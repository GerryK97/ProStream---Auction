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

    if (!activeTournament) {
      return NextResponse.json(
        { error: 'No active tournament found' },
        { status: 404 }
      );
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
