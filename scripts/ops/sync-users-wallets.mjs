#!/usr/bin/env node
/**
 * One-way sync of the shared `public` user/wallet tables from a source
 * PostgreSQL (Neon, currently authoritative) to a target PostgreSQL (Dokploy),
 * which froze behind while both deployments ran side by side.
 *
 * Deliberately additive and fail-closed:
 *   - Refuses to run unless the target's rows are a strict subset of the
 *     source, so it can never overwrite divergent history.
 *   - Never deletes. Never edits an existing wallet_transactions row: that
 *     table is the immutable money ledger.
 *   - Copies missing users, then missing wallets, then missing transactions in
 *     ascending id order, so a wallet always exists before its ledger rows.
 *   - Re-points each wallet's balance to the source value only after its
 *     transactions are in place, keeping balance and ledger consistent.
 *   - Resets the sequences afterwards so new inserts on the target cannot
 *     collide with ids copied from the source.
 *
 * Usage:
 *   SOURCE_DATABASE_URL=... TARGET_DATABASE_URL=... \
 *     node scripts/ops/sync-users-wallets.mjs [--apply]
 *
 * Dry run by default: reports exactly what would be copied and writes nothing.
 */
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const APPLY = process.argv.includes('--apply');
// Schema override exists so the tool can be rehearsed against a scratch copy
// before it is ever pointed at a production database.
const SOURCE_SCHEMA = process.env.SOURCE_SCHEMA ?? 'public';
const TARGET_SCHEMA = process.env.TARGET_SCHEMA ?? 'public';
const SOURCE_URL = process.env.SOURCE_DATABASE_URL ?? process.env.DATABASE_URL;
const TARGET_URL = process.env.TARGET_DATABASE_URL;

if (!SOURCE_URL || !TARGET_URL) {
  console.error(`Usage: SOURCE_DATABASE_URL=... TARGET_DATABASE_URL=... node scripts/ops/sync-users-wallets.mjs [--apply]

  SOURCE_DATABASE_URL  authoritative database (defaults to DATABASE_URL)
  TARGET_DATABASE_URL  database to bring up to date
  SOURCE_SCHEMA        defaults to public
  TARGET_SCHEMA        defaults to public
  --apply              perform the writes; omit for a dry run`);
  process.exit(2);
}
if (SOURCE_URL === TARGET_URL && SOURCE_SCHEMA === TARGET_SCHEMA) {
  console.error('Source and target must differ by database URL or schema');
  process.exit(2);
}

/** Tables copied, in dependency order. */
const USER_COLUMNS = [
  'id', 'username', 'email', 'password_hash', 'display_name', 'role', 'status', 'plan',
  'phone', 'phone_verified', 'photo_cloudinary_id', 'assigned_tournaments',
  'can_recharge_wallet', 'created_at', 'updated_at',
];
const WALLET_COLUMNS = ['id', 'user_id', 'balance', 'updated_at'];
const TX_COLUMNS = [
  'id', 'wallet_id', 'type', 'category', 'amount', 'balance_before', 'balance_after',
  'description', 'reference_id', 'created_by', 'created_at',
];

function placeholders(count, offset = 0) {
  return Array.from({ length: count }, (_, i) => `$${i + 1 + offset}`).join(', ');
}

async function readAll(client, schema, table, columns) {
  const { rows } = await client.query(`select ${columns.join(', ')} from ${schema}.${table} order by id`);
  return rows;
}

/**
 * Fails closed when the target holds anything the source does not, which would
 * mean the two databases genuinely forked rather than one lagging behind.
 */
function assertSubset(label, sourceRows, targetRows, describe) {
  const sourceIds = new Set(sourceRows.map(r => String(r.id)));
  const extra = targetRows.filter(r => !sourceIds.has(String(r.id)));
  if (extra.length > 0) {
    throw new Error(
      `${label}: target has ${extra.length} row(s) absent from source (e.g. ${describe(extra[0])}). ` +
      'The databases have diverged; this tool only fast-forwards a strict subset.',
    );
  }
}

/**
 * Compares rows present in both, so a silent content drift cannot slip past.
 * `assigned_tournaments` is excluded here and reconciled separately: it is a
 * set that either side may legitimately have added to while both deployments
 * were live, so it is merged rather than treated as a conflict.
 */
function findConflicts(sourceRows, targetRows, columns) {
  const targetById = new Map(targetRows.map(r => [String(r.id), r]));
  const conflicts = [];
  for (const source of sourceRows) {
    const target = targetById.get(String(source.id));
    if (!target) continue;
    for (const column of columns) {
      const a = source[column];
      const b = target[column];
      const normalise = (v) => (v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join(',') : v === null ? null : String(v));
      if (normalise(a) !== normalise(b)) {
        conflicts.push({ id: source.id, column, source: normalise(a), target: normalise(b) });
      }
    }
  }
  return conflicts;
}

