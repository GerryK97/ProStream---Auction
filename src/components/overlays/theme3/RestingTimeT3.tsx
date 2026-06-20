'use client';

import React from 'react';
import type { Tournament } from '@/types';

interface Props {
  tournament: Tournament | null;
  overrideLabel?: string;
  size?: 'small' | 'medium' | 'large';
}

const DARK = '#141414';
const BLACK = '#050505';
const WHITE = '#ffffff';
const GOLD = '#b9aa62';
const ORANGE = '#f2692e';
const YELLOW = '#ffc522';
const MUTED = 'rgba(255,255,255,0.72)';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Saira+Extra+Condensed:wght@600;700;800&display=swap');

  @keyframes t3ChampionMainIn {
    0%   { transform: translateY(110%) scaleY(0.86); opacity: 0; }
    62%  { transform: translateY(-4%) scaleY(1.02); opacity: 1; }
    100% { transform: translateY(0) scaleY(1); opacity: 1; }
  }
  @keyframes t3ChampionTitleIn {
    0%   { transform: translateY(34px) scaleX(0.86); opacity: 0; }
    100% { transform: translateY(0) scaleX(1); opacity: 1; }
  }
  @keyframes t3ChampionLogoLeftIn {
    from { transform: translateX(-100%) scaleX(0.86); opacity: 0; }
    to   { transform: translateX(0) scaleX(1); opacity: 1; }
  }
  @keyframes t3ChampionLogoRightIn {
    from { transform: translateX(100%) scaleX(0.86); opacity: 0; }
    to   { transform: translateX(0) scaleX(1); opacity: 1; }
  }
  @keyframes t3ChampionPulse {
    0%,100% { opacity: 0.58; transform: scaleX(1); }
    50%     { opacity: 1; transform: scaleX(1.04); }
  }
  @keyframes t3ChampionLogoGlow {
    0%,100% { filter: drop-shadow(0 0 8px rgba(255,197,34,0.35)); }
    50%     { filter: drop-shadow(0 0 24px rgba(255,197,34,0.82)); }
  }
  @keyframes t3ChampionTicker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes t3ChampionSweep {
    from { transform: translateX(-150%) skewX(-18deg); }
    to   { transform: translateX(280%) skewX(-18deg); }
  }
  @keyframes t3RestingOrbitCW {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes t3RestingOrbitCCW {
    from { transform: rotate(360deg); }
    to   { transform: rotate(0deg); }
  }
  @keyframes t3RestingHaloSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes t3RestingBreathe {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.014); }
  }
  @keyframes t3RestingSweepLoop {
    0%   { transform: translateX(-150%) skewX(-18deg); opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { transform: translateX(280%) skewX(-18deg); opacity: 0; }
  }
  @keyframes t3RestingGoldBarPulse {
    0%, 100% { box-shadow: 0 0 0 rgba(185,170,98,0); opacity: 1; }
    50%      { box-shadow: 0 0 22px rgba(185,170,98,0.55); opacity: 0.88; }
  }
  @keyframes t3RestingTitleGlow {
    0%, 100% { text-shadow: 0 0 0 rgba(255,255,255,0); }
    50%      { text-shadow: 0 0 18px rgba(255,255,255,0.35); }
  }
  @keyframes t3RestingDotOrbit {
    from { transform: rotate(0deg) translateX(46px) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(46px) rotate(-360deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .t3-resting-idle { animation: none !important; }
  }
`;

function initials(label: string): string {
  const value = label
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase();
  return value.slice(0, 3) || 'PS';
}

const RestingTimeT3: React.FC<Props> = ({ tournament, overrideLabel }) => {
  const title = overrideLabel ?? tournament?.name ?? 'PROSTREAM AUCTION';
  const venue = tournament?.auctionDate
    ? new Date(tournament.auctionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    : 'LIVE AUCTION STUDIO';
  const logo = tournament?.logoURL || tournament?.wheelCenterImageURL || '';
  const secondaryLogo = tournament?.wheelCenterImageURL || tournament?.logoURL || '';
  const fallback = initials(title);

  return (
    <>
      <style>{CSS}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          fontFamily: 'Saira Extra Condensed, sans-serif',
          pointerEvents: 'none',
        }}
      >
        {/* OBS transparent canvas with gentle spotlight */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 82%, rgba(185,170,98,0.16), rgba(0,0,0,0.02) 42%, transparent 70%)' }} />

        <RestingAmbience />

        {/* Topic area from Champion sample: left 20%, top 73%, width 60%, height 18% */}
        <div
          style={{
            position: 'absolute',
            left: '20%',
            top: '73%',
            width: '60%',
            height: '18%',
            transformOrigin: '50% 100%',
            animation: 't3ChampionMainIn 620ms cubic-bezier(0.22,1,0.36,1) both',
            overflow: 'visible',
          }}
        >
          {/* Main lower third block: left 11%, top 26.9%, width 78%, height 73.1% */}
          <div
            className="t3-resting-idle"
            style={{
              position: 'absolute',
              left: '11%',
              top: '26.9%',
              width: '78%',
              height: '73.1%',
              overflow: 'hidden',
              background: BLACK,
              boxShadow: '0 16px 40px rgba(0,0,0,0.62)',
              transformOrigin: '50% 50%',
              animation: 't3RestingBreathe 5.5s ease-in-out infinite',
            }}
          >
            {/* Top Rectangle */}
            <div style={{ position: 'absolute', left: '-2.65%', top: 0, width: '105.3%', height: '4%', background: WHITE }} />
            {/* Bottom Rectangle */}
            <div
              className="t3-resting-idle"
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '110.3%',
                height: '4%',
                background: GOLD,
                animation: 't3RestingGoldBarPulse 3.2s ease-in-out infinite',
              }}
            />

            {/* lineOne Rectangle + gradient */}
            <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '55%', background: DARK }} />
            <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '55%', background: 'linear-gradient(90deg, rgba(255,255,255,0.10), transparent 18%, transparent 82%, rgba(255,255,255,0.10))' }} />

            {/* lineTwo Rectangle + gradient */}
            <div style={{ position: 'absolute', left: 0, top: '55%', width: '100%', height: '45%', background: '#000' }} />
            <div style={{ position: 'absolute', left: 0, top: '55%', width: '100%', height: '45%', background: 'linear-gradient(180deg, rgba(185,170,98,0.28), rgba(0,0,0,0.0))' }} />

            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              <div
                className="t3-resting-idle"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: '34%',
                  background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.20) 50%, transparent 80%)',
                  animation: 't3RestingSweepLoop 4.8s ease-in-out infinite',
                }}
              />
            </div>

            {/* lineOneText */}
            <div
              className="t3-resting-idle"
              style={{
                position: 'absolute',
                left: '1%',
                top: '9.5%',
                height: '40%',
                width: '98%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: WHITE,
                fontSize: 38,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                animation: 't3RestingTitleGlow 3.6s ease-in-out infinite',
              }}
            >
              AUCTION BREAK
            </div>

            {/* lineTwoText */}
            <div
              style={{
                position: 'absolute',
                left: '1%',
                top: '60.5%',
                height: '30%',
                width: '98%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgb(214,214,214)',
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              STAY TUNED · NEXT LOT COMING UP · {venue}
            </div>
          </div>

          {/* Title block, sample: left 11%, width 78%, height 30% */}
          <div
            style={{
              position: 'absolute',
              left: '11%',
              top: 0,
              width: '78%',
              height: '30%',
              background: DARK,
              transformOrigin: '50% 100%',
              animation: 't3ChampionTitleIn 520ms 160ms cubic-bezier(0.22,1,0.36,1) both',
              boxShadow: '0 10px 30px rgba(0,0,0,0.42)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '1%',
                top: '7.5%',
                height: '85%',
                width: '98%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: WHITE,
                fontSize: 50,
                fontWeight: 800,
                lineHeight: 1,
                textAlign: 'center',
                textTransform: 'uppercase',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </div>
          </div>

          <LogoTower side="left" logo={logo} fallback={fallback} />
          <LogoTower side="right" logo={secondaryLogo} fallback="LIVE" />
        </div>

        {/* Creative resting ticker */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 36,
            height: 34,
            overflow: 'hidden',
            opacity: 0.82,
            color: MUTED,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          <div style={{ display: 'inline-flex', gap: 54, whiteSpace: 'nowrap', animation: 't3ChampionTicker 22s linear infinite' }} className="t3-resting-idle">
            {Array.from({ length: 2 }).map((_, i) => (
              <React.Fragment key={i}>
                <span>RESTING TIME</span>
                <span style={{ color: GOLD }}>●</span>
                <span>CHECK PLAYER LISTS</span>
                <span style={{ color: GOLD }}>●</span>
                <span>PREPARE NEXT BID</span>
                <span style={{ color: GOLD }}>●</span>
                <span>{title}</span>
                <span style={{ color: GOLD }}>●</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

function RestingAmbience() {
  return (
    <div style={{ position: 'absolute', left: '50%', top: '82%', width: 0, height: 0, zIndex: 1, pointerEvents: 'none' }}>
      <div
        className="t3-resting-idle"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 560,
          height: 560,
          marginLeft: -280,
          marginTop: -280,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(185,170,98,0.14) 40deg, transparent 80deg, rgba(242,105,46,0.10) 140deg, transparent 200deg, rgba(255,197,34,0.12) 260deg, transparent 320deg)',
          animation: 't3RestingHaloSpin 28s linear infinite',
          opacity: 0.85,
        }}
      />
      <div
        className="t3-resting-idle"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 480,
          height: 480,
          marginLeft: -240,
          marginTop: -240,
          borderRadius: '50%',
          border: '2px dashed rgba(185,170,98,0.32)',
          animation: 't3RestingOrbitCW 24s linear infinite',
        }}
      />
      <div
        className="t3-resting-idle"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 360,
          height: 360,
          marginLeft: -180,
          marginTop: -180,
          borderRadius: '50%',
          border: '1px solid rgba(255,197,34,0.22)',
          animation: 't3RestingOrbitCCW 18s linear infinite',
        }}
      />
      <div
        className="t3-resting-idle"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 260,
          height: 260,
          marginLeft: -130,
          marginTop: -130,
          borderRadius: '50%',
          border: '2px dotted rgba(255,255,255,0.12)',
          animation: 't3RestingOrbitCW 12s linear infinite',
        }}
      />
    </div>
  );
}

function LogoTower({ side, logo, fallback }: { side: 'left' | 'right'; logo: string; fallback: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: side === 'right' ? '89%' : undefined,
        top: '26.9%',
        width: '11%',
        height: '73.1%',
        overflow: 'hidden',
        background: WHITE,
        transformOrigin: side === 'left' ? '100% 100%' : '0% 100%',
        animation: `${side === 'left' ? 't3ChampionLogoLeftIn' : 't3ChampionLogoRightIn'} 520ms 80ms cubic-bezier(0.22,1,0.36,1) both`,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${ORANGE}, ${YELLOW})`, opacity: 0.92 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,255,255,0.06))' }} />
      <div
        style={{
          position: 'absolute',
          left: side === 'left' ? '17.5%' : '12.5%',
          top: side === 'left' ? '17.5%' : '12.5%',
          width: side === 'left' ? '65%' : '75%',
          height: side === 'left' ? '65%' : '75%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 't3ChampionLogoGlow 3s ease-in-out infinite',
        }}
      >
        <div
          className="t3-resting-idle"
          style={{
            position: 'absolute',
            inset: '-18%',
            borderRadius: '50%',
            border: '1px solid rgba(255,197,34,0.35)',
            animation: `${side === 'left' ? 't3RestingOrbitCW' : 't3RestingOrbitCCW'} 10s linear infinite`,
          }}
        />
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="t3-resting-idle"
            style={{
              position: 'absolute',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: i === 0 ? GOLD : i === 1 ? ORANGE : YELLOW,
              top: '50%',
              left: '50%',
              marginTop: -3.5,
              marginLeft: -3.5,
              animation: `t3RestingDotOrbit 6s linear ${i * 2}s infinite`,
              opacity: 0.85,
            }}
          />
        ))}
        {logo ? (
          <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }} />
        ) : (
          <span style={{ color: DARK, fontSize: 34, fontWeight: 900, letterSpacing: 2, position: 'relative', zIndex: 1 }}>{fallback}</span>
        )}
      </div>
    </div>
  );
}

export default RestingTimeT3;
