import { NextRequest, NextResponse } from 'next/server';
import { invoiceDB, customerDB } from '@/lib/db-invoicing';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import PDFDocument from 'pdfkit';

// Brand Colors
const BRAND_DARK = '#0F172A';
const BRAND_PRIMARY = '#6366F1';
const BRAND_PRIMARY_LIGHT = '#818CF8';
const ACCENT = '#10B981';
const GRAY_600 = '#475569';
const GRAY_400 = '#94A3B8';
const GRAY_100 = '#F1F5F9';
const WHITE = '#FFFFFF';
const ROW_ALT = '#F8FAFC';
const DANGER = '#EF4444';

const PAGE_WIDTH = 595.28;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

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

    const invoice = await invoiceDB.getById(id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.createdBy !== user.userId && user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customer = await customerDB.getById(invoice.customerId);

    // ── PDF Generation ───────────────────────────────────────────
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const formatCurrency = (n: number) =>
      `LKR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (d: Date | string) =>
      new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // ── HEADER BAND ──────────────────────────────────────────────
    doc.rect(0, 0, PAGE_WIDTH, 130).fill(BRAND_DARK);

    // Company name (left)
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(22)
      .text('ProStream Inc.', MARGIN, 38);
    doc.fillColor(BRAND_PRIMARY_LIGHT).font('Helvetica').fontSize(10)
      .text('Colombo, Sri Lanka  |  invoicing@prostream.lk  |  VAT: LK-980234', MARGIN, 64);

    // "INVOICE" badge (right)
    doc.rect(PAGE_WIDTH - MARGIN - 120, 30, 120, 40)
      .fill(BRAND_PRIMARY);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(18)
      .text('INVOICE', PAGE_WIDTH - MARGIN - 120, 40, { width: 120, align: 'center' });

    // Invoice number below badge
    doc.fillColor(GRAY_400).font('Helvetica').fontSize(9)
      .text(invoice.invoiceNumber, PAGE_WIDTH - MARGIN - 120, 78, { width: 120, align: 'center' });

    // ── INFO STRIP ───────────────────────────────────────────────
    doc.rect(0, 130, PAGE_WIDTH, 1).fill(BRAND_PRIMARY);
    doc.rect(0, 131, PAGE_WIDTH, 55).fill('#1E293B');

    const infoItems = [
      { label: 'Issue Date', value: formatDate(invoice.issueDate) },
      { label: 'Due Date', value: formatDate(invoice.dueDate) },
      { label: 'Status', value: invoice.status.toUpperCase() },
    ];
    const colW = CONTENT_WIDTH / infoItems.length;
    infoItems.forEach((item, i) => {
      const x = MARGIN + i * colW;
      doc.fillColor(GRAY_400).font('Helvetica').fontSize(8).text(item.label, x, 143, { width: colW });
      const isStatus = item.label === 'Status';
      const color = isStatus && invoice.status === 'paid' ? ACCENT
        : isStatus && invoice.status === 'overdue' ? DANGER
          : WHITE;
      doc.fillColor(color).font('Helvetica-Bold').fontSize(11).text(item.value, x, 155, { width: colW });
    });

    // ── BILL TO / FROM SECTION ───────────────────────────────────
    let y = 210;
    doc.fillColor(BRAND_DARK).font('Helvetica-Bold').fontSize(9)
      .text('BILL TO', MARGIN, y);
    doc.fillColor(BRAND_DARK).font('Helvetica-Bold').fontSize(9)
      .text('FROM', MARGIN + CONTENT_WIDTH / 2, y);

    y += 14;
    // Bill To
    doc.fillColor(BRAND_DARK).font('Helvetica-Bold').fontSize(12)
      .text(customer?.name || 'Unknown Customer', MARGIN, y, { width: CONTENT_WIDTH / 2 - 20 });
    y += 16;
    if (customer?.companyName) {
      doc.fillColor(GRAY_600).font('Helvetica').fontSize(10)
        .text(customer.companyName, MARGIN, y, { width: CONTENT_WIDTH / 2 - 20 });
      y += 14;
    }
    doc.fillColor(GRAY_600).font('Helvetica').fontSize(10)
      .text(customer?.email || '', MARGIN, y, { width: CONTENT_WIDTH / 2 - 20 });
    if (customer?.phone) {
      y += 14;
      doc.text(customer.phone, MARGIN, y, { width: CONTENT_WIDTH / 2 - 20 });
    }
    if (customer?.address?.city) {
      y += 14;
      const addr = [customer.address.street, customer.address.city, customer.address.country].filter(Boolean).join(', ');
      doc.text(addr, MARGIN, y, { width: CONTENT_WIDTH / 2 - 20 });
    }

    // From (static company info, right column)
    const fromX = MARGIN + CONTENT_WIDTH / 2;
    let fromY = 224;
    doc.fillColor(BRAND_DARK).font('Helvetica-Bold').fontSize(12).text('ProStream Inc.', fromX, fromY);
    fromY += 16;
    doc.fillColor(GRAY_600).font('Helvetica').fontSize(10)
      .text('123 Galle Road, Colombo 03', fromX, fromY, { width: CONTENT_WIDTH / 2 });
    fromY += 14;
    doc.text('Sri Lanka', fromX, fromY);
    fromY += 14;
    doc.text('invoicing@prostream.lk', fromX, fromY);
    fromY += 14;
    doc.text('VAT: LK-980234-V', fromX, fromY);

    // ── DIVIDER ──────────────────────────────────────────────────
    const tableTop = Math.max(y + 30, fromY + 30);
    doc.rect(MARGIN, tableTop, CONTENT_WIDTH, 1).fill(GRAY_400);

    // ── LINE ITEMS TABLE ─────────────────────────────────────────
    const tableHeaderY = tableTop + 8;
    // Header background
    doc.rect(MARGIN, tableHeaderY, CONTENT_WIDTH, 22).fill(BRAND_PRIMARY);

    const cols = {
      desc: { x: MARGIN + 10, w: 230 },
      qty: { x: MARGIN + 250, w: 60 },
      price: { x: MARGIN + 320, w: 90 },
      total: { x: MARGIN + 420, w: CONTENT_WIDTH - 370 },
    };

    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9);
    doc.text('DESCRIPTION', cols.desc.x, tableHeaderY + 7, { width: cols.desc.w });
    doc.text('QTY', cols.qty.x, tableHeaderY + 7, { width: cols.qty.w, align: 'center' });
    doc.text('UNIT PRICE', cols.price.x, tableHeaderY + 7, { width: cols.price.w, align: 'right' });
    doc.text('TOTAL', cols.total.x, tableHeaderY + 7, { width: cols.total.w, align: 'right' });

    let rowY = tableHeaderY + 22;
    invoice.items.forEach((item: any, idx: number) => {
      const rowH = 24;
      // Alternating row color
      doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowH).fill(idx % 2 === 0 ? WHITE : ROW_ALT);

      doc.fillColor(BRAND_DARK).font('Helvetica').fontSize(9);
      doc.text(item.description, cols.desc.x, rowY + 8, { width: cols.desc.w - 5, ellipsis: true });
      doc.text(String(item.quantity), cols.qty.x, rowY + 8, { width: cols.qty.w, align: 'center' });
      doc.text(formatCurrency(item.unitPrice), cols.price.x, rowY + 8, { width: cols.price.w, align: 'right' });
      doc.fillColor(BRAND_PRIMARY).font('Helvetica-Bold')
        .text(formatCurrency(item.total), cols.total.x, rowY + 8, { width: cols.total.w, align: 'right' });

      rowY += rowH;
    });

    // ── TOTALS ───────────────────────────────────────────────────
    rowY += 10;
    const totalsX = MARGIN + CONTENT_WIDTH / 2;
    const totalsValueX = PAGE_WIDTH - MARGIN;

    const drawTotalRow = (label: string, value: string, isBold = false, color = GRAY_600) => {
      doc.fillColor(color).font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10)
        .text(label, totalsX, rowY, { width: 120 })
        .text(value, totalsX + 120, rowY, { width: totalsValueX - totalsX - 120, align: 'right' });
      rowY += 18;
    };

    drawTotalRow('Subtotal', formatCurrency(invoice.subtotal));
    if (invoice.tax > 0) drawTotalRow(`Tax (${invoice.taxRate}%)`, formatCurrency(invoice.tax));
    if (invoice.discount > 0) drawTotalRow('Discount', `-${formatCurrency(invoice.discount)}`, false, DANGER);
    if (invoice.amountPaid > 0) drawTotalRow('Amount Paid', formatCurrency(invoice.amountPaid), false, ACCENT);

    rowY += 4;
    // Total box
    doc.rect(totalsX - 10, rowY - 4, totalsValueX - totalsX + 10, 30).fill(BRAND_PRIMARY);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(13)
      .text('BALANCE DUE', totalsX, rowY + 6, { width: 120 })
      .text(formatCurrency(invoice.balance), totalsX + 120, rowY + 6, { width: totalsValueX - totalsX - 120, align: 'right' });
    rowY += 40;

    // ── NOTES ────────────────────────────────────────────────────
    if (invoice.notes) {
      rowY += 10;
      doc.rect(MARGIN, rowY, CONTENT_WIDTH, 1).fill(GRAY_100);
      rowY += 10;
      doc.fillColor(BRAND_PRIMARY).font('Helvetica-Bold').fontSize(9).text('NOTES', MARGIN, rowY);
      rowY += 14;
      doc.fillColor(GRAY_600).font('Helvetica').fontSize(9)
        .text(invoice.notes, MARGIN, rowY, { width: CONTENT_WIDTH });
    }

    // ── FOOTER ───────────────────────────────────────────────────
    doc.rect(0, 780, PAGE_WIDTH, 62).fill(BRAND_DARK);
    doc.fillColor(GRAY_400).font('Helvetica').fontSize(8)
      .text('Thank you for your business!', MARGIN, 795, { width: CONTENT_WIDTH, align: 'center' });
    doc.fillColor(GRAY_600).fontSize(7)
      .text(`Generated on ${new Date().toLocaleDateString()} · ProStream Invoicing`, MARGIN, 810, { width: CONTENT_WIDTH, align: 'center' });

    // ── FINALIZE ─────────────────────────────────────────────────
    const endPromise = new Promise<void>((resolve) => { doc.on('end', resolve); });
    doc.end();
    await endPromise;

    const pdfBuffer = Buffer.concat(chunks);
    const filename = `${invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Generate Invoice PDF error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
