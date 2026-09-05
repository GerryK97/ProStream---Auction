#!/usr/bin/env node
/**
 * Guarded rehearsal tool for Auction's MongoDB -> PostgreSQL migration.
 *
 * Commands
 *   --dry-run  Read and validate all Mongo data. No PostgreSQL connection.
 *   --apply    Insert once into an empty, explicitly confirmed scratch database
 *              and reconcile it before committing.
 *   --verify   Re-read Mongo and compare it with a previously imported scratch DB.
 *
 * This tool intentionally has no truncate, delete, upsert, or production escape
 * hatch. It can only write to a database whose name explicitly looks disposable.
 */
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import pg from 'pg';
import {
  SOURCE_COLLECTIONS,
  TARGET_TABLES,
  buildImportPlan,
  planFingerprint,
  tableCounts,
} from './auction-etl-lib.mjs';

const { Client } = pg;
// Next.js keeps developer credentials in .env.local. Process environment values
// still win, while .env.local fills values before the optional shared .env file.
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });
const args = new Set(process.argv.slice(2));
const modes = ['--dry-run', '--apply', '--verify'].filter((mode) => args.has(mode));
const usage = `Usage: node scripts/ops/auction-mongo-to-postgres.mjs [--dry-run|--apply|--verify]

Environment:
  MONGODB_URI                     Source Atlas URI, read only.
  AUCTION_ETL_DATABASE_URL        Scratch PostgreSQL URL. Required for --apply/--verify.
  AUCTION_ETL_CONFIRM_TARGET      Exact parsed database name. Required for --apply/--verify.
  AUCTION_ETL_CONFIRM_APPLY       Must equal IMPORT_INTO_EMPTY_SCRATCH for --apply.

The target database name must contain one of: scratch, trial, test, dev, local.
--apply refuses any non-empty auction schema and never truncates or overwrites data.`;

if (modes.length !== 1 || args.has('--help') || args.has('-h')) {
  console.error(usage);
  process.exit(modes.length === 0 && (args.has('--help') || args.has('-h')) ? 0 : 2);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function targetDatabaseName(url) {
  const parsed = new URL(url);
  const name = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (!name) throw new Error('AUCTION_ETL_DATABASE_URL must include a database name');
  return name;
}

function assertSafeTarget(url, mode) {
  const database = targetDatabaseName(url);
  if (process.env.AUCTION_ETL_CONFIRM_TARGET !== database) {
    throw new Error(`Refusing target ${JSON.stringify(database)}. Set AUCTION_ETL_CONFIRM_TARGET to that exact database name.`);
  }
  if (!/(scratch|trial|test|dev|local)/i.test(database)) {
    throw new Error(`Refusing target ${JSON.stringify(database)}. The database name must visibly be a disposable scratch/trial/test/dev/local database.`);
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL === url) {
    throw new Error('AUCTION_ETL_DATABASE_URL must not equal DATABASE_URL. Use a separate scratch database URL.');
  }
  if (mode === '--apply' && process.env.AUCTION_ETL_CONFIRM_APPLY !== 'IMPORT_INTO_EMPTY_SCRATCH') {
    throw new Error('Refusing write. Set AUCTION_ETL_CONFIRM_APPLY=IMPORT_INTO_EMPTY_SCRATCH after confirming the target is disposable and empty.');
  }
  return database;
}

function quoteIdentifier(identifier) {
  if (!/^[a-z_]+$/.test(identifier)) throw new Error(`Unsafe fixed identifier: ${identifier}`);
  return `"${identifier}"`;
}

function stableJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
}

function fingerprints(rows) {
  return new Set(rows.map((row) => stableJson(row)));
}

async function readSource(uri) {
  const mongo = new MongoClient(uri, { readPreference: 'secondaryPreferred' });
  await mongo.connect();
  try {
    const db = mongo.db();
    const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name));
    const source = {};
    for (const [key, collection] of Object.entries(SOURCE_COLLECTIONS)) {
      if (!existing.has(collection)) {
        source[key] = [];
        console.warn(`Source collection ${collection} does not exist. Treating it as zero rows.`);
        continue;
      }
      source[key] = await db.collection(collection).find({}).toArray();
    }
    return source;
  } finally {
    await mongo.close();
  }
}

async function assertSchema(client) {
  const { rows } = await client.query(`
    SELECT table_name
      FROM information_schema.tables
     WHERE table_schema = 'auction'
       AND table_type = 'BASE TABLE'
     ORDER BY table_name
  `);
  const actual = new Set(rows.map((row) => row.table_name));
  const missing = TARGET_TABLES.filter((table) => !actual.has(table));
  if (missing.length) throw new Error(`Target does not have the D-A auction schema. Missing tables: ${missing.join(', ')}`);
}

async function assertTargetEmpty(client) {
  const nonEmpty = [];
  for (const table of TARGET_TABLES) {
    const { rows } = await client.query(`SELECT count(*)::int AS count FROM auction.${quoteIdentifier(table)}`);
    if (rows[0].count !== 0) nonEmpty.push(`${table}=${rows[0].count}`);
  }
  if (nonEmpty.length) {
    throw new Error(`Refusing to write: the scratch auction schema is not empty (${nonEmpty.join(', ')}). This tool never truncates, deletes, or overwrites.`);
  }
}

function postgresValue(value) {
  // node-postgres serializes Date and arrays. Objects must be explicit JSON so
  // `jsonb` always receives valid JSON rather than a driver-specific coercion.
  if (value !== null && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) return JSON.stringify(value);
  return value;
}

