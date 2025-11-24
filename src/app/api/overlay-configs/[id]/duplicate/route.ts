import { NextRequest, NextResponse } from 'next/server';
import { overlayConfigDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// POST /api/overlay-configs/[id]/duplicate - Duplicate an overlay config
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'create', 'overlayConfig')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const duplicated = await overlayConfigDB.duplicate(params.id, user.userId);

    if (!duplicated) {
      return NextResponse.json(
        { error: 'Overlay config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error: any) {
    console.error('Error duplicating overlay config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to duplicate overlay config' },
      { status: 400 }
    );
  }
}
