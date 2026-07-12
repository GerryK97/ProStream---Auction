import { getPlayerBarBottom, PLAYER_BAR_T3_TICKER_GAP } from './theme3Layout';

/** Portrait large card for Custom Theme 3 overlay. */
export const PORTRAIT_CARD_W = 440;
export const PORTRAIT_CARD_H = 660;
export const PORTRAIT_FOOTER_H = 145;
export const PORTRAIT_PHOTO_H = PORTRAIT_CARD_H - PORTRAIT_FOOTER_H;
export const PORTRAIT_CARD_GAP_ABOVE_TICKER = 12;

export const PORTRAIT_ENTER_MS = 480;
export const PORTRAIT_EXIT_MS = 400;
export const PORTRAIT_SOLD_HOLD_MS = 5000;
export const PORTRAIT_UNSOLD_HOLD_MS = 2500;

export function getPortraitCardBottom(tickerVisible: boolean): number {
  return getPlayerBarBottom(tickerVisible) + PORTRAIT_CARD_GAP_ABOVE_TICKER;
}

export function portraitNameFontSize(nameLength: number): number {
  if (nameLength > 22) return 26;
  if (nameLength > 16) return 30;
  if (nameLength > 12) return 34;
  return 38;
}

/** Live bid amount in portrait card footer — must read larger than player name. */
export const PORTRAIT_BID_FONT_SIZE = 48;
