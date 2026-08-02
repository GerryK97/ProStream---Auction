'use client';

import React, { useMemo } from 'react';
import type { Player, Tournament } from '@/types';
import type { WheelSpinEvent } from '@/types/pusher-events';
import { buildImageUrl } from '@/lib/cloudinaryUtils';
import { WHEEL_SPIN_DURATION_MS } from '@/lib/wheelSpinTiming';

interface WheelSpinT4Props {
  data: WheelSpinEvent;
  /** Full player list for resolving segment names (wheel payload carries ids only). */
  allPlayers?: Player[];
  /** Tournament config — streamer logo (`wheelCenterImageURL`) fills the center hub. */
  tournament?: Tournament | null;
}

// SVG viewBox — 1000×1000
const CX = 500;
const CY = 500;
const R = 440;
/** Near outer rim so numbers stay readable (not mid-radius). */
const R_LABEL = Math.round(R * 0.88);
const R_HUB = 108;
const HUB_STROKE = 6;

/** Heraldic navy / antique gold alternating slices — Theme 4, not T3 rainbow. */
const SEG_NAVY = '#0E1628';
const SEG_NAVY_MID = '#1A2740';
const SEG_GOLD_TINT = '#2A2210';
const SEG_BRONZE = '#1E180C';

const GOLD_HI = 'var(--t4-shield-gold-hi, #F3E2A0)';
const GOLD = 'var(--t4-shield-gold, #D4AF37)';
const GOLD_MID = 'var(--t4-shield-gold-mid, #B8860B)';
const NAME_GOLD = 'var(--t4-name-gold, #F0D878)';
const LABEL_FONT = 'var(--t4-font-label, "Oswald", "Arial Narrow", sans-serif)';
const NAME_FONT = 'var(--t4-font-name, "Bebas Neue", "Oswald", Impact, sans-serif)';

const CRISP_TEXT: React.CSSProperties = {
  textRendering: 'geometricPrecision',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
};

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarXY(cx: number, cy: number, r: number, deg: number) {
  return { x: cx + r * Math.cos(toRad(deg)), y: cy + r * Math.sin(toRad(deg)) };
}

