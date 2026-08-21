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
    wheelCenterImageURL: { type: String },
    createdBy: { type: String, required: false }, // User ID who created the tournament
    status: {
      type: String,
      enum: ['Draft', 'Completed', 'Setup', 'Pending', 'Live', 'Paused', 'Stopped', 'Archived'],
      default: 'Draft',
    },
    sport: { type: String, default: 'cricket' }, // e.g. cricket | football | basketball
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
      enum: ['standard', 'premium', 'neon', 'theme2', 'theme3', 'theme4'],
      default: 'standard',
    },
    overlayPalette: {
      type: String,
      default: 'default',
    },
    biddingMode: {
      type: String,
      enum: ['direct', 'team'],
      default: 'direct',
    },
    bidIncrements: {
      type: [
        {
          upTo:      { type: Number, required: true },
          increment: { type: Number, required: true },
        },
      ],
      default: [],
    },
    directBidSlabEnabled: { type: Boolean, default: false },
    directQuickBidsEnabled: { type: Boolean, default: false },
    directQuickBids: {
      type: [{ amount: { type: Number, required: true } }],
      default: [],
    },
    playerProfileFields: {
      type: {
        showAge:          { type: Boolean, default: false },
        showBattingStyle: { type: Boolean, default: false },
        showBowlingStyle: { type: Boolean, default: false },
        statFields:       { type: [{ key: String, label: String }], default: [] },
      },
      default: () => ({ showAge: false, showBattingStyle: false, showBowlingStyle: false, statFields: [] }),
    },
    teamOfficialsConfig: {
      type: {
        enabledRoles:  { type: [String], default: ['Owner'] },
        requiredRoles: { type: [String], default: ['Owner'] },
      },
      default: () => ({ enabledRoles: ['Owner'], requiredRoles: ['Owner'] }),
    },
    playerCardTemplates: {
      type: [
        {
          id:       { type: String, required: true },
          name:     { type: String, required: true },
          pngUrl:   { type: String, required: true },
          layoutId: { type: String },
        },
      ],
      default: [],
    },
    auctionDate: { type: String },
    completedAt: { type: Date },
    overlayControlSettings: {
      type: {
        size: { type: String, enum: ['large', 'small'], default: 'large' },
        tickerMode: { type: String, enum: ['all', 'sold', 'available'], default: 'sold' },
        displayMode: { type: String, default: 'standard' },
        hidePremiumCard: { type: Boolean, default: false },
        customTickerLine1: { type: String, default: '' },
        customTickerLine2: { type: String, default: '' },
        soldMessagePosition: {
          type: String,
          enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
          default: 'bottom-right',
        },
        hideTickerCustom: { type: Boolean, default: false },
        hideTickerFullscreen: { type: Boolean, default: false },
        teamWiseTeamId: { type: String, default: null },
        bidCardTop: { type: Number, default: 160 },
        bidCardLeft: { type: Number, default: 1576 },
        hideTeamCards: { type: Boolean, default: false },
        teamCardSize: { type: String, enum: ['small', 'medium', 'large'], default: 'large' },
        teamCardPosition: { type: String, enum: ['top-right', 'bottom-right'], default: 'top-right' },
        bidCardPosition: { type: String, enum: ['top', 'right', 'left'], default: 'top' },
      },
      default: undefined,
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
