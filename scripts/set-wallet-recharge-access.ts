/**
 * Script: Grant or revoke a user's wallet-recharge capability.
 *
 * Usage:
 *   npx tsx scripts/set-wallet-recharge-access.ts <userId> [true|false]
 *
 * Defaults to `true` (grant) when the flag is omitted.
 * Idempotent — safe to run multiple times.
 */

import { Pool } from '@neondatabase/serverless';

async function main() {
  const userId = process.argv[2];
  const flagArg = (process.argv[3] ?? 'true').toLowerCase();

  if (!userId) {
    console.error('Usage: npx tsx scripts/set-wallet-recharge-access.ts <userId> [true|false]');
    process.exit(1);
  }
  if (!['true', 'false'].includes(flagArg)) {
    console.error('Second argument must be "true" or "false".');
    process.exit(1);
  }
  const grant = flagArg === 'true';

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL is not set.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET can_recharge_wallet = $2, updated_at = now()
       WHERE id = $1
       RETURNING id, username, display_name, role, can_recharge_wallet;`,
      [userId, grant],
    );

    if (rows.length === 0) {
      console.error(`No user found with id ${userId}`);
      process.exitCode = 1;
      return;
    }

    const u = rows[0];
    console.log(
      `${grant ? 'Granted' : 'Revoked'} wallet recharge access:\n` +
        `  ${u.display_name} (@${u.username}) — role ${u.role}\n` +
        `  can_recharge_wallet = ${u.can_recharge_wallet}`,
    );
  } catch (error) {
    console.error('Failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
