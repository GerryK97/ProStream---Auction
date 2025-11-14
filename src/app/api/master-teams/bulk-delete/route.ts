import { NextRequest, NextResponse } from 'next/server';
import { MasterTeamModel } from '@/models/MasterTeam';
import { TeamModel } from '@/models/Team';
import { TournamentModel } from '@/models/Tournament';
import { connectToDatabase } from '@/lib/mongodb';

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { confirm } = body;

    // Require explicit confirmation
    if (confirm !== 'DELETE ALL MASTER TEAMS') {
      return NextResponse.json(
        { error: 'Confirmation text does not match. Type "DELETE ALL MASTER TEAMS" to proceed.' },
        { status: 400 }
      );
    }

    // Safety check: Ensure no Live tournaments exist
    const liveCount = await TournamentModel.countDocuments({
      status: 'Live',
    });

    if (liveCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${liveCount} tournaments are currently Live. Stop all live auctions before clearing master teams.`,
        },
        { status: 400 }
      );
    }

    // Get count of master teams and affected tournament instances
    const masterTeamCount = await MasterTeamModel.countDocuments();
    const tournamentInstanceCount = await TeamModel.countDocuments();

    // Get count of affected tournaments
    const affectedTournaments = await TeamModel.distinct('tournamentId');
    const uniqueTournaments = affectedTournaments.filter(id => id != null).length;

    // CASCADE DELETE: First delete all tournament instances
    const teamInstanceResult = await TeamModel.deleteMany({});

    // Then delete all master teams
    const masterResult = await MasterTeamModel.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Deleted ${masterResult.deletedCount} master teams and ${teamInstanceResult.deletedCount} tournament instances across ${uniqueTournaments} tournaments`,
      deletedMasterTeams: masterResult.deletedCount,
      deletedTournamentInstances: teamInstanceResult.deletedCount,
      affectedTournaments: uniqueTournaments,
    });
  } catch (error: any) {
    console.error('Bulk delete master teams error:', error);
    return NextResponse.json(
      { error: `Failed to delete master teams: ${error.message}` },
      { status: 500 }
    );
  }
}
