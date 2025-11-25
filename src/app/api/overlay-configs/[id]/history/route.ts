import { NextRequest, NextResponse } from 'next/server';
import { overlayHistoryDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// GET /api/overlay-configs/[id]/history - Get version history for an overlay config
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'read', 'overlayConfig')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const history = await overlayHistoryDB.getByConfigId(id);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching overlay history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overlay history' },
      { status: 500 }
    );
  }
}
