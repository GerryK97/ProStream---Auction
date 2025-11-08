import mongoose, { Schema, model, models } from 'mongoose';
import { Team } from '@/types';

const teamSchema = new Schema<Team>(
  {
    _id: { type: String, required: true },
    tournamentId: { type: String, required: false, default: null },
    name: { type: String, required: true },
    shortCode: { type: String, required: true },
    ownerName: { type: String, required: true },
    initialBudget: { type: Number, required: false },
    currentBalance: { type: Number, required: false },
    playersPurchased: [{ type: String }],
    logoURL: { type: String, required: false },
    primaryColor: { type: String },
    secondaryColor: { type: String },
  },
  {
    timestamps: true,
    _id: false, // Use custom _id
  }
);

export const TeamModel = models.Team || model<Team>('Team', teamSchema);
