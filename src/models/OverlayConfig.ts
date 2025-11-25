import mongoose, { Schema, model, models } from 'mongoose';
import { OverlayConfig, OverlayScene, OverlayHistory, OverlayAnalytics } from '@/types';

// Sub-schemas
const overlayPositionSchema = new Schema({
  x: { type: Number, required: true, default: 0 },
  y: { type: Number, required: true, default: 0 },
  unit: { type: String, enum: ['px', '%'], default: 'px' },
}, { _id: false });

const overlaySizeSchema = new Schema({
  width: { type: Number, required: true, default: 1920 },
  height: { type: Number, required: true, default: 1080 },
  unit: { type: String, enum: ['px', '%'], default: 'px' },
  aspectRatioLocked: { type: Boolean, default: false },
  preset: {
    type: String,
    enum: ['1080p', '720p', '4K', 'custom'],
    default: 'custom'
  },
}, { _id: false });

const overlayAnimationSchema = new Schema({
  entry: {
    type: {
      type: String,
      enum: ['none', 'fade', 'slide', 'zoom', 'bounce'],
      default: 'fade',
    },
    direction: {
      type: String,
      enum: ['up', 'down', 'left', 'right'],
    },
    duration: { type: Number, default: 300 },
  },
  exit: {
    type: {
      type: String,
      enum: ['none', 'fade', 'slide', 'zoom', 'bounce'],
      default: 'fade',
    },
    direction: {
      type: String,
      enum: ['up', 'down', 'left', 'right'],
    },
    duration: { type: Number, default: 300 },
  },
  loop: { type: Boolean, default: false },
  loopDuration: { type: Number },
}, { _id: false });

const displayRuleSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['auction-state', 'time-based', 'event-based'],
    required: true
  },
  condition: { type: String, required: true },
  action: { type: String, enum: ['show', 'hide'], required: true },
  enabled: { type: Boolean, default: true },
});

// Main OverlayConfig schema
const overlayConfigSchema = new Schema<OverlayConfig>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    overlayType: {
      type: String,
      enum: [
        'player-card',
        'premium-player-card',
        'teams',
        'ticker',
        'premium-ticker',
        'current-bid',
        'status',
        'leaderboard',
        'sale-banner',
        'sold-summary',
        'auction-overview',
        'player-highlight-led',
      ],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'player-info',
        'team-info',
        'auction-status',
        'tickers',
        'led-displays',
        'banners',
        'other',
      ],
      required: true,
    },
    imageURL: { type: String },
    isActive: { type: Boolean, default: true },
    isTemplate: { type: Boolean, default: false },

    // Layout
    position: { type: overlayPositionSchema, required: true },
    size: { type: overlaySizeSchema, required: true },
    zIndex: { type: Number, default: 1000 },
    opacity: { type: Number, min: 0, max: 100, default: 100 },

    // Customization
    parameters: { type: Schema.Types.Mixed, default: {} },
    animations: { type: overlayAnimationSchema },
    displayRules: { type: [displayRuleSchema], default: [] },

    // Association
    tournamentId: { type: String, default: null },
    sceneIds: { type: [String], default: [] },

    // Metadata
    createdBy: { type: String, required: true },
    version: { type: Number, default: 1 },
    parentConfigId: { type: String },

    // Usage tracking
    viewCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date },

    // Access control
    isLocked: { type: Boolean, default: false },
    allowedRoles: { type: [String], default: [] },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// Indexes
overlayConfigSchema.index({ createdBy: 1 });
overlayConfigSchema.index({ tournamentId: 1 });
overlayConfigSchema.index({ overlayType: 1 });
overlayConfigSchema.index({ category: 1 });
overlayConfigSchema.index({ isTemplate: 1 });

// Scene schema
const overlaySceneSchema = new Schema<OverlayScene>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    overlayIds: { type: [String], default: [] },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// History schema
const overlayHistorySchema = new Schema<OverlayHistory>(
  {
    _id: { type: String, required: true },
    overlayConfigId: { type: String, required: true },
    version: { type: Number, required: true },
    changes: { type: Schema.Types.Mixed, required: true },
    changedBy: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    comment: { type: String },
  },
  {
    _id: false,
  }
);

overlayHistorySchema.index({ overlayConfigId: 1, version: -1 });

// Analytics schema
const overlayAnalyticsSchema = new Schema<OverlayAnalytics>(
  {
    overlayConfigId: { type: String, required: true, unique: true },
    displayCount: { type: Number, default: 0 },
    totalDisplayDuration: { type: Number, default: 0 },
    averageDisplayDuration: { type: Number, default: 0 },
    lastDisplayedAt: { type: Date },
    errorCount: { type: Number, default: 0 },
    loadTime: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

overlayAnalyticsSchema.index({ overlayConfigId: 1 });

// Export models
export const OverlayConfigModel =
  models.OverlayConfig || model<OverlayConfig>('OverlayConfig', overlayConfigSchema);

export const OverlaySceneModel =
  models.OverlayScene || model<OverlayScene>('OverlayScene', overlaySceneSchema);

export const OverlayHistoryModel =
  models.OverlayHistory || model<OverlayHistory>('OverlayHistory', overlayHistorySchema);

export const OverlayAnalyticsModel =
  models.OverlayAnalytics || model<OverlayAnalytics>('OverlayAnalytics', overlayAnalyticsSchema);
