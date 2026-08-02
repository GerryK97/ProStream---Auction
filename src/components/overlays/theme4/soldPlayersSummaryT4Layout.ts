/** Theme 4 summaries — Fresh Fixtures geometry (80% panel).
 *  Shared by Player Summary, Team Summary, Team-wise Summary, Top 10 Sold.
 *  Title / column header = ticker-blue family. Accents / footer = Prime blue.
 */

/** Fresh: left/top 10%, width/height 80% of 1920×1080 */
export const T4_SUMMARY_PANEL_LEFT = 192;
export const T4_SUMMARY_PANEL_TOP = 108;
export const T4_SUMMARY_PANEL_W = 1536;
export const T4_SUMMARY_PANEL_H = 864;

/** Title zone — compact so 12 rows fit fully above footer */
export const T4_SUMMARY_TITLE_TOP_H = 44;
export const T4_SUMMARY_TITLE_BOTTOM_H = 56;
export const T4_SUMMARY_TITLE_H = T4_SUMMARY_TITLE_TOP_H + T4_SUMMARY_TITLE_BOTTOM_H; // 100
export const T4_SUMMARY_HEADER_H = 40;
export const T4_SUMMARY_FOOTER_H = 52;
export const T4_SUMMARY_ROWS_PER_PAGE = 12;
export const T4_SUMMARY_ROW_H = 52;
/** Gap above footer / page dots — keep small so row 12 clears */
export const T4_SUMMARY_ROWS_BOTTOM_PAD = 12;
export const T4_SUMMARY_PAGE_MS = 10_000;

/** # | PLAYER | TEAM | SOLD PRICE  (Player Summary + Top 10) */
export const T4_SUMMARY_COLS = '70px 1fr 340px 260px';

/** # | TEAM | PLAYERS | CAN BUY | MAX BID | BALANCE */
export const T4_TEAM_SUMMARY_COLS = '64px 1fr 120px 140px 200px 200px';

/** # | PLAYER | SOLD PRICE  (Team-wise Summary) */
export const T4_TEAM_WISE_COLS = '70px 1fr 260px';

export const T4_SUMMARY_EXIT_MS = 600;

/** Prime ticker blue family — two distinct blues for stacked title bands */
export const T4_SUMMARY_TITLE_TOP = '#2A7AD4'; // tournament name (lighter)
export const T4_SUMMARY_TITLE_TOP_DEEP = '#1A5FB8';
export const T4_SUMMARY_TITLE_BOTTOM = '#1A5FB8'; // mode title strip
export const T4_SUMMARY_TITLE_BOTTOM_DEEP = '#0a3d8d'; // matches footer / ticker bar

/** Column header strip */
export const T4_SUMMARY_COL_HEADER = '#1A5FB8';
export const T4_SUMMARY_COL_HEADER_DEEP = '#0E4F96';

/** Accents (prices, footer, thumbs) — Prime ticker blue; deep lightened for presence */
export const T4_SUMMARY_ACCENT = '#0a3d8d';
export const T4_SUMMARY_ACCENT_DEEP = '#09357A';
export const T4_SUMMARY_PANEL_BG = '#0A0C10';
export const T4_SUMMARY_TEXT = '#ffffff';
export const T4_SUMMARY_MUTED = 'rgba(255,255,255,0.62)';
export const T4_SUMMARY_DIVIDER = 'rgba(255,255,255,0.28)';

/** Selected team row highlight (Team Summary) */
export const T4_SUMMARY_HIGHLIGHT_BG = 'rgba(42, 122, 212, 0.22)';
export const T4_SUMMARY_HIGHLIGHT_EDGE = '#2A7AD4';
