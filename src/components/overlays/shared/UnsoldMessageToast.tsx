'use client';

import React from 'react';
import { Player } from '@/types';

type UnsoldMessagePosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface UnsoldMessageToastProps {
  player: Player;
  basePrice: number;
  exiting: boolean;
  position?: UnsoldMessagePosition;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString('en-IN');
}

const DANGER = 'var(--overlay-danger, #EF4444)';

const positionStyle: Record<UnsoldMessagePosition, React.CSSProperties> = {
  'bottom-right': { bottom: 120, right: 48 },
  'bottom-left':  { bottom: 120, left: 48 },
  'top-right':    { top: 48, right: 48 },
  'top-left':     { top: 48, left: 48 },
};

function getAnimClass(pos: UnsoldMessagePosition, exiting: boolean): string {
  const isLeft = pos === 'bottom-left' || pos === 'top-left';
  if (exiting) return isLeft ? 'sold-toast-exit-left' : 'sold-toast-exit';
  return isLeft ? 'sold-toast-enter-left' : 'sold-toast-enter';
}

const UnsoldMessageToast: React.FC<UnsoldMessageToastProps> = ({
  player,
  basePrice,
  exiting,
  position = 'bottom-right',
}) => (
  <div
    className={getAnimClass(position, exiting)}
    style={{
      position: 'absolute',
      ...positionStyle[position],
      width: 440,
      background: 'var(--overlay-bg-panel)',
      borderRadius: 14,
      border: '1px solid rgba(239,68,68,0.25)',
      borderLeft: `5px solid ${DANGER}`,
      boxShadow: '0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.12), 0 0 60px rgba(239,68,68,0.08)',
      overflow: 'hidden',
      zIndex: 100,
    }}
  >
    <div style={{
      background: 'linear-gradient(90deg, rgba(239,68,68,0.18) 0%, transparent 100%)',
      padding: '10px 20px 10px 22px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      borderBottom: '1px solid rgba(239,68,68,0.2)',
    }}>
      <div style={{
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: DANGER,
        boxShadow: '0 0 8px rgba(239,68,68,0.8)',
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: '"Graduate", cursive',
        fontSize: 13,
        letterSpacing: 5,
        color: DANGER,
        textTransform: 'uppercase',
      }}>UNSOLD</span>
    </div>

    <div style={{ padding: '18px 22px 14px 22px' }}>
      <div style={{
        fontFamily: '"Inconsolata", monospace',
        fontSize: 38,
        fontWeight: 700,
        color: 'var(--overlay-text-bright)',
        letterSpacing: 2,
        lineHeight: 1.1,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {player.name}
      </div>
      {(player.position || player.playerClass) && (
        <div style={{
          fontFamily: '"Graduate", cursive',
          fontSize: 13,
          color: 'var(--overlay-text-dim)',
          letterSpacing: 2,
          marginTop: 4,
          textTransform: 'uppercase',
        }}>
          {[player.playerClass, player.position].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>

    <div style={{
      height: 1,
      margin: '0 22px',
      background: 'linear-gradient(90deg, rgba(239,68,68,0.35) 0%, transparent 100%)',
    }} />

    <div style={{
      padding: '14px 22px 20px 22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <div style={{
        fontFamily: '"Graduate", cursive',
        fontSize: 13,
        color: 'var(--overlay-text-dim)',
        letterSpacing: 3,
        textTransform: 'uppercase',
      }}>
        Base Price
      </div>
      <div style={{
        fontFamily: '"Inconsolata", monospace',
        fontSize: 26,
        fontWeight: 700,
        color: 'var(--overlay-text-muted)',
        textAlign: 'right',
        flexShrink: 0,
        textDecoration: 'line-through',
        textDecorationColor: DANGER,
        textDecorationThickness: 2,
        whiteSpace: 'nowrap',
      }}>
        {formatPrice(basePrice)}
      </div>
    </div>
  </div>
);

export default UnsoldMessageToast;
