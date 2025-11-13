import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';

// GET /api/tournaments/active - Get currently active (Live or Stopped) tournament
export async function GET() {
  try {
    await connectToDatabase();

    // Find tournament with Live or Stopped status
    const activeTournament = await TournamentModel.findOne({
      status: { $in: ['Live', 'Stopped'] }
    })
      .sort({ _id: -1 }) // Get most recent if multiple
      .lean();

    // Return null with 200 status if no active tournament (this is an expected state, not an error)
    // This prevents console errors when no auction is running
    if (!activeTournament) {
      return NextResponse.json(null);
    }

    return NextResponse.json(activeTournament);
  } catch (error) {
    console.error('Error fetching active tournament:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active tournament' },
      { status: 500 }
    );
  }
}
