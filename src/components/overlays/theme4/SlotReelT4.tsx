'use client';

import React, { useMemo } from 'react';
import type { Player, Tournament } from '@/types';
import type { WheelSpinEvent } from '@/types/pusher-events';
import { buildImageUrl } from '@/lib/cloudinaryUtils';
import { WHEEL_SPIN_DURATION_MS } from '@/lib/wheelSpinTiming';

interface SlotReelT4Props {
  data: WheelSpinEvent;
  /** Full player list for resolving winner photo/name (spin payload carries ids only). */
  allPlayers?: Player[];
  /** Tournament config — streamer logo beside the reel; name + `logoURL` in the top header. */
  tournament?: Tournament | null;
}

const TILE_H = 160;
const TILE_W = 280;
const VISIBLE_TILES = 3;
const WINDOW_H = TILE_H * VISIBLE_TILES;
const MAX_UNIQUE = 16;
const CYCLES = 8;
const CENTER_INDEX = 1;

const GOLD_HI = 'var(--t4-shield-gold-hi, #F3E2A0)';
const GOLD = 'var(--t4-shield-gold, #D4AF37)';
const GOLD_MID = 'var(--t4-shield-gold-mid, #B8860B)';
const NAME_GOLD = 'var(--t4-name-gold, #F0D878)';
const LABEL_FONT = 'var(--t4-font-label, "Oswald", "Arial Narrow", sans-serif)';
const NAME_FONT = 'var(--t4-font-name, "Bebas Neue", "Oswald", Impact, sans-serif)';

const TILE_FILLS = ['#0E1628', '#1A2740', '#16120A', '#121C30'] as const;

const CRISP_TEXT: React.CSSProperties = {
  textRendering: 'geometricPrecision',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
};

const CSS = `
  @keyframes t4ReelEnter {
    0%   { opacity: 0; transform: translateY(48px) scale(0.92); filter: blur(8px); }
    70%  { opacity: 1; transform: translateY(-6px) scale(1.02); filter: blur(0); }
    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  }
  @keyframes t4ReelSpin {
    0%   { transform: translateY(0); filter: blur(1.6px); }
    72%  { filter: blur(0.5px); }
    100% { transform: translateY(var(--t4-reel-final-y)); filter: blur(0); }
  }
  @keyframes t4ReelTitleIn {
    0%   { opacity: 0; letter-spacing: 28px; transform: translateY(-18px); }
    100% { opacity: 1; letter-spacing: 12px; transform: translateY(0); }
  }
  @keyframes t4ReelTitlePulse {
    0%, 100% { text-shadow: 0 2px 0 rgba(0,0,0,0.85), 0 0 20px rgba(212,175,55,0.28); }
    50%      { text-shadow: 0 2px 0 rgba(0,0,0,0.85), 0 0 36px rgba(240,216,120,0.55), 0 0 64px rgba(212,175,55,0.25); }
  }
  @keyframes t4ReelBezelShine {
    0%   { opacity: 0.2; }
    45%  { opacity: 0.85; }
    100% { opacity: 0.25; }
  }
  @keyframes t4ReelPointer {
    0%, 100% { transform: translateY(-50%) scaleX(1); }
    50%      { transform: translateY(-50%) scaleX(1.08); }
  }
  @keyframes t4ReelLockGlow {
    0%, 100% {
      box-shadow: inset 0 0 0 2px rgba(212,175,55,0.5), 0 0 18px rgba(212,175,55,0.18);
    }
    50% {
      box-shadow: inset 0 0 0 3px rgba(243,226,160,0.9), 0 0 32px rgba(212,175,55,0.42);
    }
  }
  @keyframes t4ReelWinnerIn {
    0%   { opacity: 0; transform: translateX(-50%) translateY(56px) scale(0.92); }
    100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }
  @keyframes t4ReelWinnerGlow {
    0%, 100% { box-shadow: 0 12px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(212,175,55,0.35); }
    50%      { box-shadow: 0 16px 48px rgba(0,0,0,0.7), 0 0 28px rgba(212,175,55,0.35), 0 0 0 1px rgba(243,226,160,0.55); }
  }
  @keyframes t4ReelWinnerPhotoIn {
    0%   { opacity: 0; transform: scale(0.7); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes t4ReelWinnerLabelIn {
    0%   { opacity: 0; letter-spacing: 16px; }
    100% { opacity: 1; letter-spacing: 0.28em; }
  }
  @keyframes t4ReelWinnerNameIn {
    0%   { opacity: 0; transform: translateY(16px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes t4ReelWinnerMetaIn {
    0%   { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .t4-reel-strip { animation-duration: 0.01ms !important; filter: none !important; }
    .t4-reel-enter, .t4-reel-title, .t4-reel-pointer,
    .t4-reel-winner, .t4-reel-bezel-shine, .t4-reel-lock { animation: none !important; }
  }
`;

