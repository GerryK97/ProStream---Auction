/**
 * Set the non-destructive Accounts opening recharge totals.
 *
 * These amounts establish the displayed cash-collection totals from a chosen
 * reporting start time. They never change wallet balances or transaction rows.
 *
 * Usage:
 *   npx tsx scripts/set-wallet-recharge-opening-totals.ts <ISO-start> <userId>=<amount> [...]
 *
 * Example:
 *   npx tsx scripts/set-wallet-recharge-opening-totals.ts 2026-08-25T00:00:00+05:30 \
 *     u-...=72000 u-...=38000
 */

import { Pool } from '@neondatabase/serverless';

const CONFIG_KEY = 'wallet_recharge_opening_totals';

async function main() {
  const [startedAtRaw, ...entries] = process.argv.slice(2);
  const connectionString = process.env.DATABASE_URL;
  const startedAt = startedAtRaw ? new Date(startedAtRaw) : null;

  if (!connectionString) throw new Error('DATABASE_URL is not set.');
  if (!startedAt || Number.isNaN(startedAt.getTime()) || entries.length === 0) {
    throw new Error('Usage: npx tsx scripts/set-wallet-recharge-opening-totals.ts <ISO-start> <userId>=<amount> [...]');
  }

  const totals: Record<string, number> = {};
  for (const entry of entries) {
    const [userId, amountRaw, ...extra] = entry.split('=');
    const amount = Number(amountRaw);
    if (!userId || extra.length > 0 || !Number.isSafeInteger(amount) || amount < 0) {
      throw new Error(`Invalid total "${entry}". Use <userId>=<non-negative-whole-LKR>.`);
    }
    totals[userId] = amount;
  }

  const pool = new Pool({ connectionString });
  try {
    const userIds = Object.keys(totals);
    const { rows: users } = await pool.query(
      'SELECT id, username, display_name FROM users WHERE id = ANY($1::text[]) ORDER BY username',
      [userIds],
    );
    if (users.length !== userIds.length) {
      throw new Error('One or more supplied user IDs do not exist. No changes were made.');
    }

    const value = JSON.stringify({ startedAt: startedAt.toISOString(), totals });
    await pool.query(
      `INSERT INTO app_config (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [CONFIG_KEY, value],
    );

    console.log(`Accounts totals now start at ${startedAt.toISOString()}:`);
    for (const user of users) console.log(`  ${user.display_name} (@${user.username}): LKR ${totals[user.id].toLocaleString()}`);
    console.log('No wallet balances or wallet transaction history were changed.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
