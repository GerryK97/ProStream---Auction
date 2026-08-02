/** Frame 15 layout — Theme 4 Player Card SMALL (lower-third).
 *  Figma node 22:27 (806×481), scaled via T4_CARD_SCALE on canvas.
 */

export const T4_CARD_W = 806;
export const T4_CARD_H = 481;

/** Shield Frame 16 */
export const T4_SHIELD_X = 251;
export const T4_SHIELD_Y = 0;
export const T4_SHIELD_FRAME_W = 305;
export const T4_SHIELD_FRAME_H = 310;
/** Inner group 18:20 relative to Frame 15 — raised so tip meets nameplate */
export const T4_SHIELD_INNER_X = 274;
export const T4_SHIELD_INNER_Y = -36;
export const T4_SHIELD_INNER_W = 255;
export const T4_SHIELD_INNER_H = 280;

/** Base Price panel 23:71 */
export const T4_BASE_X = 0;
export const T4_BASE_Y = 133;
export const T4_PANEL_W = 310;
export const T4_PANEL_H = 75;
export const T4_PANEL_HEADER_H = 30;
export const T4_PANEL_BODY_H = 45;

/** Current Bid panel 23:60 */
export const T4_BID_X = 496;
export const T4_BID_Y = 132;

/** Nameplate — wider, taller enough for bottom-aligned name under shield tip */
export const T4_NAME_W = 600;
export const T4_NAME_H = 78;
export const T4_NAME_X = Math.round((T4_CARD_W - T4_NAME_W) / 2);
export const T4_NAME_Y = 214;

export const T4_LABEL_SIZE = 28;
export const T4_AMOUNT_SIZE = 44;
export const T4_AMOUNT_TRACKING = 4;
export const T4_NAME_SIZE = 48;
export const T4_NAME_TRACKING = 3;

export const T4_ENTER_MS = 480;
export const T4_EXIT_MS = 400;
export const T4_SOLD_HOLD_MS = 5000;
export const T4_UNSOLD_HOLD_MS = 2500;

/** Overall Frame 15 card scale on the 1920×1080 canvas. */
export const T4_CARD_SCALE = 0.8;

/**
 * Place Frame 15 card at bottom-center of 1920×1080 (OBS lower-third).
 * Position uses unscaled box; T4_CARD_SCALE is applied via transform-origin
 * at the nameplate bottom-center so the card stays docked bottom-middle.
 * When the Prime ticker is visible, sit the card flush just above it.
 */
export function getT4CardOffset(tickerHeight = 0): { left: number; top: number } {
  const visualBottom = T4_NAME_Y + T4_NAME_H;
  // Flush above ticker when on; 5px from screen bottom when ticker is off.
  const bottomMargin = tickerHeight > 0 ? tickerHeight : 5;
  return {
    left: Math.round((1920 - T4_CARD_W) / 2),
    top: Math.round(1080 - visualBottom - bottomMargin),
  };
}

/** Transform origin for scale — nameplate bottom center (keeps lower-third dock). */
export function getT4CardTransformOrigin(): string {
  return `${T4_CARD_W / 2}px ${T4_NAME_Y + T4_NAME_H}px`;
}

/** Match Figma Frame 15 amounts (e.g. 250,000). */
export function formatT4Amount(value: number): string {
  return Math.round(Math.abs(value)).toLocaleString('en-US');
}

export function t4NameFontSize(nameLength: number): number {
  if (nameLength > 22) return 34;
  if (nameLength > 16) return 40;
  if (nameLength > 12) return 44;
  return T4_NAME_SIZE;
}
