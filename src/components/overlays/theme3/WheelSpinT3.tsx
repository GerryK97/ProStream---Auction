'use client';

import React, { useMemo } from 'react';
import type { Player, Tournament } from '@/types';
import type { WheelSpinEvent } from '@/types/pusher-events';
import { buildImageUrl } from '@/lib/cloudinaryUtils';

interface WheelSpinT3Props {
  data: WheelSpinEvent;
  /** Full player list for resolving segment names (wheel payload carries ids only). */
  allPlayers?: Player[];
  /** Tournament config — streamer logo (`wheelCenterImageURL`) fills the center hub. */
  tournament?: Tournament | null;
}

// SVG viewBox — 1000×1000 coordinate system
const CX = 500;
const CY = 500;
const R = 455;
const R_LABEL = Math.round(R * 0.72);
const R_HUB = 118;
const HUB_STROKE = 5;

/** overlays.uno-style vibrant segment palette */
const SEGMENT_COLORS = [
  '#00a2cb', '#f2009d', '#ffbe00', '#ddff0d', '#b500ff',
  '#ff001e', '#01b6fa', '#f4b500', '#00e04b', '#ff9800',
  '#bb00ff', '#00e04b', '#ff002c', '#4a0056',
];

const GOLD = '#b9aa62';
const GOLD_BRIGHT = '#ffc522';
const DARK = '#141414';

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function polarXY(cx: number, cy: number, r: number, deg: number) {
  return { x: cx + r * Math.cos(toRad(deg)), y: cy + r * Math.sin(toRad(deg)) };
}

