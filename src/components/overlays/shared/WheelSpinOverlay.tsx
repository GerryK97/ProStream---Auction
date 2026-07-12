'use client';

import React, { useMemo } from 'react';
import type { WheelSpinEvent } from '@/types/pusher-events';
import { WHEEL_SPIN_DURATION_MS } from '@/lib/wheelSpinTiming';

interface WheelSpinOverlayProps {
  data: WheelSpinEvent;
}

// SVG viewBox constants — 1000×1000 internal coordinate system
const CX = 500;
const CY = 500;
const R  = 455;                   // wheel outer radius
const R_LABEL = Math.round(R * 0.78); // label near outer rim
const R_HUB = 120;                // center hub radius (holds optional image)
const HUB_STROKE = 6;             // stroke width of the hub border

// Color palette — cycles by segment index
const SEGMENT_COLORS = [
  '#3B82F6', '#F59E0B', '#10B981', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#0EA5E9', '#84CC16', '#F43F5E', '#A855F7',
];

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

const WheelSpinOverlay: React.FC<WheelSpinOverlayProps> = ({ data }) => {
  const { players, winner, winnerIndex, centerImageURL } = data;
  const N = players.length;
  const segDeg = 360 / N;

  // Final clockwise rotation so winner lands under top pointer (12 o'clock)
  const winnerCenterAngle = winnerIndex * segDeg + segDeg / 2;
  const alignmentRotation = (360 - winnerCenterAngle % 360 + 360) % 360;
  const finalRotation = 8 * 360 + alignmentRotation; // 8+ full spins

  const spinDurationS = (WHEEL_SPIN_DURATION_MS / 1000).toFixed(1);

  const segments = useMemo(() => players.map((player, i) => {
    const startDeg = i * segDeg - 90;   // -90 so segment 0 starts at 12 o'clock
    const endDeg   = startDeg + segDeg;
    const midDeg   = startDeg + segDeg / 2;
    const lp       = polarXY(CX, CY, R_LABEL, midDeg);
    const color    = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    return { player, startDeg, endDeg, midDeg, lp, color, path: segmentPath(startDeg, endDeg) };
  }), [players, segDeg]);

  // Font size scales with segment arc width so number always fits within its grid area
  // 2 * R_LABEL * sin(π/N) = arc width at label radius; number text width ≈ 1.16 * fontSize (2 chars)
  const labelFontSize = Math.max(16, Math.min(82, Math.round(R_LABEL * Math.sin(Math.PI / N) * 1.55)));

  const getPlayerLabel = (player: WheelSpinEvent['players'][number], index: number): string => {
    if (player.playerNo) return String(parseInt(player.playerNo, 10));
    return String(index + 1);
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'var(--overlay-bg-fullscreen, #040508)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes wsEnter {
          0%   { opacity: 0; transform: scale(0.5) rotate(-15deg); }
          60%  { opacity: 1; transform: scale(1.04) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes wsSpin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(var(--ws-final-deg)); }
        }
        @keyframes wsPointer {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes wsWinnerReveal {
          0%   { opacity: 0; transform: translateX(-50%) translateY(50px) scale(0.9); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes wsWinnerGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(var(--overlay-color-primary-rgb, 255,201,25),0.4), 0 0 60px rgba(var(--overlay-color-primary-rgb, 255,201,25),0.15); }
          50%       { box-shadow: 0 0 70px rgba(var(--overlay-color-primary-rgb, 255,201,25),0.85), 0 0 120px rgba(var(--overlay-color-primary-rgb, 255,201,25),0.35); }
        }
        .ws-container {
          animation: wsEnter 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .ws-spin-group {
          transform-box: fill-box;
          transform-origin: 50% 50%;
          animation: wsSpin ${spinDurationS}s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards;
        }
        .ws-pointer {
          animation: wsPointer 0.6s ease-in-out infinite;
          transform-origin: ${CX}px ${CY - R - 44}px;
        }
        .ws-winner-card {
          animation:
            wsWinnerReveal 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) ${spinDurationS}s both,
            wsWinnerGlow   1.5s ease-in-out ${spinDurationS}s infinite;
        }
      `}</style>

      {/* 1920×1080 canvas — outer overlays scale this to fit the viewport */}
      <div style={{ position: 'relative', width: 1920, height: 1080, flexShrink: 0 }}>

        {/* Title */}
        <div style={{
          position: 'absolute',
          top: 48,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: '"Bebas Neue", cursive',
          fontSize: 76,
          color: 'var(--overlay-color-primary, #FFC919)',
          letterSpacing: 12,
          textShadow: '0 0 40px rgba(var(--overlay-color-primary-rgb, 255,201,25),0.55), 0 0 80px rgba(var(--overlay-color-primary-rgb, 255,201,25),0.2)',
        }}>
          SPIN THE WHEEL
        </div>

        {/* Wheel — 880×880, centered in 1920×1080 */}
        <div
          className="ws-container"
          style={{
            position: 'absolute',
            left: (1920 - 880) / 2,
            top:  (1080 - 880) / 2 + 50,
            width: 880,
            height: 880,
          }}
        >
          <svg viewBox="0 0 1000 1000" width="880" height="880" style={{ display: 'block' }}>
            {/* Outer glow rings */}
            <circle cx={CX} cy={CY} r={R + 14} fill="none" stroke="rgba(var(--overlay-color-primary-rgb, 255,201,25),0.28)" strokeWidth="6" />
            <circle cx={CX} cy={CY} r={R + 26} fill="none" stroke="rgba(var(--overlay-color-primary-rgb, 255,201,25),0.10)" strokeWidth="3" />

            {/* Spinning group — segments + labels */}
            <g
              className="ws-spin-group"
              style={{ '--ws-final-deg': `${finalRotation}deg` } as React.CSSProperties}
            >
              {segments.map((seg, i) => (
                <g key={seg.player._id}>
                  {/* Segment fill */}
                  <path
                    d={seg.path}
                    fill={seg.color}
                    stroke="rgba(0,0,0,0.35)"
                    strokeWidth="2"
                    opacity="0.92"
                  />
                  {/* Alternating darker overlay for every other segment */}
                  {i % 2 === 1 && (
                    <path d={seg.path} fill="rgba(0,0,0,0.15)" />
                  )}
                  {/* Player number label */}
                  <text
                    x={seg.lp.x}
                    y={seg.lp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${seg.midDeg + 90}, ${seg.lp.x}, ${seg.lp.y})`}
                    style={{
                      fontFamily: '"Bebas Neue", cursive',
                      fontSize: labelFontSize,
                      fontWeight: 700,
                      fill: '#fff',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    } as React.CSSProperties}
                  >
                    {getPlayerLabel(seg.player, i)}
                  </text>
                </g>
              ))}

            </g>

            {/* Center hub — rendered OUTSIDE the spinning group so the image stays upright */}
            <defs>
              <clipPath id="ws-hub-clip">
                <circle cx={CX} cy={CY} r={R_HUB - HUB_STROKE} />
              </clipPath>
            </defs>
            <circle
              cx={CX}
              cy={CY}
              r={R_HUB}
              fill="var(--overlay-bg-fullscreen, #0d1117)"
              stroke="var(--overlay-color-primary, #FFC919)"
              strokeWidth={HUB_STROKE}
            />
            {centerImageURL ? (
              <image
                href={centerImageURL}
                x={CX - (R_HUB - HUB_STROKE)}
                y={CY - (R_HUB - HUB_STROKE)}
                width={(R_HUB - HUB_STROKE) * 2}
                height={(R_HUB - HUB_STROKE) * 2}
                clipPath="url(#ws-hub-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <text
                x={CX}
                y={CY + 4}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontFamily: '"Bebas Neue", cursive',
                  fontSize: 54,
                  fill: 'var(--overlay-color-primary, #FFC919)',
                  letterSpacing: 6,
                } as React.CSSProperties}
              >
                SPIN
              </text>
            )}

            {/* Fixed pointer — NOT inside the spinning group */}
            <g className="ws-pointer">
              {/* Pointer shadow */}
              <polygon
                points={`${CX - 22},${CY - R - 44} ${CX + 22},${CY - R - 44} ${CX},${CY - R + 16}`}
                fill="rgba(0,0,0,0.4)"
                transform="translate(3,3)"
              />
              {/* Pointer */}
              <polygon
                points={`${CX - 22},${CY - R - 44} ${CX + 22},${CY - R - 44} ${CX},${CY - R + 16}`}
                fill="var(--overlay-color-primary, #FFC919)"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>

        {/* Winner reveal card — appears after spin ends */}
        {winner && (
          <div
            className="ws-winner-card"
            style={{
              position: 'absolute',
              bottom: 64,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--overlay-bg-panel, #0f0c29)',
              border: '2px solid var(--overlay-color-primary, #FFC919)',
              borderRadius: 24,
              padding: '24px 60px 28px',
              textAlign: 'center',
              minWidth: 520,
              maxWidth: 900,
            }}
          >
            <div style={{
              fontFamily: '"Rajdhani", sans-serif',
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--overlay-color-primary, #FFC919)',
              letterSpacing: 6,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              Next Player
            </div>
            {/* Player number badge */}
            {winner.playerNo && (
              <div style={{
                fontFamily: '"Bebas Neue", cursive',
                fontSize: 30,
                color: 'rgba(var(--overlay-color-primary-rgb, 255,201,25),0.75)',
                letterSpacing: 8,
                lineHeight: 1,
                marginBottom: 4,
              }}>
                #{parseInt(winner.playerNo, 10)}
              </div>
            )}
            {/* Player name */}
            <div style={{
              fontFamily: '"Bebas Neue", cursive',
              fontSize: 68,
              color: '#FFFFFF',
              letterSpacing: 6,
              lineHeight: 1.05,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {winner.name}
            </div>
            {(winner.position || winner.playerClass) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                marginTop: 12,
              }}>
                {winner.position && (
                  <span style={{
                    fontFamily: '"Rajdhani", sans-serif',
                    fontSize: 22,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.6)',
                    letterSpacing: 3,
                  }}>
                    {winner.position}
                  </span>
                )}
                {winner.position && winner.playerClass && (
                  <span style={{ color: 'rgba(var(--overlay-color-primary-rgb, 255,201,25),0.4)', fontSize: 20 }}>·</span>
                )}
                {winner.playerClass && (
                  <span style={{
                    background: 'rgba(var(--overlay-color-primary-rgb, 255,201,25),0.14)',
                    border: '1px solid rgba(var(--overlay-color-primary-rgb, 255,201,25),0.4)',
                    borderRadius: 8,
                    padding: '3px 16px',
                    fontFamily: '"Rajdhani", sans-serif',
                    fontSize: 20,
                    fontWeight: 600,
                    color: 'var(--overlay-color-primary, #FFC919)',
                    letterSpacing: 3,
                  }}>
                    {winner.playerClass}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WheelSpinOverlay;
