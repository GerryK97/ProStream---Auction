/**
 * One-time migration script to update player IDs to the new format:
 * - Master Players: PS001, PS002, PS003... (system-wide unique)
 * - Tournament Players: 001, 002, 003... (per-tournament unique)
 *
 * Run this script once: npx ts-node src/scripts/migrate-player-ids.ts
 */

import { connectToDatabase } from '../lib/mongodb';
import { PlayerModel } from '../models/Player';

interface Migration {
  oldId: string;
  newId: string;
  name: string;
}

async function migrateTournamentPlayerIds(): Promise<{ [tournamentId: string]: Migration[] }> {
  console.log('\n📋 Migrating Tournament Player IDs...');

  // Group players by tournament
  const tournaments = await PlayerModel.distinct('tournamentId');
  const migrations: { [tournamentId: string]: Migration[] } = {};

  for (const tournamentId of tournaments) {
    if (!tournamentId) continue;

    console.log(`\n  Tournament: ${tournamentId}`);
    const players = await PlayerModel.find({ tournamentId }).sort({ createdAt: 1 });
    migrations[tournamentId] = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const oldId = player._id;
      const newId = (i + 1).toString().padStart(3, '0');

      // Skip if already in correct format
      if (oldId === newId) {
        console.log(`  ✓ ${oldId} - ${player.name} (already correct)`);
        continue;
      }

      // Check if new ID already exists in this tournament
      const existingWithNewId = await PlayerModel.findOne({ _id: newId, tournamentId });
      if (existingWithNewId && existingWithNewId._id !== oldId) {
        console.warn(`  ⚠️  Skipping ${oldId} - ${newId} already exists in this tournament`);
        continue;
      }

      try {
        // Get player data
        const playerData = player.toObject();
        delete (playerData as any).__v;
        delete (playerData as any).createdAt;
        delete (playerData as any).updatedAt;

        // Create new document with new ID
        await PlayerModel.create({
          ...playerData,
          _id: newId,
        });

        // Update team references (playersPurchased arrays)
        const TeamModel = require('../models/Team').TeamModel;
        await TeamModel.updateMany(
          { tournamentId, playersPurchased: oldId },
          { $set: { 'playersPurchased.$': newId } }
        );

        // Delete old document
        await PlayerModel.deleteOne({ _id: oldId });

        migrations[tournamentId].push({
          oldId,
          newId,
          name: player.name,
        });

        console.log(`  ✓ Migrated: ${oldId} → ${newId} (${player.name})`);
      } catch (error) {
        console.error(`  ✗ Failed to migrate ${oldId}:`, error);
      }
    }
  }

  return migrations;
}

async function main() {
  try {
    console.log('🚀 Starting Player ID Migration...\n');

    await connectToDatabase();

    const tournamentMigrations = await migrateTournamentPlayerIds();

    console.log('\n✅ Migration Complete!\n');
    console.log('Summary:');

    let totalTournamentMigrations = 0;
    for (const tournamentId in tournamentMigrations) {
      const count = tournamentMigrations[tournamentId].length;
      totalTournamentMigrations += count;
      console.log(`  Tournament ${tournamentId}: ${count} players migrated`);
    }
    console.log(`  Total Tournament Players: ${totalTournamentMigrations} migrated`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  main();
}

export { migrateTournamentPlayerIds };
