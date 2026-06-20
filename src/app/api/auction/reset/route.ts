import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { triggerAuctionReset } from '@/lib/pusher-server';

// POST /api/auction/reset - Reset the current auction (remove player from bidding board and return to available players list)
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

    // Get auction state
    const auctionState = await AuctionStateModel.findOne({ tournamentId });
    if (!auctionState) {
      return NextResponse.json(
        { error: 'Auction state not found for this tournament' },
        { status: 404 }
      );
    }

    if (!auctionState.currentPlayerId) {
      return NextResponse.json(
        { error: 'No player currently selected for auction' },
        { status: 400 }
      );
    }

    // Reset auction and remove current player (return to available players list)
    const updatedState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      {
        $set: {
          currentPlayerId: null,
          currentBid: 0,
          winningTeamId: null,
          currentAuctionStatus: 'Pending',
          history: [],
        },
      },
      { returnDocument: 'after' }
    ).lean();

    // Trigger Pusher event
    try {
      triggerAuctionReset(tournamentId, {
        auctionState: updatedState as any,
        message: 'Auction reset successfully',
      }).catch((err) => console.error('[reset] Pusher trigger failed:', err));
    } catch (pusherError) {
      console.error('Failed to trigger Pusher event:', pusherError);
    }

    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('Error resetting auction:', error);
    return NextResponse.json(
      { error: 'Failed to reset auction' },
      { status: 500 }
    );
  }
}
