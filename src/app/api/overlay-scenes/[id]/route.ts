import { NextRequest, NextResponse } from 'next/server';
import { overlaySceneDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// GET /api/overlay-scenes/[id] - Get single overlay scene
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'read', 'overlayConfig')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scene = await overlaySceneDB.getById(params.id);

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    return NextResponse.json(scene);
  } catch (error) {
    console.error('Error fetching overlay scene:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overlay scene' },
      { status: 500 }
    );
  }
}

// PUT /api/overlay-scenes/[id] - Update overlay scene
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'update', 'overlayConfig')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { _id, createdAt, updatedAt, ...updateData } = body;

    const updated = await overlaySceneDB.update(params.id, updateData);

    if (!updated) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating overlay scene:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update overlay scene' },
      { status: 400 }
    );
  }
}

// DELETE /api/overlay-scenes/[id] - Delete overlay scene
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'delete', 'overlayConfig')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deleted = await overlaySceneDB.delete(params.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Scene deleted successfully' });
  } catch (error) {
    console.error('Error deleting overlay scene:', error);
    return NextResponse.json(
      { error: 'Failed to delete overlay scene' },
      { status: 500 }
    );
  }
}
