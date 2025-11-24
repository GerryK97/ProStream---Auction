import { NextRequest, NextResponse } from 'next/server';
import { overlayConfigDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// POST /api/overlay-configs/[id]/lock - Lock/unlock an overlay config
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can lock/unlock configs
    if (user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { locked } = body;

    if (typeof locked !== 'boolean') {
      return NextResponse.json(
        { error: 'locked field must be a boolean' },
        { status: 400 }
      );
    }

    const updated = await overlayConfigDB.lock(params.id, locked);

    if (!updated) {
      return NextResponse.json(
        { error: 'Overlay config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error locking overlay config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to lock overlay config' },
      { status: 400 }
    );
  }
}
