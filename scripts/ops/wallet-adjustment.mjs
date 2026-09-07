#!/usr/bin/env node
/**
 * Posts a manual wallet adjustment (correction) against a user's wallet.
 *
 * Adjustments are ordinary immutable ledger rows with no `category`, so they
 * never distort the Accounts revenue/promo/usage totals. Nothing is ever
 * edited or deleted: a mistaken adjustment is corrected by posting the
 * opposite adjustment.
 *
 * Usage:
 *   node scripts/ops/wallet-adjustment.mjs --user <username|id> --amount -2000 \
 *     --description "..." --by <username|id> [--apply]
 *
 * Dry run by default: without --apply it resolves the user, shows the current
 * balance and the resulting balance, and writes nothing.
 */
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const APPLY = process.argv.includes('--apply');
const userRef = arg('user');
const byRef = arg('by');
const description = arg('description');
const amount = Number(arg('amount'));

if (!userRef || !byRef || !description || !Number.isInteger(amount) || amount === 0) {
  console.error(`Usage: node scripts/ops/wallet-adjustment.mjs --user <username|id> --amount <non-zero integer> --description "..." --by <username|id> [--apply]

  --amount is signed: negative deducts, positive credits.
  Without --apply nothing is written.`);
  process.exit(2);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

/** Resolves a username or id to exactly one user, refusing ambiguous matches. */
async function resolveUser(client, ref, label) {
  const { rows } = await client.query(
    'select id, username, display_name from users where id = $1 or lower(username) = lower($1)',
    [ref],
  );
  if (rows.length === 0) throw new Error(`${label} not found: ${ref}`);
  if (rows.length > 1) throw new Error(`${label} is ambiguous: ${ref}`);
  return rows[0];
}

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    const target = await resolveUser(client, userRef, 'Target user');
    const actor = await resolveUser(client, byRef, 'Acting user');

    const { rows: walletRows } = await client.query(
      'select id, balance from wallets where user_id = $1',
      [target.id],
    );
    const before = walletRows[0]?.balance ?? 0;
    const after = before + amount;

    console.log(`User:        ${target.display_name} (@${target.username}) ${target.id}`);
    console.log(`Posted by:   ${actor.display_name} (@${actor.username})`);
    console.log(`Description: ${description}`);
    console.log(`Amount:      ${amount > 0 ? '+' : ''}${amount}`);
    console.log(`Balance:     ${before} -> ${after}`);

    if (amount < 0 && before < -amount) {
      throw new Error(`Refusing to overdraw: balance ${before} cannot absorb ${amount}`);
    }
    if (!APPLY) {
      console.log('\nDry run. Re-run with --apply to post this adjustment.');
      return;
    }

    // Single transaction, with the balance guard inside the UPDATE so a
    // concurrent spend cannot race between the read above and this write.
    await client.query('begin');
    try {
      await client.query(
        'insert into wallets (user_id, balance) values ($1, 0) on conflict (user_id) do nothing',
        [target.id],
      );

      const { rows: updated } = await client.query(
        `update wallets set balance = balance + $2, updated_at = now()
          where user_id = $1 and ($2 >= 0 or balance >= -$2)
          returning id, balance`,
        [target.id, amount],
      );
      if (updated.length === 0) throw new Error('Balance changed concurrently; adjustment not posted');

      const balanceAfter = updated[0].balance;
      const { rows: tx } = await client.query(
        `insert into wallet_transactions
           (wallet_id, type, category, amount, balance_before, balance_after, description, reference_id, created_by)
         values ($1, $2, null, $3, $4, $5, $6, null, $7)
         returning id, created_at`,
        [
          updated[0].id,
          amount < 0 ? 'deduction' : 'topup',
          amount,
          balanceAfter - amount,
          balanceAfter,
          description,
          actor.id,
        ],
      );

      await client.query('commit');
      console.log(`\nPosted. Transaction #${tx[0].id} at ${tx[0].created_at.toISOString()}`);
      console.log(`New balance: ${balanceAfter}`);
    } catch (error) {
      await client.query('rollback');
      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(String(error.message ?? error));
  process.exit(1);
});
