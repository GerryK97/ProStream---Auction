import { NextRequest, NextResponse } from 'next/server';
import { quotationDB } from '@/lib/db-invoicing';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

/**
 * GET /api/quotations/[id]
 * Get a single quotation by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'read', 'invoice')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const quotation = await quotationDB.getById(params.id);

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Check ownership
    if (quotation.createdBy !== user.userId && user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ quotation });
  } catch (error: any) {
    console.error('Get quotation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quotation' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/quotations/[id]
 * Update a quotation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'update', 'invoice')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check ownership
    const existing = await quotationDB.getById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    if (existing.createdBy !== user.userId && user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Recalculate totals if items changed
    if (body.items) {
      const subtotal = body.items.reduce(
        (sum: number, item: any) => sum + item.total,
        0
      );
      const tax = subtotal * (body.taxRate || existing.taxRate) / 100;
      const total = subtotal + tax - (body.discount || existing.discount);

      body.subtotal = subtotal;
      body.tax = tax;
      body.total = total;
    }

    const quotation = await quotationDB.update(params.id, body);

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json({ quotation });
  } catch (error: any) {
    console.error('Update quotation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update quotation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quotations/[id]
 * Delete a quotation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'delete', 'invoice')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check ownership
    const existing = await quotationDB.getById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    if (existing.createdBy !== user.userId && user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await quotationDB.delete(params.id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Quotation deleted successfully' });
  } catch (error: any) {
    console.error('Delete quotation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete quotation' },
      { status: 500 }
    );
  }
}
