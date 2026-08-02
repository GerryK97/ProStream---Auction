'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AuctionState, Player, Team, Tournament } from '@/types';
import { optimizeImage } from '@/lib/imageOptimization';
import ResilientImage from '../shared/ResilientImage';
import {
  getT4LargeCardOffset,
  t4LargeNameFontSize,
  T4_LARGE_BASE_AMOUNT_SIZE,
  T4_LARGE_BASE_LABEL_SIZE,
  T4_LARGE_CARD_H,
  T4_LARGE_CARD_W,
  T4_LARGE_ENTER_MS,
  T4_LARGE_EXIT_MS,
  T4_LARGE_FOOTER_H,
  T4_LARGE_NUMBER_SIZE,
  T4_LARGE_NO_LABEL_SIZE,
  T4_LARGE_PHOTO_H,
  T4_LARGE_POSITION_SIZE,
  T4_LARGE_SOLD_HOLD_MS,
  T4_LARGE_UNSOLD_HOLD_MS,
} from './portraitPlayerCardT4Layout';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import { formatT4Amount } from './frame15PlayerCardT4Layout';

const LABEL_FONT = 'var(--t4-font-label, "Oswald", "Arial Narrow", sans-serif)';
const NAME_FONT = 'var(--t4-font-name, "Bebas Neue", "Oswald", Impact, sans-serif)';

const CRISP_TEXT: React.CSSProperties = {
  textRendering: 'geometricPrecision',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  fontKerning: 'none',
  fontSynthesis: 'none',
};

type CardPhase =
  | 'entering'
  | 'livePending'
  | 'liveBidding'
  | 'soldReveal'
  | 'unsoldReveal'
  | 'exiting';

export interface PortraitPlayerCardT4Props {
  currentPlayer: Player;
  auctionState: AuctionState;
  teams: Team[];
  tournament: Tournament | null;
  visible: boolean;
}

