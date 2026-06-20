/**
 * Migration: Add phone OTP verification tables
 *
 * 1. Adds phone_verified column to users table
 * 2. Creates phone_verifications table
 *
 * Usage: npx tsx scripts/migrate-otp-phone-verification.ts
 * Safety: Idempotent — safe to run multiple times.
 */

import { Pool } from '@neondatabase/serverless';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

  console.log('Running OTP phone verification migration...\n');

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;
  `);
  console.log('✅ users.phone_verified column added (or already exists)');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS phone_verifications (
      id          SERIAL PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      phone       VARCHAR(20) NOT NULL,
      otp_hash    TEXT NOT NULL,
      attempts    INTEGER NOT NULL DEFAULT 0,
      expires_at  TIMESTAMP NOT NULL,
      verified_at TIMESTAMP,
      created_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ phone_verifications table created (or already exists)');

  // Index for fast lookup by user_id
  await pool.query(`
    CREATE INDEX IF NOT EXISTS phone_verifications_user_id_idx
    ON phone_verifications(user_id);
  `);
  console.log('✅ phone_verifications_user_id_idx index created (or already exists)');

  await pool.end();
  console.log('\nMigration complete.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
