import { NextRequest, NextResponse } from 'next/server';
import { TeamModel } from '@/models/Team';
import { TournamentModel } from '@/models/Tournament';
import { connectToDatabase } from '@/lib/mongodb';
import { Tournament } from '@/types';

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { tournamentId } = body;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'tournamentId is required' },
        { status: 400 }
      );
    }

    // Fetch tournament
    const tournament = await TournamentModel.findById(tournamentId).lean() as Tournament | null;
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Safety check: Cannot delete from Live, Completed, or Archived tournaments
    if (['Live', 'Completed', 'Archived'].includes(tournament.status)) {
      return NextResponse.json(
        { error: `Cannot delete teams from a ${tournament.status} tournament` },
        { status: 400 }
      );
    }

    // Safety check: Cannot delete teams that have purchased players
    const teamsWithPlayers = await TeamModel.countDocuments({
      tournamentId,
      playersPurchased: { $exists: true, $ne: [] },
    });

    if (teamsWithPlayers > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete teams: ${teamsWithPlayers} teams have purchased players. Remove teams manually before clearing all.`,
        },
        { status: 400 }
      );
    }

    // Delete all teams in tournament
    const result = await TeamModel.deleteMany({ tournamentId });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} teams from tournament`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Bulk delete teams error:', error);
    return NextResponse.json(
      { error: `Failed to delete teams: ${error.message}` },
      { status: 500 }
    );
  }
}