function resolveAsset(src?: string, size = 400): string {
  const raw = src?.trim();
  if (!raw) return '';
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
  return buildImageUrl(raw, { width: size, height: size });
}

function hubImageSrc(centerImageURL?: string, tournament?: Tournament | null): string {
  return resolveAsset(centerImageURL, 400) || resolveAsset(tournament?.wheelCenterImageURL, 400);
}

function GoldRingLogo({ src, size, fallback }: { src: string; size: number; fallback?: string }) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        padding: Math.max(4, Math.round(size * 0.036)),
        background: 'linear-gradient(160deg, #EDD989 0%, #D4AF37 40%, #A67C1A 100%)',
        boxShadow: '0 10px 32px rgba(0,0,0,0.55), 0 0 24px rgba(212,175,55,0.22)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#0A0C10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid rgba(255,248,220,0.2)',
        }}
      >
        {src ? (
          <img
            src={src}
            alt=""
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span
            style={{
              fontFamily: NAME_FONT,
              fontSize: Math.round(size * 0.17),
              color: NAME_GOLD,
              letterSpacing: 4,
            }}
          >
            {fallback ?? ''}
          </span>
        )}
      </div>
    </div>
  );
}

function tournamentNameFontSize(name: string): number {
  if (name.length > 36) return 34;
  if (name.length > 28) return 42;
  if (name.length > 20) return 50;
  return 56;
}

