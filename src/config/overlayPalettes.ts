export interface OverlayPalette {
  id: string;
  name: string;
  cssVars: React.CSSProperties;
}

interface Theme3PaletteInput {
  id: string;
  name: string;
  app: string;
  canvas: string;
  panel: string;
  card: string;
  raised: string;
  modal: string;
  sidebar: string;
  muted: string;
  hover: string;
  active: string;
  photo: string;
  fallback: string;
  ticker: string;
  overlay: string;
  borderSubtle: string;
  borderStrong: string;
  borderAccent: string;
  textPrimary: string;
  textPrimaryRgb: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textAccent: string;
  accent: string;
  accentRgb: string;
  accentSoft: string;
  onAccent: string;
  actionHover: string;
  actionActive: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  focusRing: string;
  canvasGradient: string;
  panelGradient: string;
  shine: string;
  shadow: string;
  charts: [string, string, string, string, string, string];
  /** Live player bar — ticker-aligned accent lower-third */
  barBgDeep?: string;
  barBgDark?: string;
  barGold?: string;
  barGoldSoft?: string;
  barHighlight?: string;
  barRail?: string;
  barRailBright?: string;
  barRailSecondary?: string;
  barText?: string;
  barTextMuted?: string;
  barPattern?: string;
  barVignette?: string;
}

interface Theme2PaletteInput {
  id: string;
  name: string;
  app: string;
  canvas: string;
  panel: string;
  card: string;
  raised: string;
  modal: string;
  sidebar: string;
  muted: string;
  hover: string;
  active: string;
  photo: string;
  fallback: string;
  ticker: string;
  overlay: string;
  borderSubtle: string;
  borderStrong: string;
  borderAccent: string;
  textPrimary: string;
  textPrimaryRgb: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textAccent: string;
  accent: string;
  accentRgb: string;
  accentSoft: string;
  onAccent: string;
  actionHover: string;
  actionActive: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  focusRing: string;
  canvasGradient: string;
  panelGradient: string;
  shine: string;
  shadow: string;
  charts: [string, string, string, string, string, string];
}

const theme2Palette = (palette: Theme2PaletteInput): OverlayPalette => ({
  id: palette.id,
  name: palette.name,
  cssVars: {
    '--t2-bg-app': palette.app,
    '--t2-bg-canvas': palette.canvas,
    '--t2-bg-panel': palette.panel,
    '--t2-bg-card': palette.card,
    '--t2-bg-card-raised': palette.raised,
    '--t2-bg-modal': palette.modal,
    '--t2-bg-sidebar': palette.sidebar,
    '--t2-bg-muted': palette.muted,
    '--t2-bg-hover': palette.hover,
    '--t2-bg-active': palette.active,
    '--t2-bg-photo': palette.photo,
    '--t2-bg-photo-fallback': palette.fallback,
    '--t2-bg-ticker': palette.ticker,
    '--t2-bg-overlay': palette.overlay,
    '--t2-border-subtle': palette.borderSubtle,
    '--t2-border-strong': palette.borderStrong,
    '--t2-border-accent': palette.borderAccent,
    '--t2-text-primary': palette.textPrimary,
    '--t2-text-primary-rgb': palette.textPrimaryRgb,
    '--t2-text-secondary': palette.textSecondary,
    '--t2-text-muted': palette.textMuted,
    '--t2-text-disabled': palette.textDisabled,
    '--t2-text-accent': palette.textAccent,
    '--t2-accent': palette.accent,
    '--t2-accent-rgb': palette.accentRgb,
    '--t2-accent-soft': palette.accentSoft,
    '--t2-on-accent': palette.onAccent,
    '--t2-action-primary': palette.accent,
    '--t2-action-primary-hover': palette.actionHover,
    '--t2-action-primary-active': palette.actionActive,
    '--t2-danger': palette.danger,
    '--t2-danger-soft': palette.dangerSoft,
    '--t2-success': palette.success,
    '--t2-success-soft': palette.successSoft,
    '--t2-warning': palette.warning,
    '--t2-warning-soft': palette.warningSoft,
    '--t2-info': palette.info,
    '--t2-info-soft': palette.infoSoft,
    '--t2-focus-ring': palette.focusRing,
    '--t2-gradient-canvas': palette.canvasGradient,
    '--t2-gradient-panel': palette.panelGradient,
    '--t2-shine': palette.shine,
    '--t2-shadow-color': palette.shadow,
    '--t2-chart-1': palette.charts[0],
    '--t2-chart-2': palette.charts[1],
    '--t2-chart-3': palette.charts[2],
    '--t2-chart-4': palette.charts[3],
    '--t2-chart-5': palette.charts[4],
    '--t2-chart-6': palette.charts[5],
    '--overlay-color-primary': palette.accent,
    '--overlay-color-primary-rgb': palette.accentRgb,
    '--overlay-color-secondary': palette.actionHover,
    '--overlay-color-success': palette.success,
    '--overlay-color-danger': palette.danger,
    '--overlay-bg-panel': palette.panel,
    '--overlay-bg-danger': palette.dangerSoft,
    '--overlay-bg-logo-pill': palette.panelGradient,
    '--overlay-bg-ticker': palette.ticker,
    '--overlay-bg-photo': palette.photo,
    '--overlay-bg-photo-fallback': palette.fallback,
    '--overlay-bg-fullscreen': palette.canvasGradient,
    '--overlay-text-bright': palette.textPrimary,
    '--overlay-text-subtle': palette.textSecondary,
    '--overlay-text-muted': palette.textMuted,
    '--overlay-text-dim': palette.textDisabled,
    '--overlay-text-dark': palette.onAccent,
    '--overlay-border-light': palette.borderSubtle,
    '--overlay-border-accent-strong': palette.borderAccent,
    '--overlay-border-accent-subtle': palette.borderSubtle,
  } as React.CSSProperties,
});

