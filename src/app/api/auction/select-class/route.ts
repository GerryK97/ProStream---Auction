import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { TournamentModel } from '@/models/Tournament';
import { PlayerModel } from '@/models/Player';
import { triggerClassSelected } from '@/lib/pusher-server';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// POST /api/auction/select-class
// Auctioneer activates a player class for the spin wheel and bidding.
// Only players in the selected class will appear on the spin wheel until the class is completed.
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!canPerformAction(user.role, 'manage', 'auction')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    // className is the class NAME (e.g. "Platinum") — matches player.playerClass
    const { tournamentId, className } = await request.json();

    if (!tournamentId || !className) {
      return NextResponse.json(
        { error: 'Missing required fields: tournamentId, className' },
        { status: 400 }
      );
    }

    // Validate tournament exists and is Live, fetch auction state, count available players — all in parallel
    const [tournament, auctionState, playerCount] = await Promise.all([
      TournamentModel.findById(tournamentId).lean(),
      AuctionStateModel.findOne({ tournamentId }),
      PlayerModel.countDocuments({
        tournamentId,
        playerClass: className,
        isSold: { $ne: true },
        isUnsold: { $ne: true },
      }),
    ]);

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }
    if ((tournament as any).status !== 'Live') {
      return NextResponse.json({ error: 'Auction is not live' }, { status: 400 });
    }

    // Validate player classes are enabled
    if (!(tournament as any).usePlayerClasses) {
      return NextResponse.json(
        { error: 'Player classes are not enabled for this tournament' },
        { status: 400 }
      );
    }

    // Validate className exists in tournament's playerClasses (match by name)
    const playerClasses: any[] = (tournament as any).playerClasses ?? [];
    const classConfig = playerClasses.find((c: any) => c.name === className);
    if (!classConfig) {
      return NextResponse.json(
        { error: `Class "${className}" not found in tournament` },
        { status: 404 }
      );
    }

    if (!auctionState) {
      return NextResponse.json(
        { error: 'Auction state not found' },
        { status: 404 }
      );
    }

    // Validate class completion using real availability.
    // If completedClasses is stale but players are available again (undo/re-auction),
    // auto-heal by removing the class from completedClasses.
    const completedClasses: string[] = (auctionState as any).completedClasses ?? [];
    if (completedClasses.includes(className)) {
      if (playerCount === 0) {
        return NextResponse.json(
          { error: `Class "${className}" is already completed` },
          { status: 400 }
        );
      }

      await AuctionStateModel.findOneAndUpdate(
        { tournamentId },
        { $pull: { completedClasses: className } }
      );
    }

    // Store the class NAME in currentAuctionClass so it matches player.playerClass directly
    const updatedState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      { $set: { currentAuctionClass: className } },
      { new: true }
    ).lean();

    // Broadcast class-selected event
    try {
      triggerClassSelected(tournamentId, {
        classCode: classConfig.code,
        className,
        playerCount,
        auctionState: updatedState as any,
        message: `${className} class selected for auction (${playerCount} players remaining)`,
      }).catch((err) => console.error('[select-class] Pusher error:', err));
    } catch (pusherError) {
      console.error('[select-class] Pusher error:', pusherError);
    }

    return NextResponse.json({ ok: true, auctionState: updatedState, classConfig, playerCount });
  } catch (error) {
    console.error('Error in /api/auction/select-class:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to select class: ${msg}` }, { status: 500 });
  }
}

// DELETE /api/auction/select-class
// Clears the active class filter so all players are visible again.
export async function DELETE(request: NextRequest) {
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

    const updatedState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      { $set: { currentAuctionClass: null } },
      { new: true }
    ).lean();

    // Broadcast so all clients update their player list filter immediately
    try {
      triggerClassSelected(tournamentId, {
        classCode: '',
        className: '',
        playerCount: 0,
        auctionState: updatedState as any,
        message: 'Class filter cleared — showing all players',
      }).catch((err) => console.error('[select-class DELETE] Pusher error:', err));
    } catch (pusherError) {
      console.error('[select-class DELETE] Pusher error:', pusherError);
    }

    return NextResponse.json({ ok: true, auctionState: updatedState });
  } catch (error) {
    console.error('Error in DELETE /api/auction/select-class:', error);
    return NextResponse.json({ error: 'Failed to clear class filter' }, { status: 500 });
  }
}
