import type { OverlaySettingsEvent } from '@/types/pusher-events';
import type { OverlayControlSettings } from '@/types';

/** Defaults for persisted overlay control panel settings (1920×1080 canvas). */
export const DEFAULT_OVERLAY_CONTROL_SETTINGS: OverlayControlSettings = {
  size: 'large',
  tickerMode: 'sold',
  displayMode: 'standard',
  hidePremiumCard: false,
  customTickerLine1: '',
  customTickerLine2: '',
  soldMessagePosition: 'bottom-right',
  hideTickerCustom: false,
  hideTickerFullscreen: false,
  teamWiseTeamId: null,
  bidCardTop: 160,
  bidCardLeft: 1576,
  hideTeamCards: false,
  teamCardSize: 'large',
  teamCardPosition: 'top-right',
  bidCardPosition: 'top',
};

/** Merge partial saved settings onto defaults. */
export function normalizeOverlayControlSettings(
  partial?: Partial<OverlayControlSettings> | null,
): OverlayControlSettings {
  if (!partial) return { ...DEFAULT_OVERLAY_CONTROL_SETTINGS };
  return {
    ...DEFAULT_OVERLAY_CONTROL_SETTINGS,
    ...partial,
    bidCardTop: partial.bidCardTop ?? DEFAULT_OVERLAY_CONTROL_SETTINGS.bidCardTop,
    bidCardLeft: partial.bidCardLeft ?? DEFAULT_OVERLAY_CONTROL_SETTINGS.bidCardLeft,
  };
}

/** Strip event metadata for MongoDB persistence. */
export function overlayControlSettingsFromEvent(
  event: Omit<OverlaySettingsEvent, 'tournamentId' | 'timestamp'>,
): OverlayControlSettings {
  return normalizeOverlayControlSettings(event);
}

/** Map persisted settings onto overlay renderer state. */
export function overlaySettingsFromControlSettings(
  saved?: Partial<OverlayControlSettings> | null,
) {
  const s = normalizeOverlayControlSettings(saved);
  return {
    size: s.size,
    tickerMode: s.tickerMode,
    displayMode: s.displayMode,
    hidePremiumCard: s.hidePremiumCard,
    customTickerLine1: s.customTickerLine1,
    customTickerLine2: s.customTickerLine2,
    soldMessagePosition: s.soldMessagePosition,
    hideTickerCustom: s.hideTickerCustom,
    hideTickerFullscreen: s.hideTickerFullscreen,
    teamWiseTeamId: s.teamWiseTeamId,
    bidCardTop: s.bidCardTop,
    bidCardLeft: s.bidCardLeft,
    hideTeamCards: s.hideTeamCards,
    teamCardSize: s.teamCardSize,
    teamCardPosition: s.teamCardPosition,
    bidCardPosition: s.bidCardPosition,
  };
}
