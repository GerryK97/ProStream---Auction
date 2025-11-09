import mongoose, { Schema, model, models } from 'mongoose';
import { Player } from '@/types';

const playerStatsSchema = new Schema(
  {
    matchesPlayed: { type: Number, required: true },
    totalScore: { type: Number, required: true },
    totalWickets: { type: Number, required: true },
  },
  { _id: false }
);

const playerSchema = new Schema<Player>(
  {
    _id: { type: String, required: true },
    masterPlayerId: { type: String, required: false }, // Reference to MasterPlayer (optional for backward compatibility)
    tournamentId: { type: String, required: false, default: null },
    // Copied from master (read-only)
    name: { type: String, required: true },
    position: { type: String, required: false },
    currentClub: { type: String, required: false },
    photoURL: { type: String, required: false },
    imageURL: { type: String, required: false }, // Kept for backward compatibility
    // Tournament-specific data
    stats: { type: playerStatsSchema, required: true }, // Tournament stats (separate from career)
    isSold: { type: Boolean, default: false },
    finalPrice: { type: Number },
    winningTeamId: { type: String },
  },
  {
    timestamps: true,
    _id: false, // Use custom _id
  }
);

// Indexes for efficient queries
playerSchema.index({ masterPlayerId: 1 });
playerSchema.index({ tournamentId: 1 });
playerSchema.index({ tournamentId: 1, masterPlayerId: 1 }); // Prevent duplicate player in same tournament

export const PlayerModel = models.Player || model<Player>('Player', playerSchema);
