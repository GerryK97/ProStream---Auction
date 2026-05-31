import mongoose, { Schema, Model } from 'mongoose';
import { Customer } from '@/types/invoicing';

const CustomerSchema = new Schema<Customer>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String },
    },
    companyName: { type: String },
    taxId: { type: String },
    createdBy: { type: String, required: true, index: true },
    totalInvoices: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalOutstanding: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'customers',
  }
);

// Indexes for efficient queries
CustomerSchema.index({ createdBy: 1, createdAt: -1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ name: 1 });

export const CustomerModel: Model<Customer> =
  mongoose.models.Customer || mongoose.model<Customer>('Customer', CustomerSchema);
