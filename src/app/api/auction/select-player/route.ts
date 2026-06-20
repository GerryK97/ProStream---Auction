import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TournamentModel } from '@/models/Tournament';
import { triggerPlayerSelected } from '@/lib/pusher-server';
import { serializePlayer } from '@/lib/cloudinaryUtils';
import { getClassBasePrice } from '@/lib/playerClassUtils';

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

    // Fetch auction state and player in parallel
    const [auctionState, player] = await Promise.all([
      AuctionStateModel.findOne({ tournamentId }),
      PlayerModel.findOne({ _id: playerId, tournamentId, isSold: false }).lean(),
    ]);

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

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found or already sold' },
        { status: 404 }
      );
    }

    // Update auction state and fetch tournament in parallel
    const [updatedState, tournament] = await Promise.all([
      AuctionStateModel.findOneAndUpdate(
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
        { returnDocument: 'after' }
      ).lean(),
      TournamentModel.findById(tournamentId).lean(),
    ]);

    const basePrice = getClassBasePrice(tournament as any, player as any);

    // Fire Pusher without awaiting — reduces operator round-trip latency.
    triggerPlayerSelected(tournamentId, {
      currentPlayer: serializePlayer(player as any) as any,
      basePrice,
      auctionState: updatedState as any,
      message: `Player ${(player as any).name} selected for auction`,
    }).catch((err) => console.error('[select-player] Pusher trigger failed:', err));

    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('Error selecting player:', error);
    return NextResponse.json(
      { error: 'Failed to select player' },
      { status: 500 }
    );
  }
}
