import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db';
import authRoutes from './routes/auth';
import tripRoutes from './routes/trips';
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Database
initDb().catch(console.error);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
