import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TournamentModel } from '@/models/Tournament';
import { triggerPlayerSelected } from '@/lib/pusher-server';

// POST /api/auction/select-player - Select a specific player for auction
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { tournamentId, playerId } = await request.json();

    if (!tournamentId || !playerId) {
      return NextResponse.json(
        { error: 'Missing required fields: tournamentId, playerId' },
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

    // Check if there's an ongoing auction
    if (auctionState.currentAuctionStatus === 'Bidding') {
      return NextResponse.json(
        { error: 'Cannot select a new player while bidding is in progress' },
        { status: 400 }
      );
    }

    // Validate player exists and is not sold
    const player = await PlayerModel.findOne({
      _id: playerId,
      tournamentId,
      isSold: false
    }).lean();

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found or already sold' },
        { status: 404 }
      );
    }

    // Update auction state with new player
    const updatedState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      {
        $set: {
          currentPlayerId: playerId,
          currentBid: 0,
          winningTeamId: null,
          currentAuctionStatus: 'Pending',
          history: [],
        },
      },
      { new: true }
    ).lean();

    // Get tournament for base price
    const tournament = await TournamentModel.findById(tournamentId).lean();
    const basePrice = tournament?.basePricePerPlayer || 0;

    // Trigger Pusher event
    try {
      await triggerPlayerSelected(tournamentId, {
        currentPlayer: player as any,
        basePrice,
        auctionState: updatedState as any,
        message: `Player ${player.name} selected for auction`,
      });
    } catch (pusherError) {
      console.error('Failed to trigger Pusher event:', pusherError);
    }

    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('Error selecting player:', error);
    return NextResponse.json(
      { error: 'Failed to select player' },
      { status: 500 }
    );
  }
}
