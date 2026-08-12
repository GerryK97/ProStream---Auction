import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { PlayerModel } from '@/models/Player';
import { getUserFromRequest } from '@/lib/request-helpers';

// POST /api/tournaments/[id]/archive - Archive a completed tournament (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Only administrators can archive tournaments' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;

    // Get tournament
    const tournament = await TournamentModel.findById(id).lean();
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if tournament is completed
    if ((tournament as { status?: string }).status !== 'Completed') {
      return NextResponse.json(
        { error: 'Only completed tournaments can be archived' },
        { status: 400 }
      );
    }

    // Verify all players are sold
    const totalPlayers = await PlayerModel.countDocuments({
      tournamentId: id
    });
    const soldPlayers = await PlayerModel.countDocuments({
      tournamentId: id,
      isSold: true
    });

    if (soldPlayers !== totalPlayers) {
      return NextResponse.json(
        {
          error: 'Cannot archive tournament with unsold players',
          stats: {
            totalPlayers,
            soldPlayers,
            remainingPlayers: totalPlayers - soldPlayers
          }
        },
        { status: 400 }
      );
    }

    // Update tournament status to Archived
    const updatedTournament = await TournamentModel.findByIdAndUpdate(
      id,
      { $set: { status: 'Archived' } },
      { returnDocument: 'after' }
    ).lean();

    return NextResponse.json({
      message: 'Tournament archived successfully',
      tournament: updatedTournament
    });
  } catch (error) {
    console.error('Error archiving tournament:', error);
    return NextResponse.json(
      { error: 'Failed to archive tournament' },
      { status: 500 }
    );
  }
}
