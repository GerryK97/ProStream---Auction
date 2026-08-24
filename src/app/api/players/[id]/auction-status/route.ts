import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { TournamentModel } from '@/models/Tournament';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// PATCH /api/players/[id]/auction-status - Update player auction status, team, and price
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!canPerformAction(user.role, 'update', 'player')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { status, winningTeamId, finalPrice } = await request.json();

    if (!['Sold', 'Unsold', 'Available'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be Sold, Unsold, or Available.' }, { status: 400 });
    }

    if (status === 'Sold' && (!winningTeamId || !finalPrice || finalPrice <= 0)) {
      return NextResponse.json({ error: 'winningTeamId and finalPrice are required when status is Sold.' }, { status: 400 });
    }

    await connectToDatabase();

    const player = await PlayerModel.findById(id).lean() as any;
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    // Check tournament access
    const tournament = await TournamentModel.findById(player.tournamentId).lean() as any;
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    const hasAccess = user.role === 'Admin' ||
      (user.role === 'Operator' && tournament.createdBy === user.userId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Step 1: Refund old team if player was previously sold
    if (player.isSold && player.winningTeamId && player.finalPrice) {
      await TeamModel.findByIdAndUpdate(player.winningTeamId, {
        $pull: { playersPurchased: id },
        $inc: { currentBalance: player.finalPrice },
      });
    }

    // Step 2: Charge new team if new status is Sold
    if (status === 'Sold') {
      const newTeam = await TeamModel.findById(winningTeamId).lean() as any;
      if (!newTeam) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

      await TeamModel.findByIdAndUpdate(winningTeamId, {
        $addToSet: { playersPurchased: id },
        $inc: { currentBalance: -finalPrice },
      });
    }

    // Step 3: Update player document
    const playerUpdate: any = {};
    if (status === 'Sold') {
      playerUpdate.isSold = true;
      playerUpdate.isUnsold = false;
      playerUpdate.winningTeamId = winningTeamId;
      playerUpdate.finalPrice = finalPrice;
    } else if (status === 'Unsold') {
      playerUpdate.isSold = false;
      playerUpdate.isUnsold = true;
      playerUpdate.winningTeamId = null;
      playerUpdate.finalPrice = null;
    } else {
      // Available
      playerUpdate.isSold = false;
      playerUpdate.isUnsold = false;
      playerUpdate.winningTeamId = null;
      playerUpdate.finalPrice = null;
    }

    const updatedPlayer = await PlayerModel.findByIdAndUpdate(
      id,
      { $set: playerUpdate },
      { returnDocument: 'after' }
    ).lean();

    return NextResponse.json({ message: 'Player auction status updated', player: updatedPlayer });
  } catch (error) {
    console.error('Error updating player auction status:', error);
    return NextResponse.json({ error: 'Failed to update player auction status' }, { status: 500 });
  }
}