const theme3Palette = (palette: Theme3PaletteInput): OverlayPalette => ({
  id: palette.id,
  name: palette.name,
  cssVars: {
    '--t3-bg-app': palette.app,
    '--t3-bg-canvas': palette.canvas,
    '--t3-bg-panel': palette.panel,
    '--t3-bg-card': palette.card,
    '--t3-bg-card-raised': palette.raised,
    '--t3-bg-modal': palette.modal,
    '--t3-bg-sidebar': palette.sidebar,
    '--t3-bg-muted': palette.muted,
    '--t3-bg-hover': palette.hover,
    '--t3-bg-active': palette.active,
    '--t3-bg-photo': palette.photo,
    '--t3-bg-photo-fallback': palette.fallback,
    '--t3-bg-ticker': palette.ticker,
    '--t3-bg-overlay': palette.overlay,
    '--t3-border-subtle': palette.borderSubtle,
    '--t3-border-strong': palette.borderStrong,
    '--t3-border-accent': palette.borderAccent,
    '--t3-text-primary': palette.textPrimary,
    '--t3-text-primary-rgb': palette.textPrimaryRgb,
    '--t3-text-secondary': palette.textSecondary,
    '--t3-text-muted': palette.textMuted,
    '--t3-text-disabled': palette.textDisabled,
    '--t3-text-accent': palette.textAccent,
    '--t3-accent': palette.accent,
    '--t3-accent-rgb': palette.accentRgb,
    '--t3-accent-soft': palette.accentSoft,
    '--t3-on-accent': palette.onAccent,
    '--t3-action-primary': palette.accent,
    '--t3-action-primary-hover': palette.actionHover,
    '--t3-action-primary-active': palette.actionActive,
    '--t3-danger': palette.danger,
    '--t3-danger-soft': palette.dangerSoft,
    '--t3-success': palette.success,
    '--t3-success-soft': palette.successSoft,
    '--t3-warning': palette.warning,
    '--t3-warning-soft': palette.warningSoft,
    '--t3-info': palette.info,
    '--t3-info-soft': palette.infoSoft,
    '--t3-focus-ring': palette.focusRing,
    '--t3-gradient-canvas': palette.canvasGradient,
    '--t3-gradient-panel': palette.panelGradient,
    '--t3-shine': palette.shine,
    '--t3-shadow-color': palette.shadow,
    '--t3-chart-1': palette.charts[0],
    '--t3-chart-2': palette.charts[1],
    '--t3-chart-3': palette.charts[2],
    '--t3-chart-4': palette.charts[3],
    '--t3-chart-5': palette.charts[4],
    '--t3-chart-6': palette.charts[5],
    '--t3-bar-bg-deep': palette.barBgDeep ?? palette.accent,
    '--t3-bar-bg-dark': palette.barBgDark ?? palette.panel,
    '--t3-bar-gold': palette.barGold ?? palette.accent,
    '--t3-bar-gold-soft': palette.barGoldSoft ?? palette.accentSoft,
    '--t3-bar-highlight': palette.barHighlight ?? palette.actionHover,
    '--t3-bar-rail-bright': palette.barRailBright ?? palette.shine,
    '--t3-bar-rail': palette.barRail ?? palette.textPrimary,
    '--t3-bar-rail-secondary': palette.barRailSecondary ?? 'rgba(0,0,0,0.42)',
    '--t3-bar-text': palette.barText ?? palette.textPrimary,
    '--t3-bar-text-muted': palette.barTextMuted ?? palette.textSecondary,
    '--t3-bar-pattern': palette.barPattern ?? palette.accentSoft,
    '--t3-bar-vignette': palette.barVignette ?? 'rgba(0,0,0,0.35)',
    '--t3-font-display': '"Saira Extra Condensed", sans-serif',
    '--overlay-color-primary': palette.accent,
    '--overlay-color-primary-rgb': palette.accentRgb,
    '--overlay-color-secondary': palette.actionHover,
    '--overlay-color-success': palette.success,
    '--overlay-color-danger': palette.danger,
    '--overlay-bg-panel': palette.panel,
    '--overlay-bg-danger': palette.dangerSoft,
    '--overlay-bg-logo-pill': palette.panelGradient,
    '--overlay-bg-ticker': palette.ticker,
    '--overlay-bg-photo': palette.photo,
    '--overlay-bg-photo-fallback': palette.fallback,
    '--overlay-bg-fullscreen': palette.canvasGradient,
    '--overlay-text-bright': palette.textPrimary,
    '--overlay-text-subtle': palette.textSecondary,
    '--overlay-text-muted': palette.textMuted,
    '--overlay-text-dim': palette.textDisabled,
    '--overlay-text-dark': palette.onAccent,
    '--overlay-border-light': palette.borderSubtle,
    '--overlay-border-accent-strong': palette.borderAccent,
    '--overlay-border-accent-subtle': palette.borderSubtle,
  } as React.CSSProperties,
});

