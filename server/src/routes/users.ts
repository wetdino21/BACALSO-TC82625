import express from 'express';
import { pool } from '../db';
import { authenticateToken } from '../auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

const userSelectFields = `json_build_object('id', u.id, 'username', u.username, 'mantra', u.mantra, 'bioPhoto', u."bioPhoto")`;

// Get user profile data (hosted trips, joined trips, reviews)
router.get('/:id/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.params.id;
    if (req.user?.id !== userId) {
        return res.status(403).json({ message: "You can only view your own profile data." });
    }

    try {
        const userQuery = `
            SELECT id, username, mantra,
                CASE 
                WHEN "bioPhoto" IS NOT NULL THEN 'data:image/png;base64,' || encode("bioPhoto", 'base64')
                ELSE NULL
                END AS "bioPhoto"
            FROM users
            WHERE id = $1
            `;
        const userResult = await pool.query(userQuery, [userId]);
        const user = userResult.rows[0];

        if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found.' });

        const hostedTripsQuery = `SELECT id, title, status FROM trips WHERE "hostId" = $1 ORDER BY "startDate" DESC`;
        const hostedTripsResult = await pool.query(hostedTripsQuery, [userId]);

        const joinedTripsQuery = `
      SELECT t.id, t.title, t.status FROM trips t
      JOIN trip_participants tp ON t.id = tp."tripId"
      WHERE tp."userId" = $1 AND t."hostId" != $1
      ORDER BY t."startDate" DESC
    `;
        const joinedTripsResult = await pool.query(joinedTripsQuery, [userId]);

        const hostedReviewsQuery = `
            SELECT 
                r.*,
                json_build_object(
                'id', u.id,
                'username', u.username,
                'bioPhoto', 
                    CASE 
                    WHEN u."bioPhoto" IS NOT NULL 
                    THEN 'data:image/png;base64,' || encode(u."bioPhoto", 'base64')
                    ELSE NULL
                    END
                ) as author,
                json_build_object('id', t.id, 'title', t.title) as trip
            FROM reviews r
            JOIN trips t ON r."tripId" = t.id
            JOIN users u ON r."authorId" = u.id
            WHERE t."hostId" = $1
            ORDER BY r."createdAt" DESC
            `;

        const hostedReviewsResult = await pool.query(hostedReviewsQuery, [userId]);

        res.json({
            user,
            hostedTrips: hostedTripsResult.rows,
            joinedTrips: joinedTripsResult.rows,
            hostedReviews: hostedReviewsResult.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching profile data." });
    }
});


// Get all trips for the current user
router.get('/my-trips', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    try {
        const query = `
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
                json_build_object(
                    'id', u.id,
                    'username', u.username,
                    'mantra', u.mantra,
                    'bioPhoto', CASE 
                        WHEN u."bioPhoto" IS NOT NULL THEN 
                            'data:image/png;base64,' || encode(u."bioPhoto", 'base64') 
                        ELSE NULL 
                    END
                ) as host,
                CASE 
                    WHEN t."coverPhoto" IS NOT NULL THEN 
                        'data:image/png;base64,' || encode(t."coverPhoto", 'base64')
                    ELSE NULL
                END as "coverPhoto"
            FROM trips t
            JOIN users u ON t."hostId" = u.id
            JOIN trip_participants tp ON t.id = tp."tripId"
            WHERE tp."userId" = $1
            ORDER BY t."startDate" DESC
        `;
        const result = await pool.query(query, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching user trips.' });
    }
});



// Update a user profile
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { username, mantra, bioPhoto } = req.body;

    if (req.user?.id !== id) {
        return res.status(403).json({ message: "You can only edit your own profile." });
    }

    try {
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );
        if (existingUser.rows.length > 0 && existingUser.rows[0].id !== id) {
            return res.status(409).json({ message: "Username is already taken." });
        }

        let bioPhotoBuffer: Buffer | null = null;
        if (bioPhoto && bioPhoto.startsWith("data:image")) {
            // Strip prefix (data:image/png;base64,...) → only keep base64
            const base64Data = bioPhoto.split(",")[1];
            bioPhotoBuffer = Buffer.from(base64Data, "base64");
        }

        const query = `
            UPDATE users 
            SET username = $1, mantra = $2, "bioPhoto" = COALESCE($3, "bioPhoto")
            WHERE id = $4
            RETURNING id, username, mantra,
                CASE 
                WHEN "bioPhoto" IS NOT NULL THEN 'data:image/png;base64,' || encode("bioPhoto", 'base64')
                ELSE NULL
                END AS "bioPhoto"
            `;

        const result = await pool.query(query, [
            username,
            mantra,
            bioPhotoBuffer,
            id,
        ]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
});


export default router;
