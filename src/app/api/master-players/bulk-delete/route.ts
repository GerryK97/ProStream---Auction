import { NextRequest, NextResponse } from 'next/server';
import { MasterPlayerModel } from '@/models/MasterPlayer';
import { PlayerModel } from '@/models/Player';
import { TournamentModel } from '@/models/Tournament';
import { connectToDatabase } from '@/lib/mongodb';

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { confirm } = body;

    // Require explicit confirmation
    if (confirm !== 'DELETE ALL MASTER PLAYERS') {
      return NextResponse.json(
        { error: 'Confirmation text does not match. Type "DELETE ALL MASTER PLAYERS" to proceed.' },
        { status: 400 }
      );
    }

    // Safety check: Ensure no Live tournaments exist
    const liveCount = await TournamentModel.countDocuments({
      status: 'Live',
    });

    if (liveCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${liveCount} tournaments are currently Live. Stop all live auctions before clearing master players.`,
        },
        { status: 400 }
      );
    }

    // Get count of master players and affected tournament instances
    const masterPlayerCount = await MasterPlayerModel.countDocuments();
    const tournamentInstanceCount = await PlayerModel.countDocuments();

    // Get count of affected tournaments
    const affectedTournaments = await PlayerModel.distinct('tournamentId');
    const uniqueTournaments = affectedTournaments.filter(id => id != null).length;

    // CASCADE DELETE: First delete all tournament instances
    const playerInstanceResult = await PlayerModel.deleteMany({});

    // Then delete all master players
    const masterResult = await MasterPlayerModel.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Deleted ${masterResult.deletedCount} master players and ${playerInstanceResult.deletedCount} tournament instances across ${uniqueTournaments} tournaments`,
      deletedMasterPlayers: masterResult.deletedCount,
      deletedTournamentInstances: playerInstanceResult.deletedCount,
      affectedTournaments: uniqueTournaments,
    });
  } catch (error: any) {
    console.error('Bulk delete master players error:', error);
    return NextResponse.json(
      { error: `Failed to delete master players: ${error.message}` },
      { status: 500 }
    );
  }
}