const THEME3_SCAFFOLD: Theme3PaletteInput = {
  id: 'scaffold',
  name: 'Theme 3 - Scaffold',
  app: '#0A0A0F',
  canvas: '#0C0C14',
  panel: '#202020',
  card: '#181824',
  raised: '#1E1E2E',
  modal: '#202030',
  sidebar: '#0E0E16',
  muted: '#14141E',
  hover: '#222232',
  active: '#2A2A3C',
  photo: '#101018',
  fallback: '#080810',
  ticker: '#0E0E18',
  overlay: 'rgba(4,4,8,.65)',
  borderSubtle: 'rgba(255,255,255,.10)',
  borderStrong: 'rgba(255,255,255,.20)',
  borderAccent: 'rgba(160,160,200,.35)',
  textPrimary: '#F0F0F8',
  textPrimaryRgb: '240,240,248',
  textSecondary: '#B8B8C8',
  textMuted: '#787888',
  textDisabled: '#505060',
  textAccent: '#A0A0D0',
  accent: '#00898c',
  accentRgb: '0,137,140',
  accentSoft: 'rgba(0,137,140,.14)',
  onAccent: '#0A0A10',
  actionHover: '#A8A8D8',
  actionActive: '#7878A8',
  success: '#6EC49A',
  successSoft: 'rgba(110,196,154,.14)',
  warning: '#D4B05E',
  warningSoft: 'rgba(212,176,94,.15)',
  danger: '#D87070',
  dangerSoft: 'rgba(216,112,112,.14)',
  info: '#70A8D8',
  infoSoft: 'rgba(112,168,216,.13)',
  focusRing: 'rgba(144,144,192,.36)',
  canvasGradient: 'linear-gradient(160deg,#080810 0%,#0C0C18 50%,#121220 100%)',
  panelGradient: 'linear-gradient(180deg,#1A1A28 0%,#14141E 100%)',
  shine: 'rgba(255,255,255,.12)',
  shadow: 'rgba(0,0,0,.50)',
  charts: ['#9090C0', '#70A8D8', '#6EC49A', '#D4B05E', '#B890D0', '#D87070'],
};

