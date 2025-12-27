import { NextRequest, NextResponse } from 'next/server';
import { quotationDB } from '@/lib/db-invoicing';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

/**
 * GET /api/quotations
 * Get all quotations for the authenticated user
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const fromDate = searchParams.get('fromDate')
      ? new Date(searchParams.get('fromDate')!)
      : undefined;
    const toDate = searchParams.get('toDate')
      ? new Date(searchParams.get('toDate')!)
      : undefined;

    const quotations = await quotationDB.getAll(user.userId, {
      status,
      customerId,
      fromDate,
      toDate,
    });

    return NextResponse.json({ quotations });
  } catch (error: any) {
    console.error('Get quotations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quotations
 * Create a new quotation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'create', 'invoice')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.customerId || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Customer and at least one item are required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = body.items.reduce(
      (sum: number, item: any) => sum + item.total,
      0
    );
    const tax = subtotal * (body.taxRate || 0) / 100;
    const total = subtotal + tax - (body.discount || 0);

    const quotationData = {
      ...body,
      subtotal,
      tax,
      total,
      issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      validUntil: body.validUntil
        ? new Date(body.validUntil)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    };

    const quotation = await quotationDB.create(quotationData, user.userId);

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error: any) {
    console.error('Create quotation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quotation' },
      { status: 500 }
    );
  }
}
