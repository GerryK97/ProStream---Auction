import { NextRequest, NextResponse } from 'next/server';
import { PlayerModel } from '@/models/Player';
import { TournamentModel } from '@/models/Tournament';
import { connectToDatabase } from '@/lib/mongodb';
import { Tournament } from '@/types';

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { tournamentId, playerIds } = body;

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
        { error: `Cannot delete players from a ${tournament.status} tournament` },
        { status: 400 }
      );
    }

    // Selective delete: specific playerIds provided
    if (Array.isArray(playerIds) && playerIds.length > 0) {
      const soldCount = await PlayerModel.countDocuments({
        _id: { $in: playerIds },
        tournamentId,
        isSold: true,
      });

      if (soldCount > 0) {
        return NextResponse.json(
          { error: `Cannot delete: ${soldCount} selected player(s) are already sold.` },
          { status: 400 }
        );
      }

      const result = await PlayerModel.deleteMany({ _id: { $in: playerIds }, tournamentId });
      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} player(s)`,
        deletedCount: result.deletedCount,
      });
    }

    // Delete all players in tournament (existing behaviour)
    const soldCount = await PlayerModel.countDocuments({
      tournamentId,
      isSold: true,
    });

    if (soldCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete players: ${soldCount} players are already sold. Remove sold players manually before clearing all.`,
        },
        { status: 400 }
      );
    }

    const result = await PlayerModel.deleteMany({ tournamentId });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} players from tournament`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Bulk delete players error:', error);
    return NextResponse.json(
      { error: `Failed to delete players: ${error.message}` },
      { status: 500 }
    );
  }
}
