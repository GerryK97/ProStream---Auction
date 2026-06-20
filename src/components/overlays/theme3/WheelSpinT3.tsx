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
const PANEL = '#2a2f35';

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
    0%   { opacity: 0; transform: translateX(-50%) translateY(40px) scale(0.92); }
    100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }
  @keyframes t3WheelWinnerGlow {
    0%, 100% { box-shadow: 0 0 24px rgba(185,170,98,0.35), 0 0 48px rgba(255,197,34,0.12); }
    50%      { box-shadow: 0 0 48px rgba(185,170,98,0.75), 0 0 80px rgba(255,197,34,0.28); }
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

        {/* Winner card */}
        {winner && (
          <div
            style={{
              position: 'absolute',
              bottom: 56,
              left: '50%',
              minWidth: 480,
              maxWidth: 920,
              padding: '22px 56px 26px',
              textAlign: 'center',
              background: PANEL,
              border: `2px solid ${GOLD}`,
              borderRadius: 16,
              animation: `t3WheelWinnerIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${spinDurationS}s both, t3WheelWinnerGlow 1.6s ease-in-out ${spinDurationS}s infinite`,
            }}
          >
            <div
              style={{
                fontFamily: '"Saira Extra Condensed", sans-serif',
                fontSize: 22,
                fontWeight: 700,
                color: GOLD,
                letterSpacing: 6,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Next Player
            </div>
            {winner.playerNo && (
              <div
                style={{
                  fontFamily: '"Nunito", sans-serif',
                  fontSize: 26,
                  fontWeight: 800,
                  color: 'rgba(255,197,34,0.8)',
                  letterSpacing: 4,
                  marginBottom: 2,
                }}
              >
                #{parseInt(winner.playerNo, 10)}
              </div>
            )}
            <div
              style={{
                fontFamily: '"Saira Extra Condensed", sans-serif',
                fontSize: 64,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: 4,
                lineHeight: 1.05,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {winner.name}
            </div>
            {(winner.position || winner.playerClass) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 10 }}>
                {winner.position && (
                  <span style={{ fontFamily: '"Nunito", sans-serif', fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: 2 }}>
                    {winner.position}
                  </span>
                )}
                {winner.position && winner.playerClass && (
                  <span style={{ color: 'rgba(185,170,98,0.5)', fontSize: 18 }}>·</span>
                )}
                {winner.playerClass && (
                  <span
                    style={{
                      background: 'rgba(185,170,98,0.14)',
                      border: `1px solid rgba(185,170,98,0.45)`,
                      borderRadius: 8,
                      padding: '3px 14px',
                      fontFamily: '"Nunito", sans-serif',
                      fontSize: 18,
                      fontWeight: 800,
                      color: GOLD_BRIGHT,
                      letterSpacing: 2,
                    }}
                  >
                    {winner.playerClass}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default WheelSpinT3;
