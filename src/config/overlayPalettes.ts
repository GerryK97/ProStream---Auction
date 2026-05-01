export interface OverlayPalette {
  id: string;
  name: string;
  cssVars: React.CSSProperties;
}

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
    {
      id: 'default',
      name: 'Theme 2 — Midnight',
      cssVars: {
        '--overlay-color-primary': '#3b82f6', '--overlay-color-primary-rgb': '59, 130, 246',
        '--overlay-color-secondary': '#2563eb', '--overlay-color-success': '#22c55e',
        '--overlay-color-danger': '#ef4444', '--overlay-bg-panel': '#0f1829',
        '--overlay-bg-danger': '#1c0a0a', '--overlay-bg-logo-pill': '#1e3a5f',
        '--overlay-bg-ticker': '#080f1c', '--overlay-bg-photo': '#0f1829',
        '--overlay-bg-photo-fallback': '#0a1020', '--overlay-bg-fullscreen': '#0a1020',
        '--overlay-text-bright': '#f8fafc', '--overlay-text-subtle': '#e2e8f0',
        '--overlay-text-muted': 'rgba(226,232,240,0.5)', '--overlay-text-dim': 'rgba(226,232,240,0.3)',
        '--overlay-text-dark': '#0d0d0d', '--overlay-border-light': 'rgba(255,255,255,0.08)',
        '--overlay-border-accent-strong': 'rgba(59,130,246,0.4)', '--overlay-border-accent-subtle': 'rgba(59,130,246,0.15)',
        '--t2-accent': '#3b82f6', '--t2-accent-rgb': '59, 130, 246',
        '--t2-bg-card': '#0f1829', '--t2-text-primary': '#e2e8f0', '--t2-text-primary-rgb': '226, 232, 240',
        '--t2-border-subtle': 'rgba(59,130,246,0.2)', '--t2-on-accent': '#ffffff',
      } as React.CSSProperties
    },
    {
      id: 'amber',
      name: 'Theme 2 — Sandstone',
      cssVars: {
        '--overlay-color-primary': '#b45309', '--overlay-color-primary-rgb': '180, 83, 9',
        '--overlay-color-secondary': '#92400e', '--overlay-color-success': '#22c55e',
        '--overlay-color-danger': '#ef4444', '--overlay-bg-panel': '#2d1a00',
        '--overlay-bg-danger': '#1c0a0a', '--overlay-bg-logo-pill': '#3d2200',
        '--overlay-bg-ticker': '#1a0e00', '--overlay-bg-photo': '#2d1a00',
        '--overlay-bg-photo-fallback': '#1a0e00', '--overlay-bg-fullscreen': '#150b00',
        '--overlay-text-bright': '#fef3c7', '--overlay-text-subtle': '#fde68a',
        '--overlay-text-muted': 'rgba(254,243,199,0.5)', '--overlay-text-dim': 'rgba(254,243,199,0.3)',
        '--overlay-text-dark': '#0d0d0d', '--overlay-border-light': 'rgba(255,255,255,0.08)',
        '--overlay-border-accent-strong': 'rgba(180,83,9,0.4)', '--overlay-border-accent-subtle': 'rgba(180,83,9,0.2)',
        '--t2-accent': '#b45309', '--t2-accent-rgb': '180, 83, 9',
        '--t2-bg-card': '#fef3c7', '--t2-text-primary': '#451a03', '--t2-text-primary-rgb': '69, 26, 3',
        '--t2-border-subtle': 'rgba(180,83,9,0.2)', '--t2-on-accent': '#ffffff',
      } as React.CSSProperties
    },
    {
      id: 'emerald',
      name: 'Theme 2 — Forest',
      cssVars: {
        '--overlay-color-primary': '#059669', '--overlay-color-primary-rgb': '5, 150, 105',
        '--overlay-color-secondary': '#047857', '--overlay-color-success': '#34d399',
        '--overlay-color-danger': '#ef4444', '--overlay-bg-panel': '#064e3b',
        '--overlay-bg-danger': '#1c0a0a', '--overlay-bg-logo-pill': '#065f46',
        '--overlay-bg-ticker': '#022c22', '--overlay-bg-photo': '#064e3b',
        '--overlay-bg-photo-fallback': '#022c22', '--overlay-bg-fullscreen': '#011a14',
        '--overlay-text-bright': '#d1fae5', '--overlay-text-subtle': '#a7f3d0',
        '--overlay-text-muted': 'rgba(209,250,229,0.5)', '--overlay-text-dim': 'rgba(209,250,229,0.3)',
        '--overlay-text-dark': '#0d0d0d', '--overlay-border-light': 'rgba(255,255,255,0.08)',
        '--overlay-border-accent-strong': 'rgba(5,150,105,0.4)', '--overlay-border-accent-subtle': 'rgba(5,150,105,0.25)',
        '--t2-accent': '#059669', '--t2-accent-rgb': '5, 150, 105',
        '--t2-bg-card': '#064e3b', '--t2-text-primary': '#d1fae5', '--t2-text-primary-rgb': '209, 250, 229',
        '--t2-border-subtle': 'rgba(5,150,105,0.3)', '--t2-on-accent': '#ffffff',
      } as React.CSSProperties
    },
    {
      id: 'violet',
      name: 'Theme 2 — Violet Dusk',
      cssVars: {
        '--overlay-color-primary': '#6d28d9', '--overlay-color-primary-rgb': '109, 40, 217',
        '--overlay-color-secondary': '#5b21b6', '--overlay-color-success': '#22c55e',
        '--overlay-color-danger': '#ef4444', '--overlay-bg-panel': '#1e0a3c',
        '--overlay-bg-danger': '#1c0a0a', '--overlay-bg-logo-pill': '#2e1065',
        '--overlay-bg-ticker': '#120526', '--overlay-bg-photo': '#1e0a3c',
        '--overlay-bg-photo-fallback': '#130630', '--overlay-bg-fullscreen': '#0e0420',
        '--overlay-text-bright': '#f5f3ff', '--overlay-text-subtle': '#ede9fe',
        '--overlay-text-muted': 'rgba(237,233,254,0.5)', '--overlay-text-dim': 'rgba(237,233,254,0.3)',
        '--overlay-text-dark': '#0d0d0d', '--overlay-border-light': 'rgba(255,255,255,0.08)',
        '--overlay-border-accent-strong': 'rgba(109,40,217,0.4)', '--overlay-border-accent-subtle': 'rgba(109,40,217,0.2)',
        '--t2-accent': '#6d28d9', '--t2-accent-rgb': '109, 40, 217',
        '--t2-bg-card': '#f5f3ff', '--t2-text-primary': '#2e1065', '--t2-text-primary-rgb': '46, 16, 101',
        '--t2-border-subtle': 'rgba(109,40,217,0.18)', '--t2-on-accent': '#ffffff',
      } as React.CSSProperties
    },
    {
      id: 'coral',
      name: 'Theme 2 — Ember',
      cssVars: {
        '--overlay-color-primary': '#c2410c', '--overlay-color-primary-rgb': '194, 65, 12',
        '--overlay-color-secondary': '#9a3412', '--overlay-color-success': '#22c55e',
        '--overlay-color-danger': '#ef4444', '--overlay-bg-panel': '#431407',
        '--overlay-bg-danger': '#1c0a0a', '--overlay-bg-logo-pill': '#5c1c08',
        '--overlay-bg-ticker': '#2a0c04', '--overlay-bg-photo': '#431407',
        '--overlay-bg-photo-fallback': '#2a0c04', '--overlay-bg-fullscreen': '#1e0903',
        '--overlay-text-bright': '#fff7ed', '--overlay-text-subtle': '#fed7aa',
        '--overlay-text-muted': 'rgba(255,247,237,0.5)', '--overlay-text-dim': 'rgba(255,247,237,0.3)',
        '--overlay-text-dark': '#0d0d0d', '--overlay-border-light': 'rgba(255,255,255,0.08)',
        '--overlay-border-accent-strong': 'rgba(194,65,12,0.5)', '--overlay-border-accent-subtle': 'rgba(194,65,12,0.3)',
        '--t2-accent': '#c2410c', '--t2-accent-rgb': '194, 65, 12',
        '--t2-bg-card': '#431407', '--t2-text-primary': '#fff7ed', '--t2-text-primary-rgb': '255, 247, 237',
        '--t2-border-subtle': 'rgba(194,65,12,0.4)', '--t2-on-accent': '#ffffff',
      } as React.CSSProperties
    },
    {
      id: 'crimson',
      name: 'Theme 2 — Crimson',
      cssVars: {
        '--overlay-color-primary': '#be123c', '--overlay-color-primary-rgb': '190, 18, 60',
        '--overlay-color-secondary': '#9f1239', '--overlay-color-success': '#22c55e',
        '--overlay-color-danger': '#ef4444', '--overlay-bg-panel': '#1c0a10',
        '--overlay-bg-danger': '#1c0a0a', '--overlay-bg-logo-pill': '#4c0519',
        '--overlay-bg-ticker': '#110208', '--overlay-bg-photo': '#1c0a10',
        '--overlay-bg-photo-fallback': '#12040a', '--overlay-bg-fullscreen': '#0e0308',
        '--overlay-text-bright': '#fff1f2', '--overlay-text-subtle': '#fecdd3',
        '--overlay-text-muted': 'rgba(254,205,211,0.5)', '--overlay-text-dim': 'rgba(254,205,211,0.3)',
        '--overlay-text-dark': '#0d0d0d', '--overlay-border-light': 'rgba(255,255,255,0.08)',
        '--overlay-border-accent-strong': 'rgba(190,18,60,0.4)', '--overlay-border-accent-subtle': 'rgba(190,18,60,0.2)',
        '--t2-accent': '#be123c', '--t2-accent-rgb': '190, 18, 60',
        '--t2-bg-card': '#fff1f2', '--t2-text-primary': '#881337', '--t2-text-primary-rgb': '136, 19, 55',
        '--t2-border-subtle': 'rgba(190,18,60,0.2)', '--t2-on-accent': '#ffffff',
      } as React.CSSProperties
    },
  ],
};
