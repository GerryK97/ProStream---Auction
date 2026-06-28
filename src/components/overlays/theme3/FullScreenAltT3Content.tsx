'use client';

import React, { useEffect, useRef, useState } from 'react';
import TickerT3Shared from './TickerT3Shared';
import { Theme3Canvas } from './Theme3Canvas';
import { CurrentBidPanelT3, type BidPanelPhase } from './CurrentBidT3';
import TeamWiseImageryT3 from './TeamWiseImageryT3';
import SoldPlayersSummaryT3 from './SoldPlayersSummaryT3';
import Top10SummaryT3 from './Top10SummaryT3';
import RestingTimeT3 from './RestingTimeT3';
import TeamSummaryT3 from './TeamSummaryT3';
import TeamWiseSummaryT3 from './TeamWiseSummaryT3';
import WheelSpinT3 from './WheelSpinT3';
import SoldMessageToast from '../shared/SoldMessageToast';
import ResilientImage from '../shared/ResilientImage';
import type { Theme3ContentProps } from './types';
import { isTheme3TeamImageryMode } from './types';
import type { OverlaySettings } from '../OverlayWrapper';
import type { Player, Team } from '@/types';

type DisplayMode = OverlaySettings['displayMode'];

const LIVE_MODES: DisplayMode[] = ['standard', 'custom-ticker'];

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';

// ─── Full-screen secondary image (Theme 1 Full Screen 2 layout, Theme 3 styling) ─

function SecondaryImagePanelT3({
  currentPlayer,
  tournament,
}: {
  currentPlayer: Player | undefined;
  tournament: Theme3ContentProps['tournament'];
}) {
  const hasPlayer = !!currentPlayer;
  const imgSrc = currentPlayer?.secondaryImageURL || currentPlayer?.photoURL || null;

  if (!hasPlayer) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          background: 'var(--t3-bg-photo-fallback, rgba(5,5,5,0.92))',
        }}
      >
        <svg
          width="96"
          height="96"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span
          style={{
            color: 'var(--t3-text-muted, rgba(255,255,255,0.35))',
            fontSize: 24,
            fontFamily: DISPLAY_FONT,
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          Waiting for player…
        </span>
      </div>
    );
  }

  if (imgSrc) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <ResilientImage
          src={imgSrc}
          alt={currentPlayer!.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 180,
            background:
              'linear-gradient(to bottom, transparent 0%, var(--t3-bg-canvas, rgba(5,5,5,0.95)) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: 'var(--t3-bg-photo-fallback, rgba(5,5,5,0.92))',
      }}
    >
      {tournament?.logoURL ? (
        <ResilientImage
          src={tournament.logoURL}
          alt={tournament.name}
          style={{ width: 320, height: 320, objectFit: 'contain', opacity: 0.85 }}
        />
      ) : (
        <svg
          width="96"
          height="96"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      )}
    </div>
  );
}

