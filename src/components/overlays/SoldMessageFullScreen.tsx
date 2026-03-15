'use client';

import React from 'react';
import { Player, Team } from '@/types';

interface SoldMessageFullScreenProps {
  player: Player;
  team: Team;
  finalPrice: number;
  exiting: boolean;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString('en-IN');
}

const SoldMessageFullScreen: React.FC<SoldMessageFullScreenProps> = ({
  player,
  team,
  finalPrice,
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
      background: 'linear-gradient(90deg, rgba(var(--overlay-color-primary-rgb),0.18) 0%, transparent 100%)',
      borderBottom: '1px solid var(--overlay-border-accent-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18,
    }}>
      <div style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: 'var(--overlay-color-primary)',
        boxShadow: '0 0 16px rgba(var(--overlay-color-primary-rgb),0.9)',
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: '"Graduate", cursive',
        fontSize: 40,
        letterSpacing: 12,
        color: 'var(--overlay-color-primary)',
        textTransform: 'uppercase',
        textShadow: '0 0 40px rgba(var(--overlay-color-primary-rgb),0.5)',
      }}>
        SOLD
      </span>
      <div style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: 'var(--overlay-color-primary)',
        boxShadow: '0 0 16px rgba(var(--overlay-color-primary-rgb),0.9)',
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

      {/* Bottom gradient overlay on photo */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 300,
        background: 'linear-gradient(to top, rgba(13,17,23,0.92) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* SOLD stamp overlay on photo */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.28)',
        pointerEvents: 'none',
      }}>
        <div
          className="animate-stamp-seal"
          style={{
            border: '7px solid #DC2626',
            borderRadius: 14,
            padding: '10px 30px',
            background: 'rgba(220,38,38,0.08)',
            boxShadow: '0 0 0 3px rgba(220,38,38,0.25), 0 0 40px rgba(var(--overlay-color-primary-rgb),0.18), inset 0 0 24px rgba(220,38,38,0.1)',
          }}
        >
          <span style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 120,
            color: '#DC2626',
            letterSpacing: 14,
            lineHeight: 1,
            display: 'block',
            textShadow: '0 0 30px rgba(220,38,38,0.6), 0 4px 20px rgba(0,0,0,0.8)',
          }}>
            SOLD
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
      background: 'linear-gradient(180deg, var(--overlay-color-primary) 0%, rgba(var(--overlay-color-primary-rgb),0.08) 100%)',
      borderRadius: 3,
    }} />

    {/* ── Right info panel ── */}

    {/* Player name */}
    <div style={{
      position: 'absolute',
      left: 780,
      top: 150,
      width: 1080,
      fontFamily: '"Inconsolata", monospace',
      fontSize: 110,
      fontWeight: 700,
      color: 'var(--overlay-color-primary)',
      lineHeight: 1.05,
      letterSpacing: 4,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      textShadow: '0 0 40px rgba(var(--overlay-color-primary-rgb),0.55), 0 0 80px rgba(var(--overlay-color-primary-rgb),0.2)',
    }}>
      {player.name}
    </div>

    {/* Divider */}
    <div style={{
      position: 'absolute',
      left: 780,
      top: 300,
      width: 1080,
      height: 3,
      background: 'linear-gradient(90deg, var(--overlay-color-primary) 0%, rgba(var(--overlay-color-primary-rgb),0.08) 100%)',
      borderRadius: 2,
    }} />

    {/* Team identity */}
    <div style={{
      position: 'absolute',
      left: 780,
      top: 360,
      display: 'flex',
      alignItems: 'center',
      gap: 28,
    }}>
      {team.logoURL ? (
        <img
          src={team.logoURL}
          alt={team.name}
          style={{
            width: 100,
            height: 100,
            objectFit: 'contain',
            flexShrink: 0,
            filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.2))',
          }}
        />
      ) : (
        <div style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(var(--overlay-color-primary-rgb),0.12)',
          border: '2px solid rgba(var(--overlay-color-primary-rgb),0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Graduate", cursive',
          fontSize: 28,
          color: 'var(--overlay-color-primary)',
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {team.shortCode?.slice(0, 2)}
        </div>
      )}
      <div>
        <div style={{
          fontFamily: '"Concert One", cursive',
          fontSize: 52,
          color: 'var(--overlay-text-bright)',
          lineHeight: 1.15,
          letterSpacing: 0.5,
          whiteSpace: 'nowrap',
        }}>
          {team.name}
        </div>
        {team.shortCode && (
          <div style={{
            fontFamily: '"Graduate", cursive',
            fontSize: 20,
            color: 'var(--overlay-text-dim)',
            letterSpacing: 5,
            textTransform: 'uppercase',
            marginTop: 4,
          }}>
            {team.shortCode}
          </div>
        )}
      </div>
    </div>

    {/* Final price */}
    <div style={{
      position: 'absolute',
      left: 780,
      top: 530,
      fontFamily: '"Inconsolata", monospace',
      fontSize: 120,
      fontWeight: 700,
      color: 'var(--overlay-color-primary)',
      lineHeight: 1,
      letterSpacing: 4,
      textShadow: '0 0 40px rgba(var(--overlay-color-primary-rgb),0.55), 0 0 80px rgba(var(--overlay-color-primary-rgb),0.2)',
      whiteSpace: 'nowrap',
    }}>
      {formatPrice(finalPrice)}
    </div>

    {/* Bottom accent line */}
    <div style={{
      position: 'absolute',
      left: 780,
      bottom: 48,
      width: 1080,
      height: 2,
      background: 'linear-gradient(90deg, rgba(var(--overlay-color-primary-rgb),0.6) 0%, transparent 100%)',
      borderRadius: 2,
    }} />
  </div>
);

export default SoldMessageFullScreen;
