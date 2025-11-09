import mongoose, { Schema, model, models } from 'mongoose';
import { MasterPlayer } from '@/types';

const playerStatsSchema = new Schema(
  {
    matchesPlayed: { type: Number, required: true, default: 0 },
    totalScore: { type: Number, required: true, default: 0 },
    totalWickets: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const masterPlayerSchema = new Schema<MasterPlayer>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    position: { type: String, required: true },
    currentClub: { type: String, required: true },
    photoURL: { type: String, required: false },
    careerStats: { type: playerStatsSchema, required: false },
  },
  {
    timestamps: true,
    _id: false, // Use custom _id
    collection: 'masterplayers',
  }
);

// Indexes for efficient queries
masterPlayerSchema.index({ name: 1 });
masterPlayerSchema.index({ position: 1 });
masterPlayerSchema.index({ currentClub: 1 });

export const MasterPlayerModel = models.MasterPlayer || model<MasterPlayer>('MasterPlayer', masterPlayerSchema);
