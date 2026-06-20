'use client';

import React from 'react';
import { PLAYER_BAR_T3_BID_WIDTH, PLAYER_BAR_T3_HEIGHT } from './theme3Layout';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';

interface SoldDetailsSectionT3Props {
  reducedMotion?: boolean;
  barHeight?: number;
  bidPanelWidth?: number;
}

/** Bar overlay — animated SOLD stamp during soldReveal (photo + identity + details). */
export function SoldDetailsSectionT3({
  reducedMotion = false,
  barHeight = PLAYER_BAR_T3_HEIGHT,
  bidPanelWidth = PLAYER_BAR_T3_BID_WIDTH,
}: SoldDetailsSectionT3Props) {
  const textSize = Math.round(barHeight * 0.88);
  const stampClass = reducedMotion
    ? 't3-sold-details-static'
    : 'animate-stamp-seal t3-sold-details-glow';

  return (
    <>
      <style>{`
        @keyframes t3SoldDetailsGlow {
          0%, 100% {
            text-shadow: 0 0 12px rgba(110,196,154,0.35), 0 2px 8px rgba(0,0,0,0.4);
          }
          50% {
            text-shadow: 0 0 28px rgba(110,196,154,0.75), 0 0 12px rgba(110,196,154,0.45), 0 2px 10px rgba(0,0,0,0.5);
          }
        }
        @keyframes t3SoldDetailsSwing {
          0%, 100% { transform: translateX(90px); }
          50%      { transform: translateX(-90px); }
        }
        .t3-sold-details-glow {
          animation: t3SoldDetailsGlow 1.6s ease-in-out 0.55s infinite;
        }
        .t3-sold-details-swing {
          animation: t3SoldDetailsSwing 2.6s ease-in-out 0.55s infinite;
          will-change: transform;
        }
        .t3-sold-details-static {
          animation: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .t3-sold-details-glow,
          .t3-sold-details-swing {
            animation: none !important;
          }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: bidPanelWidth,
          top: 0,
          bottom: 0,
          zIndex: 6,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        <div
          className={reducedMotion ? undefined : 't3-sold-details-swing'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <span
            className={stampClass}
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: textSize,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--t3-success, #6EC49A)',
              lineHeight: 0.88,
              transform: reducedMotion ? 'rotate(-6deg)' : undefined,
              display: 'inline-block',
              whiteSpace: 'nowrap',
            }}
          >
            SOLD
          </span>
        </div>
      </div>
    </>
  );
}

export default SoldDetailsSectionT3;
