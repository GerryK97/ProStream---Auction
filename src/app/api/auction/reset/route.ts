import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';

// POST /api/auction/reset - Reset the current auction (clear bids but keep player selected)
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

    // Reset bids but keep current player
    const updatedState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      {
        $set: {
          currentBid: 0,
          winningTeamId: null,
          currentAuctionStatus: 'Pending',
          history: [],
        },
      },
      { new: true }
    ).lean();

    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('Error resetting auction:', error);
    return NextResponse.json(
      { error: 'Failed to reset auction' },
      { status: 500 }
    );
  }
}
