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

    // Keep the selection hot path small. Auction history and full tournament/player
    // documents can be large, but this route only needs the status, player card
    // fields, and pricing configuration.
    const [auctionState, player] = await Promise.all([
      AuctionStateModel.findOne({ tournamentId }, { currentAuctionStatus: 1 }).lean(),
      PlayerModel.findOne(
        { _id: playerId, tournamentId, isSold: false },
        {
          _id: 1,
          tournamentId: 1,
          name: 1,
          displayName: 1,
          playerNo: 1,
          position: 1,
          playerClass: 1,
          basePrice: 1,
          photoURL: 1,
          secondaryImageURL: 1,
          isSold: 1,
          isUnsold: 1,
          finalPrice: 1,
          winningTeamId: 1,
        }
      ).lean(),
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
      TournamentModel.findById(
        tournamentId,
        {
          basePricePerPlayer: 1,
          basePriceStrategy: 1,
          usePlayerClasses: 1,
          playerClasses: 1,
        }
      ).lean(),
    ]);

    const basePrice = getClassBasePrice(tournament as any, player as any);
    const selectedPlayer = serializePlayer(player as any) as any;
    const message = `Player ${(player as any).name} selected for auction`;

    // Await the publish before ending the serverless request. Fire-and-forget
    // promises may be suspended once the response is returned, which leaves the
    // overlay and other auction panels waiting until their next full refresh.
    try {
      await triggerPlayerSelected(tournamentId, {
        currentPlayer: selectedPlayer,
        basePrice,
        auctionState: updatedState as any,
        message,
      });
    } catch (err) {
      // The database update succeeded, so return the authoritative selection to
      // the operator even if realtime delivery is temporarily unavailable.
      console.error('[select-player] Pusher trigger failed:', err);
    }

    // Returning the same event shape lets the initiating panel apply the server
    // result immediately instead of waiting for its own Pusher echo.
    return NextResponse.json({
      tournamentId,
      timestamp: Date.now(),
      currentPlayer: selectedPlayer,
      basePrice,
      auctionState: updatedState,
      message,
    });
  } catch (error) {
    console.error('Error selecting player:', error);
    return NextResponse.json(
      { error: 'Failed to select player' },
      { status: 500 }
    );
  }
}
