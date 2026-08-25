/**
 * Migration Script: Wallet recharge capability + transaction categories
 *
 * 1. Adds `users.can_recharge_wallet` (boolean, default false) — a per-user
 *    capability grant that lets a non-admin take paid wallet recharges for any
 *    user and view the Accounts ledger.
 * 2. Adds the `transaction_category` enum and `wallet_transactions.category`
 *    column + an index on (category, created_at).
 * 3. Backfills existing rows:
 *      - type = 'topup'     -> category 'paid_recharge'
 *      - type = 'deduction' -> category 'overlay_charge'
 *
 * Usage: npx tsx scripts/migrate-wallet-recharge-capability.ts
 *
 * Safety: Idempotent — every statement uses IF NOT EXISTS / guarded updates,
 * so it is safe to run multiple times.
 */

import { Pool } from '@neondatabase/serverless';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL is not set.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    console.log('Starting migration: wallet recharge capability...\n');

    // 1. users.can_recharge_wallet
    console.log('Adding users.can_recharge_wallet...');
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS can_recharge_wallet boolean NOT NULL DEFAULT false;
    `);

    // 2. transaction_category enum (create if missing)
    console.log('Creating transaction_category enum...');
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_category') THEN
          CREATE TYPE transaction_category AS ENUM ('paid_recharge', 'free_credit', 'overlay_charge');
        END IF;
      END
      $$;
    `);

    // 3. wallet_transactions.category column
    console.log('Adding wallet_transactions.category...');
    await pool.query(`
      ALTER TABLE wallet_transactions
      ADD COLUMN IF NOT EXISTS category transaction_category;
    `);

    // 4. index on (category, created_at)
    console.log('Adding index wallet_tx_category_created_idx...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS wallet_tx_category_created_idx
      ON wallet_transactions (category, created_at);
    `);

    // 5. Backfill categories for existing rows (only where NULL)
    console.log('Backfilling categories for existing transactions...');
    const topups = await pool.query(`
      UPDATE wallet_transactions
      SET category = 'paid_recharge'
      WHERE category IS NULL AND type = 'topup';
    `);
    const deductions = await pool.query(`
      UPDATE wallet_transactions
      SET category = 'overlay_charge'
      WHERE category IS NULL AND type = 'deduction';
    `);

    console.log(`  topups   -> paid_recharge: ${topups.rowCount}`);
    console.log(`  deductions -> overlay_charge: ${deductions.rowCount}`);

    console.log('\n' + '='.repeat(60));
    console.log('Migration completed successfully.');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\nMigration failed with error:');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
