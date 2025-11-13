import mongoose, { Schema, model, models } from 'mongoose';
import { Tournament } from '@/types';

const tournamentSchema = new Schema<Tournament>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    year: { type: Number, required: true },
    budgetPerTeam: { type: Number, required: true },
    squadSize: { type: Number, required: true },
    basePricePerPlayer: { type: Number, required: true },
    logoURL: { type: String },
    status: {
      type: String,
      enum: ['Draft', 'Completed', 'Setup', 'Pending', 'Live', 'Paused', 'Stopped', 'Archived'],
      default: 'Draft',
    },
    usePlayerClasses: { type: Boolean, default: false },
    playerClasses: {
      type: [
        {
          name: { type: String, required: true },
          basePrice: { type: Number },
          color: { type: String, required: true },
          icon: { type: String },
          order: { type: Number, required: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    _id: false, // Use custom _id
  }
);

export const TournamentModel =
  models.Tournament || model<Tournament>('Tournament', tournamentSchema);
