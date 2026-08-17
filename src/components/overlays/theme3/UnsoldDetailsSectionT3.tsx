'use client';

import React from 'react';
import type { Tournament } from '@/types';
import type { Player } from '@/types';
import { getClassBasePrice } from '@/lib/playerClassUtils';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';
const DANGER = 'var(--t3-danger, #D87070)';

export interface UnsoldDetailsSectionT3Props {
  currentPlayer: Player;
  tournament: Tournament | null;
  reducedMotion?: boolean;
}

/**
 * Theme 3 Full Screen unsold reveal — large stamp + base-price strike.
 * Fills the profile area so the outcome is broadcast-readable (OBS).
 */
export function UnsoldDetailsSectionT3({
  currentPlayer,
  tournament,
  reducedMotion = false,
}: UnsoldDetailsSectionT3Props) {
  const basePrice = getClassBasePrice(tournament, currentPlayer);
  const baseFormatted = basePrice.toLocaleString('en-IN');

  return (
    <>
      <style>{`
        @keyframes t3UnsoldEnter {
          0% {
            opacity: 0;
            transform: scale(0.82) translateY(36px);
          }
          55% {
            opacity: 1;
            transform: scale(1.05) translateY(-6px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes t3UnsoldStamp {
          0% {
            opacity: 0;
            transform: rotate(-22deg) scale(2.4);
          }
          55% {
            opacity: 1;
            transform: rotate(-10deg) scale(0.92);
          }
          75% {
            transform: rotate(-8deg) scale(1.06);
          }
          100% {
            opacity: 1;
            transform: rotate(-8deg) scale(1);
          }
        }
        @keyframes t3UnsoldPulse {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(216, 112, 112, 0.4),
              0 8px 32px rgba(0, 0, 0, 0.45);
          }
          50% {
            box-shadow:
              0 0 0 16px rgba(216, 112, 112, 0.08),
              0 8px 40px rgba(216, 112, 112, 0.35);
          }
        }
        @keyframes t3UnsoldShine {
          0% { transform: translateX(-130%) skewX(-16deg); opacity: 0; }
          35% { opacity: 0.45; }
          100% { transform: translateX(230%) skewX(-16deg); opacity: 0; }
        }
        @keyframes t3UnsoldPriceIn {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .t3-unsold-enter {
          animation: t3UnsoldEnter 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .t3-unsold-stamp {
          animation: t3UnsoldStamp 0.6s cubic-bezier(0.23, 1, 0.32, 1) both;
        }
        .t3-unsold-pulse {
          animation: t3UnsoldPulse 1.5s ease-in-out infinite;
        }
        .t3-unsold-shine {
          animation: t3UnsoldShine 1s ease-out 0.2s both;
        }
        .t3-unsold-price-in {
          animation: t3UnsoldPriceIn 0.4s ease-out 0.2s both;
        }
        @media (prefers-reduced-motion: reduce) {
          .t3-unsold-enter,
          .t3-unsold-stamp,
          .t3-unsold-pulse,
          .t3-unsold-shine,
          .t3-unsold-price-in {
            animation: none !important;
          }
        }
      `}</style>

      <div
        data-t3-element="unsold-details"
        className={reducedMotion ? undefined : 't3-unsold-enter'}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 32,
          padding: '8px 0 12px',
          pointerEvents: 'none',
        }}
      >
        {/* UNSOLD stamp */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div
            className={[
              reducedMotion ? '' : 't3-unsold-stamp',
              reducedMotion ? '' : 't3-unsold-pulse',
            ]
              .filter(Boolean)
              .join(' ') || undefined}
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '22px 52px',
              borderRadius: 8,
              background:
                'linear-gradient(135deg, #4A1515 0%, #2A0C0C 48%, #3D1212 100%)',
              border: `4px solid ${DANGER}`,
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.12), 0 10px 36px rgba(0,0,0,0.5)',
              transform: reducedMotion ? 'rotate(-8deg)' : undefined,
            }}
          >
            {!reducedMotion && (
              <div
                className="t3-unsold-shine"
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: '0 auto 0 -20%',
                  width: '38%',
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  pointerEvents: 'none',
                }}
              />
            )}
            <span
              style={{
                position: 'relative',
                fontFamily: DISPLAY_FONT,
                fontSize: 108,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: DANGER,
                lineHeight: 0.88,
                textShadow: '0 0 28px rgba(216,112,112,0.55), 0 4px 14px rgba(0,0,0,0.55)',
              }}
            >
              Unsold
            </span>
          </div>
        </div>

        {/* Status copy + base price */}
        <div className={reducedMotion ? undefined : 't3-unsold-price-in'}>
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
              marginBottom: 12,
            }}
          >
            Returned to pool
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 18,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              Base
            </span>
            <span
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 96,
                fontWeight: 800,
                lineHeight: 0.9,
                color: 'rgba(255,255,255,0.42)',
                textDecoration: 'line-through',
                textDecorationThickness: 4,
                textShadow: '0 2px 12px rgba(0,0,0,0.45)',
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

export default UnsoldDetailsSectionT3;
