'use client';

import React, { useEffect, useState, type ReactNode } from 'react';

export const THEME3_CANVAS_WIDTH = 1920;
export const THEME3_CANVAS_HEIGHT = 1080;

interface Theme3CanvasProps {
  children: ReactNode;
  /** Transparent for custom overlay; defaults to theme gradient */
  transparent?: boolean;
}

/** Fixed 1920×1080 overlay canvas, scaled to fit the browser viewport (OBS-safe). */
export function Theme3Canvas({ children, transparent = false }: Theme3CanvasProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      setScale(
        Math.min(
          window.innerWidth / THEME3_CANVAS_WIDTH,
          window.innerHeight / THEME3_CANVAS_HEIGHT,
        ),
      );
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: transparent ? 'transparent' : 'var(--t3-gradient-canvas, var(--overlay-bg-fullscreen))',
      }}
    >
      <div
        style={{
          width: THEME3_CANVAS_WIDTH,
          height: THEME3_CANVAS_HEIGHT,
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          background: transparent ? 'transparent' : 'var(--t3-gradient-canvas, var(--overlay-bg-fullscreen))',
          overflow: 'hidden',
          boxSizing: 'border-box',

        }}
      >
        {children}
      </div>
    </div>
  );
}
