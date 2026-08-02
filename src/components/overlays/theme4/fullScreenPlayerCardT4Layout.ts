import { THEME4_CANVAS_HEIGHT, THEME4_CANVAS_WIDTH } from './Theme4Canvas';
import { TICKER_T4_HEIGHT } from './TickerT4';

export {
  THEME4_CANVAS_WIDTH as FS_CARD_T4_CANVAS_W,
  THEME4_CANVAS_HEIGHT as FS_CARD_T4_CANVAS_H,
};

/** Gap between full-screen card bottom and ticker rail. */
export const FS_CARD_T4_TICKER_GAP = 6;

/**
 * Max share of canvas for the hero photo; details panel keeps at least MIN_PANEL width.
 * Photo box is sized to the original image aspect (full image visible, no crop).
 */
export const FS_CARD_T4_PHOTO_RATIO_MAX = 0.62;
/** Minimum width reserved for the details panel (name, stats, bid). */
export const FS_CARD_T4_MIN_PANEL_W = 560;
/** Fallback aspect when dimensions unknown — portrait 3:4. */
export const FS_CARD_T4_DEFAULT_ASPECT = 3 / 4;
/** @deprecated */
export const FS_CARD_T4_PHOTO_RATIO = FS_CARD_T4_PHOTO_RATIO_MAX;
export const FS_CARD_T4_PHOTO_RATIO_MIN = 0.22;

export const FS_CARD_T4_PANEL_PADDING = 36;
export const FS_CARD_T4_PANEL_LEFT_INSET = 40;
export const FS_CARD_T4_GOLD_RAIL_W = 6;
export const FS_CARD_T4_TOP_STRIP_H = 72;

export const FS_CARD_T4_ENTER_MS = 480;
export const FS_CARD_T4_EXIT_MS = 400;
export const FS_CARD_T4_SOLD_HOLD_MS = 5000;
export const FS_CARD_T4_UNSOLD_HOLD_MS = 2500;
export const FS_CARD_T4_LOOP_INTERVAL_MS = 4000;
export const FS_CARD_T4_LOOP_FADE_MS = 300;

/** Full-screen bid panel type scale. */
export const FS_BID_T4_FONT_SIZE = 120;
export const FS_BID_T4_LABEL_SIZE = 28;
export const FS_BID_T4_CAPTION_SIZE = 30;
export const FS_BASE_T4_LABEL_SIZE = 30;
export const FS_BASE_T4_AMOUNT_SIZE = 64;
export const FS_BID_T4_PANEL_MIN_HEIGHT = 200;

/** Floating bar bid card (Full Screen 2). */
export const FS2_BID_T4_WIDTH = 320;
export const FS2_BID_T4_FONT_SIZE = 52;
export const FS2_BID_T4_LABEL_SIZE = 16;
export const FS2_BASE_T4_AMOUNT_SIZE = 28;
export const FS2_BASE_T4_LABEL_SIZE = 14;

export function getFullScreenCardT4Height(tickerVisible: boolean): number {
  if (!tickerVisible) return THEME4_CANVAS_HEIGHT;
  return THEME4_CANVAS_HEIGHT - TICKER_T4_HEIGHT - FS_CARD_T4_TICKER_GAP;
}

export type FullScreenPhotoT4Box = {
  width: number;
  height: number;
  /** Offset from top of content area (below top strip) — centers tall/short fits. */
  top: number;
};

/**
 * Fit the original photo fully inside the content area (no crop).
 * `imageAspect` = naturalWidth / naturalHeight.
 * Returns the exact display box; details panel uses remaining canvas width.
 */
export function getFullScreenPhotoT4Box(
  cardHeight: number,
  imageAspect: number = FS_CARD_T4_DEFAULT_ASPECT,
): FullScreenPhotoT4Box {
  const contentH = Math.max(1, cardHeight - FS_CARD_T4_TOP_STRIP_H);
  const maxWByRatio = Math.round(THEME4_CANVAS_WIDTH * FS_CARD_T4_PHOTO_RATIO_MAX);
  const maxWByPanel = THEME4_CANVAS_WIDTH - FS_CARD_T4_GOLD_RAIL_W - FS_CARD_T4_MIN_PANEL_W;
  const maxW = Math.max(200, Math.min(maxWByRatio, maxWByPanel));

  const aspect =
    Number.isFinite(imageAspect) && imageAspect > 0.08
      ? imageAspect
      : FS_CARD_T4_DEFAULT_ASPECT;

  // Largest rectangle of this aspect that fits in maxW × contentH
  let width = maxW;
  let height = width / aspect;
  if (height > contentH) {
    height = contentH;
    width = height * aspect;
  }

  width = Math.max(1, Math.round(width));
  height = Math.max(1, Math.round(height));
  const top = Math.max(0, Math.round((contentH - height) / 2));

  return { width, height, top };
}

/** @deprecated Prefer getFullScreenPhotoT4Box — width-only helper kept for callers. */
export function getFullScreenPhotoT4Width(
  cardHeight: number,
  imageAspect = FS_CARD_T4_DEFAULT_ASPECT,
): number {
  return getFullScreenPhotoT4Box(cardHeight, imageAspect).width;
}

/** Scale name type when the details panel shrinks (wide photo). */
export function fsCardT4NameFontSize(nameLength: number, panelWidth?: number): number {
  let size = 110;
  if (nameLength > 22) size = 68;
  else if (nameLength > 16) size = 82;
  else if (nameLength > 12) size = 96;
  if (panelWidth != null && panelWidth < 780) {
    const scale = Math.max(0.72, panelWidth / 900);
    size = Math.round(size * scale);
  }
  return size;
}

export function fsCardT4StatSlotHeight(fieldCount: number, panelInnerH: number): number {
  if (fieldCount <= 0) return 0;
  const available = panelInnerH - 460;
  return Math.max(72, Math.min(128, Math.floor(available / fieldCount)));
}