async function main() {
  const source = new pg.Client({ connectionString: SOURCE_URL });
  const target = new pg.Client({ connectionString: TARGET_URL });
  await source.connect();
  await target.connect();

  try {
    const [srcUsers, tgtUsers] = [await readAll(source, SOURCE_SCHEMA, 'users', USER_COLUMNS), await readAll(target, TARGET_SCHEMA, 'users', USER_COLUMNS)];
    const [srcWallets, tgtWallets] = [await readAll(source, SOURCE_SCHEMA, 'wallets', WALLET_COLUMNS), await readAll(target, TARGET_SCHEMA, 'wallets', WALLET_COLUMNS)];
    const [srcTx, tgtTx] = [await readAll(source, SOURCE_SCHEMA, 'wallet_transactions', TX_COLUMNS), await readAll(target, TARGET_SCHEMA, 'wallet_transactions', TX_COLUMNS)];

    console.log(`source: ${srcUsers.length} users, ${srcWallets.length} wallets, ${srcTx.length} transactions`);
    console.log(`target: ${tgtUsers.length} users, ${tgtWallets.length} wallets, ${tgtTx.length} transactions`);

    assertSubset('users', srcUsers, tgtUsers, r => r.username);
    assertSubset('wallets', srcWallets, tgtWallets, r => `wallet #${r.id}`);
    assertSubset('wallet_transactions', srcTx, tgtTx, r => `transaction #${r.id}`);

    // The ledger is immutable, so any content difference on a shared row is a
    // hard stop rather than something to overwrite.
    const txConflicts = findConflicts(srcTx, tgtTx, TX_COLUMNS);
    if (txConflicts.length > 0) {
      console.error(`\nRefusing to sync: ${txConflicts.length} shared ledger row(s) differ.`);
      for (const c of txConflicts.slice(0, 10)) {
        console.error(`  transaction #${c.id}.${c.column}: source=${c.source} target=${c.target}`);
      }
      process.exit(1);
    }

    const targetUserIds = new Set(tgtUsers.map(r => r.id));
    const targetWalletIds = new Set(tgtWallets.map(r => String(r.id)));
    const targetTxIds = new Set(tgtTx.map(r => String(r.id)));

    const newUsers = srcUsers.filter(r => !targetUserIds.has(r.id));
    const newWallets = srcWallets.filter(r => !targetWalletIds.has(String(r.id)));
    const newTx = srcTx.filter(r => !targetTxIds.has(String(r.id)));

    // Balances can drift even where the wallet row already exists, because the
    // missing transactions were never applied on the target.
    const targetWalletById = new Map(tgtWallets.map(r => [String(r.id), r]));
    const balanceUpdates = srcWallets.filter((r) => {
      const existing = targetWalletById.get(String(r.id));
      return existing && existing.balance !== r.balance;
    });

    // Tournament access is a set, and both deployments were granting access
    // while they ran in parallel. Overwriting the target with the source would
    // silently revoke grants made only on the target, so the two sets are
    // merged and the union is written back to BOTH databases.
    const targetUserById = new Map(tgtUsers.map(r => [r.id, r]));
    const accessMerges = [];
    for (const sourceUser of srcUsers) {
      const targetUser = targetUserById.get(sourceUser.id);
      if (!targetUser) continue;
      const sourceSet = new Set(sourceUser.assigned_tournaments ?? []);
      const targetSet = new Set(targetUser.assigned_tournaments ?? []);
      const onlyInTarget = [...targetSet].filter(t => !sourceSet.has(t));
      const onlyInSource = [...sourceSet].filter(t => !targetSet.has(t));
      if (onlyInTarget.length === 0 && onlyInSource.length === 0) continue;
      accessMerges.push({
        id: sourceUser.id,
        username: sourceUser.username,
        union: [...new Set([...sourceSet, ...targetSet])].sort(),
        onlyInTarget,
        onlyInSource,
      });
    }

    console.log(`\nto copy: ${newUsers.length} users, ${newWallets.length} wallets, ${newTx.length} transactions`);
    console.log(`balances to correct on existing wallets: ${balanceUpdates.length}`);
    console.log(`tournament-access sets to merge: ${accessMerges.length}`);
    for (const merge of accessMerges) {
      const parts = [];
      if (merge.onlyInTarget.length > 0) parts.push(`+${merge.onlyInTarget.length} kept from target`);
      if (merge.onlyInSource.length > 0) parts.push(`+${merge.onlyInSource.length} from source`);
      console.log(`  ${merge.username}: ${parts.join(', ')} -> ${merge.union.length} total`);
    }
    if (newUsers.length > 0) console.log('  users:', newUsers.map(u => u.username).join(', '));
    if (newTx.length > 0) console.log(`  transactions: #${newTx[0].id}..#${newTx[newTx.length - 1].id}`);

    if (newUsers.length + newWallets.length + newTx.length + balanceUpdates.length + accessMerges.length === 0) {
      console.log('\nAlready in sync. Nothing to do.');
      return;
    }
    if (!APPLY) {
      console.log('\nDry run. Re-run with --apply to write these changes.');
      return;
    }

    await target.query('begin');
    try {
      for (const row of newUsers) {
        await target.query(
          `insert into ${TARGET_SCHEMA}.users (${USER_COLUMNS.join(', ')}) values (${placeholders(USER_COLUMNS.length)})
           on conflict (id) do nothing`,
          USER_COLUMNS.map(c => row[c]),
        );
      }
      for (const row of newWallets) {
        await target.query(
          `insert into ${TARGET_SCHEMA}.wallets (${WALLET_COLUMNS.join(', ')}) values (${placeholders(WALLET_COLUMNS.length)})
           on conflict (id) do nothing`,
          WALLET_COLUMNS.map(c => row[c]),
        );
      }
      // Ascending id order preserves the ledger's chronology.
      for (const row of newTx) {
        await target.query(
          `insert into ${TARGET_SCHEMA}.wallet_transactions (${TX_COLUMNS.join(', ')}) values (${placeholders(TX_COLUMNS.length)})
           on conflict (id) do nothing`,
          TX_COLUMNS.map(c => row[c]),
        );
      }
      for (const row of balanceUpdates) {
        await target.query(`update ${TARGET_SCHEMA}.wallets set balance = $2, updated_at = $3 where id = $1`, [row.id, row.balance, row.updated_at]);
      }
      // Write the merged access set to the target inside this transaction.
      for (const merge of accessMerges) {
        await target.query(
          `update ${TARGET_SCHEMA}.users set assigned_tournaments = $2, updated_at = now() where id = $1`,
          [merge.id, merge.union],
        );
      }

      // Copied ids came from the source's sequences, so the target's own
      // sequences must be advanced or the next insert would collide.
      await target.query(`select setval(pg_get_serial_sequence('${TARGET_SCHEMA}.wallets','id'), coalesce((select max(id) from ${TARGET_SCHEMA}.wallets), 1))`);
      await target.query(`select setval(pg_get_serial_sequence('${TARGET_SCHEMA}.wallet_transactions','id'), coalesce((select max(id) from ${TARGET_SCHEMA}.wallet_transactions), 1))`);

      await target.query('commit');
    } catch (error) {
      await target.query('rollback');
      throw error;
    }

    // Apply the same merged access sets to the source. Only grants the source
    // is missing are added, so this stays additive: no user loses access on
    // either side. Done after the target commit so a target failure never
    // leaves the source ahead.
    const sourceAccessUpdates = accessMerges.filter(m => m.onlyInTarget.length > 0);
    if (sourceAccessUpdates.length > 0) {
      await source.query('begin');
      try {
        for (const merge of sourceAccessUpdates) {
          await source.query(
            `update ${SOURCE_SCHEMA}.users set assigned_tournaments = $2, updated_at = now() where id = $1`,
            [merge.id, merge.union],
          );
        }
        await source.query('commit');
        console.log(`\nMerged ${sourceAccessUpdates.length} access set(s) back into the source.`);
      } catch (error) {
        await source.query('rollback');
        throw error;
      }
    }

    // Read back independently rather than trusting the writes.
    const [vUsers, vWallets, vTx] = [
      await readAll(target, TARGET_SCHEMA, 'users', USER_COLUMNS),
      await readAll(target, TARGET_SCHEMA, 'wallets', WALLET_COLUMNS),
      await readAll(target, TARGET_SCHEMA, 'wallet_transactions', TX_COLUMNS),
    ];
    const remainingConflicts = findConflicts(srcTx, vTx, TX_COLUMNS);
    const { rows: [sourceTotal] } = await source.query(`select coalesce(sum(balance),0)::int total from ${SOURCE_SCHEMA}.wallets`);
    const { rows: [targetTotal] } = await target.query(`select coalesce(sum(balance),0)::int total from ${TARGET_SCHEMA}.wallets`);

    // Re-read the source too, since the access merge wrote to both sides.
    const vSrcUsers = await readAll(source, SOURCE_SCHEMA, 'users', USER_COLUMNS);
    const srcAccessById = new Map(vSrcUsers.map(u => [u.id, new Set(u.assigned_tournaments ?? [])]));
    const accessDivergence = vUsers.filter((u) => {
      const sourceSet = srcAccessById.get(u.id);
      if (!sourceSet) return false;
      const targetSet = new Set(u.assigned_tournaments ?? []);
      return sourceSet.size !== targetSet.size || [...targetSet].some(t => !sourceSet.has(t));
    });

    console.log('\nAfter sync:');
    console.log(`  users        ${vUsers.length}/${srcUsers.length}`);
    console.log(`  wallets      ${vWallets.length}/${srcWallets.length}`);
    console.log(`  transactions ${vTx.length}/${srcTx.length}`);
    console.log(`  ledger mismatches: ${remainingConflicts.length}`);
    console.log(`  access sets still divergent: ${accessDivergence.length}`);
    console.log(`  total balance: source ${sourceTotal.total} / target ${targetTotal.total}`);

    const ok = vUsers.length === srcUsers.length
      && vWallets.length === srcWallets.length
      && vTx.length === srcTx.length
      && remainingConflicts.length === 0
      && accessDivergence.length === 0
      && sourceTotal.total === targetTotal.total;
    if (!ok) {
      console.error('\nVerification FAILED: target does not match source.');
      process.exit(1);
    }
    console.log('\nVerified: target now matches source.');
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((error) => {
  console.error(String(error.message ?? error));
  process.exit(1);
});
