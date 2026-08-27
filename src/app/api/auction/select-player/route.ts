import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TournamentModel } from '@/models/Tournament';
import { triggerPlayerSelected } from '@/lib/pusher-server';
import { serializePlayer } from '@/lib/cloudinaryUtils';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import { authorizeAuctionMutation } from '@/lib/auctionAuthorization';

// POST /api/auction/select-player - Select a specific player for auction
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { tournamentId, playerId, overlaySize, sizeRev } = await request.json();

    if (!tournamentId || !playerId) {
      return NextResponse.json(
        { error: 'Missing required fields: tournamentId, playerId' },
        { status: 400 }
      );
    }

    const access = await authorizeAuctionMutation(request, tournamentId);
    if (!access.authorized) return access.response;
    const tournament = access.tournament;
    if (tournament.status !== 'Live') {
      return NextResponse.json({ error: 'Auction is not live' }, { status: 400 });
    }

    const resolvedOverlaySize =
      overlaySize === 'large' || overlaySize === 'small' ? overlaySize : undefined;
    const resolvedSizeRev =
      typeof sizeRev === 'number' && Number.isFinite(sizeRev) ? sizeRev : undefined;

    // Keep the selection hot path small. Auction history and full tournament/player
    // documents can be large, but this route only needs the status, player card
    // fields, and pricing configuration.
    const [auctionState, player] = await Promise.all([
      AuctionStateModel.findOne(
        { tournamentId },
        { currentAuctionStatus: 1, currentAuctionClass: 1 },
      ).lean(),
      PlayerModel.findOne(
        { _id: playerId, tournamentId, isSold: false, isUnsold: { $ne: true } },
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
        { error: 'Player not found, already sold, or marked unsold' },
        { status: 404 }
      );
    }

    const activeClass = (auctionState as any).currentAuctionClass as string | null;
    if (activeClass && (player as any).playerClass !== activeClass) {
      return NextResponse.json(
        { error: `Only players from the active class "${activeClass}" can be selected` },
        { status: 409 },
      );
    }

    const updatedState = await AuctionStateModel.findOneAndUpdate(
        {
          tournamentId,
          currentAuctionStatus: { $ne: 'Bidding' },
          currentAuctionClass: activeClass ?? null,
        },
        {
          $set: {
            currentPlayerId: playerId,
            currentBid: 0,
            winningTeamId: null,
            currentAuctionStatus: 'Pending',
            history: [],
          },
          $inc: { revision: 1 },
        },
        { returnDocument: 'after' }
      ).lean();

    if (!updatedState) {
      return NextResponse.json(
        { error: 'Auction state changed before the player could be selected' },
        { status: 409 }
      );
    }

    const basePrice = getClassBasePrice(tournament as any, player as any);
    const selectedPlayer = serializePlayer(player as any) as any;
    const message = `Player ${(player as any).name} selected for auction`;

    // Persist intro card size before broadcasting so refresh/reconnect stays consistent.
    // overlaySize rides on auction:player-selected so overlays apply Large in the same
    // tick as the new player (avoids Small flash from a prior auto-switch).
    if (resolvedOverlaySize) {
      await TournamentModel.findByIdAndUpdate(tournamentId, {
        $set: { 'overlayControlSettings.size': resolvedOverlaySize },
      });
    }

    // Await the publish before ending the serverless request. Fire-and-forget
    // promises may be suspended once the response is returned, which leaves the
    // overlay and other auction panels waiting until their next full refresh.
    try {
      await triggerPlayerSelected(tournamentId, {
        currentPlayer: selectedPlayer,
        basePrice,
        auctionState: updatedState as any,
        message,
        ...(resolvedOverlaySize ? { overlaySize: resolvedOverlaySize } : {}),
        ...(resolvedSizeRev !== undefined ? { sizeRev: resolvedSizeRev } : {}),
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
      ...(resolvedOverlaySize ? { overlaySize: resolvedOverlaySize } : {}),
      ...(resolvedSizeRev !== undefined ? { sizeRev: resolvedSizeRev } : {}),
    });
  } catch (error) {
    console.error('Error selecting player:', error);
    return NextResponse.json(
      { error: 'Failed to select player' },
      { status: 500 }
    );
  }
}
