import mongoose, { Schema, Document } from 'mongoose';

export interface IOverlaySession extends Document {
  _id: string;          // the session token (UUID v4)
  tournamentId: string;
  label: string;        // admin-given name e.g. "OBS Main"
  createdBy: string;    // userId
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
    isActive: { type: Boolean, required: true, default: true },
    revokedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    _id: false,
  }
);

OverlaySessionSchema.index({ tournamentId: 1, isActive: 1 });

export const OverlaySessionModel =
  mongoose.models.OverlaySession ||
  mongoose.model<IOverlaySession>('OverlaySession', OverlaySessionSchema);
