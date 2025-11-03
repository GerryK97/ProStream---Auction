import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';

// POST /api/auction/bid - Place a bid for the current player
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { tournamentId, teamId, amount } = await request.json();

    if (!tournamentId || !teamId || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: tournamentId, teamId, amount' },
        { status: 400 }
      );
    }

    // Get auction state
    const auctionState = await AuctionStateModel.findOne({ tournamentId });
    if (!auctionState) {
      return NextResponse.json(
        { error: 'Auction state not found for this tournament' },
        { status: 404 }
      );
    }

    // Validate tournament is live
    const tournament = await TournamentModel.findOne({ _id: tournamentId }).lean();
    if (!tournament || tournament.status !== 'Live') {
      return NextResponse.json(
        { error: 'Auction is not live' },
        { status: 400 }
      );
    }

    // Validate player
    if (!auctionState.currentPlayerId) {
      return NextResponse.json(
        { error: 'No player is currently up for auction' },
        { status: 400 }
      );
    }

    const player = await PlayerModel.findOne({ _id: auctionState.currentPlayerId }).lean();
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    if (player.isSold) {
      return NextResponse.json(
        { error: 'Player is already sold' },
        { status: 400 }
      );
    }

    // Validate team
    const team = await TeamModel.findOne({ _id: teamId }).lean();
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Validate bid amount
    if (amount <= auctionState.currentBid) {
      return NextResponse.json(
        { error: 'Bid must be higher than the current bid' },
        { status: 400 }
      );
    }

    if (auctionState.currentBid === 0 && amount < tournament.basePricePerPlayer) {
      return NextResponse.json(
        { error: `The first bid must be at least the base price of ${tournament.basePricePerPlayer.toLocaleString()}` },
        { status: 400 }
      );
    }

    if (amount > team.currentBalance) {
      return NextResponse.json(
        { error: 'Team does not have enough balance for this bid' },
        { status: 400 }
      );
    }

    // Update auction state
    const newBid = {
      teamId,
      amount,
      timestamp: Date.now(),
    };

    const updatedState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      {
        $set: {
          currentBid: amount,
          winningTeamId: teamId,
          currentAuctionStatus: 'Bidding',
        },
        $push: { history: newBid },
      },
      { new: true }
    ).lean();

    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('Error placing bid:', error);
    return NextResponse.json(
      { error: 'Failed to place bid' },
      { status: 500 }
    );
  }
}
