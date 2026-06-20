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

    // findOneAndUpdate with upsert avoids the two-round-trip findOne + create pattern
    const auctionState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      {
        $setOnInsert: {
          tournamentId,
          currentPlayerId: null,
          currentBid: 0,
          winningTeamId: null,
          currentAuctionStatus: 'Pending',
          history: [],
        },
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json(auctionState);
  } catch (error) {
    console.error('Error fetching auction state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auction state' },
      { status: 500 }
    );
  }
}
