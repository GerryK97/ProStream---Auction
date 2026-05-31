/**
 * TypeScript interfaces for InvoiceIt module
 */

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuotationLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: CustomerAddress;
  companyName?: string;
  taxId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  totalInvoices: number;
  totalPaid: number;
  totalOutstanding: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerId: string;
  createdBy: string;

  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;

  items: InvoiceLineItem[];

  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  total: number;

  amountPaid: number;
  balance: number;

  notes?: string;
  terms?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface Quotation {
  _id: string;
  quotationNumber: string;
  customerId: string;
  createdBy: string;

  issueDate: Date;
  validUntil: Date;
  status: QuotationStatus;

  items: QuotationLineItem[];

  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  total: number;

  notes?: string;
  terms?: string;

  createdAt: Date;
  updatedAt: Date;

  convertedToInvoiceId?: string;
}
