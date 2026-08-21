import mongoose, { Schema, model, models } from 'mongoose';
import { Team } from '@/types';

const teamSchema = new Schema<Team>(
  {
    _id: { type: String, required: true },
    tournamentId: { type: String, required: true },
    createdBy: { type: String, required: false },
    name: { type: String, required: true },
    shortCode: { type: String, required: true },
    ownerName: { type: String, required: false }, // derived from Owner official; kept for back-compat
    officials: {
      type: [
        {
          _id: false,
          role: { type: String, enum: ['Owner', 'Manager', 'Captain'], required: true },
          name: { type: String, required: true },
          photoURL: { type: String, required: false },
        },
      ],
      default: [],
    },
    logoURL: { type: String, required: false },
    initialBudget: { type: Number, required: false },
    currentBalance: { type: Number, required: false },
    playersPurchased: [{ type: String }],
  },
  {
    timestamps: true,
    _id: false,
  }
);

teamSchema.index({ tournamentId: 1 });
teamSchema.index({ createdBy: 1 });

export const TeamModel = models.Team || model<Team>('Team', teamSchema);
