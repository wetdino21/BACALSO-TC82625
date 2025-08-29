import express from 'express';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Helper to build user object
const userSelectFields = `
  json_build_object(
    'id', u.id,
    'username', u.username,
    'mantra', u.mantra,
    'bioPhoto', CASE 
      WHEN u."bioPhoto" IS NOT NULL THEN
        'data:image/png;base64,' || encode(u."bioPhoto", 'base64')
      ELSE NULL
    END
  )
`;

// Get all trips
router.get('/', async (req, res) => {
    const { search, status, hasSlots } = req.query;
    try {
        let query = `
      SELECT 
        t.*,
        (SELECT COUNT(*) FROM trip_participants tp WHERE tp."tripId" = t.id) as "participantCount",
        ${userSelectFields} as host
      FROM trips t
      JOIN users u ON t."hostId" = u.id
    `;
        const params: any[] = [];
        let whereClauses: string[] = [];

        if (search) {
            params.push(`%${search}%`);
            whereClauses.push(`(t.title ILIKE $${params.length} OR t.destination ILIKE $${params.length})`);
        }
        if (status) {
            params.push(status);
            whereClauses.push(`t.status = $${params.length}`);
        }
        if (hasSlots === 'true') {
            whereClauses.push(`(SELECT COUNT(*) FROM trip_participants tp WHERE tp."tripId" = t.id) < t."maxParticipants" AND t.status = 'Upcoming'`);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        query += ' ORDER BY t."createdAt" DESC';

        const result = await pool.query(query, params);

        // Convert bytea coverPhoto to base64 string for front-end
        const trips = result.rows.map(row => ({
            ...row,
            coverPhoto: row.coverPhoto
                ? `data:image/jpeg;base64,${row.coverPhoto.toString('base64')}`
                : null,
        }));

        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching trips.' });
    }
});


// Get a single trip by ID
router.get('/:id', async (req, res) => {
    try {
        const tripQuery = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.destination,
        t."startDate",
        t."endDate",
        t."minParticipants",
        t."maxParticipants",
        t.status,
        (SELECT COUNT(*) FROM trip_participants tp WHERE tp."tripId" = t.id) as "participantCount",
        -- coverPhoto as data URI
        CASE 
          WHEN t."coverPhoto" IS NOT NULL THEN
            'data:image/png;base64,' || encode(t."coverPhoto", 'base64')
          ELSE '/images/default-cover.png'
        END as "coverPhoto",
        json_build_object(
          'id', u.id,
          'username', u.username,
          'mantra', u.mantra,
          'bioPhoto', CASE 
              WHEN u."bioPhoto" IS NOT NULL THEN
                  'data:image/png;base64,' || encode(u."bioPhoto", 'base64')
              ELSE NULL
          END
        ) as host
      FROM trips t
      JOIN users u ON t."hostId" = u.id
      WHERE t.id = $1
    `;

        const tripResult = await pool.query(tripQuery, [req.params.id]);
        if (tripResult.rows.length === 0) return res.status(404).json({ message: 'Trip not found.' });

        const trip = tripResult.rows[0];

        // Fetch participants
        const participantsQuery = `
            SELECT 
                u.id, 
                u.username, 
                u.mantra,
                CASE 
                    WHEN u."bioPhoto" IS NOT NULL THEN
                        'data:image/png;base64,' || encode(u."bioPhoto", 'base64')
                    ELSE NULL
                END as "bioPhoto"
            FROM users u
            JOIN trip_participants tp ON u.id = tp."userId"
            WHERE tp."tripId" = $1
        `;

        const participantsResult = await pool.query(participantsQuery, [req.params.id]);
        trip.participants = participantsResult.rows;

        // Fetch reviews
        const reviewsQuery = `
            SELECT 
                r.*, 
                json_build_object(
                    'id', u.id,
                    'username', u.username,
                    'mantra', u.mantra,
                    'bioPhoto', CASE 
                        WHEN u."bioPhoto" IS NOT NULL THEN
                            'data:image/png;base64,' || encode(u."bioPhoto", 'base64')
                        ELSE NULL
                    END
                ) as author
            FROM reviews r
            JOIN users u ON r."authorId" = u.id
            WHERE r."tripId" = $1
            ORDER BY r."createdAt" DESC
        `;
        const reviewsResult = await pool.query(reviewsQuery, [req.params.id]);
        trip.reviews = reviewsResult.rows;

        res.json(trip);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching trip details.' });
    }
});


// Create a trip
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { title, description, destination, startDate, endDate, minParticipants, maxParticipants, coverPhoto } = req.body;
    const hostId = req.user?.id;

    try {
        const tripId = uuidv4();

        let coverPhotoBuffer: Buffer | null = null;
        if (coverPhoto) {
            // Expecting coverPhoto as data URL: "data:image/png;base64,...."
            const matches = coverPhoto.match(/^data:(image\/\w+);base64,(.+)$/);
            if (!matches) {
                return res.status(400).json({ message: 'Invalid coverPhoto format.' });
            }
            coverPhotoBuffer = Buffer.from(matches[2], 'base64');
        }

        const query = `
      INSERT INTO trips (id, title, description, destination, "startDate", "endDate", "minParticipants", "maxParticipants", "coverPhoto", "hostId", status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Upcoming')
      RETURNING *
    `;
        const newTripResult = await pool.query(query, [
            tripId,
            title,
            description,
            destination,
            startDate,
            endDate,
            minParticipants,
            maxParticipants,
            coverPhotoBuffer,
            hostId,
        ]);

        // Add host as first participant
        await pool.query('INSERT INTO trip_participants ("tripId", "userId") VALUES ($1, $2)', [tripId, hostId]);

        const newTrip = newTripResult.rows[0];
        res.status(201).json(newTrip);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error creating trip.' });
    }
});


// Update a trip
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { title, description, destination, startDate, endDate, minParticipants, maxParticipants, coverPhoto, status } = req.body;
    const userId = req.user?.id;

    try {
        const tripResult = await pool.query('SELECT "hostId", status FROM trips WHERE id = $1', [id]);
        if (tripResult.rows.length === 0) return res.status(404).json({ message: 'Trip not found.' });
        if (tripResult.rows[0].hostId !== userId) return res.status(403).json({ message: 'Only the host can edit this trip.' });

        const currentStatus = tripResult.rows[0].status;

        let coverPhotoBuffer: Buffer | null = null;
        if (coverPhoto) {
            // Expecting coverPhoto as data URL: "data:image/png;base64,...."
            const matches = coverPhoto.match(/^data:(image\/\w+);base64,(.+)$/);
            if (!matches) {
                return res.status(400).json({ message: 'Invalid coverPhoto format.' });
            }
            coverPhotoBuffer = Buffer.from(matches[2], 'base64');
        }

        const query = `
            UPDATE trips
            SET title = $1,
                description = $2,
                destination = $3,
                "startDate" = $4,
                "endDate" = $5,
                "minParticipants" = $6,
                "maxParticipants" = $7,
                "coverPhoto" = COALESCE($8, "coverPhoto"),
                status = $9
            WHERE id = $10
            RETURNING *;
            `;
        const result = await pool.query(query, [
            title,
            description,
            destination,
            startDate,
            endDate,
            minParticipants,
            maxParticipants,
            coverPhotoBuffer,
            status || currentStatus,    // Keep current status if not provided
            id
        ]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating trip.' });
    }
});


// Cancel a trip (host only)
router.put('/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        const tripResult = await pool.query('SELECT "hostId", status FROM trips WHERE id = $1', [id]);
        if (tripResult.rows.length === 0) return res.status(404).json({ message: 'Trip not found.' });
        if (tripResult.rows[0].hostId !== userId) return res.status(403).json({ message: 'Only the host can cancel this trip.' });

        const currentStatus = tripResult.rows[0].status;
        if (currentStatus === 'Cancelled') return res.status(400).json({ message: 'Trip is already cancelled.' });

        const result = await pool.query(
            'UPDATE trips SET status = $1 WHERE id = $2 RETURNING *',
            ['Cancelled', id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error cancelling trip.' });
    }
});

// Conclude a trip (host only)
router.put('/:id/conclude', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        const tripResult = await pool.query('SELECT "hostId", status FROM trips WHERE id = $1', [id]);
        if (tripResult.rows.length === 0) return res.status(404).json({ message: 'Trip not found.' });
        if (tripResult.rows[0].hostId !== userId) return res.status(403).json({ message: 'Only the host can conclude this trip.' });

        const currentStatus = tripResult.rows[0].status;
        if (currentStatus === 'Concluded') return res.status(400).json({ message: 'Trip is already concluded.' });

        const result = await pool.query(
            'UPDATE trips SET status = $1 WHERE id = $2 RETURNING *',
            ['Concluded', id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error concluding trip.' });
    }
});


// Join a trip
router.post('/:id/join', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { id: tripId } = req.params;
    const userId = req.user?.id;
    try {
        await pool.query('INSERT INTO trip_participants ("tripId", "userId") VALUES ($1, $2)', [tripId, userId]);

        // Check if trip is now full
        const result = await pool.query(`
            SELECT t."maxParticipants", COUNT(tp. "userId") as "participantCount"
            FROM trips t
            JOIN trip_participants tp ON t.id = tp."tripId"
            WHERE t.id = $1
            GROUP BY t."maxParticipants"
        `, [tripId]);

        if (result.rows[0] && result.rows[0].participantCount >= result.rows[0].maxParticipants) {
            await pool.query(`UPDATE trips SET status = 'Full' WHERE id = $1`, [tripId]);
        }

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error joining trip.' });
    }
});

// Leave a trip
router.post('/:id/leave', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { id: tripId } = req.params;
    const userId = req.user?.id;
    try {
        await pool.query('DELETE FROM trip_participants WHERE "tripId" = $1 AND "userId" = $2', [tripId, userId]);

        // If trip was full, it's now upcoming again
        await pool.query(`UPDATE trips SET status = 'Upcoming' WHERE id = $1 AND status = 'Full'`, [tripId]);

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error leaving trip.' });
    }
});

// Remove a participant (host only)
router.delete('/:tripId/participants/:userId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { tripId, userId: participantIdToRemove } = req.params;
    const hostId = req.user?.id;
    try {
        const tripResult = await pool.query('SELECT "hostId" FROM trips WHERE id = $1', [tripId]);
        if (tripResult.rows.length === 0) return res.status(404).json({ message: 'Trip not found.' });
        if (tripResult.rows[0].hostId !== hostId) return res.status(403).json({ message: 'Only the host can remove participants.' });

        await pool.query('DELETE FROM trip_participants WHERE "tripId" = $1 AND "userId" = $2', [tripId, participantIdToRemove]);

        await pool.query(`UPDATE trips SET status = 'Upcoming' WHERE id = $1 AND status = 'Full'`, [tripId]);

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error removing participant.' });
    }
});


// Add a review to a trip
router.post('/:id/reviews', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { id: tripId } = req.params;
    const authorId = req.user?.id;
    const { rating, comment } = req.body;
    try {
        const newReviewId = uuidv4();
        await pool.query(
            'INSERT INTO reviews (id, "tripId", "authorId", rating, comment) VALUES ($1, $2, $3, $4, $5)',
            [newReviewId, tripId, authorId, rating, comment]
        );
        res.status(201).json({ message: 'Review added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error adding review.' });
    }
});


export default router;
