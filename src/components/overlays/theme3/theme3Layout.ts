import { TICKER_T3_HEIGHT } from './TickerT3Shared';

export { TICKER_T3_HEIGHT };

/** Live player bar height within the 1920×1080 canvas. */
export const PLAYER_BAR_T3_HEIGHT = 132;

/** Centered bar width — not full-bleed. */
export const PLAYER_BAR_T3_WIDTH = 1200;

/** Portrait photo column width (12.5% of 1200 — Champion reference). */
export const PLAYER_BAR_T3_PHOTO_WIDTH = 150;

/** Stacked top rail bands (bright + primary + accent). */
export const PLAYER_BAR_T3_TOP_RAIL_HEIGHT = 9;

/** Vertical gap between player bar and ticker. */
export const PLAYER_BAR_T3_TICKER_GAP = 6;

/** Bid panel column width (matches CurrentBidT3). */
export const PLAYER_BAR_T3_BID_WIDTH = 320;

/** Default bottom offset — ticker height + gap. */
export const PLAYER_BAR_T3_BOTTOM = TICKER_T3_HEIGHT + PLAYER_BAR_T3_TICKER_GAP;

export function getPlayerBarBottom(tickerVisible: boolean): number {
  return tickerVisible ? TICKER_T3_HEIGHT + PLAYER_BAR_T3_TICKER_GAP : 0;
}
