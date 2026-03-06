import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import mongoose from 'mongoose';

/**
 * POST /api/admin/reset-player-team-data
 *
 * One-time cleanup endpoint. Drops all player, team, master player/team, and
 * auction state data and resets all tournaments back to Draft status.
 *
 * Admin-only. Delete this endpoint after use.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'Admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not available');

    const results: Record<string, number> = {};

    const deleteCollection = async (collectionName: string) => {
      try {
        const result = await db.collection(collectionName).deleteMany({});
        results[collectionName] = result.deletedCount;
      } catch {
        // Collection may not exist yet — that's fine
        results[collectionName] = 0;
      }
    };

    await Promise.all([
      deleteCollection('players'),
      deleteCollection('teams'),
      deleteCollection('masterplayers'),
      deleteCollection('masterteams'),
      deleteCollection('auctionstates'),
    ]);

    // Reset all tournaments back to Draft
    const tournamentResult = await db.collection('tournaments').updateMany(
      {},
      { $set: { status: 'Draft' } }
    );
    results['tournaments_reset'] = tournamentResult.modifiedCount;

    return NextResponse.json({
      success: true,
      message: 'Data reset complete. Delete this endpoint.',
      results,
    });
  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: error.message || 'Reset failed' }, { status: 500 });
  }
}
