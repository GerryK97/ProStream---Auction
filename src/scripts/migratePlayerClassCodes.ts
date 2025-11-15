/**
 * Migration Script: Add Short Codes to Player Classes
 *
 * This script automatically generates short codes for player classes in existing tournaments
 * that don't have them. It should be run once after deploying the code field to the schema.
 *
 * Usage:
 *   npx ts-node src/scripts/migratePlayerClassCodes.ts
 */

import mongoose from 'mongoose';
import { TournamentModel } from '@/models/Tournament';
import { PlayerClassConfig } from '@/types';

// MongoDB connection string - update as needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prostream-auction';

/**
 * Generate a short code from a player class name
 * Examples:
 *   "Platinum" → "PLA"
 *   "Gold" → "GOL"
 *   "All Rounder A" → "ARA"
 *   "Batsman B" → "BATB"
 */
function generateCodeFromName(name: string): string {
  // Remove special characters and extra spaces
  const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();

  // Split into words
  const words = cleanName.split(/\s+/);

  if (words.length === 1) {
    // Single word: take first 3 letters
    return words[0].substring(0, 3).toUpperCase();
  } else if (words.length === 2) {
    // Two words: take first letter of first word + first 2 of second
    // OR first 2 of first + first letter of second
    const word1 = words[0];
    const word2 = words[1];

    // If second word is single letter (like "A", "B"), use pattern: word1(2) + word2(1)
    if (word2.length === 1) {
      return (word1.substring(0, 2) + word2).toUpperCase();
    }

    // Otherwise, use first letter of each word + first letter of second word again
    return (word1[0] + word2.substring(0, 2)).toUpperCase();
  } else {
    // Three or more words: take first letter of each word (up to 3)
    return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
  }
}

/**
 * Ensure code is unique within the tournament's player classes
 */
function ensureUniqueCode(code: string, existingCodes: Set<string>): string {
  let uniqueCode = code;
  let counter = 1;

  while (existingCodes.has(uniqueCode)) {
    uniqueCode = `${code}${counter}`;
    counter++;
  }

  return uniqueCode;
}

/**
 * Main migration function
 */
async function migratePlayerClassCodes() {
  try {
    console.log('🔄 Starting migration: Adding codes to player classes...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all tournaments
    const tournaments = await TournamentModel.find({});
    console.log(`📊 Found ${tournaments.length} tournaments\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const tournament of tournaments) {
      // Skip if tournament doesn't use player classes
      if (!tournament.usePlayerClasses || !tournament.playerClasses || tournament.playerClasses.length === 0) {
        console.log(`⏭️  Skipping tournament "${tournament.name}" (no player classes)`);
        skippedCount++;
        continue;
      }

      // Check if any class is missing a code
      const needsMigration = tournament.playerClasses.some((pc: any) => !pc.code);

      if (!needsMigration) {
        console.log(`✅ Tournament "${tournament.name}" already has codes`);
        skippedCount++;
        continue;
      }

      console.log(`🔧 Migrating tournament: "${tournament.name}"`);

      // Track existing codes to ensure uniqueness
      const existingCodes = new Set<string>();

      // Update player classes
      const updatedClasses = tournament.playerClasses.map((pc: any) => {
        // If class already has a code, keep it
        if (pc.code) {
          existingCodes.add(pc.code.toUpperCase());
          return pc;
        }

        // Generate code from name
        let generatedCode = generateCodeFromName(pc.name);

        // Ensure uniqueness
        generatedCode = ensureUniqueCode(generatedCode, existingCodes);
        existingCodes.add(generatedCode);

        console.log(`   • "${pc.name}" → "${generatedCode}"`);

        return {
          ...pc,
          code: generatedCode,
        };
      });

      // Update tournament
      tournament.playerClasses = updatedClasses as any;
      await tournament.save();

      updatedCount++;
      console.log(`   ✅ Updated successfully\n`);
    }

    console.log('═══════════════════════════════════════');
    console.log('📊 Migration Summary:');
    console.log(`   • Tournaments updated: ${updatedCount}`);
    console.log(`   • Tournaments skipped: ${skippedCount}`);
    console.log(`   • Total tournaments: ${tournaments.length}`);
    console.log('═══════════════════════════════════════');
    console.log('✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if executed directly
if (require.main === module) {
  migratePlayerClassCodes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { migratePlayerClassCodes, generateCodeFromName, ensureUniqueCode };
