import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { TournamentModel } from '@/models/Tournament';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { triggerBidPlaced } from '@/lib/pusher-server';

// POST /api/auction/bid/correct
// Corrects the current bid to any positive amount — bypasses the "must be higher" rule.
// Used by bid handlers to undo accidental over-bids during a live auction.
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { tournamentId, amount, teamId } = await request.json();

    if (!tournamentId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing or invalid fields: tournamentId, amount (must be > 0)' },
        { status: 400 }
      );
    }

    const auctionState = await AuctionStateModel.findOne({ tournamentId });
    if (!auctionState) {
      return NextResponse.json(
        { error: 'Auction state not found for this tournament' },
        { status: 404 }
      );
    }

    const tournament = await TournamentModel.findOne({ _id: tournamentId }).lean();
    if (!tournament || (tournament as any).status !== 'Live') {
      return NextResponse.json({ error: 'Auction is not live' }, { status: 400 });
    }

    if (!auctionState.currentPlayerId) {
      return NextResponse.json(
        { error: 'No player is currently up for auction' },
        { status: 400 }
      );
    }

    const player = await PlayerModel.findOne({ _id: auctionState.currentPlayerId }).lean();
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    if ((player as any).isSold) {
      return NextResponse.json({ error: 'Player is already sold' }, { status: 400 });
    }

    const previousBid = auctionState.currentBid;

    const updatedState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      {
        $set: {
          currentBid: amount,
          currentAuctionStatus: 'Bidding',
        },
        $push: { history: { teamId: teamId || null, amount, timestamp: Date.now() } },
      },
      { new: true }
    ).lean();

    // Look up the team if provided
    let winningTeam = null;
    if (teamId) {
      winningTeam = await TeamModel.findById(teamId).lean();
    }

    // Reuse the bid-placed Pusher event so the overlay updates in real time
    try {
      await triggerBidPlaced(tournamentId, {
        auctionState: updatedState as any,
        currentPlayer: player as any,
        winningTeam: winningTeam as any,
        currentBid: amount,
        previousBid,
        message: `Bid corrected to: ${amount.toLocaleString()}`,
      });
    } catch (pusherError) {
      console.error('Failed to trigger Pusher event:', pusherError);
    }

    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('Error correcting bid:', error);
    return NextResponse.json({ error: 'Failed to correct bid' }, { status: 500 });
  }
}
