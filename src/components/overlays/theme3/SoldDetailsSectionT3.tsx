'use client';

import React from 'react';
import type { Team } from '@/types';
import { PLAYER_BAR_T3_HEIGHT } from './theme3Layout';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';
/** Theme 3 danger — sold panel red system (replaces success green for sold only). */
const DANGER = 'var(--t3-danger, #D87070)';
const DANGER_RGB = '216,112,112';

interface SoldDetailsSectionT3Props {
  reducedMotion?: boolean;
  barHeight?: number;
  /** @deprecated Kept for call-site compatibility. */
  bidPanelWidth?: number;
  soldTeam?: Team | null;
  soldAmount?: string;
  /** Fill remaining bar width with one sold story (no duplicate bid panel). */
  fullBleed?: boolean;
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
 * Sold reveal for Theme 3.
 * `fullBleed` bar mode: red-themed sold strip (same layout language as live bar).
 * Without team/amount: compact SOLD watermark only (fullscreen use).
 */
export function SoldDetailsSectionT3({
  reducedMotion = false,
  barHeight = PLAYER_BAR_T3_HEIGHT,
  soldTeam,
  soldAmount,
  fullBleed = false,
}: SoldDetailsSectionT3Props) {
  const hasDetails = !!soldTeam || (soldAmount != null && soldAmount !== '');

  const soldBadgeSize = fullBleed
    ? Math.round(barHeight * 0.55)
    : Math.max(28, Math.round(barHeight * 0.42));
  const priceSize = fullBleed
    ? Math.round(barHeight * 0.62)
    : Math.max(22, Math.round(barHeight * 0.34));
  const teamSize = fullBleed
    ? Math.round(barHeight * 0.38)
    : Math.max(18, Math.round(barHeight * 0.28));
  const logoSize = fullBleed
    ? Math.round(barHeight * 0.72)
    : Math.max(36, Math.round(barHeight * 0.55));
  const labelSize = fullBleed ? 14 : 11;

  if (!hasDetails) {
    // Full Screen watermark — keep compact (was ~0.7× panel height / ~500px+).
    const watermarkSize = Math.min(96, Math.max(64, Math.round(barHeight * 0.12)));
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: watermarkSize,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: DANGER,
            lineHeight: 0.9,
            transform: 'rotate(-6deg)',
            textShadow: '0 0 16px rgba(216,112,112,0.45)',
          }}
        >
          Sold
        </span>
      </div>
    );
  }

  const panelBg = fullBleed
    ? `linear-gradient(105deg, #8B1A1A 0%, ${DANGER} 42%, #B91C1C 78%, #7F1D1D 100%)`
    : `linear-gradient(90deg, rgba(${DANGER_RGB},0.95) 0%, #8B1A1A 100%)`;

  return (
    <>
      <style>{`
        @keyframes t3SoldBadgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.28); }
          50% { box-shadow: 0 0 0 5px rgba(255,255,255,0.08); }
        }
        .t3-sold-badge-pulse {
          animation: t3SoldBadgePulse 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .t3-sold-badge-pulse { animation: none !important; }
        }
      `}</style>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'stretch',
          gap: fullBleed ? 16 : 12,
          padding: fullBleed ? '8px 16px' : '6px 12px',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          minWidth: 0,
          background: panelBg,
          borderLeft: '3px solid rgba(255,255,255,0.35)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.25)',
        }}
      >
        {/* SOLD — white chip on red (same chip language as before) */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            className={reducedMotion ? undefined : 't3-sold-badge-pulse'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: fullBleed ? '100%' : undefined,
              padding: fullBleed ? '0 18px' : '4px 14px',
              borderRadius: 8,
              background: '#ffffff',
              border: '2px solid #0a0a0f',
              boxSizing: 'border-box',
            }}
          >
            <span
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: soldBadgeSize,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#7F1D1D',
                lineHeight: 0.85,
              }}
            >
              Sold
            </span>
          </div>
        </div>

        {/* Price */}
        {soldAmount != null && soldAmount !== '' && (
          <div
            style={{
              flex: '0 1 auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              minWidth: 0,
              paddingRight: 12,
              borderRight: '1px solid rgba(255,255,255,0.28)',
            }}
          >
            <span
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: labelSize,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.82)',
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              Sold For
            </span>
            <span
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: priceSize,
                fontWeight: 800,
                lineHeight: 0.85,
                color: '#ffffff',
                textShadow: '0 0 12px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.45)',
                whiteSpace: 'nowrap',
              }}
            >
              {soldAmount}
            </span>
          </div>
        )}

        {/* Team */}
        {soldTeam && (
          <div
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: fullBleed ? 14 : 10,
              paddingLeft: 4,
            }}
          >
            {soldTeam.logoURL ? (
              <img
                src={soldTeam.logoURL}
                alt=""
                style={{
                  width: logoSize,
                  height: logoSize,
                  objectFit: 'contain',
                  borderRadius: 8,
                  flexShrink: 0,
                  background: 'rgba(0,0,0,0.25)',
                  border: '2px solid rgba(255,255,255,0.55)',
                }}
              />
            ) : (
              <div
                style={{
                  width: logoSize,
                  height: logoSize,
                  borderRadius: 8,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.28)',
                  border: '2px solid rgba(255,255,255,0.55)',
                  fontFamily: DISPLAY_FONT,
                  fontSize: Math.round(logoSize * 0.4),
                  fontWeight: 800,
                  color: '#ffffff',
                }}
              >
                {teamInitials(soldTeam.name)}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: labelSize,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.82)',
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                Bought By
              </span>
              <span
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: teamSize,
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  lineHeight: 0.9,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: '0 2px 8px rgba(0,0,0,0.45)',
                }}
              >
                {soldTeam.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SoldDetailsSectionT3;
