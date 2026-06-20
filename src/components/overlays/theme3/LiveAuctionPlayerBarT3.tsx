'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AuctionState, Player, Team, Tournament } from '@/types';
import { getClassConfig } from '@/lib/playerClassUtils';
import { PLAYER_BAR_T3_HEIGHT, PLAYER_BAR_T3_WIDTH, getPlayerBarBottom } from './theme3Layout';
import { PlayerPhotoSection, PlayerIdentitySection } from './PlayerCardT3';
import CurrentBidPanelT3, { type BidPanelPhase } from './CurrentBidT3';
import { SoldBarOverlayT3, UnsoldBarOverlayT3 } from './SoldMessageT3';
import { PlayerBarBackgroundT3 } from './PlayerBarBackgroundT3';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';

type BarPhase =
  | 'entering'
  | 'livePending'
  | 'liveBidding'
  | 'soldReveal'
  | 'unsoldReveal'
  | 'exiting';

interface LoopItem {
  label: string;
  color?: string;
}

interface LiveAuctionPlayerBarT3Props {
  currentPlayer: Player;
  auctionState: AuctionState;
  teams: Team[];
  tournament: Tournament | null;
  visible: boolean;
  tickerVisible?: boolean;
}

const ENTER_MS = 480;
const EXIT_MS = 400;
const SOLD_HOLD_MS = 2800;
const UNSOLD_HOLD_MS = 2500;
const LOOP_INTERVAL_MS = 4000;
const LOOP_FADE_MS = 300;

function buildLoopItems(player: Player, tournament: Tournament | null): LoopItem[] {
  const items: LoopItem[] = [];

  if (player.playerClass) {
    const cfg = getClassConfig(tournament, player.playerClass);
    items.push({
      label: `CLASS · ${player.playerClass.toUpperCase()}`,
      color: cfg?.color,
    });
  }
  if (player.position) {
    items.push({ label: `POSITION · ${player.position.toUpperCase()}` });
  }

  const statFields = tournament?.playerProfileFields?.statFields ?? [];
  for (const sf of statFields.slice(0, 2)) {
    const val = player.stats?.[sf.key];
    if (val != null && String(val).trim() !== '') {
      items.push({ label: `${sf.label.toUpperCase()} · ${String(val).toUpperCase()}` });
    }
  }

  if (items.length === 0) {
    items.push({
      label: tournament?.name?.toUpperCase() ?? 'LIVE AUCTION',
    });
  }

  return items;
}

function DetailsLoopSection({
  items,
  active,
  reducedMotion,
}: {
  items: LoopItem[];
  active: boolean;
  reducedMotion: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [items]);

  useEffect(() => {
    if (!active || items.length <= 1 || reducedMotion) return;

    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex(i => (i + 1) % items.length);
        setFading(false);
      }, LOOP_FADE_MS);
    }, LOOP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [active, items.length, reducedMotion]);

  const item = items[index] ?? items[0];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: item.color ?? 'var(--t3-bar-text-muted, #e0e0e0)',
          opacity: fading ? 0 : 1,
          transition: reducedMotion ? 'none' : `opacity ${LOOP_FADE_MS}ms ease`,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          textAlign: 'center',
        }}
      >
        {item.label}
      </span>
    </div>
  );
}

