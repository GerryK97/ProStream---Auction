import { NextRequest, NextResponse } from 'next/server';
import { TournamentModel } from '@/models/Tournament';
import { getUserFromRequest } from '@/lib/request-helpers';
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

    // Only Admin can reactivate
    if (user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Only administrators can reactivate completed tournaments' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id: tournamentId } = await params;

    // Get tournament
    const tournament = await TournamentModel.findById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Can only reactivate Completed tournaments
    if (tournament.status !== 'Completed') {
      return NextResponse.json(
        { error: 'Only completed tournaments can be reactivated' },
        { status: 400 }
      );
    }

    // Reactivate to Stopped status (not Live, requires manual start)
    tournament.status = 'Stopped';
    await tournament.save();

    return NextResponse.json({
      success: true,
      message: 'Tournament reactivated. Set to Stopped status.',
      tournament: tournament.toObject()
    });
  } catch (error: any) {
    console.error('Error reactivating tournament:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reactivate tournament' },
      { status: 500 }
    );
  }
}
