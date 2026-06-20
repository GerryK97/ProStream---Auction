'use client';

import React, { useEffect, useState } from 'react';

interface TeamWiseImageBackgroundT3Props {
  /** Pattern panel height in px (leaves bottom accent strip visible). */
  height: number;
  reducedMotion?: boolean;
}

/** Layered abstract panel background for TeamWiseImageT3 — CSS-only, OBS-safe. */
export function TeamWiseImageBackgroundT3({
  height,
  reducedMotion: reducedMotionProp,
}: TeamWiseImageBackgroundT3Props) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setPrefersReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const reducedMotion = reducedMotionProp ?? prefersReducedMotion;
  const skewActive = !reducedMotion;

  return (
    <>
      <style>{`
        .twi-bg-skew-a,
        .twi-bg-skew-b {
          position: absolute;
          pointer-events: none;
          top: -15%;
          height: 130%;
          transform: skewX(-16deg);
        }
        .twi-bg-skew-a {
          left: 38%;
          width: 34%;
          opacity: 0.22;
          background: var(--t3-bar-highlight, var(--t3-action-primary-hover));
        }
        .twi-bg-skew-b {
          left: 58%;
          width: 26%;
          opacity: 0.14;
          background: var(--t3-accent-soft, rgba(0,137,140,0.14));
        }
        @keyframes twiBgSkewDrift {
          0%, 100% {
            transform: skewX(-16deg) translateX(0);
            opacity: 0.18;
          }
          50% {
            transform: skewX(-16deg) translateX(24px);
            opacity: 0.28;
          }
        }
        .twi-bg-skew-a-active {
          animation: twiBgSkewDrift 10s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .twi-bg-skew-a-active { animation: none !important; }
        }
      `}</style>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Bottom accent strip — visible below pattern panel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(
              180deg,
              var(--t3-accent, #00898c) 0%,
              color-mix(in srgb, var(--t3-accent, #00898c) 72%, #0A1A22) 100%
            )`,
          }}
        />

        {/* Pattern panel — covers top 98.5% */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height,
            overflow: 'hidden',
          }}
        >
          {/* Base gradient */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(
                145deg,
                var(--t3-bg-panel, #202020) 0%,
                #0E2228 45%,
                #0A1A22 100%
              )`,
            }}
          />

          {/* Accent tint wash */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(
                120deg,
                rgba(var(--t3-accent-rgb, 0,137,140), 0.08) 0%,
                transparent 55%,
                rgba(var(--t3-accent-rgb, 0,137,140), 0.05) 100%
              )`,
            }}
          />

          {/* Skew accent bands */}
          <div className={`twi-bg-skew-a${skewActive ? ' twi-bg-skew-a-active' : ''}`} />
          <div className="twi-bg-skew-b" />

          {/* Dot grid */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `radial-gradient(
                circle,
                rgba(255,255,255,0.05) 1px,
                transparent 1px
              )`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Corner glows */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse 55% 45% at 92% 8%, rgba(var(--t3-accent-rgb, 0,137,140), 0.14) 0%, transparent 70%),
                radial-gradient(ellipse 45% 40% at 6% 92%, rgba(var(--t3-accent-rgb, 0,137,140), 0.10) 0%, transparent 65%)
              `,
            }}
          />

          {/* Edge vignette */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(
                90deg,
                rgba(0,0,0,0.42) 0%,
                transparent 14%,
                transparent 86%,
                rgba(0,0,0,0.42) 100%
              ),
              linear-gradient(
                180deg,
                rgba(0,0,0,0.28) 0%,
                transparent 22%,
                transparent 88%,
                rgba(0,0,0,0.35) 100%
              )`,
            }}
          />
        </div>
      </div>
    </>
  );
}

export default TeamWiseImageBackgroundT3;
