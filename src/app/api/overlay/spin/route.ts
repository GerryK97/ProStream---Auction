import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PlayerModel } from '@/models/Player';
import { AuctionStateModel } from '@/models/AuctionState';
import { triggerWheelSpin, triggerOverlaySettings } from '@/lib/pusher-server';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// POST /api/overlay/spin
// Picks a random winner from available players, broadcasts overlay:wheel-spin
// and overlay:settings (displayMode:'wheel-spin') via Pusher.
// Returns { winnerId } so the control panel can auto-select after the animation.
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!canPerformAction(user.role, 'manage', 'auction')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const { tournamentId } = await request.json();

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    // Get current auction state to exclude the player already on stage and apply class filter
    const auctionState = await AuctionStateModel.findOne({ tournamentId }).lean();
    const currentPlayerId = (auctionState as any)?.currentPlayerId ?? null;
    const currentAuctionClass = (auctionState as any)?.currentAuctionClass ?? null;

    // Fetch available players (not sold, not unsold, not currently selected)
    // If a class is active, restrict to that class only
    const query: Record<string, unknown> = {
      tournamentId,
      isSold: { $ne: true },
      isUnsold: { $ne: true },
    };
    if (currentPlayerId) query._id = { $ne: currentPlayerId };
    if (currentAuctionClass) query.playerClass = currentAuctionClass;

    const availablePlayers = await PlayerModel
      .find(query)
      .select('_id name playerNo position playerClass')
      .lean();

    if (availablePlayers.length === 0) {
      const msg = currentAuctionClass
        ? `No available players in the active class to spin`
        : 'No available players to spin';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const winnerIndex = Math.floor(Math.random() * availablePlayers.length);
    const winner = availablePlayers[winnerIndex];
    const winnerId = (winner._id as any).toString();
    const spinDurationMs = 8000;

    const players = availablePlayers.map(p => ({
      _id: (p as any)._id.toString(),
      name: (p as any).name as string,
      playerNo: (p as any).playerNo as string | undefined,
      position: (p as any).position as string | undefined,
      playerClass: (p as any).playerClass as string | undefined,
      photoURL: (p as any).photoURL as string | undefined,
    }));

    // Broadcast spin event — overlays animate to winner
    try {
      await triggerWheelSpin(tournamentId, { players, winnerId, winnerIndex, spinDurationMs });
    } catch (pusherError) {
      console.error('[spin] triggerWheelSpin failed:', pusherError);
      const msg = pusherError instanceof Error ? pusherError.message : String(pusherError);
      return NextResponse.json({ error: `Pusher error: ${msg}` }, { status: 500 });
    }

    // Switch overlays to wheel-spin display mode
    try {
      await triggerOverlaySettings(tournamentId, {
        size: 'large',
        tickerMode: 'sold',
        displayMode: 'wheel-spin',
        hidePremiumCard: false,
        customTickerLine1: '',
        customTickerLine2: '',
        soldMessagePosition: 'bottom-right',
      });
    } catch (pusherError) {
      console.error('[spin] triggerOverlaySettings failed:', pusherError);
      // Non-fatal — wheel-spin event already sent
    }

    return NextResponse.json({ ok: true, winnerId, winnerIndex, playerCount: players.length });
  } catch (error) {
    console.error('Error in /api/overlay/spin:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Spin failed: ${msg}` }, { status: 500 });
  }
}