function resolvePhoto(player: Player | null | undefined, size: number): string | null {
  const raw = player?.photoURL?.trim() || player?.secondaryImageURL?.trim() || '';
  if (!raw) return null;
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
  return buildImageUrl(raw, { width: size, height: size, fit: 'fill' });
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

function formatPlayerNo(rawNo?: string, fallbackIndex?: number): string {
  if (rawNo) return String(parseInt(rawNo, 10) || rawNo);
  if (fallbackIndex != null) return String(fallbackIndex + 1);
  return '';
}

interface ReelFace {
  _id: string;
  playerNo?: string;
}

function buildUniqueFaces(
  eventPlayers: WheelSpinEvent['players'],
  winnerId: string,
  allPlayers: Player[],
): { faces: ReelFace[]; winnerSlot: number } {
  const byId = new Map(allPlayers.map((p) => [p._id, p]));

  const resolved: ReelFace[] = eventPlayers.map((p) => {
    const full = byId.get(p._id);
    return {
      _id: p._id,
      playerNo: p.playerNo || full?.playerNo,
    };
  });

  if (resolved.length === 0) {
    return { faces: [], winnerSlot: 0 };
  }

  const winnerFromList = resolved.find((f) => f._id === winnerId);
  const winnerFace =
    winnerFromList ??
    (() => {
      const full = byId.get(winnerId);
      return {
        _id: winnerId,
        playerNo: full?.playerNo,
      } satisfies ReelFace;
    })();

  if (resolved.length <= MAX_UNIQUE) {
    const slot = Math.max(0, resolved.findIndex((f) => f._id === winnerId));
    return { faces: resolved, winnerSlot: slot === -1 ? 0 : slot };
  }

  const others = resolved.filter((f) => f._id !== winnerId);
  const take = MAX_UNIQUE - 1;
  const sampled: ReelFace[] = [];
  if (others.length <= take) {
    sampled.push(...others);
  } else {
    const step = others.length / take;
    for (let i = 0; i < take; i++) {
      sampled.push(others[Math.min(others.length - 1, Math.floor(i * step))]);
    }
  }
  const winnerSlot = Math.min(Math.floor(sampled.length / 2), sampled.length);
  sampled.splice(winnerSlot, 0, winnerFace);
  return { faces: sampled, winnerSlot };
}

/**
 * Theme 4 slot reel — player-number strip that decelerates onto the pre-chosen winner.
 * Same timing + winner math as the shared wheel-spin event; OverlayWrapper owns mode lifecycle.
 */
const SlotReelT4: React.FC<SlotReelT4Props> = ({
  data,
  allPlayers = [],
  tournament = null,
}) => {
  const { players, winner, winnerId, centerImageURL } = data;
  const hubLogoSrc = useMemo(
    () => hubImageSrc(centerImageURL, tournament),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [centerImageURL, tournament?.wheelCenterImageURL, tournament],
  );
  const tournamentLogoSrc = useMemo(
    () => resolveAsset(tournament?.logoURL, 240),
    [tournament?.logoURL],
  );
  const tournamentName = tournament?.name?.trim() || '';

  const spinDurationS = (WHEEL_SPIN_DURATION_MS / 1000).toFixed(1);

  const { faces, winnerSlot } = useMemo(
    () => buildUniqueFaces(players, winnerId || winner?._id, allPlayers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [players, winnerId, winner?._id, allPlayers],
  );

  const strip = useMemo(() => {
    const rows: Array<ReelFace & { key: string }> = [];
    for (let cycle = 0; cycle < CYCLES; cycle++) {
      for (let i = 0; i < faces.length; i++) {
        const face = faces[i];
        rows.push({ ...face, key: `${face._id}-${cycle}-${i}` });
      }
    }
    return rows;
  }, [faces]);

  const uniqueCount = Math.max(faces.length, 1);
  const landingIndex = (CYCLES - 1) * uniqueCount + winnerSlot;
  const finalY = TILE_H * (CENTER_INDEX - landingIndex);

  const winnerPlayer = useMemo(
    () => (winner ? allPlayers.find((p) => p._id === winner._id) ?? null : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allPlayers, winner?._id, winner],
  );
  const winnerPhotoSrc = useMemo(() => resolvePhoto(winnerPlayer, 360), [winnerPlayer]);

  const groupWidth = 168 + 36 + 28 + TILE_W + 28;
  const groupLeft = (1920 - groupWidth) / 2;
  const groupTop = (1080 - WINDOW_H) / 2 - 12;

  return (
    <>
      <style>{CSS}</style>
      <div
        data-t4-element="slot-reel"
        data-t4-label="Theme 4 Slot Reel"
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

        <div
          className="t4-reel-title"
          data-t4-element="reel-title"
          style={{
            position: 'absolute',
            top: 28,
            left: 80,
            right: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            animation:
              't4ReelTitleIn 0.7s cubic-bezier(0.22,1,0.36,1) both, t4ReelTitlePulse 2.6s ease-in-out 0.7s infinite',
          }}
        >
          {(tournamentLogoSrc || tournamentName) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 22,
                maxWidth: '100%',
              }}
            >
              {tournamentLogoSrc ? <GoldRingLogo src={tournamentLogoSrc} size={88} /> : null}
              {tournamentName ? (
                <div
                  style={{
                    fontFamily: NAME_FONT,
                    fontSize: tournamentNameFontSize(tournamentName),
                    fontWeight: 400,
                    color: NAME_GOLD,
                    letterSpacing: 6,
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 1400,
                    textShadow: '0 2px 0 rgba(0,0,0,0.85), 0 0 20px rgba(212,175,55,0.28)',
                  }}
                >
                  {tournamentName}
                </div>
              ) : null}
            </div>
          )}
          <div
            style={{
              fontFamily: NAME_FONT,
              fontSize: tournamentName ? 40 : 72,
              fontWeight: 400,
              color: tournamentName ? GOLD : NAME_GOLD,
              letterSpacing: tournamentName ? 10 : 12,
              textTransform: 'uppercase',
            }}
          >
            Selecting Player
          </div>
        </div>

        <div
          className="t4-reel-enter"
          data-t4-element="reel"
          style={{
            position: 'absolute',
            left: groupLeft,
            top: groupTop,
            width: groupWidth,
            height: WINDOW_H,
            display: 'flex',
            alignItems: 'center',
            animation: 't4ReelEnter 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards',
          }}
        >
          <GoldRingLogo src={hubLogoSrc} size={168} fallback="DRAW" />

          <div style={{ width: 36, flexShrink: 0 }} />

          {/* Left chevron pointer */}
          <div
            className="t4-reel-pointer"
            aria-hidden
            style={{
              position: 'relative',
              width: 28,
              height: WINDOW_H,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                right: 2,
                width: 0,
                height: 0,
                borderTop: '16px solid transparent',
                borderBottom: '16px solid transparent',
                borderLeft: `22px solid ${GOLD}`,
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))',
                animation: 't4ReelPointer 0.7s ease-in-out infinite',
              }}
            />
          </div>

          {/* Slot window */}
          <div
            style={{
              position: 'relative',
              width: TILE_W,
              height: WINDOW_H,
              flexShrink: 0,
              borderRadius: 4,
              padding: 8,
              background: 'linear-gradient(160deg, #EDD989 0%, #D4AF37 42%, #A67C1A 100%)',
              boxShadow: '0 18px 48px rgba(0,0,0,0.62), 0 0 28px rgba(212,175,55,0.2)',
            }}
          >
            <div
              className="t4-reel-bezel-shine"
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 4,
                pointerEvents: 'none',
                background:
                  'linear-gradient(180deg, rgba(255,248,220,0.35) 0%, transparent 28%, transparent 72%, rgba(0,0,0,0.35) 100%)',
                animation: 't4ReelBezelShine 2.8s ease-in-out infinite',
              }}
            />
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                background: '#05070C',
                boxShadow: 'inset 0 0 0 2px rgba(10,12,16,0.85)',
              }}
            >
              <div
                className="t4-reel-strip"
                style={{
                  willChange: 'transform',
                  animation: `t4ReelSpin ${spinDurationS}s cubic-bezier(0.12, 0.72, 0.08, 1) forwards`,
                  ['--t4-reel-final-y' as string]: `${finalY}px`,
                }}
              >
                {strip.map((face, i) => {
                  const no = formatPlayerNo(face.playerNo, i % uniqueCount);
                  return (
                    <div
                      key={face.key}
                      style={{
                        height: TILE_H,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        background: TILE_FILLS[i % TILE_FILLS.length],
                        borderBottom: '1px solid rgba(212,175,55,0.22)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: NAME_FONT,
                          fontSize: 92,
                          lineHeight: 1,
                          color: NAME_GOLD,
                          letterSpacing: 4,
                          textShadow: '0 4px 18px rgba(0,0,0,0.65), 0 0 18px rgba(212,175,55,0.28)',
                        }}
                      >
                        {no ? `#${no}` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Edge fade */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background:
                    'linear-gradient(180deg, rgba(5,7,12,0.88) 0%, transparent 18%, transparent 82%, rgba(5,7,12,0.9) 100%)',
                }}
              />

              {/* Center lock row */}
              <div
                className="t4-reel-lock"
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: TILE_H,
                  height: TILE_H,
                  pointerEvents: 'none',
                  borderTop: `1px solid ${GOLD_HI}99`,
                  borderBottom: `1px solid ${GOLD_HI}99`,
                  background: 'rgba(212,175,55,0.06)',
                  animation: `t4ReelLockGlow 1.8s ease-in-out ${spinDurationS}s infinite`,
                }}
              />
            </div>
          </div>

          {/* Right chevron pointer */}
          <div
            className="t4-reel-pointer"
            aria-hidden
            style={{
              position: 'relative',
              width: 28,
              height: WINDOW_H,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 2,
                width: 0,
                height: 0,
                borderTop: '16px solid transparent',
                borderBottom: '16px solid transparent',
                borderRight: `22px solid ${GOLD}`,
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))',
                animation: 't4ReelPointer 0.7s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {winner && (
          <div
            className="t4-reel-winner"
            data-t4-element="reel-winner"
            style={{
              position: 'absolute',
              bottom: 48,
              left: '50%',
              width: 980,
              zIndex: 40,
              animation: `t4ReelWinnerIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${spinDurationS}s both`,
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
                borderTop: '1px solid rgba(243,226,160,0.5)',
                borderBottom: '1px solid rgba(212,175,55,0.28)',
                animation: `t4ReelWinnerGlow 2.4s ease-in-out ${spinDurationS}s infinite`,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  padding: 4,
                  background: 'linear-gradient(160deg, #EDD989 0%, #D4AF37 40%, #A67C1A 100%)',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.55), 0 0 20px rgba(212,175,55,0.25)',
                  animation: `t4ReelWinnerPhotoIn 0.55s cubic-bezier(0.22,1,0.36,1) calc(${spinDurationS}s + 0.1s) both`,
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
                    animation: `t4ReelWinnerLabelIn 0.5s ease-out calc(${spinDurationS}s + 0.16s) both`,
                  }}
                >
                  Next Player
                  {winner.playerNo ? `  ·  #${parseInt(winner.playerNo, 10)}` : ''}
                </div>

                <div
                  data-t4-element="reel-winner-name"
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
                    animation: `t4ReelWinnerNameIn 0.55s cubic-bezier(0.22,1,0.36,1) calc(${spinDurationS}s + 0.28s) both`,
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
                      animation: `t4ReelWinnerMetaIn 0.45s ease-out calc(${spinDurationS}s + 0.4s) both`,
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
                          border: '1px solid rgba(212,175,55,0.45)',
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

export default SlotReelT4;
