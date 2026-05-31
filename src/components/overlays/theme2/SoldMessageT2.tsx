'use client';

import React from 'react';
import { Player, Team } from '@/types';

interface Props {
  player: Player;
  team: Team;
  finalPrice: number;
  exiting: boolean;
}

const SoldMessageT2: React.FC<Props> = ({ player, team, finalPrice, exiting }) => (
  <>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');`}</style>
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Varela Round', sans-serif",
      background: 'var(--t2-bg-overlay)',
      opacity: exiting ? 0 : 1,
      transition: exiting ? 'opacity 0.5s ease-out' : 'opacity 0.3s ease-in',
    }}>
      <div style={{
        minWidth: 720,
        maxWidth: 980,
        background: 'var(--t2-gradient-panel)',
        border: '1px solid var(--t2-border-strong)',
        borderRadius: 18,
        boxShadow: '0 24px 80px var(--t2-shadow-color)',
        overflow: 'hidden',
      }}>
        <div style={{
          background: 'var(--t2-danger)',
          color: 'var(--t2-on-accent)',
          padding: '18px 44px',
          textAlign: 'center',
          fontSize: 56,
          fontWeight: 700,
          letterSpacing: 14,
          lineHeight: 1,
        }}>
          SOLD
        </div>
        <div style={{ padding: '34px 48px 38px', textAlign: 'center' }}>
          <div style={{
            color: 'var(--t2-text-muted)',
            fontSize: 14,
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            Winning Bid
          </div>
          <div style={{
            color: 'var(--t2-text-primary)',
            fontSize: 54,
            fontWeight: 700,
            lineHeight: 1.05,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            {player.name}
          </div>
          <div style={{
            height: 1,
            width: '68%',
            margin: '0 auto 18px',
            background: 'var(--t2-border-accent)',
          }} />
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: 20,
            color: 'var(--t2-text-secondary)',
            fontSize: 24,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            <span>{team.shortCode || team.name}</span>
            <span style={{ color: 'var(--t2-accent)', fontSize: 38 }}>
              {finalPrice.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  </>
);

export default SoldMessageT2;
