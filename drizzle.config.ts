import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '.env.local' });

/**
 * Drizzle config for the Auction `auction` schema migration (see
 * docs/MONGO_TO_POSTGRES_MIGRATION_PLAN.md).
 *
 * Deliberately migration-file based, not push-based. This dataset holds team
 * balances, sale prices, and invoices, so every column and constraint change
 * should be an explicit reviewed SQL file rather than an inferred diff applied
 * straight to a database.
 *
 * `users`, `wallets`, and the rest of the shared `public` schema are owned by
 * the Scoreboard repository and are intentionally NOT included here, so
 * running these migrations can never alter shared tables.
 */
export default defineConfig({
  schema: './src/lib/pg/auction-schema.ts',
  out: './drizzle/auction',
  dialect: 'postgresql',
  schemaFilter: ['auction'],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
