import { TICKER_T3_HEIGHT } from './TickerT3Shared';

export { TICKER_T3_HEIGHT };

/** Live player bar height within the 1920×1080 canvas. */
export const PLAYER_BAR_T3_HEIGHT = 132;

/** Centered bar width — not full-bleed. */
export const PLAYER_BAR_T3_WIDTH = 1200;

/** Portrait photo column width (12.5% of 1200 — Champion reference). */
export const PLAYER_BAR_T3_PHOTO_WIDTH = 150;

/** Default bottom offset — flush above the ticker. */
export const PLAYER_BAR_T3_BOTTOM = TICKER_T3_HEIGHT;

export function getPlayerBarBottom(tickerVisible: boolean): number {
  return tickerVisible ? TICKER_T3_HEIGHT : 0;
}
