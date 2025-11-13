import { NextRequest, NextResponse } from 'next/server';
import { masterTeamDB } from '@/lib/db-mongodb';

// GET /api/master-teams - Get all master teams with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    // Get paginated data and total count
    const teams = await masterTeamDB.getPaginated(skip, limit);
    const total = await masterTeamDB.count();

    return NextResponse.json({
      data: teams,
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
    const body = await request.json();
    const newTeam = await masterTeamDB.create(body);
    return NextResponse.json(newTeam, { status: 201 });
  } catch (error: any) {
    console.error('Error creating master team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create master team' },
      { status: 400 }
    );
  }
}
