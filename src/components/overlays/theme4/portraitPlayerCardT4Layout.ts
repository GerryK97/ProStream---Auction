/** Theme 4 Player Card LARGE — centered hero photo + mobile-readable identity footer.
 *  Inspired by Theme 3 Portrait large; styled with Theme 4 gold / navy system.
 *  Type sizes are broadcast-oriented so text stays legible when the 1920×1080
 *  canvas is watched on a phone.
 */

export const T4_LARGE_CARD_W = 480;
export const T4_LARGE_CARD_H = 700;
/** Taller strip so mobile viewers can read name / number / base. */
export const T4_LARGE_FOOTER_H = 120;
export const T4_LARGE_PHOTO_H = T4_LARGE_CARD_H - T4_LARGE_FOOTER_H;

export const T4_LARGE_ENTER_MS = 480;
export const T4_LARGE_EXIT_MS = 400;
export const T4_LARGE_SOLD_HOLD_MS = 5000;
export const T4_LARGE_UNSOLD_HOLD_MS = 2500;

export function getT4LargeCardOffset(): { left: number; top: number } {
  return {
    left: Math.round((1920 - T4_LARGE_CARD_W) / 2),
    top: Math.round((1080 - T4_LARGE_CARD_H) / 2),
  };
}

export function t4LargeNameFontSize(nameLength: number): number {
  if (nameLength > 22) return 30;
  if (nameLength > 16) return 36;
  if (nameLength > 12) return 40;
  return 46;
}

export const T4_LARGE_POSITION_SIZE = 18;
export const T4_LARGE_NUMBER_SIZE = 52;
export const T4_LARGE_BASE_LABEL_SIZE = 14;
export const T4_LARGE_BASE_AMOUNT_SIZE = 30;
export const T4_LARGE_NO_LABEL_SIZE = 13;
