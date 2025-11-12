import mongoose, { Schema, model, models } from 'mongoose';
import { Team } from '@/types';

const teamSchema = new Schema<Team>(
  {
    _id: { type: String, required: true },
    masterTeamId: { type: String, required: false }, // Reference to MasterTeam (optional for backward compatibility)
    tournamentId: { type: String, required: false, default: null },
    // Copied from master (read-only)
    name: { type: String, required: true },
    shortCode: { type: String, required: true },
    ownerName: { type: String, required: true },
    logoURL: { type: String, required: false },
    // Tournament-specific data
    initialBudget: { type: Number, required: false },
    currentBalance: { type: Number, required: false },
    playersPurchased: [{ type: String }],
  },
  {
    timestamps: true,
    _id: false, // Use custom _id
  }
);

// Indexes for efficient queries
teamSchema.index({ masterTeamId: 1 });
teamSchema.index({ tournamentId: 1 });
teamSchema.index({ tournamentId: 1, masterTeamId: 1 }); // Prevent duplicate team in same tournament

export const TeamModel = models.Team || model<Team>('Team', teamSchema);
