'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AuctionState, Player, Team, Tournament } from '@/types';
import { getClassConfig } from '@/lib/playerClassUtils';
import { optimizeImage } from '@/lib/imageOptimization';
import ResilientImage from '../shared/ResilientImage';
import { PlayerBarBackgroundT3 } from './PlayerBarBackgroundT3';
import { CurrentBidFooterT3, type BidPanelPhase } from './CurrentBidT3';
import { UnsoldBarOverlayT3 } from './SoldMessageT3';
import { PLAYER_BAR_T3_TOP_RAIL_HEIGHT } from './theme3Layout';
import {
  getPortraitCardBottom,
  portraitNameFontSize,
  PORTRAIT_CARD_H,
  PORTRAIT_CARD_W,
  PORTRAIT_ENTER_MS,
  PORTRAIT_EXIT_MS,
  PORTRAIT_FOOTER_H,
  PORTRAIT_PHOTO_H,
  PORTRAIT_SOLD_HOLD_MS,
  PORTRAIT_UNSOLD_HOLD_MS,
} from './customPortraitPlayerCardT3Layout';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';

type CardPhase =
  | 'entering'
  | 'livePending'
  | 'liveBidding'
  | 'soldReveal'
  | 'unsoldReveal'
  | 'exiting';

export interface PortraitPlayerCardT3Props {
  currentPlayer: Player;
  auctionState: AuctionState;
  teams: Team[];
  tournament: Tournament | null;
  visible: boolean;
  tickerVisible?: boolean;
}

