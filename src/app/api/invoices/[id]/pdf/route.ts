import { NextRequest, NextResponse } from 'next/server';
import { invoiceDB, customerDB } from '@/lib/db-invoicing';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import ReactPDF from '@react-pdf/renderer';
import { InvoiceTemplate } from '@/components/invoiceit/PDFTemplates/InvoiceTemplate';

/**
 * GET /api/invoices/[id]/pdf
 * Generate and download invoice PDF
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

    // Get invoice
    const invoice = await invoiceDB.getById(params.id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check ownership
    if (invoice.createdBy !== user.userId && user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get customer
    const customer = await customerDB.getById(invoice.customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfStream = await ReactPDF.renderToStream(
      InvoiceTemplate({ invoice, customer })
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Generate PDF error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
