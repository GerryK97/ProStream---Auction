/**
 * Migration Script: Add createdBy field to existing resources
 *
 * Backfills Mongo tournament, team, and player resources that were created
 * before multi-user access control. Users now live in Postgres, so the admin
 * owner id is resolved from the shared users table.
 *
 * Usage: npx ts-node scripts/migrate-add-created-by.ts
 *        or npx tsx scripts/migrate-add-created-by.ts
 *
 * Safety: Idempotent - safe to run multiple times.
 */

import { connectToDatabase } from '../src/lib/mongodb';
import { TournamentModel } from '../src/models/Tournament';
import { TeamModel } from '../src/models/Team';
import { PlayerModel } from '../src/models/Player';
import { listUsers } from '../src/lib/pg/user-queries';

async function migrateCreatedBy() {
  console.log('Starting migration: adding createdBy field to existing resources...\n');

  try {
    console.log('Connecting to MongoDB...');
    await connectToDatabase();
    console.log('Connected to MongoDB\n');

    console.log('Finding admin user in Postgres...');
    const { rows } = await listUsers({ role: 'Admin', page: 1, limit: 1 });
    const admin = rows[0];
    if (!admin) {
      console.error('Error: No admin user found. Please create or import an admin user first.');
      process.exit(1);
    }

    const adminId = admin.id;
    console.log(`Found admin user: ${admin.username} (ID: ${adminId})\n`);

    console.log('Migrating tournaments...');
    const tournamentsResult = await TournamentModel.updateMany(
      { createdBy: { $exists: false } },
      { $set: { createdBy: adminId } }
    );
    console.log(`Updated ${tournamentsResult.modifiedCount} tournaments\n`);

    console.log('Migrating teams...');
    const teamsResult = await TeamModel.updateMany(
      { createdBy: { $exists: false } },
      { $set: { createdBy: adminId } }
    );
    console.log(`Updated ${teamsResult.modifiedCount} teams\n`);

    console.log('Migrating players...');
    const playersResult = await PlayerModel.updateMany(
      { createdBy: { $exists: false } },
      { $set: { createdBy: adminId } }
    );
    console.log(`Updated ${playersResult.modifiedCount} players\n`);

    const totalUpdated =
      tournamentsResult.modifiedCount +
      teamsResult.modifiedCount +
      playersResult.modifiedCount;

    console.log('='.repeat(60));
    console.log('Migration completed successfully.');
    console.log('='.repeat(60));
    console.log(`\nTotal resources migrated: ${totalUpdated}`);
    console.log(`\nSummary:`);
    console.log(`  - Tournaments: ${tournamentsResult.modifiedCount}`);
    console.log(`  - Teams: ${teamsResult.modifiedCount}`);
    console.log(`  - Players: ${playersResult.modifiedCount}`);
    console.log(`\nAll resources without createdBy have been assigned to admin: ${admin.username}`);
    console.log('\nNote: This migration is idempotent and safe to run multiple times.');
  } catch (error) {
    console.error('\nMigration failed with error:');
    console.error(error);
    process.exit(1);
  }
}

migrateCreatedBy().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});