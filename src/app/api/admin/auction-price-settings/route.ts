import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { AuctionPriceSettingsModel } from '@/models/AuctionPriceSettings';
import { BidIncrementRange } from '@/types';

const SETTINGS_ID = 'auction-price-settings';

const DEFAULT_SETTINGS = {
  _id: SETTINGS_ID,
  basePricePerPlayer: 50000,
  bidIncrements: [
    { upTo: 50000, increment: 5000 },
    { upTo: 100000, increment: 10000 },
    { upTo: 200000, increment: 25000 },
  ],
};

function sanitizeBidIncrements(value: unknown): BidIncrementRange[] {
  if (!Array.isArray(value)) return DEFAULT_SETTINGS.bidIncrements;

  const ranges = value
    .map((row) => ({
      upTo: Number((row as BidIncrementRange)?.upTo),
      increment: Number((row as BidIncrementRange)?.increment),
    }))
    .filter((row) => Number.isFinite(row.upTo) && row.upTo >= 0 && Number.isFinite(row.increment) && row.increment > 0)
    .sort((a, b) => a.upTo - b.upTo);

  return ranges.length > 0 ? ranges : DEFAULT_SETTINGS.bidIncrements;
}

async function getSettings() {
  await connectToDatabase();
  const settings = await AuctionPriceSettingsModel.findOneAndUpdate(
    { _id: SETTINGS_ID },
    { $setOnInsert: DEFAULT_SETTINGS },
    { new: true, upsert: true }
  ).lean();

  return settings;
}

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[auction-price-settings GET]', error);
    return NextResponse.json({ error: 'Failed to fetch auction price settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    if (!isAdmin(payload.role)) {
      return NextResponse.json({ error: 'Only Admin users can manage auction price settings.' }, { status: 403 });
    }

    const body = await request.json();
    const basePricePerPlayer = Number(body.basePricePerPlayer);
    if (!Number.isFinite(basePricePerPlayer) || basePricePerPlayer < 0) {
      return NextResponse.json({ error: 'Base price must be a valid amount.' }, { status: 400 });
    }

    const bidIncrements = sanitizeBidIncrements(body.bidIncrements);

    await connectToDatabase();
    const settings = await AuctionPriceSettingsModel.findOneAndUpdate(
      { _id: SETTINGS_ID },
      {
        $set: {
          basePricePerPlayer,
          bidIncrements,
          updatedBy: payload.userId,
        },
      },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[auction-price-settings PUT]', error);
    return NextResponse.json({ error: 'Failed to update auction price settings' }, { status: 500 });
  }
}
