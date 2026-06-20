import { NextRequest, NextResponse } from 'next/server';
import { canPerformAction } from '@/lib/permissions';
import { getUserFromRequest } from '@/lib/request-helpers';
import { getPricesWithFallbacks } from '@/lib/pg/wallet-queries';
import { AUCTION_OVERLAY_TYPE_KEYS, AuctionOverlayType, getAuctionOverlayConfig } from '@/lib/overlays/auctionOverlayTypes';
import { DEFAULT_OVERLAY_PRICES, getOverlayPricingDefaultsByKey } from '@/lib/overlays/overlayPricing';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canPerformAction(user.role, 'create', 'overlayConfig')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pricesByKey = await getPricesWithFallbacks(getOverlayPricingDefaultsByKey());
    const prices = Object.fromEntries(
      AUCTION_OVERLAY_TYPE_KEYS.map((type) => {
        const config = getAuctionOverlayConfig(type);
        return [type, pricesByKey[config.pricingKey] ?? DEFAULT_OVERLAY_PRICES[type]] as const;
      })
    ) as Record<AuctionOverlayType, number>;

    return NextResponse.json({ prices });
  } catch (error) {
    console.error('[overlay/prices GET]', error);
    return NextResponse.json({ error: 'Failed to fetch overlay prices' }, { status: 500 });
  }
}
