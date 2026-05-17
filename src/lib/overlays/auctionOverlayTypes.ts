export const AUCTION_OVERLAY_TYPES = {
  custom: {
    label: 'Custom Overlay',
    shortLabel: 'Custom',
    copyLabel: 'OBS',
    useCase: 'Used by streamers',
    pricingKey: 'auction_overlay_custom',
    path: '/custom',
    accent: '#8B5CF6',
  },
  fullscreen: {
    label: 'Full Screen',
    shortLabel: 'Full Screen',
    copyLabel: 'Full Screen',
    useCase: 'For LED walls',
    pricingKey: 'auction_overlay_fullscreen',
    path: '',
    accent: '#4F46E5',
  },
  fullscreen2: {
    label: 'Full Screen 2',
    shortLabel: 'Full Screen 2',
    copyLabel: 'Full Screen 2',
    useCase: 'Alternate LED wall output',
    pricingKey: 'auction_overlay_fullscreen2',
    path: '/fullscreen2',
    accent: '#10B981',
  },
  team_owners: {
    label: 'Team Owners Overlay',
    shortLabel: 'Team Owners',
    copyLabel: 'Team Owner Link',
    useCase: 'Mobile-friendly output',
    pricingKey: 'auction_overlay_team_owners',
    path: '/team-owner',
    accent: '#F59E0B',
  },
} as const;

export type AuctionOverlayType = keyof typeof AUCTION_OVERLAY_TYPES;

export const AUCTION_OVERLAY_TYPE_KEYS = Object.keys(AUCTION_OVERLAY_TYPES) as AuctionOverlayType[];

export function isAuctionOverlayType(value: unknown): value is AuctionOverlayType {
  return typeof value === 'string' && value in AUCTION_OVERLAY_TYPES;
}

export function getAuctionOverlayConfig(type: AuctionOverlayType) {
  return AUCTION_OVERLAY_TYPES[type];
}

export function buildAuctionOverlayUrl(origin: string, tournamentId: string, overlayType: AuctionOverlayType, token: string) {
  const config = getAuctionOverlayConfig(overlayType);
  return `${origin}/overlays/${tournamentId}${config.path}?token=${token}`;
}
