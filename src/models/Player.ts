import mongoose, { Schema, model, models } from 'mongoose';
import { Player } from '@/types';

const playerSchema = new Schema<Player>(
  {
    _id: { type: String, required: true },               // Globally unique (timestamp-based)
    playerNo: { type: String, required: false },          // Sequential per tournament (001, 002, 003)
    tournamentId: { type: String, required: true },
    createdBy: { type: String, required: false },
    name: { type: String, required: true },
    position: { type: String, required: false },
    currentClub: { type: String, required: false },
    photoURL: { type: String, required: false },
    secondaryImageURL: { type: String, required: false },
    playerClass: { type: String, required: false },
    age: { type: Number, required: false },
    isSold: { type: Boolean, default: false },
    isUnsold: { type: Boolean, default: false },
    finalPrice: { type: Number },
    winningTeamId: { type: String },
    isIconic: { type: Boolean, default: false },
    battingStyle: { type: String, required: false },
    bowlingStyle: { type: String, required: false },
    stats: { type: Map, of: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    _id: false,
  }
);

playerSchema.index({ tournamentId: 1 });
playerSchema.index({ tournamentId: 1, playerNo: 1 }, { unique: true, sparse: true });
playerSchema.index({ createdBy: 1 });

export const PlayerModel = models.Player || model<Player>('Player', playerSchema);
