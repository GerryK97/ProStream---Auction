'use client';

import React from 'react';
import type { Player, Tournament } from '@/types';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import { formatT4Amount } from './frame15PlayerCardT4Layout';

const LABEL_FONT = 'var(--t4-font-label, "Oswald", "Arial Narrow", sans-serif)';
const NAME_FONT = 'var(--t4-font-name, "Bebas Neue", "Oswald", Impact, sans-serif)';
const DANGER = 'var(--t4-danger, #E85A5A)';

export interface UnsoldDetailsSectionT4Props {
  currentPlayer: Player;
  tournament: Tournament | null;
  reducedMotion?: boolean;
}

/**
 * Theme 4 Full Screen unsold reveal — large stamp + struck base price.
 * Fills the profile area so the outcome is broadcast-readable (OBS).
 */
export function UnsoldDetailsSectionT4({
  currentPlayer,
  tournament,
  reducedMotion = false,
}: UnsoldDetailsSectionT4Props) {
  const basePrice = getClassBasePrice(tournament, currentPlayer);
  const baseFormatted = formatT4Amount(basePrice);

  return (
    <>
      <style>{`
        @keyframes t4UnsoldEnter {
          0% {
            opacity: 0;
            transform: scale(0.86) translateY(32px);
          }
          55% {
            opacity: 1;
            transform: scale(1.04) translateY(-4px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes t4UnsoldStamp {
          0% {
            opacity: 0;
            transform: rotate(-22deg) scale(2.35);
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
        @keyframes t4UnsoldPulse {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(232, 90, 90, 0.42),
              0 8px 32px rgba(0, 0, 0, 0.5);
          }
          50% {
            box-shadow:
              0 0 0 14px rgba(232, 90, 90, 0.08),
              0 8px 40px rgba(232, 90, 90, 0.35);
          }
        }
        @keyframes t4UnsoldShine {
          0% { transform: translateX(-130%) skewX(-16deg); opacity: 0; }
          35% { opacity: 0.4; }
          100% { transform: translateX(230%) skewX(-16deg); opacity: 0; }
        }
        @keyframes t4UnsoldPriceIn {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .t4-unsold-enter {
          animation: t4UnsoldEnter 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .t4-unsold-stamp {
          animation: t4UnsoldStamp 0.6s cubic-bezier(0.23, 1, 0.32, 1) both;
        }
        .t4-unsold-pulse {
          animation: t4UnsoldPulse 1.5s ease-in-out infinite;
        }
        .t4-unsold-shine {
          animation: t4UnsoldShine 1s ease-out 0.2s both;
        }
        .t4-unsold-price-in {
          animation: t4UnsoldPriceIn 0.4s ease-out 0.2s both;
        }
        @media (prefers-reduced-motion: reduce) {
          .t4-unsold-enter,
          .t4-unsold-stamp,
          .t4-unsold-pulse,
          .t4-unsold-shine,
          .t4-unsold-price-in {
            animation: none !important;
          }
        }
      `}</style>

      <div
        data-t4-element="unsold-details"
        className={reducedMotion ? undefined : 't4-unsold-enter'}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 28,
          padding: '12px 0 8px',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div
            className={[
              reducedMotion ? '' : 't4-unsold-stamp',
              reducedMotion ? '' : 't4-unsold-pulse',
            ]
              .filter(Boolean)
              .join(' ') || undefined}
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '20px 48px',
              borderRadius: 8,
              background:
                'linear-gradient(135deg, #4A1818 0%, #2A0E0E 48%, #3D1414 100%)',
              border: `3px solid ${DANGER}`,
              boxShadow:
                '0 0 0 1px rgba(212,175,55,0.2), 0 10px 36px rgba(0,0,0,0.5)',
              transform: reducedMotion ? 'rotate(-8deg)' : undefined,
            }}
          >
            {!reducedMotion && (
              <div
                className="t4-unsold-shine"
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: '0 auto 0 -20%',
                  width: '38%',
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
                  pointerEvents: 'none',
                }}
              />
            )}
            <span
              style={{
                position: 'relative',
                fontFamily: NAME_FONT,
                fontSize: 96,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: DANGER,
                lineHeight: 0.9,
                textShadow: '0 0 28px rgba(232,90,90,0.55), 0 4px 14px rgba(0,0,0,0.55)',
              }}
            >
              Unsold
            </span>
          </div>
        </div>

        <div className={reducedMotion ? undefined : 't4-unsold-price-in'}>
          <div
            style={{
              fontFamily: LABEL_FONT,
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(243,226,160,0.65)',
              marginBottom: 12,
            }}
          >
            Returned to pool
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: LABEL_FONT,
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Base
            </span>
            <span
              style={{
                fontFamily: LABEL_FONT,
                fontSize: 108,
                fontWeight: 700,
                lineHeight: 0.9,
                color: 'rgba(255,255,255,0.4)',
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

export default UnsoldDetailsSectionT4;
