import { NextRequest, NextResponse } from 'next/server';
import { invoiceDB } from '@/lib/db-invoicing';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

/**
 * POST /api/invoices/[id]/payment
 * Record a payment for an invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'update', 'invoice')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check ownership
    const existing = await invoiceDB.getById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (existing.createdBy !== user.userId && user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    if (body.amount > existing.balance) {
      return NextResponse.json(
        { error: 'Payment amount cannot exceed outstanding balance' },
        { status: 400 }
      );
    }

    const invoice = await invoiceDB.markAsPaid(id, body.amount);

    if (!invoice) {
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }

    return NextResponse.json({
      invoice,
      message: `Payment of ${body.amount} recorded successfully`,
    });
  } catch (error: any) {
    console.error('Record payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record payment' },
      { status: 500 }
    );
  }
}
