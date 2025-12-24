import { NextRequest, NextResponse } from 'next/server';
import { quotationDB } from '@/lib/db-invoicing';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

/**
 * POST /api/quotations/[id]/convert
 * Convert a quotation to an invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'create', 'invoice')) {
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

    if (existing.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Only accepted quotations can be converted to invoices' },
        { status: 400 }
      );
    }

    if (existing.convertedToInvoiceId) {
      return NextResponse.json(
        { error: 'This quotation has already been converted to an invoice' },
        { status: 400 }
      );
    }

    const invoice = await quotationDB.convertToInvoice(params.id, user.userId);

    return NextResponse.json({
      invoice,
      message: 'Quotation converted to invoice successfully',
    });
  } catch (error: any) {
    console.error('Convert quotation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert quotation' },
      { status: 500 }
    );
  }
}