const OBSIDIAN_LEDGER: Theme2PaletteInput = {
  id: 'obsidian-ledger',
  name: 'Theme 2 - Obsidian Ledger',
  app: '#070A0F',
  canvas: '#090D14',
  panel: '#0E141D',
  card: '#121A24',
  raised: '#172231',
  modal: '#182332',
  sidebar: '#0B1119',
  muted: '#101720',
  hover: '#1A2635',
  active: '#203044',
  photo: '#0C121A',
  fallback: '#070B11',
  ticker: '#0B1017',
  overlay: 'rgba(3,6,10,.68)',
  borderSubtle: 'rgba(178,190,204,.13)',
  borderStrong: 'rgba(196,207,222,.24)',
  borderAccent: 'rgba(196,167,111,.42)',
  textPrimary: '#EEF3F7',
  textPrimaryRgb: '238,243,247',
  textSecondary: '#B8C3CE',
  textMuted: '#7F8B99',
  textDisabled: '#4F5A66',
  textAccent: '#D6B16E',
  accent: '#C8A15F',
  accentRgb: '200,161,95',
  accentSoft: 'rgba(200,161,95,.13)',
  onAccent: '#11100C',
  actionHover: '#D7B878',
  actionActive: '#AD8646',
  success: '#5FB98E',
  successSoft: 'rgba(95,185,142,.14)',
  warning: '#D7A84D',
  warningSoft: 'rgba(215,168,77,.16)',
  danger: '#D96868',
  dangerSoft: 'rgba(217,104,104,.15)',
  info: '#78A8D8',
  infoSoft: 'rgba(120,168,216,.14)',
  focusRing: 'rgba(200,161,95,.38)',
  canvasGradient: 'linear-gradient(160deg,#05070B 0%,#0B1018 48%,#121A24 100%)',
  panelGradient: 'linear-gradient(180deg,#151F2B 0%,#101821 100%)',
  shine: 'rgba(255,244,218,.20)',
  shadow: 'rgba(0,0,0,.52)',
  charts: ['#C8A15F', '#78A8D8', '#5FB98E', '#D7A84D', '#B18CD9', '#D96868'],
};

const PORCELAIN_GRAPHITE: Theme2PaletteInput = {
  id: 'porcelain-graphite',
  name: 'Theme 2 - Porcelain Graphite',
  app: '#E9E6DF',
  canvas: '#F1EEE8',
  panel: '#FAF8F3',
  card: '#FFFDF8',
  raised: '#F6F2EA',
  modal: '#FFFDF8',
  sidebar: '#E2DED5',
  muted: '#EFEAE1',
  hover: '#E8E1D6',
  active: '#DED4C4',
  photo: '#D8D2C8',
  fallback: '#CAC1B3',
  ticker: '#171A1F',
  overlay: 'rgba(23,26,31,.36)',
  borderSubtle: 'rgba(42,48,56,.14)',
  borderStrong: 'rgba(42,48,56,.25)',
  borderAccent: 'rgba(30,95,116,.36)',
  textPrimary: '#1B1F27',
  textPrimaryRgb: '27,31,39',
  textSecondary: '#4F5864',
  textMuted: '#7B7370',
  textDisabled: '#A9A19A',
  textAccent: '#1E5F74',
  accent: '#1E5F74',
  accentRgb: '30,95,116',
  accentSoft: 'rgba(30,95,116,.10)',
  onAccent: '#F9FBFC',
  actionHover: '#26748C',
  actionActive: '#174C5D',
  success: '#357D62',
  successSoft: 'rgba(53,125,98,.13)',
  warning: '#A86F25',
  warningSoft: 'rgba(168,111,37,.14)',
  danger: '#B34C4A',
  dangerSoft: 'rgba(179,76,74,.13)',
  info: '#4F6FA6',
  infoSoft: 'rgba(79,111,166,.12)',
  focusRing: 'rgba(30,95,116,.32)',
  canvasGradient: 'linear-gradient(160deg,#E4DFD6 0%,#F4F0E8 54%,#DAD4CB 100%)',
  panelGradient: 'linear-gradient(180deg,#FFFDF8 0%,#F3EFE7 100%)',
  shine: 'rgba(255,255,255,.42)',
  shadow: 'rgba(31,27,20,.18)',
  charts: ['#1E5F74', '#A86F25', '#357D62', '#4F6FA6', '#8B6F47', '#B34C4A'],
};

