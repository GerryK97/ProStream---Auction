import mongoose, { Schema, model, models } from 'mongoose';
import { MasterTeam } from '@/types';

const masterTeamSchema = new Schema<MasterTeam>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    ownerName: { type: String, required: true },
    logoURL: { type: String, required: false },
    createdBy: { type: String, required: false }, // User ID who created the master team
  },
  {
    timestamps: true,
    _id: false, // Use custom _id
    collection: 'masterteams',
  }
);

// Indexes for efficient queries
masterTeamSchema.index({ name: 1 });
masterTeamSchema.index({ createdBy: 1 });
// Note: shortCode index is automatically created by unique: true constraint on line 8

export const MasterTeamModel = models.MasterTeam || model<MasterTeam>('MasterTeam', masterTeamSchema);
