import mongoose, { Schema, model, models } from 'mongoose';
import { OverlayLibraryItem, ParameterOption } from '@/types';

// Parameter option sub-schema
const parameterOptionSchema = new Schema<ParameterOption>({
  type: {
    type: String,
    enum: ['select', 'color', 'toggle', 'text', 'number'],
    required: true
  },
  label: { type: String, required: true },
  options: { type: [String] },
  description: { type: String },
  min: { type: Number },
  max: { type: Number },
  default: { type: Schema.Types.Mixed }
}, { _id: false });

// Main OverlayLibrary schema
const overlayLibrarySchema = new Schema<OverlayLibraryItem>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    route: { type: String, required: true },
    tags: { type: [String], default: [] },
    category: { type: String, required: true },
    defaultParams: { type: Schema.Types.Mixed, default: {} },
    parameterSchema: {
      type: Map,
      of: parameterOptionSchema,
      default: {}
    },
    imageURL: { type: String },
    dimensions: {
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String }
  },
  {
    timestamps: true,
    _id: false
  }
);

// Indexes for performance
overlayLibrarySchema.index({ category: 1 });
overlayLibrarySchema.index({ tags: 1 });
overlayLibrarySchema.index({ isActive: 1 });

export const OverlayLibraryModel =
  models.OverlayLibrary || model<OverlayLibraryItem>('OverlayLibrary', overlayLibrarySchema);
