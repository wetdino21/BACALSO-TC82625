import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';
import { authenticateToken } from '../auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    const { username, password, mantra, bioPhoto } = req.body;

    if (!username || !password || !mantra) {
        return res.status(400).json({ message: 'Username, password, and mantra are required.' });
    }

    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        const newUserQuery = `
            INSERT INTO users (id, username, password, mantra)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, mantra
        `;
        const newUserResult = await pool.query(newUserQuery, [userId, username, hashedPassword, mantra]);
        const user = newUserResult.rows[0];

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

        res.status(201).json({ user, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

        // Don't send the password back
        const { password: _, ...userWithoutPassword } = user;

        res.json({ user: userWithoutPassword, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Get current user (me)
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, mantra, "bioPhoto" FROM users WHERE id = $1',
      [req.user?.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = result.rows[0];

    // Convert Buffer to base64 data URL for frontend
    if (user.bioPhoto) {
      user.bioPhoto = `data:image/png;base64,${user.bioPhoto.toString('base64')}`;
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});



export default router;
