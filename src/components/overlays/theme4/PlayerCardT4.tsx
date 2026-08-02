'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AuctionState, Player, Team, Tournament } from '@/types';
import { optimizeImage } from '@/lib/imageOptimization';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import ResilientImage from '../shared/ResilientImage';
import {
  formatT4Amount,
  getT4CardOffset,
  getT4CardTransformOrigin,
  T4_AMOUNT_SIZE,
  T4_AMOUNT_TRACKING,
  T4_BASE_X,
  T4_BASE_Y,
  T4_BID_X,
  T4_BID_Y,
  T4_CARD_H,
  T4_CARD_SCALE,
  T4_CARD_W,
  T4_ENTER_MS,
  T4_EXIT_MS,
  T4_LABEL_SIZE,
  T4_NAME_H,
  T4_NAME_TRACKING,
  T4_NAME_W,
  T4_NAME_X,
  T4_NAME_Y,
  T4_PANEL_BODY_H,
  T4_PANEL_HEADER_H,
  T4_PANEL_H,
  T4_PANEL_W,
  T4_SHIELD_INNER_H,
  T4_SHIELD_INNER_W,
  T4_SHIELD_INNER_X,
  T4_SHIELD_INNER_Y,
  T4_SOLD_HOLD_MS,
  T4_UNSOLD_HOLD_MS,
  t4NameFontSize,
} from './frame15PlayerCardT4Layout';
import { TICKER_T4_HEIGHT } from './TickerT4';
import {
  T4_SHIELD_INNER_PATH,
  T4_SHIELD_PATH,
  T4_SHIELD_VB_H,
  T4_SHIELD_VB_W,
} from './t4ShieldPath';

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

export interface PlayerCardT4Props {
  currentPlayer: Player;
  auctionState: AuctionState;
  teams: Team[];
  tournament: Tournament | null;
  visible: boolean;
  /** Lift card above Theme 4 Prime ticker when visible. */
  tickerVisible?: boolean;
}

