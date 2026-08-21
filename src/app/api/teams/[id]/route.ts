import { NextRequest, NextResponse } from 'next/server';
import { teamDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction, canAccessTeam, canModifyResource } from '@/lib/permissions';
import { tournamentDB } from '@/lib/db-mongodb';
import { resolveTeamOfficialsConfig, validateAndNormalizeOfficials, deriveOwnerName } from '@/lib/teamOfficials';
import { serializeTeam } from '@/lib/cloudinaryUtils';

// GET /api/teams/[id] - Get team by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to read teams
    if (!canPerformAction(user.role, 'read', 'team')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const team = await teamDB.getById(id);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this team
    let canAccessTeamFlag = false;
    if (team.tournamentId) {
      const tournament = await tournamentDB.getById(team.tournamentId);
      if (tournament) {
        const canAccessTournamentFlag = user.role === 'Admin' ||
          team.createdBy === user.userId ||
          user.assignedTournaments.includes(team.tournamentId);
        canAccessTeamFlag = canAccessTeam(
          user.userId,
          user.role,
          { _id: team._id, tournamentId: team.tournamentId, createdBy: team.createdBy },
          canAccessTournamentFlag
        );
      }
    } else {
      canAccessTeamFlag = user.role === 'Admin' || team.createdBy === user.userId;
    }

    if (!canAccessTeamFlag) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(serializeTeam(team as any));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

// PUT /api/teams/[id] - Update team
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update teams
    if (!canPerformAction(user.role, 'update', 'team')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const team = await teamDB.getById(id);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user can modify this team
    if (!canModifyResource(user.userId, user.role, team)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // If officials (or ownerName) are being edited, validate against tournament config
    if (body.officials !== undefined || body.ownerName !== undefined) {
      const tournament = await tournamentDB.getById((team as any).tournamentId) as any;
      const cfg = resolveTeamOfficialsConfig(tournament);
      // Fall back to existing officials/ownerName when only one side is provided
      const submittedOfficials = body.officials !== undefined ? body.officials : (team as any).officials;
      const legacyOwner = body.ownerName !== undefined ? body.ownerName : (team as any).ownerName;
      const officialsResult = validateAndNormalizeOfficials(submittedOfficials, cfg, legacyOwner);
      if ('error' in officialsResult) {
        return NextResponse.json({ error: officialsResult.error }, { status: 400 });
      }
      body.officials = officialsResult.officials;
      body.ownerName = deriveOwnerName(officialsResult.officials) || (typeof legacyOwner === 'string' ? legacyOwner.trim() : '');
    }

    const updatedTeam = await teamDB.update(id, body);
    if (!updatedTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(serializeTeam(updatedTeam as any));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Delete team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete teams
    if (!canPerformAction(user.role, 'delete', 'team')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const team = await teamDB.getById(id);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user can modify this team
    if (!canModifyResource(user.userId, user.role, team)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await teamDB.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
