/**
 * Migration: Add app_config table + seed version-gating keys.
 *
 * Keys:
 *   latest_version        — newest published app version (semver, e.g. "1.2.16")
 *   min_supported_version — below this, the update is forced/blocking
 *   update_url            — where "Update Now" sends the user
 *   update_message        — optional custom text shown in the popup
 *   force_update          — "true" to force the popup for everyone below latest
 *
 * Seeded to the CURRENT app version so no false "update available" popup fires
 * until an admin bumps latest_version for a real release.
 *
 * Usage:  npx tsx scripts/migrate-app-config.ts
 * Safety: Idempotent — safe to run multiple times (seeds only if key absent).
 */

import { Pool } from '@neondatabase/serverless';

// Keep in sync with app.json "version" at migration time.
const CURRENT_VERSION = '1.2.16';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.prostream.auction';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

  console.log('Running app_config migration...\n');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_config (
      key        VARCHAR(64) PRIMARY KEY,
      value      TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ app_config table created (or already exists)');

  const seed: Array<[string, string]> = [
    ['latest_version', CURRENT_VERSION],
    ['min_supported_version', CURRENT_VERSION],
    ['update_url', PLAY_STORE_URL],
    ['update_message', 'A new version of ProStream is available with improvements and fixes.'],
    ['force_update', 'false'],
  ];

  for (const [key, value] of seed) {
    // Insert only when the key is missing — never overwrite admin-set values.
    await pool.query(
      `INSERT INTO app_config (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO NOTHING;`,
      [key, value],
    );
    console.log(`✅ seeded ${key} (or already present)`);
  }

  await pool.end();
  console.log('\nMigration complete.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
