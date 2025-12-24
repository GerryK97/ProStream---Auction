import mongoose, { Schema, Model } from 'mongoose';
import { Quotation, QuotationLineItem } from '@/types/invoicing';

const LineItemSchema = new Schema<QuotationLineItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const QuotationSchema = new Schema<Quotation>(
  {
    _id: { type: String, required: true },
    quotationNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, ref: 'Customer', index: true },
    createdBy: { type: String, required: true, index: true },

    issueDate: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
      default: 'draft',
      index: true,
    },

    items: { type: [LineItemSchema], required: true, validate: [(val: QuotationLineItem[]) => val.length > 0, 'At least one item is required'] },

    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    taxRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },

    notes: { type: String },
    terms: { type: String },

    convertedToInvoiceId: { type: String, ref: 'Invoice' },
  },
  {
    timestamps: true,
    collection: 'quotations',
  }
);

// Compound indexes for efficient queries
QuotationSchema.index({ createdBy: 1, createdAt: -1 });
QuotationSchema.index({ customerId: 1, createdAt: -1 });
QuotationSchema.index({ status: 1, validUntil: 1 });
QuotationSchema.index({ createdBy: 1, status: 1 });

export const QuotationModel: Model<Quotation> =
  mongoose.models.Quotation || mongoose.model<Quotation>('Quotation', QuotationSchema);
