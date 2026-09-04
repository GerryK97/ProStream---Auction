import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './users-schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

// Reuse the TCP connection pool in the persistent Dokploy application process.
// The standard `pg` driver accepts both the temporary Neon connection URL and
// the final internal Dokploy PostgreSQL URL.
const globalForDatabase = globalThis as typeof globalThis & {
  prostreamAuctionPool?: Pool;
};

const pool = globalForDatabase.prostreamAuctionPool ?? new Pool({
  connectionString,
  application_name: process.env.DATABASE_APPLICATION_NAME ?? 'prostream-auction',
  max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

globalForDatabase.prostreamAuctionPool = pool;

export const pgDb = drizzle(pool, { schema });
