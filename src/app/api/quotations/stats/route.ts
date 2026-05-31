import { NextRequest, NextResponse } from 'next/server';
import { quotationDB } from '@/lib/db-invoicing';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

/**
 * GET /api/quotations/stats
 * Get quotation statistics for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'read', 'invoice')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = await quotationDB.getStats(user.userId);

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Get quotation stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quotation statistics' },
      { status: 500 }
    );
  }
}
