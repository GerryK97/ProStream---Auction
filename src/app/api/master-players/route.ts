import { NextRequest, NextResponse } from 'next/server';
import { masterPlayerDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// GET /api/master-players - Get all master players with pagination
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to read master players (Admin or MasterManager)
    if (!canPerformAction(user.role, 'read', 'masterPlayer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use getAllForUser to filter master players based on role
    // Admin sees all, MasterManagers see only their own
    const players = await masterPlayerDB.getAllForUser(user.userId, user.role);

    // Apply pagination to filtered results
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const paginatedPlayers = players.slice(skip, skip + limit);
    const total = players.length;

    return NextResponse.json({
      data: paginatedPlayers,
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
    console.error('Error fetching master players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master players' },
      { status: 500 }
    );
  }
}

// POST /api/master-players - Create new master player
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create master players
    if (!canPerformAction(user.role, 'create', 'masterPlayer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Add createdBy field to track ownership
    const newPlayer = await masterPlayerDB.create({
      ...body,
      createdBy: user.userId,
    });

    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating master player:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create master player' },
      { status: 400 }
    );
  }
}
