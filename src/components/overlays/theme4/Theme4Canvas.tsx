'use client';

import React, { useEffect, useState, type ReactNode } from 'react';

export const THEME4_CANVAS_WIDTH = 1920;
export const THEME4_CANVAS_HEIGHT = 1080;

interface Theme4CanvasProps {
  children: ReactNode;
  /** Transparent for custom overlay; defaults to theme gradient */
  transparent?: boolean;
}

/**
 * Fixed 1920×1080 overlay canvas, scaled to fit the browser viewport.
 * OBS: set Browser Source to 1920×1080 so scale stays 1 (sharpest text/edges).
 */
export function Theme4Canvas({ children, transparent = false }: Theme4CanvasProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const raw = Math.min(
        window.innerWidth / THEME4_CANVAS_WIDTH,
        window.innerHeight / THEME4_CANVAS_HEIGHT,
      );
      // Snap near-1.0 to exact 1 — avoids subpixel blur in OBS at native size
      const next = Math.abs(raw - 1) < 0.02 ? 1 : Math.round(raw * 1000) / 1000;
      setScale(next);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const bg = transparent
    ? 'transparent'
    : 'var(--t4-gradient-canvas, var(--overlay-bg-fullscreen))';

  return (
    <div
      data-t4-element="canvas-viewport"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: bg,
        // Pass-through empty letterbox; scaled canvas children opt into hits
        pointerEvents: 'none',
      }}
    >
      <div
        data-t4-element="canvas-1920x1080"
        data-t4-label="Theme 4 Canvas 1920×1080"
        style={{
          width: THEME4_CANVAS_WIDTH,
          height: THEME4_CANVAS_HEIGHT,
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: 'top left',
          // Skip transform entirely at 1:1 for crisp OBS rendering
          transform: scale === 1 ? undefined : `scale(${scale})`,
          background: bg,
          overflow: 'hidden',
          boxSizing: 'border-box',
          // Pass-through shell — children with pointer-events:auto are pickable
          pointerEvents: 'none',
          // Broadcast clarity
          textRendering: 'geometricPrecision',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        {children}
      </div>
    </div>
  );
}
