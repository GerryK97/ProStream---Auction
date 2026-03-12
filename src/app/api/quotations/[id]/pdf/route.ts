import { NextRequest, NextResponse } from 'next/server';
import { quotationDB, customerDB } from '@/lib/db-invoicing';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import PDFDocument from 'pdfkit';

/**
 * GET /api/quotations/[id]/pdf
 * Generate and download quotation PDF
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

    // Get quotation
    const quotation = await quotationDB.getById(id);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Check ownership
    if (quotation.createdBy !== user.userId && user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get customer
    const customer = await customerDB.getById(quotation.customerId);

    // Generate PDF using PDFKit
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Create PDF content
    doc.fontSize(24).text('QUOTATION', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Quotation Number: ${quotation.quotationNumber}`);
    doc.text(`Issue Date: ${new Date(quotation.issueDate).toLocaleDateString()}`);
    doc.text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Prepared For:');
    doc.fontSize(10).text(customer?.name || 'Unknown Customer');
    if (customer?.email) doc.text(customer.email);
    if (customer?.phone) doc.text(customer.phone);
    doc.moveDown();

    // Line items
    doc.fontSize(12).text('Items:', { underline: true });
    doc.moveDown(0.5);

    quotation.items.forEach((item: any) => {
      doc.fontSize(10).text(`${item.description} - Qty: ${item.quantity} x LKR ${item.unitPrice.toFixed(2)} = LKR ${item.total.toFixed(2)}`);
    });

    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Subtotal: LKR ${quotation.subtotal.toFixed(2)}`, { align: 'right' });
    if (quotation.tax > 0) {
      doc.text(`Tax (${quotation.taxRate}%): LKR ${quotation.tax.toFixed(2)}`, { align: 'right' });
    }
    if (quotation.discount > 0) {
      doc.text(`Discount: -LKR ${quotation.discount.toFixed(2)}`, { align: 'right' });
    }
    doc.fontSize(16).text(`Total: LKR ${quotation.total.toFixed(2)}`, { align: 'right' });

    if (quotation.notes) {
      doc.moveDown();
      doc.fontSize(10).text('Notes:', { underline: true });
      doc.text(quotation.notes);
    }

    if (quotation.terms) {
      doc.moveDown();
      doc.fontSize(10).text('Terms & Conditions:', { underline: true });
      doc.text(quotation.terms);
    }

    // Wait for PDF to be generated
    const endPromise = new Promise<void>((resolve) => {
      doc.on('end', () => resolve());
    });

    doc.end();

    await endPromise;

    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF with proper filename (quotation number only)
    const filename = `${quotation.quotationNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
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
