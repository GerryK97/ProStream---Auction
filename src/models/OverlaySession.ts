import mongoose, { Schema, Document } from 'mongoose';
import type { AuctionOverlayType } from '@/lib/overlays/auctionOverlayTypes';

export type OverlayPaymentStatus = 'free' | 'paid' | 'refunded' | 'payment_failed';

export interface IOverlaySession extends Omit<Document, '_id'> {
  _id: string;          // the session token (UUID v4)
  tournamentId: string;
  label: string;        // admin-given name e.g. "OBS Main"
  createdBy: string;    // userId
  overlayType: AuctionOverlayType;
  paymentStatus: OverlayPaymentStatus;
  walletTransactionId?: number;
  refundTransactionId?: number;
  priceCharged: number;
  isActive: boolean;    // false = revoked
  createdAt: Date;
  revokedAt?: Date;
}

const OverlaySessionSchema = new Schema<IOverlaySession>(
  {
    _id: { type: String, required: true },
    tournamentId: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    createdBy: { type: String, required: true },
    overlayType: {
      type: String,
      enum: ['custom', 'fullscreen', 'fullscreen2', 'team_owners'],
      required: true,
      default: 'fullscreen',
    },
    paymentStatus: {
      type: String,
      enum: ['free', 'paid', 'refunded', 'payment_failed'],
      required: true,
      default: 'free',
    },
    walletTransactionId: { type: Number, default: null },
    refundTransactionId: { type: Number, default: null },
    priceCharged: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
    revokedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    _id: false,
  }
);

OverlaySessionSchema.index({ tournamentId: 1, isActive: 1 });
OverlaySessionSchema.index({ tournamentId: 1, overlayType: 1, isActive: 1 });

export const OverlaySessionModel =
  mongoose.models.OverlaySession ||
  mongoose.model<IOverlaySession>('OverlaySession', OverlaySessionSchema);
