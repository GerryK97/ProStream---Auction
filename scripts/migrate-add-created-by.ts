/**
 * Migration Script: Add createdBy field to existing resources
 *
 * Purpose: Backfill the createdBy field for tournaments, teams, players,
 * master teams, and master players that were created before the multi-user
 * access control system was implemented.
 *
 * Usage: npx ts-node scripts/migrate-add-created-by.ts
 *        or npx tsx scripts/migrate-add-created-by.ts
 *
 * This script:
 * 1. Connects to MongoDB
 * 2. Finds the first admin user
 * 3. Updates all resources without createdBy to use the admin user
 * 4. Prints results of the migration
 *
 * Safety: Idempotent - safe to run multiple times
 */

import { connectToDatabase } from '../src/lib/mongodb';
import { User } from '../src/models/User';
import { TournamentModel } from '../src/models/Tournament';
import { TeamModel } from '../src/models/Team';
import { PlayerModel } from '../src/models/Player';

async function migrateCreatedBy() {
  console.log('🔄 Starting migration: Adding createdBy field to existing resources...\n');

  try {
    // Connect to database
    console.log('📦 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✓ Connected to MongoDB\n');

    // Find the first admin user
    console.log('👤 Finding admin user...');
    const admin = await User.findOne({ role: 'Admin' }).select('_id username');
    if (!admin) {
      console.error('❌ Error: No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    const adminId = admin._id.toString();
    console.log(`✓ Found admin user: ${admin.username} (ID: ${adminId})\n`);

    // Update tournaments
    console.log('📋 Migrating tournaments...');
    const tournamentsResult = await TournamentModel.updateMany(
      { createdBy: { $exists: false } },
      { $set: { createdBy: adminId } }
    );
    console.log(`✓ Updated ${tournamentsResult.modifiedCount} tournaments\n`);

    // Update teams
    console.log('🏛️  Migrating teams...');
    const teamsResult = await TeamModel.updateMany(
      { createdBy: { $exists: false } },
      { $set: { createdBy: adminId } }
    );
    console.log(`✓ Updated ${teamsResult.modifiedCount} teams\n`);

    // Update players
    console.log('👥 Migrating players...');
    const playersResult = await PlayerModel.updateMany(
      { createdBy: { $exists: false } },
      { $set: { createdBy: adminId } }
    );
    console.log(`✓ Updated ${playersResult.modifiedCount} players\n`);

    // Summary
    const totalUpdated =
      tournamentsResult.modifiedCount +
      teamsResult.modifiedCount +
      playersResult.modifiedCount;

    console.log('═'.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('═'.repeat(60));
    console.log(`\nTotal resources migrated: ${totalUpdated}`);
    console.log(`\nSummary:`);
    console.log(`  • Tournaments: ${tournamentsResult.modifiedCount}`);
    console.log(`  • Teams: ${teamsResult.modifiedCount}`);
    console.log(`  • Players: ${playersResult.modifiedCount}`);
    console.log(`\nAll resources without createdBy have been assigned to admin: ${admin.username}`);
    console.log('\n⚠️  Note: This migration is idempotent and safe to run multiple times.');
  } catch (error) {
    console.error('\n❌ Migration failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
migrateCreatedBy().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
