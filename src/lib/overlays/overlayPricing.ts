import {
  AUCTION_OVERLAY_TYPE_KEYS,
  AuctionOverlayType,
  getAuctionOverlayConfig,
} from '@/lib/overlays/auctionOverlayTypes';

export const DEFAULT_OVERLAY_PRICES: Record<AuctionOverlayType, number> = {
  custom: 500,
  fullscreen: 1000,
  fullscreen2: 1000,
  team_owners: 300,
};

export function getOverlayPricingDefaultsByKey(): Record<string, number> {
  return Object.fromEntries(
    AUCTION_OVERLAY_TYPE_KEYS.map(type => [
      getAuctionOverlayConfig(type).pricingKey,
      DEFAULT_OVERLAY_PRICES[type],
    ])
  );
}

export function getOverlayPriceMetadata() {
  return AUCTION_OVERLAY_TYPE_KEYS.map(type => {
    const config = getAuctionOverlayConfig(type);
    return {
      type,
      key: config.pricingKey,
      label: config.label,
      shortLabel: config.shortLabel,
      useCase: config.useCase,
      defaultValue: DEFAULT_OVERLAY_PRICES[type],
    };
  });
}
