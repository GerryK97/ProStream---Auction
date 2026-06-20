'use client';

import React from 'react';

/** Champion-style layered background — CSS-only, OBS-safe. */
export function PlayerBarBackgroundT3() {
  return (
    <>
      <style>{`
        .t3-bar-bg-skew-a,
        .t3-bar-bg-skew-b {
          position: absolute;
          pointer-events: none;
          top: -20%;
          height: 140%;
          width: 38%;
          transform: skewX(-18deg);
          background: var(--t3-bar-gold-soft, rgba(237,169,0,0.18));
        }
        .t3-bar-bg-skew-a { left: 42%; opacity: 0.55; }
        .t3-bar-bg-skew-b { left: 62%; opacity: 0.35; width: 28%; }
      `}</style>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {/* Base navy gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(
              100deg,
              var(--t3-bar-bg-deep, #002145) 0%,
              var(--t3-bar-bg-dark, #1f1f1f) 55%,
              var(--t3-bar-bg-deep, #002145) 100%
            )`,
          }}
        />
        <div className="t3-bar-bg-skew-a" />
        <div className="t3-bar-bg-skew-b" />
        {/* Edge vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(
              90deg,
              var(--t3-bar-vignette, rgba(0,0,0,0.55)) 0%,
              transparent 18%,
              transparent 82%,
              var(--t3-bar-vignette, rgba(0,0,0,0.55)) 100%
            )`,
          }}
        />
        {/* Top gold rail */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'var(--t3-bar-gold, #eda900)',
            zIndex: 2,
          }}
        />
      </div>
    </>
  );
}

export default PlayerBarBackgroundT3;
