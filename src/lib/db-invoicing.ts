/**
 * Database helper functions for InvoiceIt module
 */

import { InvoiceModel } from '@/models/Invoice';
import { QuotationModel } from '@/models/Quotation';
import { CustomerModel } from '@/models/Customer';
import { Invoice, Quotation, Customer } from '@/types/invoicing';
import { connectToDatabase } from './mongodb';

// ==================== Customer DB Functions ====================

export const customerDB = {
  /**
   * Create a new customer
   */
  async create(data: Partial<Customer>, userId: string): Promise<Customer> {
    await connectToDatabase();

    // Generate customer ID
    const customerCount = await CustomerModel.countDocuments();
    const customerId = `CUS${(customerCount + 1).toString().padStart(5, '0')}`;

    const customer = await CustomerModel.create({
      ...data,
      _id: customerId,
      createdBy: userId,
      totalInvoices: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    });

    return customer.toObject();
  },

  /**
   * Get customer by ID
   */
  async getById(customerId: string): Promise<Customer | null> {
    await connectToDatabase();
    const customer = await CustomerModel.findById(customerId).lean();
    return customer as Customer | null;
  },

  /**
   * Get all customers for a user
   */
  async getAll(userId: string, filters?: { search?: string }): Promise<Customer[]> {
    await connectToDatabase();

    const query: any = { createdBy: userId };

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { companyName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const customers = await CustomerModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return customers as Customer[];
  },

  /**
   * Update customer
   */
  async update(customerId: string, data: Partial<Customer>): Promise<Customer | null> {
    await connectToDatabase();

    const customer = await CustomerModel.findByIdAndUpdate(
      customerId,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    return customer as Customer | null;
  },

  /**
   * Delete customer
   */
  async delete(customerId: string): Promise<boolean> {
    await connectToDatabase();
    const result = await CustomerModel.deleteOne({ _id: customerId });
    return result.deletedCount > 0;
  },

  /**
   * Update customer statistics
   */
  async updateStats(customerId: string): Promise<void> {
    await connectToDatabase();

    const invoices = await InvoiceModel.find({ customerId }).lean();

    const totalInvoices = invoices.length;
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);

    await CustomerModel.findByIdAndUpdate(customerId, {
      totalInvoices,
      totalPaid,
      totalOutstanding,
    });
  },
};

// ==================== Invoice DB Functions ====================

export const invoiceDB = {
  /**
   * Generate next invoice number
   */
  async generateInvoiceNumber(): Promise<string> {
    await connectToDatabase();
    const year = new Date().getFullYear();
    const count = await InvoiceModel.countDocuments({
      invoiceNumber: { $regex: `^INV-${year}` },
    });
    return `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;
  },

  /**
   * Create a new invoice
   */
  async create(data: Partial<Invoice>, userId: string): Promise<Invoice> {
    await connectToDatabase();

    // Generate invoice ID and number
    const invoiceCount = await InvoiceModel.countDocuments();
    const invoiceId = `INV${(invoiceCount + 1).toString().padStart(6, '0')}`;
    const invoiceNumber = data.invoiceNumber || (await this.generateInvoiceNumber());

    const invoice = await InvoiceModel.create({
      ...data,
      _id: invoiceId,
      invoiceNumber,
      createdBy: userId,
    });

    // Update customer stats
    if (data.customerId) {
      await customerDB.updateStats(data.customerId);
    }

    return invoice.toObject();
  },

  /**
   * Get invoice by ID
   */
  async getById(invoiceId: string): Promise<Invoice | null> {
    await connectToDatabase();
    const invoice = await InvoiceModel.findById(invoiceId).lean();
    return invoice as Invoice | null;
  },

  /**
   * Get all invoices for a user
   */
  async getAll(
    userId: string,
    filters?: {
      status?: string;
      customerId?: string;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<Invoice[]> {
    await connectToDatabase();

    const query: any = { createdBy: userId };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.customerId) {
      query.customerId = filters.customerId;
    }

    if (filters?.fromDate || filters?.toDate) {
      query.issueDate = {};
      if (filters.fromDate) query.issueDate.$gte = filters.fromDate;
      if (filters.toDate) query.issueDate.$lte = filters.toDate;
    }

    const invoices = await InvoiceModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return invoices as Invoice[];
  },

  /**
   * Update invoice
   */
  async update(invoiceId: string, data: Partial<Invoice>): Promise<Invoice | null> {
    await connectToDatabase();

    const invoice = await InvoiceModel.findByIdAndUpdate(
      invoiceId,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    // Update customer stats if needed
    if (invoice) {
      await customerDB.updateStats((invoice as Invoice).customerId);
    }

    return invoice as Invoice | null;
  },

  /**
   * Delete invoice
   */
  async delete(invoiceId: string): Promise<boolean> {
    await connectToDatabase();

    const invoice = await InvoiceModel.findById(invoiceId).lean();
    const result = await InvoiceModel.deleteOne({ _id: invoiceId });

    // Update customer stats
    if (invoice && result.deletedCount > 0) {
      await customerDB.updateStats((invoice as Invoice).customerId);
    }

    return result.deletedCount > 0;
  },

  /**
   * Mark invoice as paid
   */
  async markAsPaid(invoiceId: string, amount: number): Promise<Invoice | null> {
    await connectToDatabase();

    const invoice = await InvoiceModel.findById(invoiceId).lean() as Invoice | null;
    if (!invoice) return null;

    const newAmountPaid = invoice.amountPaid + amount;
    const newBalance = invoice.total - newAmountPaid;
    const newStatus = newBalance <= 0 ? 'paid' : invoice.status;

    const updated = await InvoiceModel.findByIdAndUpdate(
      invoiceId,
      {
        $set: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
        },
      },
      { new: true }
    ).lean();

    // Update customer stats
    if (updated) {
      await customerDB.updateStats((updated as Invoice).customerId);
    }

    return updated as Invoice | null;
  },

  /**
   * Get invoice statistics for a user
   */
  async getStats(userId: string): Promise<{
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
  }> {
    await connectToDatabase();

    const invoices = await InvoiceModel.find({ createdBy: userId }).lean();

    return {
      total: invoices.length,
      draft: invoices.filter((inv) => inv.status === 'draft').length,
      sent: invoices.filter((inv) => inv.status === 'sent').length,
      paid: invoices.filter((inv) => inv.status === 'paid').length,
      overdue: invoices.filter((inv) => inv.status === 'overdue').length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
      paidAmount: invoices.reduce((sum, inv) => sum + inv.amountPaid, 0),
      outstandingAmount: invoices.reduce((sum, inv) => sum + inv.balance, 0),
    };
  },
};

// ==================== Quotation DB Functions ====================

export const quotationDB = {
  /**
   * Generate next quotation number
   */
  async generateQuotationNumber(): Promise<string> {
    await connectToDatabase();
    const year = new Date().getFullYear();
    const count = await QuotationModel.countDocuments({
      quotationNumber: { $regex: `^QUO-${year}` },
    });
    return `QUO-${year}-${(count + 1).toString().padStart(4, '0')}`;
  },

  /**
   * Create a new quotation
   */
  async create(data: Partial<Quotation>, userId: string): Promise<Quotation> {
    await connectToDatabase();

    // Generate quotation ID and number
    const quotationCount = await QuotationModel.countDocuments();
    const quotationId = `QUO${(quotationCount + 1).toString().padStart(6, '0')}`;
    const quotationNumber = data.quotationNumber || (await this.generateQuotationNumber());

    const quotation = await QuotationModel.create({
      ...data,
      _id: quotationId,
      quotationNumber,
      createdBy: userId,
    });

    return quotation.toObject();
  },

  /**
   * Get quotation by ID
   */
  async getById(quotationId: string): Promise<Quotation | null> {
    await connectToDatabase();
    const quotation = await QuotationModel.findById(quotationId).lean();
    return quotation as Quotation | null;
  },

  /**
   * Get all quotations for a user
   */
  async getAll(
    userId: string,
    filters?: {
      status?: string;
      customerId?: string;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<Quotation[]> {
    await connectToDatabase();

    const query: any = { createdBy: userId };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.customerId) {
      query.customerId = filters.customerId;
    }

    if (filters?.fromDate || filters?.toDate) {
      query.issueDate = {};
      if (filters.fromDate) query.issueDate.$gte = filters.fromDate;
      if (filters.toDate) query.issueDate.$lte = filters.toDate;
    }

    const quotations = await QuotationModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return quotations as Quotation[];
  },

  /**
   * Update quotation
   */
  async update(quotationId: string, data: Partial<Quotation>): Promise<Quotation | null> {
    await connectToDatabase();

    const quotation = await QuotationModel.findByIdAndUpdate(
      quotationId,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    return quotation as Quotation | null;
  },

  /**
   * Delete quotation
   */
  async delete(quotationId: string): Promise<boolean> {
    await connectToDatabase();
    const result = await QuotationModel.deleteOne({ _id: quotationId });
    return result.deletedCount > 0;
  },

  /**
   * Convert quotation to invoice
   */
  async convertToInvoice(quotationId: string, userId: string): Promise<Invoice> {
    await connectToDatabase();

    const quotation = await QuotationModel.findById(quotationId).lean() as Quotation | null;
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (quotation.status !== 'accepted') {
      throw new Error('Only accepted quotations can be converted to invoices');
    }

    if (quotation.convertedToInvoiceId) {
      throw new Error('This quotation has already been converted to an invoice');
    }

    // Create invoice from quotation
    const invoice = await invoiceDB.create(
      {
        customerId: quotation.customerId,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'draft',
        items: quotation.items,
        subtotal: quotation.subtotal,
        tax: quotation.tax,
        taxRate: quotation.taxRate,
        discount: quotation.discount,
        total: quotation.total,
        amountPaid: 0,
        balance: quotation.total,
        notes: quotation.notes,
        terms: quotation.terms,
      },
      userId
    );

    // Update quotation with invoice reference
    await QuotationModel.findByIdAndUpdate(quotationId, {
      convertedToInvoiceId: invoice._id,
    });

    return invoice;
  },

  /**
   * Get quotation statistics for a user
   */
  async getStats(userId: string): Promise<{
    total: number;
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
  }> {
    await connectToDatabase();

    const quotations = await QuotationModel.find({ createdBy: userId }).lean();

    return {
      total: quotations.length,
      draft: quotations.filter((q) => q.status === 'draft').length,
      sent: quotations.filter((q) => q.status === 'sent').length,
      accepted: quotations.filter((q) => q.status === 'accepted').length,
      rejected: quotations.filter((q) => q.status === 'rejected').length,
      expired: quotations.filter((q) => q.status === 'expired').length,
    };
  },
};
