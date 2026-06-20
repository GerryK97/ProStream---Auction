'use client';

import React from 'react';
import { PLAYER_BAR_T3_TOP_RAIL_HEIGHT } from './theme3Layout';

/** Stacked top rail bands — bright catch-light, primary stripe, accent stripe. */
const TOP_RAIL_BANDS = [
  { height: 2, token: '--t3-bar-rail-bright' },
  { height: 4, token: '--t3-bar-rail' },
  { height: 3, token: '--t3-bar-rail-secondary' },
] as const;

interface PlayerBarBackgroundT3Props {
  /** Pulse/drift the primary skew highlight during live bidding */
  animateSkew?: boolean;
  reducedMotion?: boolean;
}

/** Ticker-aligned layered background — CSS-only, OBS-safe. */
export function PlayerBarBackgroundT3({
  animateSkew = false,
  reducedMotion = false,
}: PlayerBarBackgroundT3Props) {
  const skewActive = animateSkew && !reducedMotion;

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
        }
        .t3-bar-bg-skew-a {
          left: 42%;
          opacity: 0.5;
          background: var(--t3-bar-highlight, var(--t3-action-primary-hover));
        }
        .t3-bar-bg-skew-b {
          left: 62%;
          opacity: 0.35;
          width: 28%;
          background: var(--t3-bar-gold-soft, var(--t3-accent-soft));
        }
        @keyframes t3BarSkewPulse {
          0%, 100% {
            opacity: 0.42;
            transform: skewX(-18deg) translateX(0);
          }
          50% {
            opacity: 0.78;
            transform: skewX(-18deg) translateX(18px);
          }
        }
        .t3-bar-bg-skew-a-active {
          animation: t3BarSkewPulse 2.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .t3-bar-bg-skew-a-active { animation: none !important; }
        }
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
        {/* Accent base — matches ticker accent rail */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--t3-bar-bg-deep, var(--t3-accent))',
          }}
        />
        {/* Top fade — matches ticker gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div className={`t3-bar-bg-skew-a${skewActive ? ' t3-bar-bg-skew-a-active' : ''}`} />
        <div className="t3-bar-bg-skew-b" />
        {/* Edge vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(
              90deg,
              var(--t3-bar-vignette, rgba(0,0,0,0.35)) 0%,
              transparent 18%,
              transparent 82%,
              var(--t3-bar-vignette, rgba(0,0,0,0.35)) 100%
            )`,
          }}
        />
        {/* Stacked top rails */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: PLAYER_BAR_T3_TOP_RAIL_HEIGHT,
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {TOP_RAIL_BANDS.map(({ height, token }) => (
            <div
              key={token}
              style={{
                width: '100%',
                height,
                flexShrink: 0,
                background: `var(${token})`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default PlayerBarBackgroundT3;
