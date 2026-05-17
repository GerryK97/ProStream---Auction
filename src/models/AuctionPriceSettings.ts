import { Schema, model, models } from 'mongoose';
import { BidIncrementRange } from '@/types';

export interface AuctionPriceSettings {
  _id: 'auction-price-settings';
  basePricePerPlayer: number;
  bidIncrements: BidIncrementRange[];
  updatedBy?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

const auctionPriceSettingsSchema = new Schema<AuctionPriceSettings>(
  {
    _id: { type: String, default: 'auction-price-settings' },
    basePricePerPlayer: { type: Number, required: true, default: 50000, min: 0 },
    bidIncrements: {
      type: [
        {
          upTo: { type: Number, required: true, min: 0 },
          increment: { type: Number, required: true, min: 1 },
        },
      ],
      default: [
        { upTo: 50000, increment: 5000 },
        { upTo: 100000, increment: 10000 },
        { upTo: 200000, increment: 25000 },
      ],
    },
    updatedBy: { type: String },
  },
  { timestamps: true, _id: false }
);

export const AuctionPriceSettingsModel =
  models.AuctionPriceSettings || model<AuctionPriceSettings>('AuctionPriceSettings', auctionPriceSettingsSchema);
