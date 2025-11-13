import { NextRequest, NextResponse } from 'next/server';
import { masterPlayerDB } from '@/lib/db-mongodb';

// GET /api/master-players - Get all master players with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    // Get paginated data and total count
    const players = await masterPlayerDB.getPaginated(skip, limit);
    const total = await masterPlayerDB.count();

    return NextResponse.json({
      data: players,
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
    const body = await request.json();
    const newPlayer = await masterPlayerDB.create(body);
    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating master player:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create master player' },
      { status: 400 }
    );
  }
}
