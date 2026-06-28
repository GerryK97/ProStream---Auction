import { NextRequest, NextResponse } from 'next/server';
import { getPusherInstance } from '@/lib/pusher-server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';

/**
 * GET /api/debug/pusher?tournamentId=xxx
 * Tests Pusher server-side trigger for a tournament channel.
 * Sends a real auction:bid-placed event so the overlay's existing handler fires.
 * Open the overlay with ?debug=true to see if the event arrives.
 */
export async function GET(request: NextRequest) {
  try {
    const tournamentId = request.nextUrl.searchParams.get('tournamentId');
    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId query param required' }, { status: 400 });
    }

    // Fetch real current auction state from DB to send a realistic event
    await connectToDatabase();
    const auctionState = await AuctionStateModel.findOne({ tournamentId }).lean() as any;

    const pusher = getPusherInstance();
    const channel = `tournament-${tournamentId}`;

    const slimState = auctionState ? {
      tournamentId: auctionState.tournamentId?.toString(),
      currentPlayerId: auctionState.currentPlayerId?.toString() ?? null,
      currentBid: auctionState.currentBid ?? 0,
      winningTeamId: auctionState.winningTeamId?.toString() ?? null,
      currentAuctionStatus: auctionState.currentAuctionStatus ?? 'Pending',
      currentAuctionClass: auctionState.currentAuctionClass ?? null,
      completedClasses: auctionState.completedClasses ?? [],
      // history intentionally omitted
    } : {
      tournamentId,
      currentPlayerId: null,
      currentBid: 0,
      winningTeamId: null,
      currentAuctionStatus: 'Pending',
      currentAuctionClass: null,
      completedClasses: [],
    };

    let pusherOk = false;
    let pusherError: string | null = null;
    try {
      await pusher.trigger(channel, 'auction:bid-placed', {
        auctionState: slimState,
        currentPlayer: null,
        winningTeam: null,
        currentBid: auctionState?.currentBid ?? 0,
        previousBid: 0,
        message: '[DEBUG] Test bid event from /api/debug/pusher',
        tournamentId,
        timestamp: Date.now(),
      });
      pusherOk = true;
    } catch (err: any) {
      pusherError = err?.message || String(err);
    }

    return NextResponse.json({
      pusher: {
        ok: pusherOk,
        error: pusherError,
        channel,
        appId: process.env.PUSHER_APP_ID ? `...${process.env.PUSHER_APP_ID.slice(-4)}` : 'MISSING',
        cluster: process.env.PUSHER_CLUSTER || 'MISSING',
        keyPrefix: process.env.PUSHER_KEY?.slice(0, 8) || 'MISSING',
      },
      currentAuctionState: {
        currentBid: auctionState?.currentBid ?? null,
        status: auctionState?.currentAuctionStatus ?? null,
        historyLen: auctionState?.history?.length ?? 0,
      },
      result: pusherOk
        ? `✅ Test event sent to "${channel}". If the overlay doesn\'t update, the overlay is NOT subscribed to this channel.`
        : `❌ Pusher trigger failed: ${pusherError}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
