import { NextRequest, NextResponse } from 'next/server';
import { overlayConfigDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// GET /api/overlay-configs/[id] - Get single overlay config
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

    const config = await overlayConfigDB.getById(params.id);

    if (!config) {
      return NextResponse.json({ error: 'Overlay config not found' }, { status: 404 });
    }

    // Check if user has access to this config
    if (
      user.role !== 'Admin' &&
      config.createdBy !== user.userId &&
      !config.isTemplate
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching overlay config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overlay config' },
      { status: 500 }
    );
  }
}

// PUT /api/overlay-configs/[id] - Update overlay config
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

    // Check if config exists and user has access
    const existing = await overlayConfigDB.getById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Overlay config not found' }, { status: 404 });
    }

    // Check if user owns this config or is admin
    if (user.role !== 'Admin' && existing.createdBy !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if config is locked
    if (existing.isLocked && user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Cannot edit locked overlay config' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Remove fields that shouldn't be updated via this endpoint
    const { _id, createdBy, createdAt, version, viewCount, ...updateData } = body;

    const updated = await overlayConfigDB.update(params.id, updateData, user.userId);

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update overlay config' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating overlay config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update overlay config' },
      { status: 400 }
    );
  }
}

// DELETE /api/overlay-configs/[id] - Delete overlay config
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

    // Check if config exists and user has access
    const existing = await overlayConfigDB.getById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Overlay config not found' }, { status: 404 });
    }

    // Check if user owns this config or is admin
    if (user.role !== 'Admin' && existing.createdBy !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if config is locked
    if (existing.isLocked && user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Cannot delete locked overlay config' },
        { status: 403 }
      );
    }

    const deleted = await overlayConfigDB.delete(params.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete overlay config' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Overlay config deleted successfully' });
  } catch (error) {
    console.error('Error deleting overlay config:', error);
    return NextResponse.json(
      { error: 'Failed to delete overlay config' },
      { status: 500 }
    );
  }
}
