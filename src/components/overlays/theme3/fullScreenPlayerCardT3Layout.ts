import { THEME3_CANVAS_HEIGHT, THEME3_CANVAS_WIDTH } from './Theme3Canvas';
import { PLAYER_BAR_T3_TICKER_GAP, TICKER_T3_HEIGHT } from './theme3Layout';

export {
  THEME3_CANVAS_WIDTH as FS_CARD_CANVAS_W,
  THEME3_CANVAS_HEIGHT as FS_CARD_CANVAS_H,
};

/**
 * Max share of canvas width for the hero photo column.
 * Actual width is the square of the photo-area height (see getFullScreenPhotoWidth),
 * capped by this ratio so the info panel never collapses.
 */
export const FS_CARD_PHOTO_RATIO = 0.52;

export const FS_CARD_PANEL_PADDING = 36;
/** Distance from the photo/details divider to name and details text. */
export const FS_CARD_PANEL_LEFT_INSET = 40;
export const FS_CARD_GOLD_RAIL_W = 6;
export const FS_CARD_TOP_STRIP_H = 72;

export const FS_CARD_ENTER_MS = 480;
export const FS_CARD_EXIT_MS = 400;
export const FS_CARD_SOLD_HOLD_MS = 10000;
export const FS_CARD_UNSOLD_HOLD_MS = 5000;
export const FS_CARD_LOOP_INTERVAL_MS = 4000;
export const FS_CARD_LOOP_FADE_MS = 300;

/** Full-screen bid panel — mirrors Custom Small two-column Base + Current Bid, scaled up. */
export const FS_BID_FONT_SIZE = 120;
export const FS_BID_LABEL_SIZE = 28;
export const FS_BID_CAPTION_SIZE = 30;
export const FS_BASE_LABEL_SIZE = 30;
export const FS_BASE_AMOUNT_SIZE = 64;
/** Min panel height so Current Bid caption (30) + amount (120) fill the section. */
export const FS_BID_PANEL_MIN_HEIGHT = 200;

export function getFullScreenCardHeight(tickerVisible: boolean): number {
  if (!tickerVisible) return THEME3_CANVAS_HEIGHT;
  return THEME3_CANVAS_HEIGHT - TICKER_T3_HEIGHT - PLAYER_BAR_T3_TICKER_GAP;
}

/** Square photo column sized to the photo area height (fits 1:1 player images). */
export function getFullScreenPhotoWidth(cardHeight: number): number {
  const photoHeight = Math.max(0, cardHeight - FS_CARD_TOP_STRIP_H);
  const maxWidth = Math.round(THEME3_CANVAS_WIDTH * FS_CARD_PHOTO_RATIO);
  return Math.min(photoHeight, maxWidth);
}

/** Responsive player name size for full-screen card. */
export function fsCardNameFontSize(nameLength: number): number {
  if (nameLength > 22) return 68;
  if (nameLength > 16) return 82;
  if (nameLength > 12) return 96;
  return 110;
}

/** Profile stat row height based on field count. */
export function fsCardStatSlotHeight(fieldCount: number, panelInnerH: number): number {
  if (fieldCount <= 0) return 0;
  const available = panelInnerH - 460;
  return Math.max(72, Math.min(128, Math.floor(available / fieldCount)));
}
