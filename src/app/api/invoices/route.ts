import { NextRequest, NextResponse } from 'next/server';
import { invoiceDB, customerDB } from '@/lib/db-invoicing';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

/**
 * GET /api/invoices
 * Get all invoices for the authenticated user
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

    const invoices = await invoiceDB.getAll(user.userId, {
      status,
      customerId,
      fromDate,
      toDate,
    });

    // Populate customer names
    const invoicesWithCustomers = await Promise.all(
      invoices.map(async (invoice) => {
        const customer = await customerDB.getById(invoice.customerId);
        return {
          ...invoice,
          customerName: customer?.name || 'Unknown Customer',
        };
      })
    );

    return NextResponse.json({ invoices: invoicesWithCustomers });
  } catch (error: any) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices
 * Create a new invoice
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
    const balance = total - (body.amountPaid || 0);

    const invoiceData = {
      ...body,
      subtotal,
      tax,
      total,
      balance,
      amountPaid: body.amountPaid || 0,
      issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      dueDate: body.dueDate
        ? new Date(body.dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    };

    const invoice = await invoiceDB.create(invoiceData, user.userId);

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
