'use client';

import React from 'react';
import { Player, Tournament } from '@/types';

interface UnsoldMessageT1Props {
  player: Player;
  tournament: Tournament | null;
  basePrice: number;
  exiting: boolean;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString('en-IN');
}

const DANGER = 'var(--overlay-danger, #EF4444)';

const UnsoldMessageT1: React.FC<UnsoldMessageT1Props> = ({
  player,
  basePrice,
  exiting,
}) => (
  <div
    className={exiting ? 'fsm-panel-exit' : 'fsm-panel-enter'}
    style={{
      position: 'absolute',
      inset: 0,
      zIndex: 200,
      background: 'var(--overlay-bg-fullscreen)',
      transformOrigin: 'center center',
      overflow: 'hidden',
    }}
  >
    {/* ── Top accent bar ── */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 110,
      background: 'linear-gradient(90deg, rgba(239,68,68,0.18) 0%, transparent 100%)',
      borderBottom: '1px solid rgba(239,68,68,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18,
    }}>
      <div style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: DANGER,
        boxShadow: '0 0 16px rgba(239,68,68,0.9)',
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: '"Graduate", cursive',
        fontSize: 40,
        letterSpacing: 12,
        color: DANGER,
        textTransform: 'uppercase',
        textShadow: '0 0 40px rgba(239,68,68,0.5)',
      }}>
        UNSOLD
      </span>
      <div style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: DANGER,
        boxShadow: '0 0 16px rgba(239,68,68,0.9)',
        flexShrink: 0,
      }} />
    </div>

    {/* ── Left photo panel ── */}
    <div style={{
      position: 'absolute',
      left: 0,
      top: 110,
      width: 720,
      height: 970,
      overflow: 'hidden',
      background: '#1a1f2e',
    }}>
      {player.photoURL ? (
        <img
          src={player.photoURL}
          alt={player.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
            filter: 'saturate(0.35) brightness(0.85)',
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1220',
        }}>
          <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 300,
        background: 'linear-gradient(to top, rgba(13,17,23,0.92) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.32)',
        pointerEvents: 'none',
      }}>
        <div
          className="animate-stamp-seal"
          style={{
            border: '7px solid #EF4444',
            borderRadius: 14,
            padding: '10px 24px',
            background: 'rgba(239,68,68,0.08)',
            boxShadow: '0 0 0 3px rgba(239,68,68,0.25), 0 0 40px rgba(239,68,68,0.18), inset 0 0 24px rgba(239,68,68,0.1)',
            transform: 'rotate(-6deg)',
          }}
        >
          <span style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 100,
            color: '#EF4444',
            letterSpacing: 12,
            lineHeight: 1,
            display: 'block',
            textShadow: '0 0 30px rgba(239,68,68,0.6), 0 4px 20px rgba(0,0,0,0.8)',
          }}>
            UNSOLD
          </span>
        </div>
      </div>
    </div>

    {/* ── Vertical accent bar ── */}
    <div style={{
      position: 'absolute',
      left: 725,
      top: 110,
      width: 5,
      height: 970,
      background: 'linear-gradient(180deg, rgba(239,68,68,0.85) 0%, rgba(239,68,68,0.08) 100%)',
      borderRadius: 3,
    }} />

    {/* ── Right info panel ── */}

    <div style={{
      position: 'absolute',
      left: 780,
      top: 150,
      width: 1080,
      fontFamily: '"Inconsolata", monospace',
      fontSize: 110,
      fontWeight: 700,
      color: 'var(--overlay-text-bright)',
      lineHeight: 1.05,
      letterSpacing: 4,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}>
      {player.name}
    </div>

    <div style={{
      position: 'absolute',
      left: 780,
      top: 300,
      width: 1080,
      height: 3,
      background: 'linear-gradient(90deg, rgba(239,68,68,0.6) 0%, rgba(239,68,68,0.08) 100%)',
      borderRadius: 2,
    }} />

    {(player.position || player.playerClass) && (
      <div style={{
        position: 'absolute',
        left: 780,
        top: 360,
        fontFamily: '"Graduate", cursive',
        fontSize: 32,
        color: 'var(--overlay-text-dim)',
        letterSpacing: 4,
        textTransform: 'uppercase',
      }}>
        {[player.playerClass, player.position].filter(Boolean).join(' · ')}
      </div>
    )}

    <div style={{
      position: 'absolute',
      left: 780,
      top: 480,
      fontFamily: '"Graduate", cursive',
      fontSize: 28,
      color: 'var(--overlay-text-dim)',
      letterSpacing: 6,
      textTransform: 'uppercase',
    }}>
      Base Price
    </div>

    <div style={{
      position: 'absolute',
      left: 780,
      top: 530,
      fontFamily: '"Inconsolata", monospace',
      fontSize: 120,
      fontWeight: 700,
      color: 'var(--overlay-text-muted)',
      lineHeight: 1,
      letterSpacing: 4,
      textDecoration: 'line-through',
      textDecorationColor: DANGER,
      textDecorationThickness: 4,
      whiteSpace: 'nowrap',
    }}>
      {formatPrice(basePrice)}
    </div>

    <div style={{
      position: 'absolute',
      left: 780,
      bottom: 48,
      width: 1080,
      height: 2,
      background: 'linear-gradient(90deg, rgba(239,68,68,0.6) 0%, transparent 100%)',
      borderRadius: 2,
    }} />
  </div>
);

export default UnsoldMessageT1;
