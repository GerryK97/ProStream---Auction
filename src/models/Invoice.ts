import mongoose, { Schema, Model } from 'mongoose';
import { Invoice, InvoiceLineItem } from '@/types/invoicing';

const LineItemSchema = new Schema<InvoiceLineItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<Invoice>(
  {
    _id: { type: String, required: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, ref: 'Customer', index: true },
    createdBy: { type: String, required: true, index: true },

    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
      index: true,
    },

    items: { type: [LineItemSchema], required: true, validate: [(val: InvoiceLineItem[]) => val.length > 0, 'At least one item is required'] },

    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    taxRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },

    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    balance: { type: Number, required: true, min: 0 },

    notes: { type: String },
    terms: { type: String },
  },
  {
    timestamps: true,
    collection: 'invoices',
  }
);

// Compound indexes for efficient queries
InvoiceSchema.index({ createdBy: 1, createdAt: -1 });
InvoiceSchema.index({ customerId: 1, createdAt: -1 });
InvoiceSchema.index({ status: 1, dueDate: 1 });
InvoiceSchema.index({ createdBy: 1, status: 1 });

export const InvoiceModel: Model<Invoice> =
  mongoose.models.Invoice || mongoose.model<Invoice>('Invoice', InvoiceSchema);
