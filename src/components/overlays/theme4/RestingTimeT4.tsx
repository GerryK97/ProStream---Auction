'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { buildImageUrl } from '@/lib/cloudinaryUtils';
import type { Tournament } from '@/types';

interface Props {
  tournament: Tournament | null;
  isExiting?: boolean;
  /** Optional banner title (e.g. post-sale waiting). */
  overrideLabel?: string;
}

const W = 1920;
const H = 1080;
/** How long each brand holds the stronger highlight before roles swap. */
const FOCUS_MS = 5500;
/** Transparent Auction web logo (same asset as Navigation / favicon). */
const PROSTREAM_LOGO =
  'https://res.cloudinary.com/diitsd6nz/image/upload/v1760794476/ProSteam_logo_h9pb8b.png';
const POWERED_FONT = '"Barlow", "Oswald", "Arial Narrow", sans-serif';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700&display=swap');
  @keyframes t4RestIn {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes t4RestSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes t4RestSpinRev {
    from { transform: rotate(360deg); }
    to   { transform: rotate(0deg); }
  }
  @keyframes t4RestPulse {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50%      { opacity: 1; transform: scale(1.06); }
  }
  @keyframes t4RestSweep {
    0%   { transform: translateX(-130%) skewX(-12deg); opacity: 0; }
    18%  { opacity: 0.55; }
    55%  { transform: translateX(130%) skewX(-12deg); opacity: 0; }
    100% { opacity: 0; }
  }
  @keyframes t4RestFloatA {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-18px); }
  }
  @keyframes t4RestFloatB {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(16px); }
  }
  @keyframes t4RestBeam {
    0%, 100% { opacity: 0.45; filter: brightness(0.9); }
    50%      { opacity: 1; filter: brightness(1.4); }
  }
  @keyframes t4RestDust {
    0%   { transform: translateY(30px) scale(0.5); opacity: 0; }
    20%  { opacity: 1; }
    100% { transform: translateY(-640px) scale(1.2); opacity: 0; }
  }
  @keyframes t4RestOrbit {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes t4RestOrbitRev {
    from { transform: rotate(360deg); }
    to   { transform: rotate(0deg); }
  }
  @keyframes t4RestCorner {
    0%, 100% { opacity: 0.55; }
    50%      { opacity: 1; }
  }
  @keyframes t4RestBorderGlow {
    0%, 100% {
      box-shadow:
        0 0 0 1px rgba(212,175,55,0.45),
        0 0 28px rgba(212,175,55,0.35),
        0 16px 48px rgba(0,0,0,0.55);
    }
    50% {
      box-shadow:
        0 0 0 2px rgba(243,226,160,0.95),
        0 0 56px rgba(212,175,55,0.7),
        0 0 100px rgba(42,122,212,0.45),
        0 20px 56px rgba(0,0,0,0.55);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .t4-rest-motion { animation: none !important; }
  }
`;

function resolveLogo(raw?: string | null, size = 720): string {
  const src = raw?.trim() || '';
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return buildImageUrl(src, { width: size, height: size });
}

/**
 * Theme 4 Resting Time — dual square logo advertisement (streamer + tournament).
 * Both brands stay on stage; focus highlight alternates.
 * Footer: Auction web logo + “Auction System Powered By ProStream” above the gold floor line.
 */
const RestingTimeT4: React.FC<Props> = ({
  tournament,
  isExiting = false,
  overrideLabel,
}) => {
  const streamerSrc = useMemo(
    () => resolveLogo(tournament?.wheelCenterImageURL, 800),
    [tournament?.wheelCenterImageURL],
  );
  const tournamentSrc = useMemo(
    () => resolveLogo(tournament?.logoURL, 800),
    [tournament?.logoURL],
  );

  const hasStreamer = Boolean(streamerSrc);
  const hasTournament = Boolean(tournamentSrc);
  const both = hasStreamer && hasTournament;

  const [focus, setFocus] = useState<'streamer' | 'tournament'>('streamer');

  useEffect(() => {
    if (!both) return;
    const t = window.setInterval(() => {
      setFocus((f) => (f === 'streamer' ? 'tournament' : 'streamer'));
    }, FOCUS_MS);
    return () => window.clearInterval(t);
  }, [both]);

  const streamerFocus = !both || focus === 'streamer';
  const tournamentFocus = !both || focus === 'tournament';

  return (
    <>
      <style>{CSS}</style>
      <div
        data-t4-element="resting-time"
        data-t4-label="Theme 4 Resting Time"
        style={{
          position: 'absolute',
          inset: 0,
          width: W,
          height: H,
          overflow: 'hidden',
          pointerEvents: 'none',
          opacity: isExiting ? 0 : 1,
          transform: isExiting ? 'scale(0.97)' : 'scale(1)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          animation: isExiting ? undefined : 't4RestIn 720ms cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {/* Soft underplate for logos — edges stay OBS-transparent */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '18%',
            right: '18%',
            top: '18%',
            bottom: '22%',
            background:
              'radial-gradient(ellipse at center, rgba(4,10,24,0.55) 0%, rgba(4,10,24,0.22) 48%, transparent 72%)',
          }}
        />

        <DustField />

        {overrideLabel && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 72,
              zIndex: 8,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontFamily: POWERED_FONT,
                fontSize: 42,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#F3E2A0',
                textShadow:
                  '0 0 2px rgba(0,0,0,0.95), 0 4px 18px rgba(0,0,0,0.75), 0 0 24px rgba(212,175,55,0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              {overrideLabel}
            </span>
          </div>
        )}

        {/* Dual brand stage */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: both ? 120 : 0,
            zIndex: 3,
          }}
        >
          {hasStreamer && (
            <SquareLogoCard
              src={streamerSrc}
              accent="gold"
              focused={streamerFocus}
              floatAnim="t4RestFloatA 5.2s ease-in-out infinite"
            />
          )}

          {/* Center energy bridge — highlights the pair */}
          {both && (
            <div
              aria-hidden
              style={{
                position: 'relative',
                width: 160,
                height: 160,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                className="t4-rest-motion"
                style={{
                  position: 'absolute',
                  width: 140,
                  height: 140,
                  border: '2px solid rgba(212,175,55,0.85)',
                  boxShadow: '0 0 16px rgba(212,175,55,0.55)',
                  animation: 't4RestSpin 22s linear infinite',
                }}
              />
              <div
                className="t4-rest-motion"
                style={{
                  position: 'absolute',
                  width: 100,
                  height: 100,
                  border: '2px solid rgba(126,182,255,0.9)',
                  boxShadow: '0 0 14px rgba(74,144,226,0.55)',
                  animation: 't4RestSpinRev 16s linear infinite',
                }}
              />
              <div
                className="t4-rest-motion"
                style={{
                  position: 'absolute',
                  left: -90,
                  right: -90,
                  height: 3,
                  background:
                    'linear-gradient(90deg, rgba(212,175,55,0.15), #D4AF37 50%, rgba(126,182,255,0.2))',
                  animation: 't4RestBeam 2.8s ease-in-out infinite',
                  boxShadow: '0 0 18px rgba(212,175,55,0.75)',
                }}
              />
              <div
                className="t4-rest-motion"
                style={{
                  width: 18,
                  height: 18,
                  background: '#D4AF37',
                  boxShadow: '0 0 24px rgba(212,175,55,0.95), 0 0 2px #000',
                  animation: 't4RestPulse 2.2s ease-in-out infinite',
                }}
              />
            </div>
          )}

          {hasTournament && (
            <SquareLogoCard
              src={tournamentSrc}
              accent="blue"
              focused={tournamentFocus}
              floatAnim="t4RestFloatB 5.8s ease-in-out 0.4s infinite"
            />
          )}
        </div>

        {/* Powered-by — sits above the gold floor line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 108,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            zIndex: 6,
          }}
        >
          <img
            src={PROSTREAM_LOGO}
            alt=""
            style={{
              height: 42,
              width: 'auto',
              objectFit: 'contain',
              flexShrink: 0,
              filter:
                'drop-shadow(0 0 1px rgba(0,0,0,0.9)) drop-shadow(0 2px 8px rgba(0,0,0,0.75))',
            }}
          />
          <span
            style={{
              fontFamily: POWERED_FONT,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: '#F3E2A0',
              textShadow:
                '0 0 2px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.85), 0 0 18px rgba(212,175,55,0.45)',
              whiteSpace: 'nowrap',
            }}
          >
            Auction System Powered By ProStream
          </span>
        </div>

        {/* Floor underline */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '14%',
            right: '14%',
            bottom: 88,
            height: 3,
            background:
              'linear-gradient(90deg, transparent, rgba(212,175,55,0.55) 18%, #D4AF37 50%, rgba(100,160,255,0.55) 82%, transparent)',
            boxShadow: '0 0 18px rgba(212,175,55,0.75), 0 0 4px rgba(0,0,0,0.8)',
          }}
        />
      </div>
    </>
  );
};

function SquareLogoCard({
  src,
  accent,
  focused,
  floatAnim,
}: {
  src: string;
  accent: 'gold' | 'blue';
  focused: boolean;
  floatAnim: string;
}) {
  const gold = accent === 'gold';
  const border = gold ? 'rgba(212,175,55,0.9)' : 'rgba(74,144,226,0.9)';
  const glow = gold
    ? '0 0 0 1px rgba(243,226,160,0.5), 0 0 48px rgba(212,175,55,0.45), 0 0 90px rgba(212,175,55,0.2)'
    : '0 0 0 1px rgba(120,180,255,0.45), 0 0 48px rgba(42,122,212,0.5), 0 0 90px rgba(10,61,141,0.35)';

  const size = focused ? 420 : 320;
  const scale = focused ? 1 : 0.92;

  return (
    <div
      className="t4-rest-motion"
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        transition: 'width 0.85s cubic-bezier(0.22,1,0.36,1), height 0.85s cubic-bezier(0.22,1,0.36,1)',
        animation: floatAnim,
        zIndex: focused ? 4 : 2,
      }}
    >
      {/* Rotating square frame */}
      <div
        aria-hidden
        className="t4-rest-motion"
        style={{
          position: 'absolute',
          inset: focused ? -28 : -18,
          border: `2px solid ${gold ? 'rgba(212,175,55,0.75)' : 'rgba(74,144,226,0.75)'}`,
          boxShadow: gold
            ? '0 0 14px rgba(212,175,55,0.4)'
            : '0 0 14px rgba(74,144,226,0.4)',
          animation: `t4RestSpin ${focused ? 18 : 28}s linear infinite`,
          opacity: focused ? 1 : 0.65,
          transition: 'opacity 0.7s ease, inset 0.85s ease',
        }}
      />
      <div
        aria-hidden
        className="t4-rest-motion"
        style={{
          position: 'absolute',
          inset: focused ? -48 : -34,
          border: `1.5px dashed ${gold ? 'rgba(243,226,160,0.65)' : 'rgba(126,182,255,0.65)'}`,
          animation: `t4RestSpinRev ${focused ? 26 : 36}s linear infinite`,
          opacity: focused ? 0.95 : 0.5,
        }}
      />

      {/* Orbiting dots */}
      {focused && (
        <>
          <OrbitDot r={focused ? 250 : 200} delay={0} color="#F3E2A0" />
          <OrbitDot r={focused ? 250 : 200} delay={2.2} color="#D4AF37" reverse />
          <OrbitDot r={focused ? 280 : 220} delay={1.1} color="rgba(120,180,255,0.9)" />
        </>
      )}

      {/* Corner brackets */}
      <CornerBrackets color={border} active={focused} />

      {/* Square logo plate */}
      <div
        className="t4-rest-motion"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 10,
          overflow: 'hidden',
          background:
            'linear-gradient(145deg, rgba(30,36,48,0.92) 0%, rgba(8,10,16,0.96) 100%)',
          border: `3px solid ${border}`,
          boxShadow: focused ? glow : '0 12px 40px rgba(0,0,0,0.5)',
          animation: focused ? 't4RestBorderGlow 3.2s ease-in-out infinite' : undefined,
          transform: `scale(${scale})`,
          transition: 'transform 0.85s cubic-bezier(0.22,1,0.36,1), box-shadow 0.7s ease',
        }}
      >
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '10%',
            boxSizing: 'border-box',
            display: 'block',
            filter: focused
              ? 'drop-shadow(0 10px 28px rgba(0,0,0,0.55)) brightness(1.05)'
              : 'drop-shadow(0 6px 16px rgba(0,0,0,0.4)) brightness(0.92)',
            transition: 'filter 0.7s ease',
          }}
        />
        {/* Sweep gloss */}
        <div
          aria-hidden
          className="t4-rest-motion"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.28) 50%, transparent 60%)',
            animation: focused
              ? 't4RestSweep 3.6s ease-in-out infinite'
              : 't4RestSweep 5.5s ease-in-out 1.2s infinite',
            pointerEvents: 'none',
          }}
        />
        {/* Soft top sheen */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 28%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

function CornerBrackets({ color, active }: { color: string; active: boolean }) {
  const arm = active ? 36 : 24;
  const thick = 3;
  const inset = active ? -10 : -6;
  const cornerAnim = (delay: string): React.CSSProperties['animation'] =>
    active ? `t4RestCorner 2.4s ease-in-out ${delay} infinite` : undefined;
  const common: React.CSSProperties = {
    position: 'absolute',
    width: arm,
    height: arm,
    borderColor: color,
    borderStyle: 'solid',
    borderWidth: 0,
    opacity: active ? 1 : 0.5,
    transition: 'opacity 0.6s ease',
  };
  return (
    <>
      <div
        aria-hidden
        className="t4-rest-motion"
        style={{
          ...common,
          left: inset,
          top: inset,
          borderTopWidth: thick,
          borderLeftWidth: thick,
          animation: cornerAnim('0s'),
        }}
      />
      <div
        aria-hidden
        className="t4-rest-motion"
        style={{
          ...common,
          right: inset,
          top: inset,
          borderTopWidth: thick,
          borderRightWidth: thick,
          animation: cornerAnim('0.3s'),
        }}
      />
      <div
        aria-hidden
        className="t4-rest-motion"
        style={{
          ...common,
          left: inset,
          bottom: inset,
          borderBottomWidth: thick,
          borderLeftWidth: thick,
          animation: cornerAnim('0.6s'),
        }}
      />
      <div
        aria-hidden
        className="t4-rest-motion"
        style={{
          ...common,
          right: inset,
          bottom: inset,
          borderBottomWidth: thick,
          borderRightWidth: thick,
          animation: cornerAnim('0.9s'),
        }}
      />
    </>
  );
}

function OrbitDot({
  r,
  delay,
  color,
  reverse,
}: {
  r: number;
  delay: number;
  color: string;
  reverse?: boolean;
}) {
  return (
    <div
      aria-hidden
      className="t4-rest-motion"
      style={{
        position: 'absolute',
        inset: 0,
        animation: `${reverse ? 't4RestOrbitRev' : 't4RestOrbit'} ${
          reverse ? 11 : 8.5
        }s linear ${delay}s infinite`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 8,
          height: 8,
          marginLeft: r - 4,
          marginTop: -4,
          borderRadius: 2,
          background: color,
          boxShadow: `0 0 2px #000, 0 0 14px ${color}`,
        }}
      />
    </div>
  );
}

function DustField() {
  const dots = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: 6 + ((i * 41) % 88),
        delay: (i * 0.48) % 8,
        size: 3 + (i % 3),
        dur: 6.5 + (i % 6),
        color: i % 3 === 0 ? '#F3E2A0' : i % 3 === 1 ? '#D4AF37' : '#7EB6FF',
      })),
    [],
  );

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {dots.map((d) => (
        <div
          key={d.id}
          className="t4-rest-motion"
          style={{
            position: 'absolute',
            left: `${d.left}%`,
            bottom: '6%',
            width: d.size,
            height: d.size,
            borderRadius: 1,
            background: d.color,
            boxShadow: `0 0 2px #000, 0 0 10px ${d.color}`,
            animation: `t4RestDust ${d.dur}s linear ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default RestingTimeT4;