async function insertRows(client, table, rows) {
  if (rows.length === 0) return;
  const columns = Object.keys(rows[0]);
  const quotedColumns = columns.map(quoteIdentifier).join(', ');
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const statement = `INSERT INTO auction.${quoteIdentifier(table)} (${quotedColumns}) VALUES (${placeholders})`;
  for (const row of rows) {
    const actualColumns = Object.keys(row);
    if (actualColumns.join('|') !== columns.join('|')) throw new Error(`${table} contains mismatched row shapes`);
    await client.query(statement, columns.map((column) => postgresValue(row[column])));
  }
}

async function actualCounts(client) {
  const counts = {};
  for (const table of TARGET_TABLES) {
    const { rows } = await client.query(`SELECT count(*)::int AS count FROM auction.${quoteIdentifier(table)}`);
    counts[table] = rows[0].count;
  }
  return counts;
}

function assertCounts(expected, actual) {
  const mismatches = Object.keys(expected).filter((table) => expected[table] !== actual[table]);
  if (mismatches.length) {
    throw new Error(`Count reconciliation failed: ${mismatches.map((table) => `${table}: Mongo-derived ${expected[table]}, Postgres ${actual[table]}`).join('; ')}`);
  }
}

async function readRows(client, table, columns) {
  const result = await client.query(`SELECT ${columns.map(quoteIdentifier).join(', ')} FROM auction.${quoteIdentifier(table)}`);
  return result.rows;
}

function assertExactRows(label, expected, actual) {
  if (expected.length !== actual.length) throw new Error(`${label}: row count differs (${expected.length} expected, ${actual.length} actual)`);
  const expectedValues = fingerprints(expected);
  const actualValues = fingerprints(actual);
  if (expectedValues.size !== expected.length || actualValues.size !== actual.length) {
    throw new Error(`${label}: duplicate rows prevent a deterministic reconciliation`);
  }
  for (const value of expectedValues) {
    if (!actualValues.has(value)) throw new Error(`${label}: a source-derived row differs from PostgreSQL`);
  }
}

async function reconcile(client, plan) {
  const expectedCounts = tableCounts(plan);
  assertCounts(expectedCounts, await actualCounts(client));

  // Exact comparison covers every monetary row, not merely a sample.
  for (const [table, columns] of [
    ['teams', ['id', 'current_balance', 'initial_budget']],
    ['players', ['id', 'is_sold', 'is_unsold', 'final_price', 'winning_team_id']],
    ['invoices', ['id', 'subtotal', 'tax', 'tax_rate', 'discount', 'total', 'amount_paid', 'balance']],
    ['quotations', ['id', 'subtotal', 'tax', 'tax_rate', 'discount', 'total', 'converted_to_invoice_id']],
    ['overlay_sessions', ['id', 'price_charged', 'payment_status']],
  ]) {
    assertExactRows(`money reconciliation for ${table}`, plan.tables[table].map((row) => Object.fromEntries(columns.map((column) => [column, row[column]]))), await readRows(client, table, columns));
  }

  // Exact comparison catches JSON shape/key loss on every configured JSON blob.
  for (const [table, columns] of [
    ['tournaments', ['id', 'player_profile_fields', 'team_officials_config', 'overlay_control_settings']],
    ['players', ['id', 'stats']],
    ['overlay_configs', ['id', 'position', 'size', 'parameters', 'animations', 'display_rules']],
    ['overlay_history', ['id', 'changes']],
    ['overlay_library', ['id', 'default_params', 'parameter_schema']],
    ['customers', ['id', 'address']],
  ]) {
    assertExactRows(`JSON reconciliation for ${table}`, plan.tables[table].map((row) => Object.fromEntries(columns.map((column) => [column, row[column]]))), await readRows(client, table, columns));
  }
}

async function main() {
  const mode = modes[0];
  const source = await readSource(requireEnv('MONGODB_URI'));
  const plan = buildImportPlan(source);
  const counts = tableCounts(plan);
  const fingerprint = planFingerprint(plan);

  console.table(Object.entries(counts).map(([table, count]) => ({ table: `auction.${table}`, rows: count })));
  console.log(`Validated ${Object.values(plan.sourceCounts).reduce((total, count) => total + count, 0)} Mongo documents. Plan fingerprint: ${fingerprint}`);
  for (const normalization of plan.normalizations) console.warn(`ETL normalization: ${normalization}`);

  if (mode === '--dry-run') {
    console.log('Dry run passed. PostgreSQL was not opened and no data was written.');
    return;
  }

  const targetUrl = requireEnv('AUCTION_ETL_DATABASE_URL');
  const targetName = assertSafeTarget(targetUrl, mode);
  const client = new Client({ connectionString: targetUrl });
  await client.connect();
  try {
    await assertSchema(client);
    if (mode === '--verify') {
      await reconcile(client, plan);
      console.log(`Verification passed for scratch database ${JSON.stringify(targetName)}. No data was changed.`);
      return;
    }

    await client.query('BEGIN');
    try {
      await assertTargetEmpty(client);
      // Parent rows precede dependants. Each source model group is nevertheless
      // inserted atomically within the one guarded rehearsal transaction.
      for (const table of [
        'tournaments', 'player_classes', 'bid_increments', 'direct_quick_bids', 'player_card_templates',
        'teams', 'team_officials', 'players', 'auction_state', 'bid_history', 'completed_classes',
        'overlay_configs', 'overlay_scenes', 'overlay_history', 'overlay_analytics', 'overlay_library', 'overlay_sessions',
        // Customers are required by both financial document tables.
        'customers', 'invoices', 'invoice_line_items', 'quotations', 'quotation_line_items',
      ]) await insertRows(client, table, plan.tables[table]);
      await reconcile(client, plan);
      await client.query('COMMIT');
      console.log(`Import and reconciliation passed for scratch database ${JSON.stringify(targetName)}. The target remains an isolated trial only.`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Auction ETL failed safely: ${error.message}`);
  process.exitCode = 1;
});
