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
      } as React.CSSProperties
    },
    {
      id: 'ocean',
      name: 'Deep Ocean (Cyan/Blue)',
      cssVars: {
        '--overlay-color-primary': '#06b6d4', /* Cyan 500 */
        '--overlay-color-primary-rgb': '6, 182, 212',
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
      } as React.CSSProperties
    },
    {
      id: 'crimson',
      name: 'Crimson Night (Red/Black)',
      cssVars: {
        '--overlay-color-primary': '#f43f5e', /* Rose 500 */
        '--overlay-color-primary-rgb': '244, 63, 94',
        '--overlay-color-success': '#00C54C',
        '--overlay-color-danger': '#ef4444', 
        '--overlay-bg-panel': 'linear-gradient(135deg, #1a0505, #4d0a0a)',
        '--overlay-bg-danger': 'linear-gradient(135deg, #1a0808, #2d0f0f)',
        '--overlay-bg-logo-pill': 'linear-gradient(270deg, #be123c 0%, #881337 74%)',
        '--overlay-bg-ticker': 'rgba(20,5,5,0.92)',
        '--overlay-bg-photo': '#240a0a',
        '--overlay-bg-photo-fallback': '#1a0505',
        '--overlay-bg-fullscreen': 'linear-gradient(160deg, #0a0505 0%, #1a0a0a 60%, #120505 100%)',
        '--overlay-text-bright': '#ffffff',
        '--overlay-text-subtle': '#fecdd3', /* Rose 200 */
        '--overlay-text-muted': 'rgba(255,255,255,0.45)',
        '--overlay-text-dim': 'rgba(255,255,255,0.28)',
        '--overlay-text-dark': '#0d0d0d',
        '--overlay-border-light': 'rgba(255,255,255,0.15)',
        '--overlay-border-accent-strong': 'rgba(244,63,94,0.4)',
        '--overlay-border-accent-subtle': 'rgba(244,63,94,0.22)',
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
  neon: []
};
