import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { triggerAuctionUndo } from '@/lib/pusher-server';
import { serializeTeam, serializePlayer } from '@/lib/cloudinaryUtils';

// POST /api/auction/undo - Undo the last player sale or unsold marking
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

    // Find the most recently acted-upon sold/unsold players — parallel (no dependency)
    const [lastSoldPlayer, lastUnsoldPlayer] = await Promise.all([
      PlayerModel.findOne({ tournamentId, isSold: true }).sort({ updatedAt: -1 }).lean(),
      PlayerModel.findOne({ tournamentId, isUnsold: true, isSold: false }).sort({ updatedAt: -1 }).lean(),
    ]);

    if (!lastSoldPlayer && !lastUnsoldPlayer) {
      return NextResponse.json(
        { error: 'No sold or unsold player found to undo' },
        { status: 400 }
      );
    }

    // Determine which action to undo:
    // - If only one type exists, undo that one
    // - If both exist, compare updatedAt timestamps; prefer undo-unsold on tie
    //   (marking unsold is always the more recent action when both are equal/null)
    let undoSale: boolean;
    if (lastSoldPlayer && !lastUnsoldPlayer) {
      undoSale = true;
    } else if (!lastSoldPlayer && lastUnsoldPlayer) {
      undoSale = false;
    } else {
      const soldAt   = new Date((lastSoldPlayer   as any).updatedAt ?? null).getTime();
      const unsoldAt = new Date((lastUnsoldPlayer as any).updatedAt ?? null).getTime();
      // Use strict greater-than so ties (both null → both 0) prefer undo-unsold
      undoSale = soldAt > unsoldAt;
    }

    if (undoSale) {
      // ── Undo a Sale ────────────────────────────────────────────────────────
      const { _id: playerId, winningTeamId, finalPrice } = lastSoldPlayer as any;

      if (!winningTeamId || finalPrice === undefined) {
        return NextResponse.json(
          { error: 'No sold player found to undo' },
          { status: 400 }
        );
      }

      // Unsell the player first — must happen before balance recalculation
      const restoredPlayer = await PlayerModel.findOneAndUpdate(
        { _id: playerId, tournamentId, isSold: true },
        {
          $set: { isSold: false },
          $unset: { finalPrice: '', winningTeamId: '' },
        },
        { new: true }
      ).lean();

      if (!restoredPlayer) {
        return NextResponse.json(
          { error: 'Last sale was already undone. Refreshing latest results.' },
          { status: 409 }
        );
      }

      // Derive correct balance from source of truth — idempotent, immune to $inc drift.
      // The player is already un-sold above, so this sum excludes the refunded player.
      // Fetch team doc + recalculated spend + auction state all in parallel.
      const [teamDoc, totalSpentAgg, auctionState] = await Promise.all([
        TeamModel.findById(winningTeamId).lean(),
        PlayerModel.aggregate([
          { $match: { tournamentId, isSold: true, winningTeamId: String(winningTeamId) } },
          { $group: { _id: null, total: { $sum: '$finalPrice' } } },
        ]),
        AuctionStateModel.findOne({ tournamentId }).lean(),
      ]);
      const totalSpent = totalSpentAgg[0]?.total ?? 0;
      const newBalance = (teamDoc as any).initialBudget - totalSpent;

      // Refund the team with derived balance
      const updatedTeam = await TeamModel.findOneAndUpdate(
        { _id: winningTeamId },
        {
          $set: { currentBalance: newBalance },
          $pull: { playersPurchased: String(playerId) },
        },
        { new: true }
      ).lean();

      // Get auction state
      let currentAuctionState = auctionState;

      // If this was the current player being auctioned, reset the auction state
      if (currentAuctionState && (currentAuctionState as any).currentPlayerId?.toString() === playerId.toString()) {
        currentAuctionState = await AuctionStateModel.findOneAndUpdate(
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
      }

      // Fire Pusher without awaiting — overlay gets event asynchronously.
      triggerAuctionUndo(tournamentId, {
        restoredPlayer: serializePlayer(restoredPlayer as any) as any,
        updatedTeam: updatedTeam ? serializeTeam(updatedTeam as any) as any : null,
        refundedAmount: finalPrice,
        auctionState: currentAuctionState as any,
        message: 'Last sale undone successfully',
      }).catch((err) => console.error('[undo] Pusher trigger failed:', err));

      return NextResponse.json({
        message: 'Last sale undone successfully',
        player: lastSoldPlayer,
        refundedAmount: finalPrice,
      });

    } else {
      // ── Undo an Unsold marking ─────────────────────────────────────────────
      const { _id: playerId } = lastUnsoldPlayer as any;

      // Restore player to available
      const restoredPlayer = await PlayerModel.findOneAndUpdate(
        { _id: playerId, tournamentId, isUnsold: true, isSold: false },
        { $set: { isUnsold: false } },
        { new: true }
      ).lean();

      if (!restoredPlayer) {
        return NextResponse.json(
          { error: 'Last unsold marking was already undone. Refreshing latest results.' },
          { status: 409 }
        );
      }

      const auctionState = await AuctionStateModel.findOne({ tournamentId }).lean();

      triggerAuctionUndo(tournamentId, {
        restoredPlayer: serializePlayer(restoredPlayer as any) as any,
        updatedTeam: null,
        refundedAmount: 0,
        auctionState: auctionState as any,
        message: 'Unsold marking reversed',
      }).catch((err) => console.error('[undo-unsold] Pusher trigger failed:', err));

      return NextResponse.json({
        message: 'Unsold marking reversed successfully',
        player: restoredPlayer,
      });
    }

  } catch (error) {
    console.error('Error undoing action:', error);
    return NextResponse.json(
      { error: 'Failed to undo action' },
      { status: 500 }
    );
  }
}
