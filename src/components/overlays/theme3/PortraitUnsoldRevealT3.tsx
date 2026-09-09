'use client';

import React from 'react';
import type { Player, Tournament } from '@/types';
import { getClassBasePrice } from '@/lib/playerClassUtils';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';
const DANGER = 'var(--t3-danger, #D87070)';

export interface PortraitUnsoldRevealT3Props {
  currentPlayer: Player;
  tournament: Tournament | null;
  reducedMotion?: boolean;
}

/**
 * Theme 3 Custom overlay — large (portrait) card unsold reveal.
 *
 * Sized for the 352×400 photo area of the portrait card, so it reads the same
 * way the Full Screen unsold reveal does without overflowing the smaller card.
 * Stamp slams in, pulses, sweeps a shine, then the struck-through base price
 * rises underneath it.
 */
export function PortraitUnsoldRevealT3({
  currentPlayer,
  tournament,
  reducedMotion = false,
}: PortraitUnsoldRevealT3Props) {
  const basePrice = getClassBasePrice(tournament, currentPlayer);
  const baseFormatted = basePrice.toLocaleString('en-IN');

  return (
    <>
      <style>{`
        @keyframes t3PortraitUnsoldScrim {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes t3PortraitUnsoldStamp {
          0%   { opacity: 0; transform: rotate(-24deg) scale(2.6); }
          55%  { opacity: 1; transform: rotate(-10deg) scale(0.92); }
          75%  { transform: rotate(-8deg) scale(1.05); }
          100% { opacity: 1; transform: rotate(-8deg) scale(1); }
        }
        @keyframes t3PortraitUnsoldPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(216,112,112,0.42), 0 8px 26px rgba(0,0,0,0.45);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(216,112,112,0.07), 0 8px 32px rgba(216,112,112,0.32);
          }
        }
        @keyframes t3PortraitUnsoldShine {
          0%   { transform: translateX(-140%) skewX(-16deg); opacity: 0; }
          35%  { opacity: 0.5; }
          100% { transform: translateX(240%) skewX(-16deg); opacity: 0; }
        }
        @keyframes t3PortraitUnsoldSubIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .t3pu-scrim  { animation: t3PortraitUnsoldScrim 260ms ease-out both; }
        .t3pu-stamp  { animation: t3PortraitUnsoldStamp 600ms cubic-bezier(0.23,1,0.32,1) both,
                                  t3PortraitUnsoldPulse 1.5s ease-in-out 600ms infinite; }
        .t3pu-shine  { animation: t3PortraitUnsoldShine 1s ease-out 220ms both; }
        .t3pu-sub    { animation: t3PortraitUnsoldSubIn 420ms ease-out 260ms both; }
        @media (prefers-reduced-motion: reduce) {
          .t3pu-scrim, .t3pu-stamp, .t3pu-shine, .t3pu-sub { animation: none !important; }
        }
      `}</style>

      <div
        data-t3-element="portrait-unsold-reveal"
        className={reducedMotion ? undefined : 't3pu-scrim'}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          pointerEvents: 'none',
          zIndex: 10,
          background:
            'radial-gradient(ellipse 78% 62% at 50% 46%, rgba(74,21,21,0.62) 0%, rgba(0,0,0,0.68) 100%)',
        }}
      >
        {/* UNSOLD stamp */}
        <div
          className={reducedMotion ? undefined : 't3pu-stamp'}
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '10px 30px',
            borderRadius: 6,
            background: 'linear-gradient(135deg, #4A1515 0%, #2A0C0C 48%, #3D1212 100%)',
            border: `3px solid ${DANGER}`,
            boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 8px 26px rgba(0,0,0,0.5)',
            transform: 'rotate(-8deg)',
          }}
        >
          {!reducedMotion && (
            <div
              className="t3pu-shine"
              aria-hidden
              style={{
                position: 'absolute',
                inset: '0 auto 0 -20%',
                width: '38%',
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent)',
                pointerEvents: 'none',
              }}
            />
          )}
          <span
            style={{
              position: 'relative',
              fontFamily: DISPLAY_FONT,
              fontSize: 62,
              fontWeight: 800,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              color: DANGER,
              lineHeight: 0.88,
              textShadow:
                '0 0 22px rgba(216,112,112,0.55), 0 3px 12px rgba(0,0,0,0.55)',
            }}
          >
            Unsold
          </span>
        </div>

        {/* Returned to pool + struck base price */}
        <div
          className={reducedMotion ? undefined : 't3pu-sub'}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.62)',
            }}
          >
            Returned to Pool
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.42)',
              }}
            >
              Base
            </span>
            <span
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 0.9,
                color: 'rgba(255,255,255,0.5)',
                textDecoration: 'line-through',
                textDecorationThickness: 3,
                textShadow: '0 2px 10px rgba(0,0,0,0.45)',
                whiteSpace: 'nowrap',
              }}
            >
              {baseFormatted}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default PortraitUnsoldRevealT3;
