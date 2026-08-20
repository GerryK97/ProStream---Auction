/**
 * Bump the app's advertised latest version (and optional flags) in app_config.
 *
 * Usage:
 *   npx tsx scripts/set-app-version.ts <latestVersion> [--min <minVersion>] \
 *       [--force] [--message "..."] [--url "https://..."]
 *
 * Examples:
 *   npx tsx scripts/set-app-version.ts 1.3.0
 *   npx tsx scripts/set-app-version.ts 1.3.0 --min 1.2.0 --message "Critical fixes"
 *   npx tsx scripts/set-app-version.ts 1.3.0 --force
 */

import { Pool } from '@neondatabase/serverless';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function run() {
  const latest = process.argv[2];
  if (!latest || latest.startsWith('--')) {
    console.error('Usage: npx tsx scripts/set-app-version.ts <latestVersion> [--min <v>] [--force] [--message "..."] [--url "..."]');
    process.exit(1);
  }

  const updates: Array<[string, string]> = [['latest_version', latest]];
  const min = arg('min');
  if (min) updates.push(['min_supported_version', min]);
  const message = arg('message');
  if (message) updates.push(['update_message', message]);
  const url = arg('url');
  if (url) updates.push(['update_url', url]);
  updates.push(['force_update', flag('force') ? 'true' : 'false']);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  for (const [key, value] of updates) {
    await pool.query(
      `INSERT INTO app_config (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
      [key, value],
    );
    console.log(`✅ ${key} = ${value}`);
  }
  await pool.end();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
