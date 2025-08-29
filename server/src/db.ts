import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

export const initDb = async () => {
  try {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        mantra VARCHAR(128) NOT NULL,
        "bioPhoto" BYTEA NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const createTripsTable = `
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY,
        title VARCHAR(128) NOT NULL,
        description VARCHAR(255) NOT NULL,
        "coverPhoto" BYTEA NOT NULL,
        destination VARCHAR(100) NOT NULL,
        "startDate" DATE NOT NULL,
        "endDate" DATE NOT NULL,
        "minParticipants" INTEGER NOT NULL,
        "maxParticipants" INTEGER NOT NULL,
        "hostId" UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const createParticipantsTable = `
      CREATE TABLE IF NOT EXISTS trip_participants (
        "tripId" UUID REFERENCES trips(id) ON DELETE CASCADE,
        "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
        "joinedAt" TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY ("tripId", "userId")
      );
    `;
    
    const createReviewsTable = `
        CREATE TABLE IF NOT EXISTS reviews (
            id UUID PRIMARY KEY,
            "tripId" UUID REFERENCES trips(id) ON DELETE CASCADE,
            "authorId" UUID REFERENCES users(id) ON DELETE SET NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT NOT NULL,
            "createdAt" TIMESTAMPTZ DEFAULT NOW()
        );
    `;

    await pool.query(createUsersTable);
    await pool.query(createTripsTable);
    await pool.query(createParticipantsTable);
    await pool.query(createReviewsTable);

    console.log('Database tables checked/created successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
    // FIX: Cast process to any to bypass potential type definition issues in a constrained environment.
    (process as any).exit(1);
  }
};