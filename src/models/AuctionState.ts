import mongoose, { Schema, model, models } from 'mongoose';
import { AuctionState, Bid } from '@/types';

const bidSchema = new Schema<Bid>(
  {
    teamId: { type: String, required: false, default: null },
    amount: { type: Number, required: true },
    timestamp: { type: Number, required: true },
  },
  { _id: false }
);

const auctionStateSchema = new Schema<AuctionState>(
  {
    tournamentId: { type: String, required: true, unique: true },
    currentPlayerId: { type: String, default: null },
    currentBid: { type: Number, default: 0 },
    winningTeamId: { type: String, default: null },
    currentAuctionStatus: {
      type: String,
      enum: ['Pending', 'Bidding', 'Sold'],
      default: 'Pending',
    },
    history: [bidSchema],
    currentAuctionClass: { type: String, default: null },
    completedClasses: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const AuctionStateModel =
  models.AuctionState || model<AuctionState>('AuctionState', auctionStateSchema);
