import { THEME3_CANVAS_HEIGHT, THEME3_CANVAS_WIDTH } from './Theme3Canvas';
import { PLAYER_BAR_T3_TICKER_GAP, TICKER_T3_HEIGHT } from './theme3Layout';

export {
  THEME3_CANVAS_WIDTH as FS_CARD_CANVAS_W,
  THEME3_CANVAS_HEIGHT as FS_CARD_CANVAS_H,
};

/** Left hero photo column (~58% of card width). */
export const FS_CARD_PHOTO_RATIO = 0.58;

export const FS_CARD_PANEL_PADDING = 56;
export const FS_CARD_GOLD_RAIL_W = 6;
export const FS_CARD_TOP_STRIP_H = 72;

export const FS_CARD_ENTER_MS = 480;
export const FS_CARD_EXIT_MS = 400;
export const FS_CARD_SOLD_HOLD_MS = 5000;
export const FS_CARD_UNSOLD_HOLD_MS = 2500;
export const FS_CARD_LOOP_INTERVAL_MS = 4000;
export const FS_CARD_LOOP_FADE_MS = 300;

export function getFullScreenCardHeight(tickerVisible: boolean): number {
  if (!tickerVisible) return THEME3_CANVAS_HEIGHT;
  return THEME3_CANVAS_HEIGHT - TICKER_T3_HEIGHT - PLAYER_BAR_T3_TICKER_GAP;
}

export function getFullScreenPhotoWidth(cardHeight: number): number {
  return Math.round(THEME3_CANVAS_WIDTH * FS_CARD_PHOTO_RATIO);
}

/** Responsive player name size for full-screen card. */
export function fsCardNameFontSize(nameLength: number): number {
  if (nameLength > 22) return 56;
  if (nameLength > 16) return 68;
  if (nameLength > 12) return 80;
  return 92;
}

/** Profile stat row height based on field count. */
export function fsCardStatSlotHeight(fieldCount: number, panelInnerH: number): number {
  if (fieldCount <= 0) return 0;
  const available = panelInnerH - 420;
  return Math.max(56, Math.min(96, Math.floor(available / fieldCount)));
}
