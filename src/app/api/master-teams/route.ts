import { NextRequest, NextResponse } from 'next/server';
import { masterTeamDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// GET /api/master-teams - Get all master teams with pagination
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to read master teams (Admin or MasterManager)
    if (!canPerformAction(user.role, 'read', 'masterTeam')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use getAllForUser to filter master teams based on role
    // Admin sees all, MasterManagers see only their own
    const teams = await masterTeamDB.getAllForUser(user.userId, user.role);

    // Apply pagination to filtered results
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const paginatedTeams = teams.slice(skip, skip + limit);
    const total = teams.length;

    return NextResponse.json({
      data: paginatedTeams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching master teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master teams' },
      { status: 500 }
    );
  }
}

// POST /api/master-teams - Create new master team
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create master teams
    if (!canPerformAction(user.role, 'create', 'masterTeam')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Add createdBy field to track ownership
    const newTeam = await masterTeamDB.create({
      ...body,
      createdBy: user.userId,
    });

    return NextResponse.json(newTeam, { status: 201 });
  } catch (error: any) {
    console.error('Error creating master team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create master team' },
      { status: 400 }
    );
  }
}
