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
    tournamentId: { type: String, required: false, default: null },
    name: { type: String, required: true },
    stats: { type: playerStatsSchema, required: true },
    imageURL: { type: String, required: false },
    isSold: { type: Boolean, default: false },
    finalPrice: { type: Number },
    winningTeamId: { type: String },
  },
  {
    timestamps: true,
    _id: false, // Use custom _id
  }
);

export const PlayerModel = models.Player || model<Player>('Player', playerSchema);
