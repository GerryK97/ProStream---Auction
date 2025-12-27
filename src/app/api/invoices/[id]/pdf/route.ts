import { NextRequest, NextResponse } from 'next/server';
import { invoiceDB, customerDB } from '@/lib/db-invoicing';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import PDFDocument from 'pdfkit';

/**
 * GET /api/invoices/[id]/pdf
 * Generate and download invoice PDF
 */
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

    if (!canPerformAction(user.role, 'read', 'invoice')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get invoice
    const invoice = await invoiceDB.getById(id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check ownership
    if (invoice.createdBy !== user.userId && user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get customer
    const customer = await customerDB.getById(invoice.customerId);

    // Generate PDF using PDFKit
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Create PDF content
    doc.fontSize(24).text('INVOICE', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Bill To:');
    doc.fontSize(10).text(customer?.name || 'Unknown Customer');
    if (customer?.email) doc.text(customer.email);
    if (customer?.phone) doc.text(customer.phone);
    doc.moveDown();

    // Line items
    doc.fontSize(12).text('Items:', { underline: true });
    doc.moveDown(0.5);

    invoice.items.forEach((item: any) => {
      doc.fontSize(10).text(`${item.description} - Qty: ${item.quantity} x LKR ${item.unitPrice.toFixed(2)} = LKR ${item.total.toFixed(2)}`);
    });

    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Subtotal: LKR ${invoice.subtotal.toFixed(2)}`, { align: 'right' });
    if (invoice.tax > 0) {
      doc.text(`Tax (${invoice.taxRate}%): LKR ${invoice.tax.toFixed(2)}`, { align: 'right' });
    }
    if (invoice.discount > 0) {
      doc.text(`Discount: -LKR ${invoice.discount.toFixed(2)}`, { align: 'right' });
    }
    doc.fontSize(14).text(`Total: LKR ${invoice.total.toFixed(2)}`, { align: 'right' });
    doc.text(`Amount Paid: LKR ${invoice.amountPaid.toFixed(2)}`, { align: 'right' });
    doc.fontSize(16).text(`Balance Due: LKR ${invoice.balance.toFixed(2)}`, { align: 'right' });

    if (invoice.notes) {
      doc.moveDown();
      doc.fontSize(10).text('Notes:', { underline: true });
      doc.text(invoice.notes);
    }

    doc.end();

    // Wait for PDF to be generated
    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve());
    });

    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF with proper filename
    const filename = `${invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
