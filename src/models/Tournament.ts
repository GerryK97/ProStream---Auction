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
    createdBy: { type: String, required: false }, // User ID who created the tournament
    status: {
      type: String,
      enum: ['Draft', 'Completed', 'Setup', 'Pending', 'Live', 'Paused', 'Stopped', 'Archived'],
      default: 'Draft',
    },
    usePlayerClasses: { type: Boolean, default: false },
    playerClasses: {
      type: [
        {
          code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            minlength: 1,
            maxlength: 10,
          },
          name: { type: String, required: true },
          basePrice: { type: Number },
          color: { type: String, required: true },
          icon: { type: String },
          order: { type: Number, required: true },
        },
      ],
      default: [],
    },
    basePriceStrategy: {
      type: String,
      enum: ['tournament-level', 'player-class-based'],
      default: 'tournament-level',
    },
    overlayTheme: {
      type: String,
      enum: ['standard', 'premium', 'neon'],
      default: 'standard',
    },
    overlayPalette: {
      type: String,
      default: 'default',
    },
  },
  {
    timestamps: true,
    _id: false, // Use custom _id
  }
);

// Create indexes for performance
tournamentSchema.index({ createdBy: 1 });

export const TournamentModel =
  models.Tournament || model<Tournament>('Tournament', tournamentSchema);
