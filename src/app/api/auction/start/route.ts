import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { AuctionStateModel } from '@/models/AuctionState';

// POST /api/auction/start - Start auction with validation
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

    // Check if another tournament is already live
    const liveTournament = await TournamentModel.findOne({
      status: 'Live',
      _id: { $ne: tournamentId }
    }).lean();

    if (liveTournament) {
      return NextResponse.json(
        { error: `Another tournament "${(liveTournament as any).name}" is already live. Stop it before starting this auction.` },
        { status: 400 }
      );
    }

    // Validate: At least 2 teams
    const teamsCount = await TeamModel.countDocuments({ tournamentId });
    if (teamsCount < 2) {
      return NextResponse.json(
        { error: 'At least 2 teams are required to start the auction' },
        { status: 400 }
      );
    }

    // Validate: At least 1 player
    const playersCount = await PlayerModel.countDocuments({ tournamentId });
    if (playersCount < 1) {
      return NextResponse.json(
        { error: 'At least 1 player is required to start the auction' },
        { status: 400 }
      );
    }

    // Update tournament status to Live
    const updatedTournament = await TournamentModel.findByIdAndUpdate(
      tournamentId,
      { $set: { status: 'Live' } },
      { new: true }
    ).lean();

    // Initialize or reset auction state
    await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      {
        $set: {
          tournamentId,
          currentPlayerId: null,
          currentBid: 0,
          winningTeamId: null,
          currentAuctionStatus: 'Pending',
          history: []
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: 'Auction started successfully',
      tournament: updatedTournament,
      teamsCount,
      playersCount
    });
  } catch (error) {
    console.error('Error starting auction:', error);
    return NextResponse.json(
      { error: 'Failed to start auction' },
      { status: 500 }
    );
  }
}
