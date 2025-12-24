import { NextRequest, NextResponse } from 'next/server';
import { teamDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import { connectToDatabase } from '@/lib/mongodb';
import { TeamModel } from '@/models/Team';

// POST /api/teams/create-from-master - Create tournament team from master team
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'create', 'team')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { masterTeamId, tournamentId } = await request.json();

    if (!masterTeamId || !tournamentId) {
      return NextResponse.json(
        { error: 'masterTeamId and tournamentId are required' },
        { status: 400 }
      );
    }

    // Enforce per-plan team limits when assigning to a tournament
    const plan = user.plan || 'Free';
    await connectToDatabase();
    const currentTeams = await TeamModel.countDocuments({ tournamentId });

    if (plan === 'Free' && currentTeams >= 5) {
      return NextResponse.json(
        { error: 'Free plan allows up to 5 teams per tournament. Upgrade to Standard or Offer for more teams.' },
        { status: 403 }
      );
    }

    if (plan === 'Standard' && currentTeams >= 10) {
      return NextResponse.json(
        { error: 'Standard plan includes 10 teams per tournament. Upgrade to Offer plan for unlimited teams, or contact admin to add more teams (500 LKR each).' },
        { status: 403 }
      );
    }

    // Offer plan: unlimited teams (no check needed)

    const newTeam = await teamDB.createFromMaster(masterTeamId, tournamentId, user.userId);
    return NextResponse.json(newTeam, { status: 201 });
  } catch (error: any) {
    console.error('Error creating team from master:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create team from master' },
      { status: 400 }
    );
  }
}