function resolvePhoto(player: Player): string | null {
  const raw = player.photoURL?.trim() || player.secondaryImageURL?.trim() || '';
  if (!raw) return null;
  if (raw.startsWith('data:')) return raw;
  return optimizeImage(raw, {
    width: T4_SHIELD_INNER_W * 2,
    height: T4_SHIELD_INNER_H * 2,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

/** Staggered two-tier panel matching Frame 15 (outer tier longer). */
function PricePanel({
  label,
  amount,
  amountColor,
  side,
  elementId,
  popping,
}: {
  label: string;
  amount: string;
  amountColor: string;
  side: 'left' | 'right';
  elementId: 'base-price' | 'current-bid';
  popping?: boolean;
}) {
  const headerClip =
    side === 'left'
      ? 'polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)'
      : 'polygon(0% 0%, 92% 0%, 100% 100%, 0% 100%)';
  const bodyClip =
    side === 'left'
      ? 'polygon(4% 0%, 100% 0%, 92% 100%, 0% 100%)'
      : 'polygon(0% 0%, 96% 0%, 100% 100%, 8% 100%)';

  return (
    <div
      data-t4-element={elementId}
      data-t4-label={label}
      style={{
        width: T4_PANEL_W,
        height: T4_PANEL_H,
        position: 'relative',
        pointerEvents: 'auto',
        filter:
          'drop-shadow(0 4px 10px rgba(0,0,0,0.45))',
      }}
    >
      <div
        data-t4-element={`${elementId}-label`}
        style={{
          position: 'absolute',
          top: 0,
          left: side === 'left' ? 10 : 0,
          right: side === 'left' ? 0 : 10,
          height: T4_PANEL_HEADER_H,
          clipPath: headerClip,
          background: 'var(--t4-panel-header)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(10,16,28,0.18)',
          borderTop: '1px solid rgba(255,255,255,0.65)',
        }}
      >
        <span
          style={{
            fontFamily: LABEL_FONT,
            fontSize: T4_LABEL_SIZE,
            fontWeight: 600,
            color: 'var(--t4-label, #0A0C12)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            lineHeight: 1,
            ...CRISP_TEXT,
          }}
        >
          {label}
        </span>
      </div>
      <div
        data-t4-element={`${elementId}-amount`}
        style={{
          position: 'absolute',
          top: T4_PANEL_HEADER_H,
          left: 0,
          right: 0,
          height: T4_PANEL_BODY_H,
          clipPath: bodyClip,
          background: 'var(--t4-panel-body)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid var(--t4-panel-edge, rgba(228,208,23,0.55))',
          boxShadow:
            'inset 0 1px 0 var(--t4-panel-edge-soft, rgba(126,216,255,0.28)), inset 0 -8px 16px rgba(0,0,0,0.35)',
        }}
      >
        <span
          className={popping ? 't4bid-pop' : undefined}
          style={{
            fontFamily: LABEL_FONT,
            fontSize: amount.length > 11 ? 34 : T4_AMOUNT_SIZE,
            fontWeight: 700,
            letterSpacing: T4_AMOUNT_TRACKING,
            color: amountColor,
            lineHeight: 1,
            display: 'inline-block',
            textShadow:
              amountColor.includes('D4') ||
              amountColor.includes('d4') ||
              amountColor.includes('AF') ||
              amountColor.includes('E4') ||
              amountColor.includes('e4') ||
              amountColor.includes('F0')
                ? '0 1px 2px rgba(0,0,0,0.85)'
                : '0 1px 2px rgba(0,0,0,0.75)',
            ...CRISP_TEXT,
          }}
        >
          {amount}
        </span>
      </div>
    </div>
  );
}

export function PlayerCardT4({
  currentPlayer,
  auctionState,
  teams,
  tournament,
  visible,
  tickerVisible = false,
}: PlayerCardT4Props) {
  const [phase, setPhase] = useState<CardPhase>('entering');
  const [dismissed, setDismissed] = useState(false);
  const [bidPopping, setBidPopping] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [enterActive, setEnterActive] = useState(false);

  const prevStatusRef = useRef(auctionState.currentAuctionStatus);
  const prevUnsoldRef = useRef(!!currentPlayer.isUnsold);
  const prevBidRef = useRef(auctionState.currentBid);
  const prevPlayerIdRef = useRef(currentPlayer._id);
  const prevAuctionPlayerIdRef = useRef(auctionState.currentPlayerId);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isBidding = auctionState.currentAuctionStatus === 'Bidding';
  const photoSrc = resolvePhoto(currentPlayer);
  const initials = currentPlayer.name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const basePrice = getClassBasePrice(tournament, currentPlayer);
  const hasBid = auctionState.currentBid > 0;
  const liveBid = hasBid ? auctionState.currentBid : basePrice;
  const soldTeam = teams.find(
    t => t._id === (currentPlayer.winningTeamId ?? auctionState.winningTeamId),
  );
  const soldPrice = currentPlayer.finalPrice ?? auctionState.currentBid;
  const { left, top } = getT4CardOffset(tickerVisible ? TICKER_T4_HEIGHT : 0);
  const transformOrigin = getT4CardTransformOrigin();

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
    prevBidRef.current = auctionState.currentBid;
    setDismissed(false);
    setPhase('entering');
    clearTimers();
    schedule(() => {
      setPhase(
        auctionState.currentAuctionStatus === 'Bidding' ? 'liveBidding' : 'livePending',
      );
    }, reducedMotion ? 0 : T4_ENTER_MS);
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
      schedule(() => setDismissed(true), reducedMotion ? 0 : T4_EXIT_MS);
      return;
    }
    setDismissed(false);
    setPhase('entering');
    schedule(() => {
      setPhase(
        auctionState.currentAuctionStatus === 'Bidding' ? 'liveBidding' : 'livePending',
      );
    }, reducedMotion ? 0 : T4_ENTER_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    const auctionPlayerId = auctionState.currentPlayerId;
    const playerChanged =
      auctionPlayerId !== prevAuctionPlayerIdRef.current ||
      currentPlayer._id !== prevPlayerIdRef.current;
    if (playerChanged && auctionPlayerId) resetForLivePlayer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionState.currentPlayerId, currentPlayer._id, auctionState.currentAuctionStatus, reducedMotion]);

  useEffect(() => {
    const status = auctionState.currentAuctionStatus;
    if (dismissed && status !== 'Sold' && (status === 'Pending' || status === 'Bidding')) {
      resetForLivePlayer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionState.currentAuctionStatus, dismissed, reducedMotion]);

  useEffect(() => {
    const status = auctionState.currentAuctionStatus;
    if (status === 'Bidding' && phase !== 'soldReveal' && phase !== 'unsoldReveal' && phase !== 'exiting') {
      setPhase('liveBidding');
    }
    if (status === 'Sold' && prevStatusRef.current !== 'Sold') {
      prevStatusRef.current = 'Sold';
      setPhase('soldReveal');
      clearTimers();
      schedule(() => {
        setPhase('exiting');
        schedule(() => setDismissed(true), reducedMotion ? 0 : T4_EXIT_MS);
      }, T4_SOLD_HOLD_MS);
    }
    if (currentPlayer.isUnsold && !prevUnsoldRef.current) {
      prevUnsoldRef.current = true;
      setPhase('unsoldReveal');
      clearTimers();
      schedule(() => {
        setPhase('exiting');
        schedule(() => setDismissed(true), reducedMotion ? 0 : T4_EXIT_MS);
      }, T4_UNSOLD_HOLD_MS);
    }
    if (!currentPlayer.isUnsold) prevUnsoldRef.current = false;
  }, [auctionState.currentAuctionStatus, currentPlayer.isUnsold, phase, reducedMotion]);

  useEffect(() => {
    if (
      auctionState.currentBid !== prevBidRef.current &&
      auctionState.currentBid > 0 &&
      auctionState.currentAuctionStatus === 'Bidding'
    ) {
      prevBidRef.current = auctionState.currentBid;
      setBidPopping(true);
      const t = setTimeout(() => setBidPopping(false), 350);
      return () => clearTimeout(t);
    }
    prevBidRef.current = auctionState.currentBid;
  }, [auctionState.currentBid, auctionState.currentAuctionStatus]);

  useEffect(() => () => clearTimers(), []);

  if (!visible || dismissed) return null;

  const isEntering = phase === 'entering';
  const isExiting = phase === 'exiting';
  const isSold = phase === 'soldReveal';
  const showUnsold = phase === 'unsoldReveal';
  const desaturate = showUnsold;

  const cardTransform = isExiting
    ? `translateY(28px) scale(${T4_CARD_SCALE * 0.97})`
    : phase === 'entering' && !enterActive && !reducedMotion
      ? `translateY(36px) scale(${T4_CARD_SCALE * 0.96})`
      : `translateY(0) scale(${T4_CARD_SCALE})`;
  const cardOpacity =
    isExiting ? 0 : phase === 'entering' && !enterActive && !reducedMotion ? 0 : 1;

  const rightLabel = isSold ? 'SOLD FOR' : showUnsold ? 'UNSOLD' : 'CURRENT BID';
  const rightAmount = isSold
    ? formatT4Amount(soldPrice)
    : showUnsold
      ? formatT4Amount(basePrice)
      : formatT4Amount(liveBid);
  const rightColor = isSold
    ? 'var(--t4-success, #6EC49A)'
    : showUnsold
      ? 'rgba(255,255,255,0.45)'
      : 'var(--t4-bid-gold, #E4D017)';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@500;600;700&display=swap');
        @keyframes t4BidPop {
          0% { transform: scale(1); }
          40% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes t4RimShineSweep {
          0% { transform: translateX(-150%) rotate(-28deg); opacity: 0; }
          10% { transform: translateX(-55%) rotate(-28deg); opacity: 1; }
          50% { transform: translateX(45%) rotate(-28deg); opacity: 1; }
          80% { transform: translateX(120%) rotate(-28deg); opacity: 0.4; }
          100% { transform: translateX(165%) rotate(-28deg); opacity: 0; }
        }
        .t4bid-pop { animation: t4BidPop 0.35s cubic-bezier(0.22,1,0.36,1) forwards; }
        .t4-rim-shine-beam {
          position: absolute;
          top: -30%;
          left: 0;
          width: 42%;
          height: 160%;
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,248,220,0.55) 26%,
            rgba(255,255,255,1) 45%,
            rgba(255,255,255,1) 55%,
            rgba(255,248,220,0.55) 74%,
            rgba(255,255,255,0) 100%
          );
          box-shadow: 0 0 18px rgba(255,252,235,0.55);
          pointer-events: none;
          animation: t4RimShineSweep 2.2s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .t4-card-enter { transition: transform ${T4_ENTER_MS}ms cubic-bezier(0.22,1,0.36,1), opacity ${T4_ENTER_MS}ms ease; }
        .t4-card-exit  { transition: transform ${T4_EXIT_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${T4_EXIT_MS}ms ease; }
        @media (prefers-reduced-motion: reduce) {
          .t4bid-pop { animation: none !important; }
          .t4-rim-shine-beam { animation: none !important; opacity: 0 !important; }
        }
      `}</style>

      <div
        key={currentPlayer._id}
        data-t4-element="player-card"
        data-t4-label="Frame 15 Player Card"
        className={`${isEntering ? 't4-card-enter' : ''} ${isExiting ? 't4-card-exit' : ''}`}
        style={{
          position: 'absolute',
          left,
          top,
          width: T4_CARD_W,
          height: T4_CARD_H,
          zIndex: 49,
          pointerEvents: 'none',
          overflow: 'visible',
          transform: cardTransform,
          transformOrigin,
          opacity: cardOpacity,
          filter: desaturate ? 'saturate(0.35) brightness(0.8)' : undefined,
          background: 'transparent',
          ...CRISP_TEXT,
        }}
      >
        {/* Base Price */}
        <div style={{ position: 'absolute', left: T4_BASE_X, top: T4_BASE_Y, zIndex: 4 }}>
          <PricePanel
            elementId="base-price"
            label="BASE PRICE"
            amount={formatT4Amount(basePrice)}
            amountColor="var(--t4-base-amount, #fff)"
            side="left"
          />
        </div>

        {/* Current Bid */}
        <div style={{ position: 'absolute', left: T4_BID_X, top: T4_BID_Y, zIndex: 4 }}>
          <PricePanel
            elementId="current-bid"
            label={rightLabel}
            amount={rightAmount}
            amountColor={rightColor}
            side="right"
            popping={bidPopping && isBidding && !isSold}
          />
        </div>

        {/* Shield — embossed gold rim over flat recessed photo */}
        <div
          data-t4-element="shield"
          style={{
            position: 'absolute',
            left: T4_SHIELD_INNER_X,
            top: T4_SHIELD_INNER_Y,
            width: T4_SHIELD_INNER_W,
            height: T4_SHIELD_INNER_H,
            zIndex: 6,
            pointerEvents: 'auto',
            filter:
              'drop-shadow(0 12px 22px rgba(0,0,0,0.5)) drop-shadow(0 0 16px rgba(212,175,55,0.2))',
          }}
        >
          {/* Photo well first — flat, visually behind the rim */}
          <div
            data-t4-element="shield-photo"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              clipPath: `path("${T4_SHIELD_INNER_PATH}")`,
              WebkitClipPath: `path("${T4_SHIELD_INNER_PATH}")`,
              background: 'var(--t4-bg-photo, #0A0C10)',
              overflow: 'hidden',
              boxShadow:
                'inset 0 6px 18px rgba(0,0,0,0.4), inset 0 0 36px rgba(10,8,4,0.4)',
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
                  objectPosition: 'center 12%',
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
                  color: 'rgba(255,255,255,0.2)',
                  fontFamily: LABEL_FONT,
                  fontSize: 64,
                }}
              >
                {initials || '?'}
              </div>
            )}
            {/* Soft vignette — keeps photo flat, no gold emboss on image */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'radial-gradient(ellipse at 50% 35%, transparent 42%, rgba(0,0,0,0.28) 100%)',
              }}
            />
          </div>

          {/* Soft undercut cast from rim onto photo well (blurred, gradual) */}
          <svg
            viewBox={`0 0 ${T4_SHIELD_VB_W} ${T4_SHIELD_VB_H}`}
            width={T4_SHIELD_INNER_W}
            height={T4_SHIELD_INNER_H}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              overflow: 'visible',
              pointerEvents: 'none',
            }}
            data-t4-element="shield-undercut"
            aria-hidden
          >
            <defs>
              <mask id={`t4-photo-well-${currentPlayer._id}`}>
                <path d={T4_SHIELD_INNER_PATH} fill="#fff" />
              </mask>
              <filter
                id={`t4-undercut-blur-${currentPlayer._id}`}
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feGaussianBlur in="SourceGraphic" stdDeviation="3.4" />
              </filter>
            </defs>
            <path
              d={T4_SHIELD_INNER_PATH}
              fill="none"
              stroke="rgba(0,0,0,0.32)"
              strokeWidth={12}
              strokeLinejoin="miter"
              strokeMiterlimit={8}
              mask={`url(#t4-photo-well-${currentPlayer._id})`}
              filter={`url(#t4-undercut-blur-${currentPlayer._id})`}
              opacity={0.65}
            />
            <path
              d={T4_SHIELD_INNER_PATH}
              fill="none"
              stroke="rgba(20,14,6,0.2)"
              strokeWidth={5}
              strokeLinejoin="miter"
              strokeMiterlimit={8}
              mask={`url(#t4-photo-well-${currentPlayer._id})`}
              filter={`url(#t4-undercut-blur-${currentPlayer._id})`}
            />
          </svg>

          {/* Gold rim — one continuous polished gold (subtle transitions only) */}
          <svg
            viewBox={`0 0 ${T4_SHIELD_VB_W} ${T4_SHIELD_VB_H}`}
            width={T4_SHIELD_INNER_W}
            height={T4_SHIELD_INNER_H}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              overflow: 'visible',
              pointerEvents: 'none',
            }}
            aria-hidden
          >
            <defs>
              <mask id={`t4-rim-full-${currentPlayer._id}`}>
                <path d={T4_SHIELD_PATH} fill="#fff" />
                <path d={T4_SHIELD_INNER_PATH} fill="#000" />
              </mask>

              {/* Tight gold family — no deep bronze jump */}
              <linearGradient
                id={`t4-rim-metal-${currentPlayer._id}`}
                x1="30%"
                y1="0%"
                x2="70%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#EDD989" />
                <stop offset="35%" stopColor="#D4AF37" />
                <stop offset="70%" stopColor="#C49A28" />
                <stop offset="100%" stopColor="#A67C1A" />
              </linearGradient>

              {/* Very soft polish wash across full rim */}
              <linearGradient
                id={`t4-rim-polish-${currentPlayer._id}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(255,255,245,0.28)" />
                <stop offset="40%" stopColor="rgba(255,248,220,0.06)" />
                <stop offset="100%" stopColor="rgba(80,55,15,0.12)" />
              </linearGradient>

              <radialGradient
                id={`t4-rim-glow-${currentPlayer._id}`}
                cx="36%"
                cy="20%"
                r="75%"
              >
                <stop offset="0%" stopColor="rgba(255,252,235,0.32)" />
                <stop offset="55%" stopColor="rgba(232,200,74,0.04)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>

              {/* Gloss — wide blur keeps highlight gradual across rim width */}
              <filter
                id={`t4-rim-gloss-${currentPlayer._id}`}
                x="-25%"
                y="-25%"
                width="150%"
                height="150%"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur in="SourceAlpha" stdDeviation="5.5" result="blur" />
                <feSpecularLighting
                  in="blur"
                  surfaceScale="0.55"
                  specularConstant="0.55"
                  specularExponent="20"
                  lightingColor="#FFFDF0"
                  result="spec"
                >
                  <feDistantLight azimuth="220" elevation="62" />
                </feSpecularLighting>
                <feComposite
                  in="spec"
                  in2="SourceAlpha"
                  operator="in"
                  result="specClip"
                />
                <feComposite
                  in="SourceGraphic"
                  in2="specClip"
                  operator="arithmetic"
                  k1="0"
                  k2="1"
                  k3="0.28"
                  k4="0"
                />
              </filter>

              <filter
                id={`t4-rim-lip-blur-${currentPlayer._id}`}
                x="-25%"
                y="-25%"
                width="150%"
                height="150%"
              >
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
              </filter>
            </defs>

            {/* Single continuous polished gold */}
            <path
              d={T4_SHIELD_PATH}
              fill={`url(#t4-rim-metal-${currentPlayer._id})`}
              mask={`url(#t4-rim-full-${currentPlayer._id})`}
              filter={`url(#t4-rim-gloss-${currentPlayer._id})`}
              data-t4-element="shield-rim"
            />
            <path
              d={T4_SHIELD_PATH}
              fill={`url(#t4-rim-polish-${currentPlayer._id})`}
              mask={`url(#t4-rim-full-${currentPlayer._id})`}
              opacity={0.4}
            />
            <path
              d={T4_SHIELD_PATH}
              fill={`url(#t4-rim-glow-${currentPlayer._id})`}
              mask={`url(#t4-rim-full-${currentPlayer._id})`}
              opacity={0.5}
            />
            {/* Thin soft outer catch-light only */}
            <path
              d={T4_SHIELD_PATH}
              fill="none"
              stroke="rgba(255,252,235,0.4)"
              strokeWidth={2.2}
              strokeLinejoin="miter"
              strokeMiterlimit={8}
              mask={`url(#t4-rim-full-${currentPlayer._id})`}
              filter={`url(#t4-rim-lip-blur-${currentPlayer._id})`}
              opacity={0.55}
            />
            {/* Soft inner lip into photo — blurred, low contrast */}
            <path
              d={T4_SHIELD_INNER_PATH}
              fill="none"
              stroke="rgba(255,248,220,0.22)"
              strokeWidth={2}
              strokeLinejoin="miter"
              strokeMiterlimit={8}
              filter={`url(#t4-rim-lip-blur-${currentPlayer._id})`}
              opacity={0.5}
            />
          </svg>

          {/* HTML shine beam — clipped to gold rim only (reliable CSS animation) */}
          <div
            data-t4-element="shield-rim-shine"
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 4,
              pointerEvents: 'none',
              overflow: 'hidden',
              // evenodd hole punches photo well for alpha masks (default)
              WebkitMaskImage: `url("data:image/svg+xml,${encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${T4_SHIELD_VB_W} ${T4_SHIELD_VB_H}'><path fill-rule='evenodd' d='${T4_SHIELD_PATH} ${T4_SHIELD_INNER_PATH}' fill='white'/></svg>`,
              )}")`,
              maskImage: `url("data:image/svg+xml,${encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${T4_SHIELD_VB_W} ${T4_SHIELD_VB_H}'><path fill-rule='evenodd' d='${T4_SHIELD_PATH} ${T4_SHIELD_INNER_PATH}' fill='white'/></svg>`,
              )}")`,
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
            }}
          >
            <div className="t4-rim-shine-beam" />
          </div>

          {showUnsold && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 8,
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  fontFamily: LABEL_FONT,
                  fontSize: 42,
                  color: 'var(--t4-danger, #E85A5A)',
                  border: '3px solid var(--t4-danger, #E85A5A)',
                  padding: '4px 14px',
                  transform: 'rotate(-12deg)',
                  textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                }}
              >
                UNSOLD
              </span>
            </div>
          )}

          {isSold && soldTeam && (
            <div
              style={{
                position: 'absolute',
                left: 20,
                right: 20,
                bottom: 36,
                zIndex: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'rgba(0,0,0,0.55)',
                borderRadius: 4,
                padding: '6px 10px',
                pointerEvents: 'none',
              }}
            >
              {soldTeam.logoURL && (
                <ResilientImage
                  src={soldTeam.logoURL}
                  alt={soldTeam.name}
                  style={{ width: 24, height: 24, objectFit: 'contain' }}
                />
              )}
              <span
                style={{
                  fontFamily: LABEL_FONT,
                  fontSize: 16,
                  color: '#fff',
                  textTransform: 'uppercase',
                }}
              >
                {soldTeam.name}
              </span>
            </div>
          )}
        </div>

        {/* Nameplate — granite rock face (same dark colors) */}
        <div
          data-t4-element="nameplate"
          style={{
            position: 'absolute',
            left: T4_NAME_X,
            top: T4_NAME_Y,
            width: T4_NAME_W,
            height: T4_NAME_H,
            zIndex: 5,
            pointerEvents: 'auto',
            clipPath: 'polygon(1.5% 0%, 98.5% 0%, 94% 100%, 6% 100%)',
            filter:
              'drop-shadow(0 8px 18px rgba(0,0,0,0.5)) drop-shadow(0 0 12px rgba(212,175,55,0.16))',
          }}
        >
          <svg
            viewBox={`0 0 ${T4_NAME_W} ${T4_NAME_H}`}
            width={T4_NAME_W}
            height={T4_NAME_H}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            aria-hidden
          >
            <defs>
              <clipPath id={`t4-np-clip-${currentPlayer._id}`}>
                <polygon points="9,0 591,0 564,78 36,78" />
              </clipPath>
              <linearGradient
                id={`t4-np-metal-${currentPlayer._id}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3A4A62" />
                <stop offset="18%" stopColor="#1E2A40" />
                <stop offset="48%" stopColor="#121A2C" />
                <stop offset="78%" stopColor="#0A101C" />
                <stop offset="100%" stopColor="#05070C" />
              </linearGradient>
              <linearGradient
                id={`t4-np-sheen-${currentPlayer._id}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="30%" stopColor="rgba(200,214,235,0.04)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
              </linearGradient>
              <linearGradient
                id={`t4-np-sides-${currentPlayer._id}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="rgba(212,175,55,0.22)" />
                <stop offset="10%" stopColor="rgba(212,175,55,0)" />
                <stop offset="90%" stopColor="rgba(212,175,55,0)" />
                <stop offset="100%" stopColor="rgba(212,175,55,0.22)" />
              </linearGradient>
              {/* Granite rock face — coarse facets + fine mineral speckles */}
              <filter
                id={`t4-np-granite-${currentPlayer._id}`}
                x="-2%"
                y="-2%"
                width="104%"
                height="104%"
                colorInterpolationFilters="sRGB"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.22"
                  numOctaves="4"
                  seed="17"
                  stitchTiles="stitch"
                  result="coarse"
                />
                <feColorMatrix
                  in="coarse"
                  type="matrix"
                  values="
                    0 0 0 0 0.58
                    0 0 0 0 0.64
                    0 0 0 0 0.74
                    0 0 0 0.45 0"
                  result="facets"
                />
                <feTurbulence
                  type="turbulence"
                  baseFrequency="1.35"
                  numOctaves="2"
                  seed="29"
                  stitchTiles="stitch"
                  result="fine"
                />
                <feColorMatrix
                  in="fine"
                  type="matrix"
                  values="
                    0 0 0 0 0.75
                    0 0 0 0 0.8
                    0 0 0 0 0.88
                    0 0 0 0.32 0"
                  result="specks"
                />
                <feBlend in="SourceGraphic" in2="facets" mode="soft-light" result="rock" />
                <feBlend in="rock" in2="specks" mode="overlay" />
              </filter>
              <pattern
                id={`t4-np-flecks-${currentPlayer._id}`}
                patternUnits="userSpaceOnUse"
                width="14"
                height="14"
              >
                <circle cx="2" cy="3" r="0.7" fill="rgba(200,214,235,0.18)" />
                <circle cx="9" cy="1.5" r="0.45" fill="rgba(0,0,0,0.35)" />
                <circle cx="6" cy="8" r="0.85" fill="rgba(180,198,220,0.12)" />
                <circle cx="12" cy="10" r="0.55" fill="rgba(0,0,0,0.28)" />
                <circle cx="4" cy="12" r="0.4" fill="rgba(220,230,245,0.1)" />
                <circle cx="11" cy="5" r="0.6" fill="rgba(30,40,55,0.4)" />
              </pattern>
            </defs>

            <g clipPath={`url(#t4-np-clip-${currentPlayer._id})`}>
              <rect
                width={T4_NAME_W}
                height={T4_NAME_H}
                fill={`url(#t4-np-metal-${currentPlayer._id})`}
                filter={`url(#t4-np-granite-${currentPlayer._id})`}
              />
              <rect
                width={T4_NAME_W}
                height={T4_NAME_H}
                fill={`url(#t4-np-flecks-${currentPlayer._id})`}
                opacity={0.85}
              />
              <rect
                width={T4_NAME_W}
                height={T4_NAME_H}
                fill={`url(#t4-np-sheen-${currentPlayer._id})`}
                opacity={0.45}
              />
              <rect
                width={T4_NAME_W}
                height={T4_NAME_H}
                fill={`url(#t4-np-sides-${currentPlayer._id})`}
              />
              <line
                x1="12"
                y1="1.2"
                x2="588"
                y2="1.2"
                stroke="rgba(243,226,160,0.65)"
                strokeWidth="1.5"
              />
              <line
                x1="40"
                y1="76.5"
                x2="560"
                y2="76.5"
                stroke="rgba(0,0,0,0.55)"
                strokeWidth="1.4"
              />
            </g>
          </svg>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: 4,
              paddingTop: 0,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <span
              data-t4-element="player-name"
              style={{
                position: 'relative',
                fontFamily: NAME_FONT,
                fontSize: t4NameFontSize(currentPlayer.name.length),
                fontWeight: 400,
                letterSpacing: T4_NAME_TRACKING,
                textTransform: 'uppercase',
                color: 'var(--t4-name-gold, #F0D878)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '94%',
                lineHeight: 0.92,
                textShadow: '0 2px 0 rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.65)',
                ...CRISP_TEXT,
              }}
            >
              {currentPlayer.name}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default PlayerCardT4;
