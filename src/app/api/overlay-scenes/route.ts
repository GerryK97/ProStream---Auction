import { NextRequest, NextResponse } from 'next/server';
import { overlaySceneDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// GET /api/overlay-scenes - Get all overlay scenes
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'read', 'overlayConfig')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scenes = await overlaySceneDB.getAll();

    return NextResponse.json(scenes);
  } catch (error) {
    console.error('Error fetching overlay scenes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overlay scenes' },
      { status: 500 }
    );
  }
}

// POST /api/overlay-scenes - Create new overlay scene
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'create', 'overlayConfig')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'Scene name is required' },
        { status: 400 }
      );
    }

    const sceneData = {
      name: body.name,
      description: body.description || '',
      overlayIds: body.overlayIds || [],
    };

    const newScene = await overlaySceneDB.create(sceneData);

    return NextResponse.json(newScene, { status: 201 });
  } catch (error: any) {
    console.error('Error creating overlay scene:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create overlay scene' },
      { status: 400 }
    );
  }
}
