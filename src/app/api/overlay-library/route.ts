import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OverlayLibraryModel } from '@/models/OverlayLibrary';
import { getUserFromRequest } from '@/lib/request-helpers';

// GET /api/overlay-library - Get all overlay library items
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const isActive = searchParams.get('isActive');

    // Build query
    const query: any = {};
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const overlays = await OverlayLibraryModel.find(query).sort({ createdAt: -1 });
    return NextResponse.json(overlays);
  } catch (error) {
    console.error('Error fetching overlay library:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overlay library' },
      { status: 500 }
    );
  }
}

// POST /api/overlay-library - Create new overlay library item
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();

    // Generate ID if not provided
    if (!body._id) {
      body._id = `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add createdBy
    body.createdBy = user.userId;

    const newOverlay = await OverlayLibraryModel.create(body);
    return NextResponse.json(newOverlay, { status: 201 });
  } catch (error) {
    console.error('Error creating overlay library item:', error);
    return NextResponse.json(
      { error: 'Failed to create overlay library item' },
      { status: 500 }
    );
  }
}
