import { NextRequest, NextResponse } from 'next/server';
import { TournamentModel } from '@/models/Tournament';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can update tournaments
    if (!canPerformAction(user.role, 'update', 'tournament')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const { id: tournamentId } = await params;

    // Get tournament
    const tournament = await TournamentModel.findById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Verify user has access (Admin or tournament creator)
    if (user.role !== 'Admin' && tournament.createdBy !== user.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to complete this tournament' },
        { status: 403 }
      );
    }

    // Update status to Completed
    tournament.status = 'Completed';
    await tournament.save();

    return NextResponse.json({
      success: true,
      message: 'Tournament marked as completed',
      tournament: tournament.toObject()
    });
  } catch (error: any) {
    console.error('Error completing tournament:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete tournament' },
      { status: 500 }
    );
  }
}