/** Full Screen 2 — secondary-image hero + floating bid card (Theme 1 layout, Theme 3 art direction). */
const FullScreenAltT3Content: React.FC<Theme3ContentProps> = ({
  soldPlayers,
  teams,
  players,
  currentPlayer,
  tournament,
  auctionState,
  overlaySettings,
  wheelSpinData,
}) => {
  const settings: OverlaySettings = { ...overlaySettings, size: 'large' };

  const [activeMode, setActiveMode] = useState<DisplayMode>(settings.displayMode);
  const [panelExiting, setPanelExiting] = useState(false);
  const [summaryExiting, setSummaryExiting] = useState(false);
  const prevModeRef = useRef<DisplayMode>(settings.displayMode);

  const [soldToast, setSoldToast] = useState<{ player: Player; team: Team; price: number } | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const prevStatusRef = useRef<string | null>(null);
  const toastTimersRef = useRef<{
    exit: ReturnType<typeof setTimeout> | null;
    clear: ReturnType<typeof setTimeout> | null;
  }>({ exit: null, clear: null });

  const [waitingForNextPlayer, setWaitingForNextPlayer] = useState(false);
  const [waitingExiting, setWaitingExiting] = useState(false);
  const soldPlayerIdRef = useRef<string | undefined>(undefined);
  const waitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [bidPopping, setBidPopping] = useState(false);
  const [bidDelta, setBidDelta] = useState<number | null>(null);
  const prevBidRef = useRef(auctionState.currentBid);

  const isLiveMode = LIVE_MODES.includes(activeMode);
  const isBidding = auctionState.currentAuctionStatus === 'Bidding';
  const hasPlayer = !!currentPlayer;

  const bidPhase: BidPanelPhase =
    currentPlayer?.isUnsold ? 'unsold' : 'live';

  const soldTeam =
    auctionState.currentAuctionStatus === 'Sold' && auctionState.winningTeamId
      ? teams.find(t => t._id === auctionState.winningTeamId)
      : undefined;

  // ── Bid pop + delta ──
  useEffect(() => {
    if (auctionState.currentAuctionStatus === 'Bidding' && auctionState.currentBid !== prevBidRef.current) {
      const delta = auctionState.currentBid - prevBidRef.current;
      if (prevBidRef.current > 0 && delta > 0) setBidDelta(delta);
      setBidPopping(true);
      const popT = setTimeout(() => setBidPopping(false), 300);
      const deltaT = setTimeout(() => setBidDelta(null), 1200);
      prevBidRef.current = auctionState.currentBid;
      return () => {
        clearTimeout(popT);
        clearTimeout(deltaT);
      };
    }
    prevBidRef.current = auctionState.currentBid;
  }, [auctionState.currentBid, auctionState.currentAuctionStatus]);

  // ── Display mode transitions (match Theme 1 Full Screen 2 timing) ──
  useEffect(() => {
    const incoming = settings.displayMode;
    const prev = prevModeRef.current;
    prevModeRef.current = incoming;
    if (prev === incoming) return;

    if (prev === 'standard' || prev === 'custom-ticker') {
      if (incoming === 'standard' || incoming === 'custom-ticker') {
        setActiveMode(incoming);
        return;
      }
      if (incoming === 'wheel-spin') {
        setActiveMode('wheel-spin');
        return;
      }
      setPanelExiting(true);
      const t = setTimeout(() => {
        setActiveMode(incoming);
        setPanelExiting(false);
      }, 1500);
      return () => clearTimeout(t);
    }

    if (prev === 'wheel-spin') {
      setSummaryExiting(true);
      const t = setTimeout(() => {
        setActiveMode(incoming);
        setSummaryExiting(false);
      }, 500);
      return () => clearTimeout(t);
    }

    if (
      prev === 'sold-summary' ||
      prev === 'team-summary' ||
      prev === 'team-wise-summary' ||
      prev === 'team-wise-image' ||
      prev === 'top10-summary' ||
      prev === 'resting'
    ) {
      setSummaryExiting(true);
      const t = setTimeout(() => {
        setActiveMode(incoming);
        setSummaryExiting(false);
      }, 1800);
      return () => clearTimeout(t);
    }

    setActiveMode(incoming);
    setPanelExiting(false);
  }, [settings.displayMode]);

  // ── Sold toast + waiting-for-next-player ──
  useEffect(() => {
    const status = auctionState.currentAuctionStatus;
    if (status === 'Sold' && prevStatusRef.current !== 'Sold') {
      const winningTeam = teams.find(t => t._id === currentPlayer?.winningTeamId);
      const price = currentPlayer?.finalPrice ?? (auctionState.currentBid || 0);
      if (currentPlayer && winningTeam) {
        if (toastTimersRef.current.exit) clearTimeout(toastTimersRef.current.exit);
        if (toastTimersRef.current.clear) clearTimeout(toastTimersRef.current.clear);
        if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
        soldPlayerIdRef.current = currentPlayer._id;
        setSoldToast({ player: currentPlayer, team: winningTeam, price });
        setToastExiting(false);
        setWaitingForNextPlayer(false);
        setWaitingExiting(false);
        toastTimersRef.current.exit = setTimeout(() => setToastExiting(true), 4400);
        toastTimersRef.current.clear = setTimeout(() => {
          setSoldToast(null);
          setToastExiting(false);
        }, 5000);
        waitingTimerRef.current = setTimeout(() => {
          setWaitingForNextPlayer(true);
          setWaitingExiting(false);
        }, 5000);
      }
    }
    prevStatusRef.current = status;
  }, [auctionState.currentAuctionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!soldToast && !waitingForNextPlayer) return;
    if (currentPlayer && currentPlayer._id !== soldPlayerIdRef.current) {
      if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
      if (waitingForNextPlayer) {
        setWaitingExiting(true);
        setTimeout(() => {
          setWaitingForNextPlayer(false);
          setWaitingExiting(false);
        }, 600);
      }
      if (soldToast) {
        if (toastTimersRef.current.exit) clearTimeout(toastTimersRef.current.exit);
        if (toastTimersRef.current.clear) clearTimeout(toastTimersRef.current.clear);
        setSoldToast(null);
        setToastExiting(false);
      }
    }
  }, [currentPlayer?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (settings.displayMode === 'wheel-spin') {
      if (toastTimersRef.current.exit) clearTimeout(toastTimersRef.current.exit);
      if (toastTimersRef.current.clear) clearTimeout(toastTimersRef.current.clear);
      setSoldToast(null);
      setToastExiting(false);
      setWaitingForNextPlayer(false);
    }
  }, [settings.displayMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const showTicker =
    !settings.hideTickerFullscreen && activeMode !== 'wheel-spin';

  const summaryWrap = (children: React.ReactNode) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        opacity: summaryExiting ? 0 : 1,
        transform: summaryExiting ? 'scale(0.97)' : 'scale(1)',
        transition: summaryExiting ? 'none' : 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      {children}
    </div>
  );

  return (
    <Theme3Canvas>
      <style>{`
        @keyframes t3fs2PanelEnter {
          0%   { transform: scaleX(0)   scaleY(0.004); }
          28%  { transform: scaleX(1)   scaleY(0.004); }
          100% { transform: scaleX(1)   scaleY(1);     }
        }
        @keyframes t3fs2PanelExit {
          0%   { transform: scaleX(1)   scaleY(1);     }
          65%  { transform: scaleX(1)   scaleY(0.004); }
          100% { transform: scaleX(0)   scaleY(0.004); }
        }
        .t3fs2-panel-enter {
          animation: t3fs2PanelEnter 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: center center;
        }
        .t3fs2-panel-exit {
          animation: t3fs2PanelExit 1.5s ease-in forwards;
          transform-origin: center center;
        }
        @keyframes t3fs2SummaryFadeOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.97); }
        }
        .t3fs2-summary-exit { animation: t3fs2SummaryFadeOut 0.5s ease-in forwards; }
        @keyframes t3fs2BidCardPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.55); }
          50%      { box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 0 28px rgba(var(--t3-accent-rgb, 185, 170, 98), 0.35); }
        }
        .t3fs2-bid-active { animation: t3fs2BidCardPulse 1.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .t3fs2-panel-enter, .t3fs2-panel-exit, .t3fs2-bid-active { animation: none !important; }
        }
      `}</style>

      {/* ── Summary / special modes ── */}
      {activeMode === 'sold-summary' &&
        summaryWrap(
          <SoldPlayersSummaryT3
            players={players}
            teams={teams}
            tournament={tournament}
            isExiting={summaryExiting}
          />,
        )}

      {activeMode === 'top10-summary' &&
        summaryWrap(
          <Top10SummaryT3
            players={players}
            teams={teams}
            tournament={tournament}
            isExiting={summaryExiting}
          />,
        )}

      {activeMode === 'team-summary' &&
        summaryWrap(
          <TeamSummaryT3
            teams={teams}
            players={players}
            tournament={tournament}
            teamId={settings.teamWiseTeamId ?? ''}
            isExiting={summaryExiting}
          />,
        )}

      {activeMode === 'team-wise-summary' &&
        summaryWrap(
          <TeamWiseSummaryT3
            players={players}
            teams={teams}
            tournament={tournament}
            teamId={settings.teamWiseTeamId ?? ''}
            isExiting={summaryExiting}
          />,
        )}

      {activeMode === 'resting' &&
        summaryWrap(<RestingTimeT3 tournament={tournament} />)}

      {isTheme3TeamImageryMode(activeMode) &&
        summaryWrap(
          <TeamWiseImageryT3
            players={players}
            teams={teams}
            tournament={tournament}
            teamId={settings.teamWiseTeamId ?? ''}
            isExiting={summaryExiting}
          />,
        )}

      {activeMode === 'wheel-spin' && wheelSpinData && (
        <WheelSpinT3 data={wheelSpinData} allPlayers={players} tournament={tournament} />
      )}

      {/* ── Live mode: full-screen image + floating bid card (Theme 1 FS2 pattern) ── */}
      {isLiveMode && (
        <div
          key={currentPlayer?._id ?? 'no-player'}
          className={panelExiting ? 't3fs2-panel-exit' : 't3fs2-panel-enter'}
          style={{ position: 'absolute', inset: 0, transformOrigin: 'center center', zIndex: 5 }}
        >
          {!waitingForNextPlayer && (
            <SecondaryImagePanelT3 currentPlayer={currentPlayer} tournament={tournament} />
          )}

          {hasPlayer && !waitingForNextPlayer && !settings.hidePremiumCard && (
            <div
              className={isBidding ? 't3fs2-bid-active' : ''}
              style={{
                position: 'absolute',
                left: settings.bidCardLeft ?? 1576,
                top: settings.bidCardTop ?? 160,
                width: 320,
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid var(--t3-bar-gold, var(--t3-accent))',
                boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
                zIndex: 6,
              }}
            >
              <CurrentBidPanelT3
                auctionState={auctionState}
                teams={teams}
                tournament={tournament}
                currentPlayer={currentPlayer!}
                isBidding={isBidding}
                bidPopping={bidPopping}
                bidDelta={bidDelta}
                phase={bidPhase}
                soldTeam={soldTeam}
                layout="bar"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Ticker ── */}
      <TickerT3Shared
        visible={showTicker}
        soldPlayers={soldPlayers}
        players={players}
        teams={teams}
        tournament={tournament}
        mode={settings.tickerMode}
        customMode={activeMode === 'custom-ticker'}
        customLine1={settings.customTickerLine1}
        customLine2={settings.customTickerLine2}
      />

      {/* ── Waiting for next player ── */}
      {waitingForNextPlayer && isLiveMode && (
        <div
          className={waitingExiting ? 't3fs2-summary-exit' : undefined}
          style={{ position: 'absolute', inset: 0, zIndex: 15 }}
        >
          <RestingTimeT3 tournament={tournament} overrideLabel="Waiting for Next Player" />
        </div>
      )}

      {/* ── Sold toast ── */}
      {soldToast && (
        <SoldMessageToast
          player={soldToast.player}
          team={soldToast.team}
          finalPrice={soldToast.price}
          exiting={toastExiting}
          position={settings.soldMessagePosition ?? 'bottom-right'}
        />
      )}
    </Theme3Canvas>
  );
};

export default FullScreenAltT3Content;
