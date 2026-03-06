import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';

/**
 * POST /api/migrate-ids
 * One-time migration to update player IDs:
 * - Master Players: PS001, PS002, PS003...
 * - Tournament Players: 001, 002, 003... (per tournament)
 */
export async function POST() {
  try {
    await connectToDatabase();

    const tournamentMigrations: { [key: string]: any[] } = {};

    // Migrate Tournament Player IDs
    const tournaments = await PlayerModel.distinct('tournamentId');

    for (const tournamentId of tournaments) {
      if (!tournamentId) continue;

      const players = await PlayerModel.find({ tournamentId }).sort({ createdAt: 1 });
      tournamentMigrations[tournamentId] = [];

      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const oldId = player._id;
        const newId = (i + 1).toString().padStart(3, '0');

        if (oldId === newId) {
          continue; // Already correct
        }

        // Check collision
        const existing = await PlayerModel.findOne({ _id: newId, tournamentId });
        if (existing && existing._id !== oldId) {
          continue;
        }

        const playerData = player.toObject();
        delete (playerData as any).__v;
        delete (playerData as any).createdAt;
        delete (playerData as any).updatedAt;

        // Create new document
        await PlayerModel.create({
          ...playerData,
          _id: newId,
        });

        // Update team references
        await TeamModel.updateMany(
          { tournamentId, playersPurchased: oldId },
          { $set: { 'playersPurchased.$': newId } }
        );

        // Delete old document
        await PlayerModel.deleteOne({ _id: oldId });

        tournamentMigrations[tournamentId].push({ oldId, newId, name: player.name });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      tournamentMigrations,
      summary: {
        tournamentPlayerCount: Object.values(tournamentMigrations).flat().length,
      },
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