function resolvePhoto(player: Player): string | null {
  const raw = player.photoURL?.trim() || player.secondaryImageURL?.trim() || '';
  if (!raw) return null;
  if (raw.startsWith('data:')) return raw;
  return optimizeImage(raw, {
    width: T4_LARGE_CARD_W * 2,
    height: T4_LARGE_PHOTO_H * 2,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

/** Theme 4 Player Card LARGE — centered photo + footer (number / name / base). */
export function PortraitPlayerCardT4({
  currentPlayer,
  auctionState,
  tournament,
  visible,
}: PortraitPlayerCardT4Props) {
  const [phase, setPhase] = useState<CardPhase>('entering');
  const [dismissed, setDismissed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [enterActive, setEnterActive] = useState(false);

  const prevStatusRef = useRef(auctionState.currentAuctionStatus);
  const prevUnsoldRef = useRef(!!currentPlayer.isUnsold);
  const prevPlayerIdRef = useRef(currentPlayer._id);
  const prevAuctionPlayerIdRef = useRef(auctionState.currentPlayerId);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const photoSrc = resolvePhoto(currentPlayer);
  const initials = currentPlayer.name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
  const position = currentPlayer.position?.trim() || '';
  const playerNo = currentPlayer.playerNo?.trim()
    ? String(parseInt(currentPlayer.playerNo, 10) || currentPlayer.playerNo.trim())
    : '';
  const basePrice = getClassBasePrice(tournament, currentPlayer);
  const { left, top } = getT4LargeCardOffset();

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  };

  const resetForLivePlayer = () => {
    prevPlayerIdRef.current = currentPlayer._id;
    prevAuctionPlayerIdRef.current = auctionState.currentPlayerId;
    prevStatusRef.current = auctionState.currentAuctionStatus;
    prevUnsoldRef.current = !!currentPlayer.isUnsold;
    setDismissed(false);
    setPhase('entering');
    clearTimers();
    schedule(() => {
      setPhase(
        auctionState.currentAuctionStatus === 'Bidding' ? 'liveBidding' : 'livePending',
      );
    }, reducedMotion ? 0 : T4_LARGE_ENTER_MS);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (phase === 'entering' && !reducedMotion) {
      setEnterActive(false);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnterActive(true));
      });
      return () => cancelAnimationFrame(raf);
    }
    if (phase !== 'entering') setEnterActive(false);
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (!visible) {
      setPhase('exiting');
      schedule(() => setDismissed(true), reducedMotion ? 0 : T4_LARGE_EXIT_MS);
      return;
    }
    setDismissed(false);
    setPhase('entering');
    schedule(() => {
      setPhase(
        auctionState.currentAuctionStatus === 'Bidding' ? 'liveBidding' : 'livePending',
      );
    }, reducedMotion ? 0 : T4_LARGE_ENTER_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    const auctionPlayerId = auctionState.currentPlayerId;
    const playerChanged =
      auctionPlayerId !== prevAuctionPlayerIdRef.current ||
      currentPlayer._id !== prevPlayerIdRef.current;
    if (playerChanged) {
      resetForLivePlayer();
      return;
    }
    prevStatusRef.current = auctionState.currentAuctionStatus;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionState.currentPlayerId, currentPlayer._id, auctionState.currentAuctionStatus]);

  useEffect(() => {
    if (phase === 'exiting' || phase === 'entering') return;
    const status = auctionState.currentAuctionStatus;
    const was = prevStatusRef.current;
    prevStatusRef.current = status;

    if (status === 'Sold' && was !== 'Sold') {
      setPhase('soldReveal');
      clearTimers();
      schedule(() => {
        setPhase('exiting');
        schedule(() => setDismissed(true), reducedMotion ? 0 : T4_LARGE_EXIT_MS);
      }, T4_LARGE_SOLD_HOLD_MS);
    } else if (status === 'Bidding' && phase !== 'liveBidding') {
      setPhase('liveBidding');
    } else if (status === 'Pending' && phase === 'liveBidding') {
      setPhase('livePending');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionState.currentAuctionStatus, phase, reducedMotion]);

  useEffect(() => {
    if (phase === 'exiting' || phase === 'entering') return;
    const unsold = !!currentPlayer.isUnsold;
    if (unsold && !prevUnsoldRef.current) {
      prevUnsoldRef.current = true;
      setPhase('unsoldReveal');
      clearTimers();
      schedule(() => {
        setPhase('exiting');
        schedule(() => setDismissed(true), reducedMotion ? 0 : T4_LARGE_EXIT_MS);
      }, T4_LARGE_UNSOLD_HOLD_MS);
    }
    prevUnsoldRef.current = unsold;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer.isUnsold, phase, reducedMotion]);

  useEffect(() => () => clearTimers(), []);

  if (!visible || dismissed) return null;

  const isEntering = phase === 'entering';
  const isExiting = phase === 'exiting';
  const showUnsold = phase === 'unsoldReveal';
  const desaturate = showUnsold;

  const cardTransform = isExiting
    ? 'translateY(36px) scale(0.97)'
    : phase === 'entering' && !enterActive && !reducedMotion
      ? 'translateY(48px) scale(0.96)'
      : 'translateY(0) scale(1)';
  const cardOpacity =
    isExiting ? 0 : phase === 'entering' && !enterActive && !reducedMotion ? 0 : 1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@500;600;700&display=swap');
        @keyframes t4LargePhotoIn {
          from { opacity: 0; transform: scale(1.04); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes t4LargeFooterIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes t4LargeFooterShimmer {
          0%   { transform: translateX(-120%); opacity: 0; }
          18%  { opacity: 0.55; }
          42%  { opacity: 0.35; }
          70%  { transform: translateX(220%); opacity: 0; }
          100% { transform: translateX(220%); opacity: 0; }
        }
        @keyframes t4LargeFooterGlow {
          0%, 100% { opacity: 0.22; }
          50%      { opacity: 0.42; }
        }
        .t4-large-enter { transition: transform ${T4_LARGE_ENTER_MS}ms cubic-bezier(0.22,1,0.36,1), opacity ${T4_LARGE_ENTER_MS}ms ease; }
        .t4-large-exit  { transition: transform ${T4_LARGE_EXIT_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${T4_LARGE_EXIT_MS}ms ease; }
        .t4-large-photo-enter { animation: t4LargePhotoIn 420ms cubic-bezier(0.22,1,0.36,1) 80ms both; }
        .t4-large-footer-enter { animation: t4LargeFooterIn 420ms cubic-bezier(0.22,1,0.36,1) 140ms both; }
        .t4-large-footer-shimmer {
          animation: t4LargeFooterShimmer 4.8s ease-in-out infinite;
        }
        .t4-large-footer-glow {
          animation: t4LargeFooterGlow 3.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .t4-large-photo-enter, .t4-large-footer-enter,
          .t4-large-footer-shimmer, .t4-large-footer-glow { animation: none !important; }
        }
      `}</style>

      <div
        key={currentPlayer._id}
        data-t4-element="player-card-large"
        data-t4-label="Theme 4 Player Card Large"
        className={`${isEntering ? 't4-large-enter' : ''} ${isExiting ? 't4-large-exit' : ''}`}
        style={{
          position: 'absolute',
          left,
          top,
          width: T4_LARGE_CARD_W,
          height: T4_LARGE_CARD_H,
          zIndex: 49,
          // none on shell so empty canvas stays click-through; children opt in for preview selection
          pointerEvents: 'none',
          transform: cardTransform,
          opacity: cardOpacity,
          filter: desaturate ? 'saturate(0.35) brightness(0.8)' : undefined,
          ...CRISP_TEXT,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow:
              '0 16px 48px rgba(0,0,0,0.65), 0 0 28px rgba(212,175,55,0.18)',
            overflow: 'hidden',
            pointerEvents: 'auto',
          }}
        >
          {/* Photo — full-bleed, no frame */}
          <div
            className={isEntering && !reducedMotion ? 't4-large-photo-enter' : ''}
            data-t4-element="player-card-large-photo"
            data-t4-label="Theme 4 Large Photo"
            style={{
              position: 'relative',
              height: T4_LARGE_PHOTO_H,
              flexShrink: 0,
              overflow: 'hidden',
              background: 'var(--t4-bg-photo, #0A0C10)',
              zIndex: 2,
              pointerEvents: 'auto',
            }}
          >
            {photoSrc ? (
              <ResilientImage
                src={photoSrc}
                alt={currentPlayer.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: NAME_FONT,
                    fontSize: 96,
                    color: 'rgba(255,255,255,0.18)',
                    ...CRISP_TEXT,
                  }}
                >
                  {initials || '?'}
                </span>
              </div>
            )}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, transparent 58%, rgba(0,0,0,0.55) 100%)',
                pointerEvents: 'none',
              }}
            />
            {showUnsold && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 4,
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: LABEL_FONT,
                    fontSize: 42,
                    fontWeight: 700,
                    color: 'var(--t4-danger, #E85A5A)',
                    border: '3px solid var(--t4-danger, #E85A5A)',
                    padding: '4px 14px',
                    transform: 'rotate(-12deg)',
                    textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                    textTransform: 'uppercase',
                    ...CRISP_TEXT,
                  }}
                >
                  UNSOLD
                </span>
              </div>
            )}
          </div>

          {/* Footer — full-width, mobile-readable type */}
          <div
            className={isEntering && !reducedMotion ? 't4-large-footer-enter' : ''}
            data-t4-element="player-card-large-footer"
            data-t4-label="Theme 4 Large Footer"
            style={{
              position: 'relative',
              width: '100%',
              height: T4_LARGE_FOOTER_H,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              boxSizing: 'border-box',
              background: 'var(--t4-bg-photo, #0A0C10)',
              borderTop: '1px solid rgba(243,226,160,0.45)',
              zIndex: 3,
              overflow: 'hidden',
              pointerEvents: 'auto',
            }}
          >
            {/* Soft gold pulse + travelling shimmer */}
            {!reducedMotion && (
              <>
                <div
                  aria-hidden
                  className="t4-large-footer-glow"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 280,
                    height: 100,
                    marginLeft: -140,
                    marginTop: -50,
                    background:
                      'radial-gradient(ellipse at center, rgba(212,175,55,0.28) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
                <div
                  aria-hidden
                  className="t4-large-footer-shimmer"
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: '38%',
                    background:
                      'linear-gradient(105deg, transparent 0%, rgba(243,226,160,0.14) 45%, rgba(255,248,220,0.22) 50%, rgba(243,226,160,0.12) 55%, transparent 100%)',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
              </>
            )}

            {/* Player number */}
            {playerNo ? (
              <div
                data-t4-element="player-number"
                style={{
                  position: 'relative',
                  zIndex: 1,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingRight: 10,
                  borderRight: '1px solid rgba(212,175,55,0.4)',
                  lineHeight: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: LABEL_FONT,
                    fontSize: T4_LARGE_NO_LABEL_SIZE,
                    fontWeight: 700,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--t4-name-gold, #F0D878)',
                    marginBottom: 4,
                    ...CRISP_TEXT,
                  }}
                >
                  No
                </span>
                <span
                  style={{
                    fontFamily: NAME_FONT,
                    fontSize: T4_LARGE_NUMBER_SIZE,
                    letterSpacing: 1,
                    color: 'var(--t4-name-gold, #F0D878)',
                    lineHeight: 0.9,
                    textShadow: '0 2px 6px rgba(0,0,0,0.85)',
                    ...CRISP_TEXT,
                  }}
                >
                  {playerNo}
                </span>
              </div>
            ) : null}

            {/* Name + position */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <span
                data-t4-element="player-name"
                style={{
                  fontFamily: NAME_FONT,
                  fontSize: t4LargeNameFontSize(currentPlayer.name.length),
                  fontWeight: 400,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: 'var(--t4-name-gold, #F0D878)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1,
                  textShadow: '0 2px 6px rgba(0,0,0,0.85)',
                  ...CRISP_TEXT,
                }}
              >
                {currentPlayer.name}
              </span>
              {position ? (
                <span
                  data-t4-element="player-position"
                  style={{
                    fontFamily: LABEL_FONT,
                    fontSize: T4_LARGE_POSITION_SIZE,
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'rgba(245,248,255,0.92)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.1,
                    textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                    ...CRISP_TEXT,
                  }}
                >
                  {position}
                </span>
              ) : null}
            </div>

            {/* Base price */}
            <div
              data-t4-element="player-base-price"
              style={{
                position: 'relative',
                zIndex: 1,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: 4,
                paddingLeft: 10,
                borderLeft: '1px solid rgba(212,175,55,0.35)',
              }}
            >
              <span
                style={{
                  fontFamily: LABEL_FONT,
                  fontSize: T4_LARGE_BASE_LABEL_SIZE,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--t4-name-gold, #F0D878)',
                  lineHeight: 1,
                  ...CRISP_TEXT,
                }}
              >
                Base
              </span>
              <span
                style={{
                  fontFamily: LABEL_FONT,
                  fontSize: T4_LARGE_BASE_AMOUNT_SIZE,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  color: 'var(--t4-base-amount, #FFFFFF)',
                  lineHeight: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.75)',
                  ...CRISP_TEXT,
                }}
              >
                {formatT4Amount(basePrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PortraitPlayerCardT4;
