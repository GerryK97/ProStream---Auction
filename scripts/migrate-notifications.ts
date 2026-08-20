/**
 * Migration: Add in-app notifications inbox table.
 *
 * Creates the notifications table used by the persistent notification feed.
 *
 * Usage:  npx tsx scripts/migrate-notifications.ts
 * Safety: Idempotent — safe to run multiple times.
 */

import { Pool } from '@neondatabase/serverless';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

  console.log('Running notifications migration...\n');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id          SERIAL PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type        VARCHAR(40) NOT NULL DEFAULT 'system',
      title       TEXT NOT NULL,
      body        TEXT NOT NULL,
      data        TEXT,
      read_at     TIMESTAMP,
      created_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ notifications table created (or already exists)');

  await pool.query(`
    CREATE INDEX IF NOT EXISTS notifications_user_created_idx
    ON notifications(user_id, id DESC);
  `);
  console.log('✅ notifications_user_created_idx index created (or already exists)');

  await pool.query(`
    CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
    ON notifications(user_id) WHERE read_at IS NULL;
  `);
  console.log('✅ notifications_user_unread_idx partial index created (or already exists)');

  await pool.end();
  console.log('\nMigration complete.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