export function LiveAuctionPlayerBarT3({
  currentPlayer,
  auctionState,
  teams,
  tournament,
  visible,
  tickerVisible = true,
}: LiveAuctionPlayerBarT3Props) {
  const [phase, setPhase] = useState<BarPhase>('entering');
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

  const loopItems = useMemo(
    () => buildLoopItems(currentPlayer, tournament),
    [currentPlayer, tournament],
  );

  const isBidding = auctionState.currentAuctionStatus === 'Bidding';
  const bottom = getPlayerBarBottom(tickerVisible);

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
    }, reducedMotion ? 0 : ENTER_MS);
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
      schedule(() => setDismissed(true), reducedMotion ? 0 : EXIT_MS);
      return;
    }
    setDismissed(false);
    setPhase('entering');
    schedule(() => {
      setPhase(
        auctionState.currentAuctionStatus === 'Bidding' ? 'liveBidding' : 'livePending',
      );
    }, reducedMotion ? 0 : ENTER_MS);
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
        schedule(() => setDismissed(true), reducedMotion ? 0 : EXIT_MS);
      }, SOLD_HOLD_MS);
    }

    if (currentPlayer.isUnsold && !prevUnsoldRef.current) {
      prevUnsoldRef.current = true;
      setPhase('unsoldReveal');
      clearTimers();
      schedule(() => {
        setPhase('exiting');
        schedule(() => setDismissed(true), reducedMotion ? 0 : EXIT_MS);
      }, UNSOLD_HOLD_MS);
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
  const showSoldOverlay = phase === 'soldReveal';
  const showUnsoldOverlay = phase === 'unsoldReveal';
  const desaturate = phase === 'unsoldReveal';

  const barTransform = isExiting
    ? 'translateY(100%)'
    : phase === 'entering' && !enterActive && !reducedMotion
      ? 'translateY(100%)'
      : 'translateY(0)';

  const barOpacity = isExiting ? 0 : phase === 'entering' && !enterActive && !reducedMotion ? 0 : 1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Saira+Extra+Condensed:wght@600;700&display=swap');
        @keyframes t3BidGlow {
          0%, 100% { box-shadow: inset 0 0 0 1px rgba(237,169,0,0.35), 0 0 8px rgba(237,169,0,0.15); }
          50%       { box-shadow: inset 0 0 0 2px var(--t3-bar-gold, #eda900), 0 0 22px rgba(237,169,0,0.45); }
        }
        @keyframes t3BidPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.14); }
          100% { transform: scale(1); }
        }
        @keyframes t3LiveDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.35; transform: scale(0.6); }
        }
        @keyframes t3BidDelta {
          0%   { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-16px); }
        }
        @keyframes t3SoldFlash {
          0%   { background-color: rgba(237,169,0,0.22); }
          100% { background-color: transparent; }
        }
        @keyframes t3SoldCelebration {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes t3BarRipple {
          0%   { transform: translateX(-100%); opacity: 0.8; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        .t3bid-glow { animation: t3BidGlow 1.4s ease-in-out infinite; }
        .t3bid-pop  { animation: t3BidPop 0.35s cubic-bezier(0.22,1,0.36,1) forwards; display: inline-block; }
        .t3bid-dot  { animation: t3LiveDot 1s ease-in-out infinite; }
        .t3bid-delta { animation: t3BidDelta 0.6s ease-out forwards; }
        .t3-sold-flash-bg { animation: t3SoldFlash 0.3s ease-out; }
        .t3-bar-enter { transition: transform ${ENTER_MS}ms cubic-bezier(0.22,1,0.36,1), opacity ${ENTER_MS}ms ease; }
        .t3-bar-exit  { transition: transform ${EXIT_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${EXIT_MS}ms ease; }
        .t3-photo-enter { animation: t3PhotoEnter 350ms cubic-bezier(0.22,1,0.36,1) 80ms both; }
        .t3-identity-enter { animation: t3IdentityEnter 350ms cubic-bezier(0.22,1,0.36,1) 120ms both; }
        .t3-bid-enter { animation: t3BidEnter 350ms cubic-bezier(0.22,1,0.36,1) 160ms both; }
        @keyframes t3PhotoEnter {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes t3IdentityEnter {
          from { transform: translateX(-24px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes t3BidEnter {
          from { transform: translateX(24px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .t3bid-glow, .t3bid-dot { animation: none !important; }
        }
      `}</style>

      <div
        key={currentPlayer._id}
        className={`${isEntering ? 't3-bar-enter' : ''} ${isExiting ? 't3-bar-exit' : ''}`}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom,
          height: PLAYER_BAR_T3_HEIGHT,
          zIndex: 49,
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'center',
          transform: barTransform,
          opacity: barOpacity,
          filter: desaturate ? 'saturate(0.4) brightness(0.85)' : undefined,
          transition: reducedMotion
            ? 'opacity 0.15s ease, transform 0.15s ease, filter 0.4s ease'
            : undefined,
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            width: PLAYER_BAR_T3_WIDTH,
            maxWidth: '94vw',
            height: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            overflow: 'hidden',
          }}
        >
          <PlayerBarBackgroundT3 />

          {/* Bid ripple sweep — gold */}
          {ripple && !reducedMotion && (
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: 0,
                right: 0,
                height: 2,
                background: 'var(--t3-bar-gold, #eda900)',
                animation: 't3BarRipple 0.4s ease-out forwards',
                zIndex: 6,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Photo — full bar height */}
          <div
            className={isEntering && !reducedMotion ? 't3-photo-enter' : ''}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              flexShrink: 0,
              height: '100%',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <PlayerPhotoSection
              player={currentPlayer}
              soldCelebration={showSoldOverlay}
              barHeight={PLAYER_BAR_T3_HEIGHT}
            />
          </div>

          {/* Identity */}
          <div
            className={isEntering && !reducedMotion ? 't3-identity-enter' : ''}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              flexShrink: 0,
              position: 'relative',
              zIndex: 2,
            }}
          >
            <PlayerIdentitySection player={currentPlayer} tournament={tournament} />
          </div>

          {/* Details loop */}
          <div style={{ position: 'relative', zIndex: 2, flex: 1, minWidth: 0, display: 'flex' }}>
            <DetailsLoopSection
              items={loopItems}
              active={loopActive}
              reducedMotion={reducedMotion}
            />
          </div>

          {/* Bid panel */}
          <div className={isEntering && !reducedMotion ? 't3-bid-enter' : ''} style={{ position: 'relative', zIndex: 2 }}>
            <CurrentBidPanelT3
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
            />
          </div>

          {showSoldOverlay && soldTeam && (
            <SoldBarOverlayT3
              player={currentPlayer}
              team={soldTeam}
              finalPrice={soldPrice}
            />
          )}

          {showUnsoldOverlay && <UnsoldBarOverlayT3 />}
        </div>
      </div>
    </>
  );
}

export default LiveAuctionPlayerBarT3;