function segmentPath(startDeg: number, endDeg: number): string {
  const s = polarXY(CX, CY, R, startDeg);
  const e = polarXY(CX, CY, R, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

function segmentFill(i: number): string {
  const cycle = i % 4;
  if (cycle === 0) return SEG_NAVY;
  if (cycle === 1) return SEG_GOLD_TINT;
  if (cycle === 2) return SEG_NAVY_MID;
  return SEG_BRONZE;
}

const CSS = `
  @keyframes t4WheelEnter {
    0%   { opacity: 0; transform: translateY(48px) scale(0.88); filter: blur(8px); }
    70%  { opacity: 1; transform: translateY(-6px) scale(1.02); filter: blur(0); }
    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  }
  @keyframes t4WheelSpin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(var(--t4-wheel-final-deg)); }
  }
  @keyframes t4WheelPointer {
    0%, 100% { transform: translateY(0) scaleY(1); }
    50%      { transform: translateY(-6px) scaleY(1.06); }
  }
  @keyframes t4WheelRimShine {
    0%   { stroke-dashoffset: 2800; opacity: 0.15; }
    40%  { opacity: 0.85; }
    100% { stroke-dashoffset: 0; opacity: 0.2; }
  }
  @keyframes t4WheelTitleIn {
    0%   { opacity: 0; letter-spacing: 28px; transform: translateY(-18px); }
    100% { opacity: 1; letter-spacing: 12px; transform: translateY(0); }
  }
  @keyframes t4WheelTitlePulse {
    0%, 100% { text-shadow: 0 2px 0 rgba(0,0,0,0.85), 0 0 20px rgba(212,175,55,0.28); }
    50%      { text-shadow: 0 2px 0 rgba(0,0,0,0.85), 0 0 36px rgba(240,216,120,0.55), 0 0 64px rgba(212,175,55,0.25); }
  }
  @keyframes t4WheelWinnerIn {
    0%   { opacity: 0; transform: translateX(-50%) translateY(56px) scale(0.92); }
    100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }
  @keyframes t4WheelWinnerGlow {
    0%, 100% { box-shadow: 0 12px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(212,175,55,0.35); }
    50%      { box-shadow: 0 16px 48px rgba(0,0,0,0.7), 0 0 28px rgba(212,175,55,0.35), 0 0 0 1px rgba(243,226,160,0.55); }
  }
  @keyframes t4WheelWinnerPhotoIn {
    0%   { opacity: 0; transform: scale(0.7); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes t4WheelWinnerLabelIn {
    0%   { opacity: 0; letter-spacing: 16px; }
    100% { opacity: 1; letter-spacing: 0.28em; }
  }
  @keyframes t4WheelWinnerNameIn {
    0%   { opacity: 0; transform: translateY(16px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes t4WheelWinnerMetaIn {
    0%   { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .t4-wheel-spin-group { animation-duration: 0.01ms !important; }
    .t4-wheel-enter, .t4-wheel-pointer, .t4-wheel-title,
    .t4-wheel-winner, .t4-wheel-rim-shine { animation: none !important; }
  }
`;

function hubImageSrc(centerImageURL?: string, tournament?: Tournament | null): string {
  const fromEvent = centerImageURL?.trim();
  if (fromEvent) {
    if (fromEvent.startsWith('http') || fromEvent.startsWith('data:')) return fromEvent;
    return buildImageUrl(fromEvent, { width: 400, height: 400 });
  }

  const streamerLogo = tournament?.wheelCenterImageURL?.trim();
  if (!streamerLogo) return '';

  if (streamerLogo.startsWith('http') || streamerLogo.startsWith('data:')) return streamerLogo;
  return buildImageUrl(streamerLogo, { width: 400, height: 400 });
}

function resolveWinnerPhoto(player: Player | null | undefined): string | null {
  const raw = player?.photoURL?.trim() || player?.secondaryImageURL?.trim() || '';
  if (!raw) return null;
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
  return buildImageUrl(raw, { width: 360, height: 360, fit: 'fill' });
}

function winnerInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function winnerNameFontSize(name: string): number {
  if (name.length > 22) return 36;
  if (name.length > 16) return 44;
  if (name.length > 12) return 52;
  return 60;
}

/**
 * Theme 4 Wheel Spin — heraldic gold/navy wheel (distinct from Theme 3 rainbow).
 * Same timing + winner math as T3; OverlayWrapper owns mode lifecycle.
 */
const WheelSpinT4: React.FC<WheelSpinT4Props> = ({
  data,
  allPlayers = [],
  tournament = null,
}) => {
  const { players, winner, winnerIndex, centerImageURL } = data;
  const hubLogoSrc = useMemo(
    () => hubImageSrc(centerImageURL, tournament),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [centerImageURL, tournament?.wheelCenterImageURL, tournament],
  );
  const N = Math.max(players.length, 1);
  const segDeg = 360 / N;

  const winnerCenterAngle = winnerIndex * segDeg + segDeg / 2;
  const alignmentRotation = (360 - (winnerCenterAngle % 360) + 360) % 360;
  const finalRotation = 8 * 360 + alignmentRotation;
  const spinDurationS = (WHEEL_SPIN_DURATION_MS / 1000).toFixed(1);

  const playerNoById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of allPlayers) {
      if (p.playerNo) map.set(p._id, p.playerNo);
    }
    return map;
  }, [allPlayers]);

  const winnerPlayer = useMemo(
    () => (winner ? allPlayers.find((p) => p._id === winner._id) ?? null : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allPlayers, winner?._id, winner],
  );

  const winnerPhotoSrc = useMemo(() => resolveWinnerPhoto(winnerPlayer), [winnerPlayer]);

  const segments = useMemo(
    () =>
      players.map((player, i) => {
        const startDeg = i * segDeg - 90;
        const endDeg = startDeg + segDeg;
        const midDeg = startDeg + segDeg / 2;
        // Place number near the outer rim of the wedge (not mid-circle)
        const lp = polarXY(CX, CY, R_LABEL, midDeg);
        const fill = segmentFill(i);
        const rawNo = player.playerNo || playerNoById.get(player._id);
        const label = rawNo ? String(parseInt(rawNo, 10) || rawNo) : String(i + 1);
        return {
          player,
          startDeg,
          endDeg,
          midDeg,
          lp,
          fill,
          label,
          path: segmentPath(startDeg, endDeg),
        };
      }),
    [players, segDeg, playerNoById],
  );

  const labelFontSize = Math.max(
    16,
    Math.min(N > 20 ? 20 : N > 14 ? 24 : 28, Math.round(R_LABEL * Math.sin(Math.PI / N) * 0.95)),
  );

  return (
    <>
      <style>{CSS}</style>
      <div
        data-t4-element="wheel-spin"
        data-t4-label="Theme 4 Wheel Spin"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 60,
          pointerEvents: 'auto',
          background:
            'var(--t4-gradient-canvas, radial-gradient(ellipse at 50% 40%, #0A1428 0%, #050810 70%, #03050A 100%))',
          overflow: 'hidden',
          ...CRISP_TEXT,
        }}
      >
        {/* Soft vignette */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 48%, transparent 28%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Title */}
        <div
          className="t4-wheel-title"
          data-t4-element="wheel-title"
          style={{
            position: 'absolute',
            top: 42,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: NAME_FONT,
            fontSize: 72,
            fontWeight: 400,
            color: NAME_GOLD,
            letterSpacing: 12,
            textTransform: 'uppercase',
            animation:
              't4WheelTitleIn 0.7s cubic-bezier(0.22,1,0.36,1) both, t4WheelTitlePulse 2.6s ease-in-out 0.7s infinite',
          }}
        >
          Player Draw
        </div>

        {/* Wheel */}
        <div
          className="t4-wheel-enter"
          data-t4-element="wheel"
          style={{
            position: 'absolute',
            left: (1920 - 820) / 2,
            top: (1080 - 820) / 2 + 28,
            width: 820,
            height: 820,
            animation: 't4WheelEnter 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards',
          }}
        >
          <svg viewBox="0 0 1000 1000" width="820" height="820" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="t4-wheel-rim" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EDD989" />
                <stop offset="38%" stopColor="#D4AF37" />
                <stop offset="72%" stopColor="#C49A28" />
                <stop offset="100%" stopColor="#A67C1A" />
              </linearGradient>
              <linearGradient id="t4-wheel-hub-ring" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F3E2A0" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#A67C1A" />
              </linearGradient>
              <clipPath id="t4-wheel-hub-clip">
                <circle cx={CX} cy={CY} r={R_HUB - HUB_STROKE} />
              </clipPath>
            </defs>

            {/* Outer ornate rings */}
            <circle
              cx={CX}
              cy={CY}
              r={R + 36}
              fill="none"
              stroke="rgba(212,175,55,0.18)"
              strokeWidth="10"
            />
            <circle
              cx={CX}
              cy={CY}
              r={R + 22}
              fill="none"
              stroke="url(#t4-wheel-rim)"
              strokeWidth="14"
            />
            <circle
              cx={CX}
              cy={CY}
              r={R + 12}
              fill="none"
              stroke="rgba(10,12,16,0.85)"
              strokeWidth="4"
            />
            {/* Travelling rim shine */}
            <circle
              className="t4-wheel-rim-shine"
              cx={CX}
              cy={CY}
              r={R + 22}
              fill="none"
              stroke="rgba(255,248,220,0.55)"
              strokeWidth="3"
              strokeDasharray="120 2680"
              strokeLinecap="round"
              style={{
                animation: 't4WheelRimShine 3.2s linear infinite',
              }}
            />

            {/* Spinning segments */}
            <g
              className="t4-wheel-spin-group"
              style={{
                transformBox: 'fill-box',
                transformOrigin: '50% 50%',
                animation: `t4WheelSpin ${spinDurationS}s cubic-bezier(0.12, 0.72, 0.08, 1) forwards`,
                ['--t4-wheel-final-deg' as string]: `${finalRotation}deg`,
              }}
            >
              {segments.map((seg) => (
                <g key={seg.player._id}>
                  <path
                    d={seg.path}
                    fill={seg.fill}
                    stroke="rgba(212,175,55,0.42)"
                    strokeWidth="2.5"
                  />
                  <text
                    x={seg.lp.x}
                    y={seg.lp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${seg.midDeg + 90}, ${seg.lp.x}, ${seg.lp.y})`}
                    style={{
                      fontFamily: NAME_FONT,
                      fontSize: labelFontSize,
                      fontWeight: 400,
                      fill: NAME_GOLD,
                      pointerEvents: 'none',
                      userSelect: 'none',
                      letterSpacing: 1,
                    }}
                  >
                    {seg.label}
                  </text>
                </g>
              ))}
            </g>

            {/* Fixed center hub */}
            <circle cx={CX} cy={CY} r={R_HUB + 10} fill="#05070C" />
            <circle
              cx={CX}
              cy={CY}
              r={R_HUB}
              fill="#0A0C10"
              stroke="url(#t4-wheel-hub-ring)"
              strokeWidth={HUB_STROKE}
            />
            <circle
              cx={CX}
              cy={CY}
              r={R_HUB - HUB_STROKE - 2}
              fill="none"
              stroke="rgba(255,248,220,0.2)"
              strokeWidth="1.5"
            />
            {hubLogoSrc ? (
              <image
                href={hubLogoSrc}
                x={CX - (R_HUB - HUB_STROKE)}
                y={CY - (R_HUB - HUB_STROKE)}
                width={(R_HUB - HUB_STROKE) * 2}
                height={(R_HUB - HUB_STROKE) * 2}
                clipPath="url(#t4-wheel-hub-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <text
                x={CX}
                y={CY + 4}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontFamily: NAME_FONT,
                  fontSize: 42,
                  fill: NAME_GOLD,
                  letterSpacing: 6,
                }}
              >
                DRAW
              </text>
            )}

            {/* Heraldic pointer — chevron with gold rim */}
            <g
              className="t4-wheel-pointer"
              style={{
                animation: 't4WheelPointer 0.7s ease-in-out infinite',
                transformOrigin: `${CX}px ${CY - R - 36}px`,
              }}
            >
              <polygon
                points={`${CX - 22},${CY - R - 52} ${CX + 22},${CY - R - 52} ${CX},${CY - R + 14}`}
                fill="rgba(0,0,0,0.5)"
                transform="translate(3,4)"
              />
              <polygon
                points={`${CX - 22},${CY - R - 52} ${CX + 22},${CY - R - 52} ${CX},${CY - R + 14}`}
                fill="url(#t4-wheel-rim)"
                stroke="#F3E2A0"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <polygon
                points={`${CX - 10},${CY - R - 44} ${CX + 10},${CY - R - 44} ${CX},${CY - R - 8}`}
                fill="#0A0C10"
                opacity="0.35"
              />
            </g>
          </svg>
        </div>

        {/* Winner reveal — clean T4 plate (no rainbow rays) */}
        {winner && (
          <div
            className="t4-wheel-winner"
            data-t4-element="wheel-winner"
            style={{
              position: 'absolute',
              bottom: 48,
              left: '50%',
              width: 980,
              zIndex: 40,
              animation: `t4WheelWinnerIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${spinDurationS}s both`,
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                padding: '22px 36px 22px 22px',
                background: 'var(--t4-bg-photo, #0A0C10)',
                borderTop: `1px solid rgba(243,226,160,0.5)`,
                borderBottom: `1px solid rgba(212,175,55,0.28)`,
                animation: `t4WheelWinnerGlow 2.4s ease-in-out ${spinDurationS}s infinite`,
              }}
            >
              {/* Circular heraldic photo */}
              <div
                style={{
                  flexShrink: 0,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  padding: 4,
                  background: `linear-gradient(160deg, #EDD989 0%, #D4AF37 40%, #A67C1A 100%)`,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.55), 0 0 20px rgba(212,175,55,0.25)',
                  animation: `t4WheelWinnerPhotoIn 0.55s cubic-bezier(0.22,1,0.36,1) calc(${spinDurationS}s + 0.1s) both`,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#05070C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {winnerPhotoSrc ? (
                    <img
                      src={winnerPhotoSrc}
                      alt=""
                      referrerPolicy="no-referrer"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: NAME_FONT,
                        fontSize: 36,
                        color: NAME_GOLD,
                        letterSpacing: 2,
                      }}
                    >
                      {winnerInitials(winner.name)}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{
                    fontFamily: LABEL_FONT,
                    fontSize: 16,
                    fontWeight: 600,
                    color: GOLD_MID,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    animation: `t4WheelWinnerLabelIn 0.5s ease-out calc(${spinDurationS}s + 0.16s) both`,
                  }}
                >
                  Next Player
                  {winner.playerNo ? `  ·  #${parseInt(winner.playerNo, 10)}` : ''}
                </div>

                <div
                  data-t4-element="wheel-winner-name"
                  style={{
                    fontFamily: NAME_FONT,
                    fontSize: winnerNameFontSize(winner.name),
                    color: NAME_GOLD,
                    letterSpacing: 3,
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textShadow: '0 2px 8px rgba(0,0,0,0.75)',
                    animation: `t4WheelWinnerNameIn 0.55s cubic-bezier(0.22,1,0.36,1) calc(${spinDurationS}s + 0.28s) both`,
                  }}
                >
                  {winner.name}
                </div>

                {(winner.position || winner.playerClass) && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      animation: `t4WheelWinnerMetaIn 0.45s ease-out calc(${spinDurationS}s + 0.4s) both`,
                    }}
                  >
                    {winner.position && (
                      <span
                        style={{
                          fontFamily: LABEL_FONT,
                          fontSize: 18,
                          fontWeight: 500,
                          color: 'rgba(220,228,240,0.72)',
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {winner.position}
                      </span>
                    )}
                    {winner.position && winner.playerClass && (
                      <span style={{ color: 'rgba(212,175,55,0.4)', fontSize: 14 }}>|</span>
                    )}
                    {winner.playerClass && (
                      <span
                        style={{
                          fontFamily: LABEL_FONT,
                          fontSize: 15,
                          fontWeight: 600,
                          color: GOLD_HI,
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                          border: `1px solid rgba(212,175,55,0.45)`,
                          padding: '4px 14px',
                        }}
                      >
                        Class {winner.playerClass}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WheelSpinT4;