const ALPINE_SIGNAL: Theme2PaletteInput = {
  id: 'alpine-signal',
  name: 'Theme 2 - Alpine Signal',
  app: '#07110F',
  canvas: '#081713',
  panel: '#0D211C',
  card: '#102A24',
  raised: '#15362E',
  modal: '#173A32',
  sidebar: '#091A16',
  muted: '#0B201B',
  hover: '#183E35',
  active: '#1E4B40',
  photo: '#0A1815',
  fallback: '#06100E',
  ticker: '#07130F',
  overlay: 'rgba(3,9,8,.66)',
  borderSubtle: 'rgba(171,207,194,.14)',
  borderStrong: 'rgba(188,224,211,.25)',
  borderAccent: 'rgba(123,198,159,.42)',
  textPrimary: '#EDF7F2',
  textPrimaryRgb: '237,247,242',
  textSecondary: '#B7D2C7',
  textMuted: '#78988C',
  textDisabled: '#49655B',
  textAccent: '#7BC69F',
  accent: '#7BC69F',
  accentRgb: '123,198,159',
  accentSoft: 'rgba(123,198,159,.13)',
  onAccent: '#06110D',
  actionHover: '#91D7B2',
  actionActive: '#62AA86',
  success: '#86D29D',
  successSoft: 'rgba(134,210,157,.14)',
  warning: '#D6B15E',
  warningSoft: 'rgba(214,177,94,.15)',
  danger: '#E07171',
  dangerSoft: 'rgba(224,113,113,.14)',
  info: '#77B7D8',
  infoSoft: 'rgba(119,183,216,.13)',
  focusRing: 'rgba(123,198,159,.36)',
  canvasGradient: 'linear-gradient(160deg,#040B09 0%,#0A1814 44%,#123029 100%)',
  panelGradient: 'linear-gradient(180deg,#14362E 0%,#0E241F 100%)',
  shine: 'rgba(213,255,235,.18)',
  shadow: 'rgba(0,0,0,.50)',
  charts: ['#7BC69F', '#77B7D8', '#D6B15E', '#A68CE0', '#E07171', '#91B58E'],
};