function segmentPath(startDeg: number, endDeg: number): string {
  const s = polarXY(CX, CY, R, startDeg);
  const e = polarXY(CX, CY, R, endDeg);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&family=Saira+Extra+Condensed:wght@600;700;800&display=swap');

  @keyframes t3WheelEnter {
    0%   { opacity: 0; transform: scale(0.55) rotate(-12deg); }
    55%  { opacity: 1; transform: scale(1.05) rotate(3deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes t3WheelSpin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(var(--t3-wheel-final-deg)); }
  }
  @keyframes t3WheelPointer {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-8px); }
  }
  @keyframes t3WheelWinnerIn {
    0%   { opacity: 0; transform: translateX(-50%) translateY(72px) scale(0.88); filter: blur(6px); }
    65%  { opacity: 1; transform: translateX(-50%) translateY(-6px) scale(1.02); filter: blur(0); }
    100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); filter: blur(0); }
  }
  @keyframes t3WheelWinnerGlow {
    0%, 100% { box-shadow: 0 0 32px rgba(185,170,98,0.4), 0 0 64px rgba(255,197,34,0.15), 0 24px 80px rgba(0,0,0,0.65); }
    50%      { box-shadow: 0 0 56px rgba(185,170,98,0.75), 0 0 96px rgba(255,197,34,0.28), 0 28px 96px rgba(0,0,0,0.72); }
  }
  @keyframes t3WheelWinnerRays {
    0%   { transform: translateX(-50%) rotate(0deg); opacity: 0.55; }
    100% { transform: translateX(-50%) rotate(360deg); opacity: 0.55; }
  }
  @keyframes t3WheelWinnerLabelIn {
    0%   { opacity: 0; letter-spacing: 18px; transform: translateY(8px); }
    100% { opacity: 1; letter-spacing: 8px; transform: translateY(0); }
  }
  @keyframes t3WheelWinnerNumberIn {
    0%   { opacity: 0; transform: scale(0.4) rotate(-8deg); }
    70%  { opacity: 1; transform: scale(1.12) rotate(2deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes t3WheelWinnerNameIn {
    0%   { opacity: 0; transform: translateY(28px) scale(0.94); clip-path: inset(100% 0 0 0); }
    100% { opacity: 1; transform: translateY(0) scale(1); clip-path: inset(0 0 0 0); }
  }
  @keyframes t3WheelWinnerMetaIn {
    0%   { opacity: 0; transform: translateY(12px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes t3WheelWinnerPhotoIn {
    0%   { opacity: 0; transform: scale(0.6) rotate(-12deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes t3WheelWinnerShimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes t3WheelTitlePulse {
    0%, 100% { text-shadow: 0 0 24px rgba(255,197,34,0.45); }
    50%      { text-shadow: 0 0 48px rgba(255,197,34,0.85), 0 0 72px rgba(185,170,98,0.35); }
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
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function winnerNameFontSize(name: string): number {
  if (name.length > 22) return 48;
  if (name.length > 16) return 56;
  if (name.length > 12) return 68;
  return 80;
}

const WheelSpinT3: React.FC<WheelSpinT3Props> = ({ data, allPlayers = [], tournament = null }) => {
  const { players, winner, winnerIndex, spinDurationMs, centerImageURL } = data;
  const hubLogoSrc = useMemo(
    () => hubImageSrc(centerImageURL, tournament),
    [centerImageURL, tournament?.wheelCenterImageURL],
  );
  const N = Math.max(players.length, 1);
  const segDeg = 360 / N;

  const winnerCenterAngle = winnerIndex * segDeg + segDeg / 2;
  const alignmentRotation = (360 - winnerCenterAngle % 360 + 360) % 360;
  const finalRotation = 8 * 360 + alignmentRotation;
  const spinDurationS = (spinDurationMs / 1000).toFixed(1);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of allPlayers) map.set(p._id, p.name);
    return map;
  }, [allPlayers]);

  const winnerPlayer = useMemo(
    () => (winner ? allPlayers.find(p => p._id === winner._id) ?? null : null),
    [allPlayers, winner?._id],
  );

  const winnerPhotoSrc = useMemo(() => resolveWinnerPhoto(winnerPlayer), [winnerPlayer]);
  const winnerAccent = SEGMENT_COLORS[winnerIndex % SEGMENT_COLORS.length] ?? GOLD_BRIGHT;

  const segments = useMemo(() => players.map((player, i) => {
    const startDeg = i * segDeg - 90;
    const endDeg = startDeg + segDeg;
    const midDeg = startDeg + segDeg / 2;
    const lp = polarXY(CX, CY, R_LABEL, midDeg);
    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    const resolvedName = nameById.get(player._id);
    const label = resolvedName
      ? (resolvedName.length > 10 ? `${resolvedName.slice(0, 9)}…` : resolvedName)
      : player.playerNo
        ? String(parseInt(player.playerNo, 10))
        : String(i + 1);
    return { player, startDeg, endDeg, midDeg, lp, color, label, path: segmentPath(startDeg, endDeg) };
  }), [players, segDeg, nameById]);

  const labelFontSize = Math.max(
    11,
    Math.min(N > 16 ? 14 : 18, Math.round(R_LABEL * Math.sin(Math.PI / N) * (N > 12 ? 0.55 : 0.72))),
  );

  return (
    <>
      <style>{CSS}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 30,
          background: 'radial-gradient(ellipse at 50% 42%, rgba(20,20,20,0.96) 0%, rgba(5,5,5,0.99) 68%)',
          overflow: 'hidden',
        }}
      >
        {/* Title */}
        <div
          style={{
            position: 'absolute',
            top: 36,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: '"Saira Extra Condensed", sans-serif',
            fontSize: 82,
            fontWeight: 800,
            color: GOLD_BRIGHT,
            letterSpacing: 10,
            textTransform: 'uppercase',
            animation: 't3WheelTitlePulse 2.4s ease-in-out infinite',
          }}
        >
          Spin the Wheel
        </div>

        {/* Wheel container */}
        <div
          style={{
            position: 'absolute',
            left: (1920 - 860) / 2,
            top: (1080 - 860) / 2 + 36,
            width: 860,
            height: 860,
            animation: 't3WheelEnter 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <svg viewBox="0 0 1000 1000" width="860" height="860" style={{ display: 'block' }}>
            {/* Outer rings */}
            <circle cx={CX} cy={CY} r={R + 18} fill="none" stroke="rgba(185,170,98,0.22)" strokeWidth="8" />
            <circle cx={CX} cy={CY} r={R + 32} fill="none" stroke="rgba(255,197,34,0.08)" strokeWidth="3" />

            {/* Spinning segments */}
            <g
              className="t3-wheel-spin-group"
              style={{
                transformBox: 'fill-box',
                transformOrigin: '50% 50%',
                animation: `t3WheelSpin ${spinDurationS}s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards`,
                ['--t3-wheel-final-deg' as string]: `${finalRotation}deg`,
              }}
            >
              {segments.map((seg, i) => (
                <g key={seg.player._id}>
                  <path
                    d={seg.path}
                    fill={seg.color}
                    stroke="rgba(0,0,0,0.45)"
                    strokeWidth="2"
                    opacity="0.95"
                  />
                  {i % 2 === 1 && <path d={seg.path} fill="rgba(0,0,0,0.12)" />}
                  <text
                    x={seg.lp.x}
                    y={seg.lp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${seg.midDeg + 90}, ${seg.lp.x}, ${seg.lp.y})`}
                    style={{
                      fontFamily: '"Nunito", sans-serif',
                      fontSize: labelFontSize,
                      fontWeight: 800,
                      fill: '#ffffff',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      letterSpacing: 0.5,
                    }}
                  >
                    {seg.label}
                  </text>
                </g>
              ))}
            </g>

            {/* Fixed center hub */}
            <defs>
              <clipPath id="t3-wheel-hub-clip">
                <circle cx={CX} cy={CY} r={R_HUB - HUB_STROKE} />
              </clipPath>
            </defs>
            <circle
              cx={CX}
              cy={CY}
              r={R_HUB}
              fill={DARK}
              stroke={GOLD}
              strokeWidth={HUB_STROKE}
            />
            {hubLogoSrc ? (
              <image
                href={hubLogoSrc}
                x={CX - (R_HUB - HUB_STROKE)}
                y={CY - (R_HUB - HUB_STROKE)}
                width={(R_HUB - HUB_STROKE) * 2}
                height={(R_HUB - HUB_STROKE) * 2}
                clipPath="url(#t3-wheel-hub-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <text
                x={CX}
                y={CY + 5}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontFamily: '"Saira Extra Condensed", sans-serif',
                  fontSize: 48,
                  fontWeight: 800,
                  fill: GOLD_BRIGHT,
                  letterSpacing: 6,
                }}
              >
                SPIN
              </text>
            )}

            {/* Pointer */}
            <g style={{ animation: 't3WheelPointer 0.65s ease-in-out infinite', transformOrigin: `${CX}px ${CY - R - 40}px` }}>
              <polygon
                points={`${CX - 24},${CY - R - 48} ${CX + 24},${CY - R - 48} ${CX},${CY - R + 18}`}
                fill="rgba(0,0,0,0.45)"
                transform="translate(4,4)"
              />
              <polygon
                points={`${CX - 24},${CY - R - 48} ${CX + 24},${CY - R - 48} ${CX},${CY - R + 18}`}
                fill={GOLD_BRIGHT}
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>

        {/* Winner reveal — broadcast-style card after spin settles */}
        {winner && (
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: '50%',
              width: 'min(1180px, 94vw)',
              zIndex: 40,
              animation: `t3WheelWinnerIn 0.85s cubic-bezier(0.22, 1, 0.36, 1) ${spinDurationS}s both`,
            }}
          >
            {/* Rotating light rays */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 40,
                width: 720,
                height: 720,
                marginLeft: -360,
                background: `conic-gradient(from 0deg, transparent 0deg, ${winnerAccent}22 18deg, transparent 36deg, ${GOLD_BRIGHT}18 54deg, transparent 72deg, ${winnerAccent}22 90deg, transparent 108deg, ${GOLD_BRIGHT}18 126deg, transparent 144deg)`,
                borderRadius: '50%',
                filter: 'blur(2px)',
                animation: `t3WheelWinnerRays 14s linear ${spinDurationS}s infinite`,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            {/* Main card */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'stretch',
                gap: 0,
                borderRadius: 20,
                overflow: 'hidden',
                border: `2px solid ${GOLD}`,
                background: `linear-gradient(135deg, rgba(18,22,28,0.98) 0%, rgba(8,10,14,0.99) 55%, rgba(22,18,10,0.98) 100%)`,
                animation: `t3WheelWinnerGlow 2.2s ease-in-out ${spinDurationS}s infinite`,
                zIndex: 1,
              }}
            >
              {/* Top gold shimmer bar */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 5,
                  background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD_BRIGHT}, ${GOLD}, transparent)`,
                  backgroundSize: '200% 100%',
                  animation: `t3WheelWinnerShimmer 2.8s linear ${spinDurationS}s infinite`,
                }}
              />

              {/* Accent stripe from winning segment */}
              <div
                aria-hidden
                style={{
                  width: 8,
                  flexShrink: 0,
                  background: `linear-gradient(180deg, ${winnerAccent}, ${GOLD_BRIGHT} 50%, ${winnerAccent})`,
                  boxShadow: `0 0 24px ${winnerAccent}88`,
                }}
              />

              {/* Player photo — square crop */}
              <div
                style={{
                  flexShrink: 0,
                  width: 168,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px 8px 20px 16px',
                  background: 'linear-gradient(180deg, rgba(255,197,34,0.08) 0%, transparent 100%)',
                  animation: `t3WheelWinnerPhotoIn 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) calc(${spinDurationS}s + 0.12s) both`,
                }}
              >
                <div
                  style={{
                    width: 132,
                    height: 132,
                    borderRadius: 8,
                    padding: 4,
                    background: `linear-gradient(145deg, ${GOLD_BRIGHT}, ${GOLD}, ${winnerAccent})`,
                    boxShadow: `0 0 32px ${winnerAccent}66, 0 8px 24px rgba(0,0,0,0.5)`,
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 4,
                      overflow: 'hidden',
                      background: DARK,
                      border: '3px solid rgba(255,255,255,0.12)',
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
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: '"Saira Extra Condensed", sans-serif',
                          fontSize: 44,
                          fontWeight: 800,
                          color: GOLD_BRIGHT,
                          letterSpacing: 2,
                        }}
                      >
                        {winnerInitials(winner.name)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Text content */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '22px 36px 24px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {/* Eyebrow label */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    animation: `t3WheelWinnerLabelIn 0.55s ease-out calc(${spinDurationS}s + 0.18s) both`,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      height: 1,
                      background: `linear-gradient(90deg, transparent, ${GOLD}88)`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: '"Saira Extra Condensed", sans-serif',
                      fontSize: 20,
                      fontWeight: 700,
                      color: GOLD,
                      letterSpacing: 8,
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Next Player
                  </span>
                  <span
                    style={{
                      flex: 1,
                      height: 1,
                      background: `linear-gradient(270deg, transparent, ${GOLD}88)`,
                    }}
                  />
                </div>

                {/* Player number + name row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 20,
                    minWidth: 0,
                  }}
                >
                  {winner.playerNo && (
                    <div
                      style={{
                        flexShrink: 0,
                        fontFamily: '"Saira Extra Condensed", sans-serif',
                        fontSize: 88,
                        fontWeight: 800,
                        lineHeight: 0.9,
                        background: `linear-gradient(180deg, ${GOLD_BRIGHT} 0%, ${GOLD} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: `drop-shadow(0 2px 8px ${winnerAccent}55)`,
                        animation: `t3WheelWinnerNumberIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) calc(${spinDurationS}s + 0.28s) both`,
                      }}
                    >
                      #{parseInt(winner.playerNo, 10)}
                    </div>
                  )}

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: '"Saira Extra Condensed", sans-serif',
                      fontSize: winnerNameFontSize(winner.name),
                      fontWeight: 800,
                      color: '#ffffff',
                      letterSpacing: 2,
                      lineHeight: 1.05,
                      textTransform: 'uppercase',
                      textShadow: `0 0 40px ${winnerAccent}44, 0 4px 24px rgba(0,0,0,0.8), 0 0 2px ${GOLD}`,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      animation: `t3WheelWinnerNameIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) calc(${spinDurationS}s + 0.38s) both`,
                    }}
                  >
                    {winner.name}
                  </div>
                </div>

                {/* Position + class badges */}
                {(winner.position || winner.playerClass) && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                      marginTop: 4,
                      animation: `t3WheelWinnerMetaIn 0.55s ease-out calc(${spinDurationS}s + 0.52s) both`,
                    }}
                  >
                    {winner.position && (
                      <span
                        style={{
                          fontFamily: '"Nunito", sans-serif',
                          fontSize: 17,
                          fontWeight: 700,
                          color: 'rgba(255,255,255,0.72)',
                          letterSpacing: 3,
                          textTransform: 'uppercase',
                          padding: '6px 0',
                        }}
                      >
                        {winner.position}
                      </span>
                    )}
                    {winner.position && winner.playerClass && (
                      <span style={{ color: 'rgba(185,170,98,0.45)', fontSize: 20 }}>◆</span>
                    )}
                    {winner.playerClass && (
                      <span
                        style={{
                          background: `linear-gradient(135deg, rgba(185,170,98,0.22), rgba(255,197,34,0.12))`,
                          border: `1.5px solid ${GOLD}`,
                          borderRadius: 999,
                          padding: '5px 18px',
                          fontFamily: '"Nunito", sans-serif',
                          fontSize: 16,
                          fontWeight: 800,
                          color: GOLD_BRIGHT,
                          letterSpacing: 3,
                          textTransform: 'uppercase',
                          boxShadow: `0 0 16px ${GOLD}33`,
                        }}
                      >
                        Class {winner.playerClass}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right decorative corner */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 48,
                  height: 48,
                  borderTop: `2px solid ${GOLD_BRIGHT}66`,
                  borderRight: `2px solid ${GOLD_BRIGHT}66`,
                  borderRadius: '0 8px 0 0',
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WheelSpinT3;
