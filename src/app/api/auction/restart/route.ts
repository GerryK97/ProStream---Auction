import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { PlayerModel } from '@/models/Player';

// POST /api/auction/restart - Restart a stopped auction
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { tournamentId } = await request.json();

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Missing required field: tournamentId' },
        { status: 400 }
      );
    }

    // Get tournament
    const tournament = await TournamentModel.findById(tournamentId).lean();
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if tournament is stopped
    if (tournament.status !== 'Stopped') {
      return NextResponse.json(
        { error: 'Only stopped auctions can be restarted' },
        { status: 400 }
      );
    }

    // Check if another tournament is already live
    const liveTournament = await TournamentModel.findOne({
      status: 'Live',
      _id: { $ne: tournamentId }
    }).lean();

    if (liveTournament) {
      return NextResponse.json(
        { error: `Another tournament "${liveTournament.name}" is already live. Stop it before restarting this auction.` },
        { status: 400 }
      );
    }

    // Check if there are unsold players
    const unsoldPlayers = await PlayerModel.countDocuments({
      tournamentId,
      isSold: false
    });

    if (unsoldPlayers === 0) {
      return NextResponse.json(
        { error: 'All players have been sold. Cannot restart auction.' },
        { status: 400 }
      );
    }

    // Update tournament status to Live
    const updatedTournament = await TournamentModel.findByIdAndUpdate(
      tournamentId,
      { $set: { status: 'Live' } },
      { new: true }
    ).lean();

    return NextResponse.json({
      message: 'Auction restarted successfully',
      tournament: updatedTournament,
      unsoldPlayers
    });
  } catch (error) {
    console.error('Error restarting auction:', error);
    return NextResponse.json(
      { error: 'Failed to restart auction' },
      { status: 500 }
    );
  }
}
