/** Theme 4 Team Imagery — overlays.uno Double Starting Lineup · Champion.

 * Geometry / chrome from Champion HTML; data from Theme 3 Imagery.
 * Gold bars `#eda900`. Dark plates `#141414` / `#1f1f1f`.
 * 15 players/page (3×5); shorter photo + compact name-only plate.
 */

export const T4_TWI_CANVAS_W = 1920;
export const T4_TWI_CANVAS_H = 1080;

/** Reserve bottom for ticker rail (ticker hidden during imagery). */
export const T4_TWI_TICKER_CLEARANCE = 65 + 8;

/** Champion thin gold bars (Top / Btm Rectangle) */
export const T4_TWI_GOLD_BAR_H = 10;

/** Dark title band under top gold bar */
export const T4_TWI_TITLE_BAND_H = 100;

/** Compact vertical columns — shorter photo for 15/page */
export const T4_TWI_BASE_CARD_W = 300;
export const T4_TWI_BASE_CARD_H = 420;
/** Compact name-only plate */
export const T4_TWI_NAMEPLATE_RATIO = 0.14;
export const T4_TWI_NAMEPLATE_MIN_H = 44;
export const T4_TWI_CARD_GAP = 12;
export const T4_TWI_ROW_GAP = 14;
export const T4_TWI_ROW_INNER_MAX = 1840;
/** At least 15 players before paginating to next page */
export const T4_TWI_MAX_PLAYERS_PER_PAGE = 15;
/** Prefer 5 across → 3 rows for a full page of 15 */
export const T4_TWI_MAX_PER_ROW = 5;

export const T4_TWI_PAGE_MS = 8000;
export const T4_TWI_EXIT_MS = 420;
export const T4_TWI_ENTER_MS = 560;

/** Champion palette */
export const T4_TWI_GOLD = '#eda900';
export const T4_TWI_GOLD_T4 = '#D4AF37';
export const T4_TWI_TITLE_BG = '#1f1f1f';
export const T4_TWI_CARD_BG = '#141414';
export const T4_TWI_PANEL = '#0A0C10';
export const T4_TWI_TEXT = '#e0e0e0';
export const T4_TWI_TEXT_TITLE = '#d6d6d6';
export const T4_TWI_MUTED = 'rgba(224,224,224,0.45)';
