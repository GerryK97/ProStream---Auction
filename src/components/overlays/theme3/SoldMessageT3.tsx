'use client';

import React from 'react';
import type { Player, Team } from '@/types';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';

interface SoldBarOverlayT3Props {
  player: Player;
  team: Team;
  finalPrice: number;
}

export function SoldBarOverlayT3({ team, finalPrice }: SoldBarOverlayT3Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 10,
        background: 'rgba(0,33,69,0.45)',
      }}
    >
      <div
        className="animate-stamp-seal t3-sold-flash-bg"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '12px 36px',
          borderRadius: 4,
          border: '3px solid var(--t3-bar-gold, #eda900)',
          background: 'rgba(0,0,0,0.72)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
      >
        <span
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'var(--t3-success, #6EC49A)',
            textTransform: 'uppercase',
          }}
        >
          SOLD
        </span>
        <span
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--t3-bar-text, #ffffff)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {team.name} · {finalPrice.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}

export function UnsoldBarOverlayT3() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 10,
        background: 'rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="animate-stamp-seal"
        style={{
          padding: '12px 36px',
          borderRadius: 4,
          border: '3px solid var(--t3-danger, #D87070)',
          background: 'rgba(0,0,0,0.72)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          transform: 'rotate(-8deg)',
        }}
      >
        <span
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'var(--t3-danger, #D87070)',
            textTransform: 'uppercase',
          }}
        >
          UNSOLD
        </span>
      </div>
    </div>
  );
}

const SoldMessageT3: React.FC<{
  player: Player;
  team: Team;
  finalPrice: number;
  exiting: boolean;
}> = ({ player, team, finalPrice }) => (
  <SoldBarOverlayT3 player={player} team={team} finalPrice={finalPrice} />
);

export default SoldMessageT3;