function resolvePortraitPhoto(player: Player): string | null {
  const raw = player.photoURL?.trim() || player.secondaryImageURL?.trim() || '';
  if (!raw) return null;
  if (raw.startsWith('data:')) return raw;
  return optimizeImage(raw, {
    width: PORTRAIT_CARD_W * 2,
    height: PORTRAIT_PHOTO_H * 2,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

export function PortraitPlayerCardT3({
  currentPlayer,
  auctionState,
  teams,
  tournament,
  visible,
  tickerVisible = true,
}: PortraitPlayerCardT3Props) {
  const [phase, setPhase] = useState<CardPhase>('entering');
  const [dismissed, setDismissed] = useState(false);
  const [bidPopping, setBidPopping] = useState(false);
  const [bidDelta, setBidDelta] = useState<number | null>(null);
  const [ripple, setRipple] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [enterActive, setEnterActive] = useState(false);

  const prevStatusRef = useRef(auctionState.currentAuctionStatus);
  const prevUnsoldRef = useRef(!!currentPlayer.isUnsold);
  const prevBidRef = useRef(auctionState.currentBid);
  const prevPlayerIdRef = useRef(currentPlayer._id);
  const prevAuctionPlayerIdRef = useRef(auctionState.currentPlayerId);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isBidding = auctionState.currentAuctionStatus === 'Bidding';
  const bottom = getPortraitCardBottom(tickerVisible);
  const classConfig = getClassConfig(tournament, currentPlayer.playerClass);
  const playerNo = currentPlayer.playerNo?.trim();
  const metaParts: string[] = [];
  if (currentPlayer.playerClass) metaParts.push(currentPlayer.playerClass.toUpperCase());
  if (currentPlayer.position) metaParts.push(currentPlayer.position.toUpperCase());

  const photoSrc = resolvePortraitPhoto(currentPlayer);
  const initials = currentPlayer.name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
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
    }, reducedMotion ? 0 : PORTRAIT_ENTER_MS);
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
      schedule(() => setDismissed(true), reducedMotion ? 0 : PORTRAIT_EXIT_MS);
      return;
    }
    setDismissed(false);
    setPhase('entering');
    schedule(() => {
      setPhase(
        auctionState.currentAuctionStatus === 'Bidding' ? 'liveBidding' : 'livePending',
      );
    }, reducedMotion ? 0 : PORTRAIT_ENTER_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    const auctionPlayerId = auctionState.currentPlayerId;
    const playerChanged =
      auctionPlayerId !== prevAuctionPlayerIdRef.current ||
      currentPlayer._id !== prevPlayerIdRef.current;

    if (playerChanged && auctionPlayerId) {
      resetForLivePlayer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionState.currentPlayerId, currentPlayer._id, auctionState.currentAuctionStatus, reducedMotion]);

  useEffect(() => {
    const status = auctionState.currentAuctionStatus;
    if (
      dismissed &&
      status !== 'Sold' &&
      (status === 'Pending' || status === 'Bidding')
    ) {
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
        schedule(() => setDismissed(true), reducedMotion ? 0 : PORTRAIT_EXIT_MS);
      }, PORTRAIT_SOLD_HOLD_MS);
    }

    if (currentPlayer.isUnsold && !prevUnsoldRef.current) {
      prevUnsoldRef.current = true;
      setPhase('unsoldReveal');
      clearTimers();
      schedule(() => {
        setPhase('exiting');
        schedule(() => setDismissed(true), reducedMotion ? 0 : PORTRAIT_EXIT_MS);
      }, PORTRAIT_UNSOLD_HOLD_MS);
    }

    if (!currentPlayer.isUnsold) {
      prevUnsoldRef.current = false;
    }
  }, [
    auctionState.currentAuctionStatus,
    currentPlayer.isUnsold,
    phase,
    reducedMotion,
  ]);

  useEffect(() => {
    if (
      auctionState.currentBid !== prevBidRef.current &&
      auctionState.currentBid > 0 &&
      auctionState.currentAuctionStatus === 'Bidding'
    ) {
      const delta = auctionState.currentBid - prevBidRef.current;
      prevBidRef.current = auctionState.currentBid;
      setBidDelta(delta > 0 ? delta : null);
      setBidPopping(true);
      setRipple(true);
      const popT = setTimeout(() => setBidPopping(false), 350);
      const deltaT = setTimeout(() => setBidDelta(null), 600);
      const rippleT = setTimeout(() => setRipple(false), 400);
      return () => {
        clearTimeout(popT);
        clearTimeout(deltaT);
        clearTimeout(rippleT);
      };
    }
    prevBidRef.current = auctionState.currentBid;
  }, [auctionState.currentBid, auctionState.currentAuctionStatus]);

  useEffect(() => () => clearTimers(), []);

  if (!visible || dismissed) return null;

  const bidPanelPhase: BidPanelPhase =
    phase === 'soldReveal' ? 'sold'
    : phase === 'unsoldReveal' ? 'unsold'
    : 'live';

  const soldTeam = teams.find(
    t => t._id === (currentPlayer.winningTeamId ?? auctionState.winningTeamId),
  );
  const soldPrice = currentPlayer.finalPrice ?? auctionState.currentBid;

  const isEntering = phase === 'entering';
  const isExiting = phase === 'exiting';
  const loopActive = phase === 'livePending' || phase === 'liveBidding';
  const showUnsoldOverlay = phase === 'unsoldReveal';
  const desaturate = phase === 'unsoldReveal';

  const cardTransform = isExiting
    ? 'translateY(100%)'
    : phase === 'entering' && !enterActive && !reducedMotion
      ? 'translateY(100%)'
      : 'translateY(0)';

  const cardOpacity = isExiting ? 0 : phase === 'entering' && !enterActive && !reducedMotion ? 0 : 1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Saira+Extra+Condensed:wght@600;700&display=swap');
        @keyframes t3PortraitBidGlow {
          0%, 100% { box-shadow: inset 0 0 0 1px rgba(var(--t3-accent-rgb, 0,137,140), 0.35), 0 0 8px rgba(var(--t3-accent-rgb, 0,137,140), 0.15); }
          50%       { box-shadow: inset 0 0 0 2px var(--t3-bar-gold, var(--t3-accent)), 0 0 22px rgba(var(--t3-accent-rgb, 0,137,140), 0.45); }
        }
        @keyframes t3PortraitBidPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.14); }
          100% { transform: scale(1); }
        }
        @keyframes t3PortraitLiveDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.35; transform: scale(0.6); }
        }
        @keyframes t3PortraitBidDelta {
          0%   { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-16px); }
        }
        @keyframes t3PortraitRipple {
          0%   { transform: translateX(-100%); opacity: 0.8; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes t3PortraitPhotoEnter {
          from { opacity: 0; transform: scale(1.04); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes t3PortraitFooterEnter {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .t3-portrait-enter { transition: transform ${PORTRAIT_ENTER_MS}ms cubic-bezier(0.22,1,0.36,1), opacity ${PORTRAIT_ENTER_MS}ms ease; }
        .t3-portrait-exit  { transition: transform ${PORTRAIT_EXIT_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${PORTRAIT_EXIT_MS}ms ease; }
        .t3-portrait-photo-enter { animation: t3PortraitPhotoEnter 420ms cubic-bezier(0.22,1,0.36,1) 80ms both; }
        .t3-portrait-footer-enter { animation: t3PortraitFooterEnter 420ms cubic-bezier(0.22,1,0.36,1) 140ms both; }
        .t3bid-glow { animation: t3PortraitBidGlow 1.4s ease-in-out infinite; }
        .t3bid-pop  { animation: t3PortraitBidPop 0.35s cubic-bezier(0.22,1,0.36,1) forwards; display: inline-block; }
        .t3bid-dot  { animation: t3PortraitLiveDot 1s ease-in-out infinite; }
        .t3bid-delta { animation: t3PortraitBidDelta 0.6s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) {
          .t3bid-glow, .t3bid-dot, .t3-portrait-photo-enter, .t3-portrait-footer-enter { animation: none !important; }
        }
      `}</style>

      <div
        key={currentPlayer._id}
        className={`${isEntering ? 't3-portrait-enter' : ''} ${isExiting ? 't3-portrait-exit' : ''}`}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom,
          width: PORTRAIT_CARD_W,
          maxWidth: '92vw',
          height: PORTRAIT_CARD_H,
          marginLeft: 'auto',
          marginRight: 'auto',
          zIndex: 49,
          pointerEvents: 'none',
          transform: cardTransform,
          opacity: cardOpacity,
          filter: desaturate ? 'saturate(0.4) brightness(0.85)' : undefined,
          transition: reducedMotion
            ? 'opacity 0.15s ease, transform 0.15s ease, filter 0.4s ease'
            : undefined,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 12px 48px rgba(0,0,0,0.65)',
            overflow: 'hidden',
          }}
        >
          <PlayerBarBackgroundT3
            animateSkew={isBidding && loopActive}
            reducedMotion={reducedMotion}
          />

          {ripple && !reducedMotion && (
            <div
              style={{
                position: 'absolute',
                top: PLAYER_BAR_T3_TOP_RAIL_HEIGHT,
                left: 0,
                right: 0,
                height: 2,
                background: 'var(--t3-bar-gold, var(--t3-accent))',
                animation: 't3PortraitRipple 0.4s ease-out forwards',
                zIndex: 6,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Photo */}
          <div
            className={isEntering && !reducedMotion ? 't3-portrait-photo-enter' : ''}
            style={{
              position: 'relative',
              height: PORTRAIT_PHOTO_H,
              flexShrink: 0,
              overflow: 'hidden',
              background: 'var(--t3-bg-photo, #101018)',
              zIndex: 2,
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
                  background: 'var(--t3-bg-panel, #202020)',
                }}
              >
                <span
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: 96,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.15)',
                  }}
                >
                  {initials || '?'}
                </span>
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.55) 100%)',
                pointerEvents: 'none',
              }}
            />
            {showUnsoldOverlay && <UnsoldBarOverlayT3 />}
          </div>

          {/* Footer — identity + embedded bid */}
          <div
            className={isEntering && !reducedMotion ? 't3-portrait-footer-enter' : ''}
            style={{
              position: 'relative',
              height: PORTRAIT_FOOTER_H,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              padding: '12px 18px 10px',
              boxSizing: 'border-box',
              background: 'rgba(0,0,0,0.42)',
              borderTop: '2px solid var(--t3-bar-gold, var(--t3-accent))',
              zIndex: 3,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, minWidth: 0 }}>
              {playerNo && (
                <span
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: 44,
                    fontWeight: 700,
                    lineHeight: 0.85,
                    color: 'var(--t3-bar-gold, var(--t3-accent))',
                    flexShrink: 0,
                    textShadow: '0 2px 8px rgba(0,0,0,0.45)',
                  }}
                >
                  {playerNo}
                </span>
              )}
              <div
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: portraitNameFontSize(currentPlayer.name.length),
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  color: 'var(--t3-bar-text, var(--t3-text-primary))',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {currentPlayer.name}
              </div>
            </div>

            {metaParts.length > 0 && (
              <div
                style={{
                  marginTop: 4,
                  fontFamily: DISPLAY_FONT,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: classConfig?.color ?? 'var(--t3-bar-text-muted, var(--t3-text-secondary))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {metaParts.join(' · ')}
              </div>
            )}

            <div style={{ marginTop: 'auto', minWidth: 0 }}>
              <CurrentBidFooterT3
                auctionState={auctionState}
                teams={teams}
                tournament={tournament}
                currentPlayer={currentPlayer}
                isBidding={isBidding}
                bidPopping={bidPopping}
                bidDelta={bidDelta}
                phase={bidPanelPhase}
                soldPrice={soldPrice}
                soldTeam={soldTeam}
                reducedMotion={reducedMotion}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PortraitPlayerCardT3;