export const OVERLAY_PALETTES: Record<string, OverlayPalette[]> = {
  standard: [
    {
      id: 'default',
      name: 'ProStream Default (Gold/Navy)',
      cssVars: {
        '--overlay-color-primary': '#FFC919',
        '--overlay-color-primary-rgb': '255, 201, 25',
        '--overlay-color-secondary': '#FFCC00',
        '--overlay-color-success': '#00C54C',
        '--overlay-color-danger': '#ef4444',
        '--overlay-bg-panel': 'linear-gradient(135deg, #0f0c29, #302b63)',
        '--overlay-bg-danger': 'linear-gradient(135deg, #1a0808, #2d0f0f)',
        '--overlay-bg-logo-pill': 'linear-gradient(270deg, #6B72FF 0%, #222899 74%)',
        '--overlay-bg-ticker': 'rgba(8,10,20,0.92)',
        '--overlay-bg-photo': '#1a1f2e',
        '--overlay-bg-photo-fallback': '#0d1220',
        '--overlay-bg-fullscreen': 'linear-gradient(160deg, #0a0a14 0%, #111827 60%, #0d1117 100%)',
        '--overlay-text-bright': '#ffffff',
        '--overlay-text-subtle': '#e2e8f0',
        '--overlay-text-muted': 'rgba(255,255,255,0.45)',
        '--overlay-text-dim': 'rgba(255,255,255,0.28)',
        '--overlay-text-dark': '#0d0d0d',
        '--overlay-border-light': 'rgba(255,255,255,0.15)',
        '--overlay-border-accent-strong': 'rgba(255,201,25,0.4)',
        '--overlay-border-accent-subtle': 'rgba(255,201,25,0.22)',
        '--t1card-gradient-from': '#ff5411',
        '--t1card-gradient-to': '#ffcc00',
      } as React.CSSProperties
    },
    {
      id: 'ocean',
      name: 'Deep Ocean (Cyan/Blue)',
      cssVars: {
        '--overlay-color-primary': '#06b6d4', /* Cyan 500 */
        '--overlay-color-primary-rgb': '6, 182, 212',
        '--overlay-color-secondary': '#0284c7', /* Blue 600 */
        '--overlay-color-success': '#10b981', /* Emerald 500 */
        '--overlay-color-danger': '#ef4444', /* Red 500 */
        '--overlay-bg-panel': 'linear-gradient(135deg, #001e36, #003b6b)',
        '--overlay-bg-danger': 'linear-gradient(135deg, #1a0808, #2d0f0f)',
        '--overlay-bg-logo-pill': 'linear-gradient(270deg, #0284c7 0%, #0369a1 74%)',
        '--overlay-bg-ticker': 'rgba(2,10,24,0.92)',
        '--overlay-bg-photo': '#041c30',
        '--overlay-bg-photo-fallback': '#092540',
        '--overlay-bg-fullscreen': 'linear-gradient(160deg, #020a14 0%, #061f36 60%, #081121 100%)',
        '--overlay-text-bright': '#ffffff',
        '--overlay-text-subtle': '#e2e8f0',
        '--overlay-text-muted': 'rgba(255,255,255,0.45)',
        '--overlay-text-dim': 'rgba(255,255,255,0.28)',
        '--overlay-text-dark': '#0d0d0d',
        '--overlay-border-light': 'rgba(255,255,255,0.15)',
        '--overlay-border-accent-strong': 'rgba(6,182,212,0.4)',
        '--overlay-border-accent-subtle': 'rgba(6,182,212,0.22)',
        '--t1card-gradient-from': '#06b6d4',
        '--t1card-gradient-to': '#0284c7',
      } as React.CSSProperties
    },
    {
      id: 'amethyst',
      name: 'Amethyst Night (Purple/Violet)',
      cssVars: {
        '--overlay-color-primary': '#c084fc',
        '--overlay-color-primary-rgb': '192, 132, 252',
        '--overlay-color-secondary': '#9333ea',
        '--overlay-color-success': '#34d399',
        '--overlay-color-danger': '#ef4444',
        '--overlay-bg-panel': 'linear-gradient(135deg, #1a0a2e, #3b1a6b)',
        '--overlay-bg-danger': 'linear-gradient(135deg, #1a0808, #2d0f0f)',
        '--overlay-bg-logo-pill': 'linear-gradient(270deg, #9333ea 0%, #6d28d9 74%)',
        '--overlay-bg-ticker': 'rgba(15,5,30,0.92)',
        '--overlay-bg-photo': '#1a0d2e',
        '--overlay-bg-photo-fallback': '#120820',
        '--overlay-bg-fullscreen': 'linear-gradient(160deg, #0a0514 0%, #150a28 60%, #0d0820 100%)',
        '--overlay-text-bright': '#ffffff',
        '--overlay-text-subtle': '#e9d5ff',
        '--overlay-text-muted': 'rgba(233,213,255,0.45)',
        '--overlay-text-dim': 'rgba(233,213,255,0.28)',
        '--overlay-text-dark': '#0d0d0d',
        '--overlay-border-light': 'rgba(255,255,255,0.15)',
        '--overlay-border-accent-strong': 'rgba(192,132,252,0.4)',
        '--overlay-border-accent-subtle': 'rgba(192,132,252,0.22)',
        '--t1card-gradient-from': '#c084fc',
        '--t1card-gradient-to': '#9333ea',
      } as React.CSSProperties
    }
  ],
  premium: [
    {
      id: 'default',
      name: 'Premium Glass',
      cssVars: {
         /* To be implemented */
      } as React.CSSProperties
    }
  ],
  neon: [],
  theme2: [
    theme2Palette({ ...OBSIDIAN_LEDGER, id: 'default', name: 'Theme 2 - Obsidian Ledger' }),
    theme2Palette(OBSIDIAN_LEDGER),
    theme2Palette(PORCELAIN_GRAPHITE),
    theme2Palette(ALPINE_SIGNAL),
  ],
  theme3: [
    theme3Palette({ ...THEME3_SCAFFOLD, id: 'default', name: 'Theme 3 - Scaffold' }),
  ],
  theme4: [
    {
      id: 'default',
      name: 'Theme 4 - Frame 15 Lightning',
      cssVars: {
        '--t4-bid-gold': '#D4AF37',
        '--t4-base-amount': '#FFFFFF',
        '--t4-label': '#0A0C12',
        '--t4-panel-header':
          'linear-gradient(180deg, #FFFFFF 0%, #E8ECF2 38%, #B8C0CC 72%, #9AA3B0 100%)',
        '--t4-panel-body':
          'linear-gradient(180deg, #1E2A42 0%, #121A2C 42%, #0A101C 100%)',
        '--t4-panel-edge': 'rgba(212,175,55,0.28)',
        '--t4-panel-edge-soft': 'rgba(255,255,255,0.12)',
        '--t4-nameplate-bg':
          'linear-gradient(180deg, #1A2438 0%, #121A2C 40%, #0A101C 78%, #06080E 100%)',
        '--t4-nameplate-edge': 'rgba(212,175,55,0.65)',
        '--t4-nameplate-glow': 'rgba(212,175,55,0.22)',
        '--t4-name-gold': '#F0D878',
        '--t4-font-label': '"Oswald", "Arial Narrow", sans-serif',
        '--t4-font-name': '"Bebas Neue", "Oswald", Impact, sans-serif',
        '--t4-bg-photo': '#0A0C10',
        /* Unified golden metal shield — no cyan/blue clash on the rim */
        '--t4-shield-gold-hi': '#F3E2A0',
        '--t4-shield-gold': '#D4AF37',
        '--t4-shield-gold-mid': '#B8860B',
        '--t4-shield-bronze': '#8A6A2F',
        '--t4-shield-bronze-deep': '#3D2E14',
        '--t4-shield-platinum': '#E6E2D6',
        '--t4-shield-line-bg': '#2A2214',
        '--t4-success': '#6EC49A',
        '--t4-danger': '#E85A5A',
        '--t4-gradient-canvas': 'linear-gradient(160deg, #050810 0%, #0A1428 55%, #080C18 100%)',
        '--overlay-color-primary': '#D4AF37',
        '--overlay-color-primary-rgb': '212,175,55',
        '--overlay-color-secondary': '#2A5BB5',
        '--overlay-color-success': '#6EC49A',
        '--overlay-color-danger': '#E85A5A',
        '--overlay-bg-panel': '#0C1424',
        '--overlay-bg-danger': 'rgba(232,90,90,0.18)',
        '--overlay-bg-logo-pill': 'linear-gradient(270deg, #D4AF37 0%, #2A5BB5 74%)',
        '--overlay-bg-ticker': '#060A14',
        '--overlay-bg-photo': '#0A0C10',
        '--overlay-bg-photo-fallback': '#050810',
        '--overlay-bg-fullscreen': 'linear-gradient(160deg, #050810 0%, #0A1428 55%, #080C18 100%)',
        '--overlay-text-bright': '#F5F7FA',
        '--overlay-text-subtle': '#B8C4D8',
        '--overlay-text-muted': '#6A7890',
        '--overlay-text-dim': '#4A5670',
        '--overlay-text-dark': '#0A0C10',
        '--overlay-border-light': 'rgba(255,255,255,0.14)',
        '--overlay-border-accent-strong': 'rgba(212,175,55,0.5)',
        '--overlay-border-accent-subtle': 'rgba(184,134,11,0.28)',
      } as React.CSSProperties,
    },
  ],
};
