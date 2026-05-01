'use client';

import React from 'react';
import { Tournament } from '@/types';

interface Props {
  tournament: Tournament | null;
  overrideLabel?: string;
  size?: 'small' | 'medium' | 'large';
}

const cardSizes = { small: 200, medium: 280, large: 340 };

const RestingTimeT2: React.FC<Props> = ({ tournament, overrideLabel, size = 'medium' }) => {
  const tournamentLogo = tournament?.logoURL ?? null;
  const streamerLogo   = tournament?.wheelCenterImageURL ?? null;
  const label          = overrideLabel ?? tournament?.name ?? 'PS';
  const cardSize       = cardSizes[size];
  const logoSize       = Math.round(cardSize * 0.35);

  const shortName = label
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const textHeight = Math.round(cardSize * 0.22);
  const nameFontSize = Math.round(cardSize * 0.11);

  const logoFace = (logo: string | null, dark: boolean, fallback: string) => (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: dark ? '#1a1a1a' : 'var(--t2-bg-card)' }}>
      {/* Image fills the full square */}
      {logo ? (
        <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            fontSize: logoSize, fontWeight: 700,
            color: dark ? 'var(--t2-accent)' : '#1a1a1a',
            letterSpacing: 4, textTransform: 'uppercase',
            fontFamily: "'Varela Round', sans-serif",
          }}>
            {fallback}
          </span>
        </div>
      )}

      {/* Name strip — overlaid at the bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: textHeight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: dark ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.82)',
        padding: '0 8px',
      }}>
        <span style={{
          fontSize: nameFontSize,
          fontWeight: 700,
          color: dark ? '#ffffff' : 'var(--t2-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: 3,
          whiteSpace: 'nowrap',
          fontFamily: "'Varela Round', sans-serif",
        }}>
          {shortName}
        </span>
      </div>
    </div>
  );

  const cardBase: React.CSSProperties = {
    position: 'absolute', top: 0, right: 0,
    width: cardSize, height: cardSize,
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');

        /*
          One card's 10 s journey — stagger each card by 2.5 s (25%):

          0 – 20%   FRONT: hold centre
          20 – 25%  slide to left-side position        (0.5 s)
          25 – 50%  LEFT-BG: hold visible at left      (2.5 s) ← stays beside new front
          50 – 58%  fade + slide off left edge          (0.8 s)
          59%       instant teleport back behind stack  (opacity 0)
          59 – 80%  hidden behind stack                 (2.1 s)
          80 – 96%  rise from behind as depth card      (1.6 s)
          96 – 100% final rise to FRONT                 (0.4 s)
          100%      FRONT → seamless loop back to 0%

          4 cards, delays aligned so phase 25% = 2.5 s offset:
            A (Tournament) delay  0 s   → FRONT at t=0
            D (Streamer)   delay -2.5 s → LEFT-BG at t=0 (was front, now visible at left)
            C (Tournament) delay -5 s   → fading off left at t=0
            B (Streamer)   delay -7.5 s → hidden, rises to FRONT at t=2.5 s
        */
        @keyframes resting-t2-cycle {
          0%, 20%  { transform: translateX(0)     scale(1);    opacity: 1;    z-index: 4; }
          25%      { transform: translateX(-100%) scale(0.8);  opacity: 0.5;  z-index: 3; }
          50%      { transform: translateX(-100%) scale(0.8);  opacity: 0.5;  z-index: 3; }
          58%      { transform: translateX(-280%) scale(0.8);  opacity: 0;    z-index: 2; }
          59%      { transform: translateX(0)     scale(0.5);  opacity: 0;    z-index: 1; }
          80%      { transform: translateX(0)     scale(0.55); opacity: 0;    z-index: 1; }
          86%      { transform: translateX(0)     scale(0.65); opacity: 0.15; z-index: 1; }
          92%      { transform: translateX(0)     scale(0.8);  opacity: 0.28; z-index: 2; }
          96%      { transform: translateX(0)     scale(0.93); opacity: 0.7;  z-index: 3; }
          100%     { transform: translateX(0)     scale(1);    opacity: 1;    z-index: 4; }
        }
      `}</style>

      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Varela Round', sans-serif",
      }}>
        {/* Stage — 3× wide so left-side card is visible */}
        <div style={{
          position: 'relative',
          width: cardSize * 3,
          height: cardSize,
          overflow: 'hidden',
        }}>
          {/* Stack container — centred in the stage */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: cardSize, height: cardSize,
            backgroundColor: '#0f0f1a',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {/* C — Tournament: fading off left at t=0 */}
            <div style={{ ...cardBase, animation: 'resting-t2-cycle 10s linear -5s infinite' }}>
              {logoFace(tournamentLogo, true, label.slice(0, 2).toUpperCase())}
            </div>

            {/* B — Streamer: hidden, rises to FRONT at t=2.5 s */}
            <div style={{ ...cardBase, animation: 'resting-t2-cycle 10s linear -7.5s infinite' }}>
              {logoFace(streamerLogo, false, 'LIVE')}
            </div>

            {/* D — Streamer: LEFT-BG at t=0, visible beside A */}
            <div style={{ ...cardBase, animation: 'resting-t2-cycle 10s linear -2.5s infinite' }}>
              {logoFace(streamerLogo, false, 'LIVE')}
            </div>

            {/* A — Tournament: FRONT at t=0 */}
            <div style={{ ...cardBase, animation: 'resting-t2-cycle 10s linear 0s infinite' }}>
              {logoFace(tournamentLogo, true, label.slice(0, 2).toUpperCase())}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RestingTimeT2;
