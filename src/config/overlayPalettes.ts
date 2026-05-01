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
      name: 'Theme 2 — Slate & White',
      cssVars: {
        '--overlay-color-primary': '#f8fafc',
        '--overlay-color-primary-rgb': '248, 250, 252',
        '--overlay-color-secondary': '#cbd5e1',
        '--overlay-color-success': '#22c55e',
        '--overlay-color-danger': '#ef4444',
        '--overlay-bg-panel': '#111827',
        '--overlay-bg-danger': '#1c0a0a',
        '--overlay-bg-logo-pill': '#1e293b',
        '--overlay-bg-ticker': '#0a0d12',
        '--overlay-bg-photo': '#0f172a',
        '--overlay-bg-photo-fallback': '#0d1117',
        '--overlay-bg-fullscreen': '#0d1117',
        '--overlay-text-bright': '#f8fafc',
        '--overlay-text-subtle': '#e2e8f0',
        '--overlay-text-muted': 'rgba(226,232,240,0.5)',
        '--overlay-text-dim': 'rgba(226,232,240,0.3)',
        '--overlay-text-dark': '#0d0d0d',
        '--overlay-border-light': 'rgba(255,255,255,0.08)',
        '--overlay-border-accent-strong': 'rgba(248,250,252,0.3)',
        '--overlay-border-accent-subtle': 'rgba(248,250,252,0.12)',
      } as React.CSSProperties
    },
    {
      id: 'teal',
      name: 'Theme 2 — Teal',
      cssVars: {
        '--overlay-color-primary': '#2dd4bf',
        '--overlay-color-primary-rgb': '45, 212, 191',
        '--overlay-color-secondary': '#14b8a6',
        '--overlay-color-success': '#22c55e',
        '--overlay-color-danger': '#ef4444',
        '--overlay-bg-panel': '#0f1f1e',
        '--overlay-bg-danger': '#1c0a0a',
        '--overlay-bg-logo-pill': '#0d1f1e',
        '--overlay-bg-ticker': '#090f0f',
        '--overlay-bg-photo': '#0a1a19',
        '--overlay-bg-photo-fallback': '#070e0e',
        '--overlay-bg-fullscreen': '#080e0e',
        '--overlay-text-bright': '#f0fdfc',
        '--overlay-text-subtle': '#ccfbf1',
        '--overlay-text-muted': 'rgba(204,251,241,0.5)',
        '--overlay-text-dim': 'rgba(204,251,241,0.3)',
        '--overlay-text-dark': '#042f2e',
        '--overlay-border-light': 'rgba(255,255,255,0.08)',
        '--overlay-border-accent-strong': 'rgba(45,212,191,0.3)',
        '--overlay-border-accent-subtle': 'rgba(45,212,191,0.12)',
      } as React.CSSProperties
    },
    {
      id: 'violet',
      name: 'Theme 2 — Violet',
      cssVars: {
        '--overlay-color-primary': '#a78bfa',
        '--overlay-color-primary-rgb': '167, 139, 250',
        '--overlay-color-secondary': '#7c3aed',
        '--overlay-color-success': '#22c55e',
        '--overlay-color-danger': '#ef4444',
        '--overlay-bg-panel': '#130f1e',
        '--overlay-bg-danger': '#1c0a0a',
        '--overlay-bg-logo-pill': '#180f2b',
        '--overlay-bg-ticker': '#0c0910',
        '--overlay-bg-photo': '#100c1a',
        '--overlay-bg-photo-fallback': '#0c0914',
        '--overlay-bg-fullscreen': '#0a0810',
        '--overlay-text-bright': '#faf5ff',
        '--overlay-text-subtle': '#ede9fe',
        '--overlay-text-muted': 'rgba(237,233,254,0.5)',
        '--overlay-text-dim': 'rgba(237,233,254,0.3)',
        '--overlay-text-dark': '#2e1065',
        '--overlay-border-light': 'rgba(255,255,255,0.08)',
        '--overlay-border-accent-strong': 'rgba(167,139,250,0.3)',
        '--overlay-border-accent-subtle': 'rgba(167,139,250,0.12)',
      } as React.CSSProperties
    },
  ],
};
