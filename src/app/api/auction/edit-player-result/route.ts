import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { TournamentModel } from '@/models/Tournament';
import { triggerStateUpdate } from '@/lib/pusher-server';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// PATCH /api/auction/edit-player-result
// Edit a sold or unsold player's status, final price, or winning team.
// Handles budget adjustments when sale amount or team changes.
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canPerformAction(user.role, 'manage', 'auction')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const { tournamentId, playerId, status, finalPrice, winningTeamId } = await request.json();

    if (!tournamentId || !playerId || !status) {
      return NextResponse.json({ error: 'Missing required fields: tournamentId, playerId, status' }, { status: 400 });
    }
    if (!['sold', 'unsold', 'available'].includes(status)) {
      return NextResponse.json({ error: 'status must be sold, unsold, or available' }, { status: 400 });
    }
    if (status === 'sold' && (!finalPrice || !winningTeamId)) {
      return NextResponse.json({ error: 'finalPrice and winningTeamId required when status is sold' }, { status: 400 });
    }

    const tournament = await TournamentModel.findById(tournamentId).lean();
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    // Fetch current player state to know what to undo
    const player = await PlayerModel.findById(playerId).lean();
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    // ── Step 1: Reverse previous state's budget impact ──────────────────────
    if ((player as any).isSold && (player as any).winningTeamId && (player as any).finalPrice) {
      // Refund old team and remove player from their roster
      await TeamModel.findByIdAndUpdate((player as any).winningTeamId, {
        $inc: { currentBalance: (player as any).finalPrice },
        $pull: { playersPurchased: playerId },
      });
    }

    // ── Step 2: Apply new state ──────────────────────────────────────────────
    let playerUpdate: Record<string, any>;

    if (status === 'sold') {
      const newPrice = Number(finalPrice);
      if (isNaN(newPrice) || newPrice <= 0) {
        return NextResponse.json({ error: 'finalPrice must be a positive number' }, { status: 400 });
      }
      const newTeam = await TeamModel.findById(winningTeamId).lean();
      if (!newTeam) return NextResponse.json({ error: 'Winning team not found' }, { status: 404 });

      // Deduct from new team and add player to their roster
      await TeamModel.findByIdAndUpdate(winningTeamId, {
        $inc: { currentBalance: -newPrice },
        $addToSet: { playersPurchased: playerId },
      });

      playerUpdate = {
        isSold: true,
        isUnsold: false,
        finalPrice: newPrice,
        winningTeamId,
        updatedAt: new Date(),
      };
    } else if (status === 'unsold') {
      playerUpdate = {
        isSold: false,
        isUnsold: true,
        finalPrice: null,
        winningTeamId: null,
        updatedAt: new Date(),
      };
    } else {
      // available — reset to pool
      playerUpdate = {
        isSold: false,
        isUnsold: false,
        finalPrice: null,
        winningTeamId: null,
        updatedAt: new Date(),
      };
    }

    await PlayerModel.findByIdAndUpdate(playerId, { $set: playerUpdate });

    // ── Step 3: Broadcast updated state ─────────────────────────────────────
    const [updatedPlayers, updatedTeams, auctionState] = await Promise.all([
      PlayerModel.find({ tournamentId }).lean(),
      TeamModel.find({ tournamentId }).lean(),
      AuctionStateModel.findOne({ tournamentId }).lean(),
    ]);

    // Fetch just the updated player to return to the client for optimistic update
    const updatedPlayer = await PlayerModel.findById(playerId).lean();

    try {
      await triggerStateUpdate({
        tournament: tournament as any,
        auctionState: auctionState as any,
        players: updatedPlayers as any[],
        teams: updatedTeams as any[],
        message: `Player result updated: ${(player as any).name} → ${status}`,
      });
    } catch (pusherError) {
      console.error('[edit-player-result] Pusher error:', pusherError);
    }

    return NextResponse.json({ ok: true, player: updatedPlayer, teams: updatedTeams });
  } catch (error) {
    console.error('Error in /api/auction/edit-player-result:', error);
    return NextResponse.json({ error: 'Failed to update player result' }, { status: 500 });
  }
}
