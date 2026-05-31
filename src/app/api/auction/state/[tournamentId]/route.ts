import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';

// GET /api/auction/state/[tournamentId] - Get auction state for a tournament
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    await connectToDatabase();
    const { tournamentId } = await params;

    let auctionState = await AuctionStateModel.findOne({ tournamentId }).lean();

    // If no auction state exists, create a default one
    if (!auctionState) {
      auctionState = await AuctionStateModel.create({
        tournamentId,
        currentPlayerId: null,
        currentBid: 0,
        winningTeamId: null,
        currentAuctionStatus: 'Pending',
        history: [],
      });
    }

    return NextResponse.json(auctionState);
  } catch (error) {
    console.error('Error fetching auction state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auction state' },
      { status: 500 }
    );
  }
}
