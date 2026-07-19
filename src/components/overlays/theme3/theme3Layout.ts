import { TICKER_T3_HEIGHT } from './TickerT3Shared';

export { TICKER_T3_HEIGHT };

/** Live player bar height within the 1920×1080 canvas. */
export const PLAYER_BAR_T3_HEIGHT = 132;

/** Small player bar width — left-aligned, not full-bleed. */
export const PLAYER_BAR_T3_WIDTH = 1200;

/** Photo column width — taller/wider than bar so the image stands out. */
export const PLAYER_BAR_T3_PHOTO_WIDTH = 180;

/** Photo height — taller than the bar so the player image stands above other sections. */
export const PLAYER_BAR_T3_PHOTO_HEIGHT = 210;

/** Stacked top rail bands (bright + primary + accent). */
export const PLAYER_BAR_T3_TOP_RAIL_HEIGHT = 9;

/** Vertical gap between player bar and ticker. */
export const PLAYER_BAR_T3_TICKER_GAP = 6;

/** Extra space below the small player card (above ticker / canvas bottom). */
export const PLAYER_BAR_T3_MARGIN_BOTTOM = 20;

/** Bid panel column width (matches CurrentBidT3). */
export const PLAYER_BAR_T3_BID_WIDTH = 420;

/** Small-bar live bid typography. */
export const BAR_BID_FONT_SIZE = 78;
export const BAR_BID_LABEL_SIZE = 18;
export const BAR_BID_CAPTION_SIZE = 16;
export const BAR_BASE_LABEL_SIZE = 16;
export const BAR_BASE_AMOUNT_SIZE = 48;

/** Default bottom offset — ticker height + gap. */
export const PLAYER_BAR_T3_BOTTOM = TICKER_T3_HEIGHT + PLAYER_BAR_T3_TICKER_GAP;

export function getPlayerBarBottom(tickerVisible: boolean): number {
  return tickerVisible ? TICKER_T3_HEIGHT + PLAYER_BAR_T3_TICKER_GAP : 0;
}
