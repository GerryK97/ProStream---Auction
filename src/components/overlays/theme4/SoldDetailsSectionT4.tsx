'use client';

import React from 'react';
import type { Team } from '@/types';
import ResilientImage from '../shared/ResilientImage';
import { formatT4Amount } from './frame15PlayerCardT4Layout';

const LABEL_FONT = 'var(--t4-font-label, "Oswald", "Arial Narrow", sans-serif)';
const NAME_FONT = 'var(--t4-font-name, "Bebas Neue", "Oswald", Impact, sans-serif)';
const GOLD = 'var(--t4-bid-gold, #D4AF37)';
const SUCCESS = 'var(--t4-success, #6EC49A)';

export interface SoldDetailsSectionT4Props {
  soldTeam?: Team | null;
  soldPrice?: number;
  reducedMotion?: boolean;
}

function teamInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

/**
 * Theme 4 Full Screen sold reveal — large, highlighted SOLD + price + team.
 * Fills the profile area so the sale is broadcast-readable (OBS).
 */
export function SoldDetailsSectionT4({
  soldTeam,
  soldPrice,
  reducedMotion = false,
}: SoldDetailsSectionT4Props) {
  const amount = formatT4Amount(soldPrice ?? 0);

  return (
    <>
      <style>{`
        @keyframes t4SoldEnter {
          0% {
            opacity: 0;
            transform: scale(0.88) translateY(28px);
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
        @keyframes t4SoldBadgePulse {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(110, 196, 154, 0.45),
              0 0 28px rgba(212, 175, 55, 0.35);
          }
          50% {
            box-shadow:
              0 0 0 14px rgba(110, 196, 154, 0.08),
              0 0 40px rgba(212, 175, 55, 0.55);
          }
        }
        @keyframes t4SoldShine {
          0% { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
          30% { opacity: 0.55; }
          100% { transform: translateX(220%) skewX(-18deg); opacity: 0; }
        }
        @keyframes t4SoldPricePop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .t4-sold-enter {
          animation: t4SoldEnter 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .t4-sold-badge-pulse {
          animation: t4SoldBadgePulse 1.5s ease-in-out infinite;
        }
        .t4-sold-shine {
          animation: t4SoldShine 1.1s ease-out 0.25s both;
        }
        .t4-sold-price-pop {
          animation: t4SoldPricePop 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both;
        }
        @media (prefers-reduced-motion: reduce) {
          .t4-sold-enter,
          .t4-sold-badge-pulse,
          .t4-sold-shine,
          .t4-sold-price-pop {
            animation: none !important;
          }
        }
      `}</style>

      <div
        data-t4-element="sold-details"
        className={reducedMotion ? undefined : 't4-sold-enter'}
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
        {/* SOLD badge */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div
            className={reducedMotion ? undefined : 't4-sold-badge-pulse'}
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '18px 44px',
              borderRadius: 8,
              background:
                'linear-gradient(135deg, #1A3D32 0%, #0F2A22 45%, #16382C 100%)',
              border: `3px solid ${SUCCESS}`,
              boxShadow:
                '0 0 0 1px rgba(212,175,55,0.35), 0 8px 32px rgba(0,0,0,0.45)',
            }}
          >
            {!reducedMotion && (
              <div
                className="t4-sold-shine"
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: '0 auto 0 -20%',
                  width: '35%',
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
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
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: SUCCESS,
                lineHeight: 0.9,
                textShadow: '0 0 24px rgba(110,196,154,0.55), 0 4px 12px rgba(0,0,0,0.55)',
              }}
            >
              Sold
            </span>
          </div>
        </div>

        {/* Price */}
        <div>
          <div
            style={{
              fontFamily: LABEL_FONT,
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(243,226,160,0.75)',
              marginBottom: 10,
            }}
          >
            Sold For
          </div>
          <div
            className={reducedMotion ? undefined : 't4-sold-price-pop'}
            style={{
              fontFamily: LABEL_FONT,
              fontSize: 128,
              fontWeight: 700,
              lineHeight: 0.9,
              color: GOLD,
              textShadow:
                '0 0 32px rgba(212,175,55,0.45), 0 4px 16px rgba(0,0,0,0.6)',
              whiteSpace: 'nowrap',
            }}
          >
            {amount}
          </div>
        </div>

        {/* Team */}
        {soldTeam && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '20px 24px',
              borderRadius: 8,
              background:
                'linear-gradient(105deg, rgba(212,175,55,0.18) 0%, rgba(20,40,80,0.55) 55%, rgba(8,12,22,0.75) 100%)',
              border: '2px solid rgba(212,175,55,0.55)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 28px rgba(0,0,0,0.4)',
            }}
          >
            {soldTeam.logoURL ? (
              <ResilientImage
                src={soldTeam.logoURL}
                alt=""
                style={{
                  width: 96,
                  height: 96,
                  objectFit: 'contain',
                  borderRadius: 8,
                  flexShrink: 0,
                  background: 'rgba(0,0,0,0.35)',
                  border: '2px solid rgba(212,175,55,0.65)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 8,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.4)',
                  border: '2px solid rgba(212,175,55,0.65)',
                  fontFamily: LABEL_FONT,
                  fontSize: 36,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {teamInitials(soldTeam.name)}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: LABEL_FONT,
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'rgba(243,226,160,0.8)',
                  marginBottom: 8,
                }}
              >
                Bought By
              </div>
              <div
                style={{
                  fontFamily: NAME_FONT,
                  fontSize: 64,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--t4-name-gold, #F0D878)',
                  lineHeight: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textShadow: '0 2px 12px rgba(0,0,0,0.55)',
                }}
              >
                {soldTeam.name}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SoldDetailsSectionT4;
