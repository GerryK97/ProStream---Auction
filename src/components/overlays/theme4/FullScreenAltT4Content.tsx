'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Theme4Canvas } from './Theme4Canvas';
import CurrentBidPanelT4, { type BidPanelPhaseT4 } from './CurrentBidPanelT4';
import WheelSpinT4 from './WheelSpinT4';
import TickerT4 from './TickerT4';
import SoldPlayersSummaryT4 from './SoldPlayersSummaryT4';
import TeamSummaryT4 from './TeamSummaryT4';
import TeamWiseSummaryT4 from './TeamWiseSummaryT4';
import Top10SummaryT4 from './Top10SummaryT4';
import TeamWiseImageryT4 from './TeamWiseImageryT4';
import RestingTimeT4 from './RestingTimeT4';
import SoldMessageToast from '../shared/SoldMessageToast';
import ResilientImage from '../shared/ResilientImage';
import { FS2_BID_T4_WIDTH } from './fullScreenPlayerCardT4Layout';
import { T4_SUMMARY_EXIT_MS } from './soldPlayersSummaryT4Layout';
import type { Theme4ContentProps } from './types';
import type { OverlaySettings } from '../OverlayWrapper';
import type { Player, Team } from '@/types';

type DisplayMode = OverlaySettings['displayMode'];

const LIVE_MODES: DisplayMode[] = ['standard', 'custom-ticker'];
const NAME_FONT = 'var(--t4-font-name, "Bebas Neue", "Oswald", Impact, sans-serif)';
const LABEL_FONT = 'var(--t4-font-label, "Oswald", "Arial Narrow", sans-serif)';

function SecondaryImagePanelT4({
  currentPlayer,
  tournament,
}: {
  currentPlayer: Player | undefined;
  tournament: Theme4ContentProps['tournament'];
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
          background: 'var(--t4-bg-photo, rgba(5,8,16,0.95))',
        }}
      >
        <svg
          width="96"
          height="96"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(243,226,160,0.2)"
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
            color: 'rgba(243,226,160,0.4)',
            fontSize: 24,
            fontFamily: LABEL_FONT,
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
            height: 220,
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(5,8,16,0.92) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 48,
            bottom: 88,
            right: 400,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily: NAME_FONT,
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--t4-name-gold, #F0D878)',
              textShadow: '0 4px 20px rgba(0,0,0,0.75)',
              lineHeight: 1,
            }}
          >
            {currentPlayer!.name}
          </div>
          {currentPlayer!.position && (
            <div
              style={{
                marginTop: 10,
                fontFamily: LABEL_FONT,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(243,226,160,0.75)',
              }}
            >
              {currentPlayer!.position}
            </div>
          )}
        </div>
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
        background: 'var(--t4-bg-photo, rgba(5,8,16,0.95))',
      }}
    >
      {tournament?.logoURL ? (
        <ResilientImage
          src={tournament.logoURL}
          alt={tournament.name}
          style={{ width: 320, height: 320, objectFit: 'contain', opacity: 0.85 }}
        />
      ) : (
        <span
          style={{
            fontFamily: NAME_FONT,
            fontSize: 120,
            color: 'rgba(243,226,160,0.15)',
          }}
        >
          {currentPlayer!.name
            .split(/\s+/)
            .slice(0, 2)
            .map(w => w[0])
            .join('')
            .toUpperCase()}
        </span>
      )}
    </div>
  );
}

/**
 * Full Screen 2 Theme 4 — secondary-image hero + floating bid card (Theme 3 Alt structure).
 */
const FullScreenAltT4Content: React.FC<Theme4ContentProps> = ({
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

  const [soldToast, setSoldToast] = useState<{
    player: Player;
    team: Team;
    price: number;
  } | null>(null);
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

  const bidPhase: BidPanelPhaseT4 = currentPlayer?.isUnsold ? 'unsold' : 'live';

  const soldTeam =
    auctionState.currentAuctionStatus === 'Sold' && auctionState.winningTeamId
      ? teams.find(t => t._id === auctionState.winningTeamId)
      : undefined;

  useEffect(() => {
    if (
      auctionState.currentAuctionStatus === 'Bidding' &&
      auctionState.currentBid !== prevBidRef.current
    ) {
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
      }, T4_SUMMARY_EXIT_MS);
      return () => clearTimeout(t);
    }

    setActiveMode(incoming);
    setPanelExiting(false);
  }, [settings.displayMode]);

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
  }, [settings.displayMode]);

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
    <Theme4Canvas>
      <style>{`
        @keyframes t4fs2PanelEnter {
          0%   { transform: scaleX(0)   scaleY(0.004); }
          28%  { transform: scaleX(1)   scaleY(0.004); }
          100% { transform: scaleX(1)   scaleY(1);     }
        }
        @keyframes t4fs2PanelExit {
          0%   { transform: scaleX(1)   scaleY(1);     }
          65%  { transform: scaleX(1)   scaleY(0.004); }
          100% { transform: scaleX(0)   scaleY(0.004); }
        }
        .t4fs2-panel-enter {
          animation: t4fs2PanelEnter 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: center center;
        }
        .t4fs2-panel-exit {
          animation: t4fs2PanelExit 1.5s ease-in forwards;
          transform-origin: center center;
        }
        @keyframes t4fs2BidCardPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.55); }
          50%      { box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 0 28px rgba(212,175,55,0.35); }
        }
        .t4fs2-bid-active { animation: t4fs2BidCardPulse 1.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .t4fs2-panel-enter, .t4fs2-panel-exit, .t4fs2-bid-active { animation: none !important; }
        }
      `}</style>

      {activeMode === 'sold-summary' &&
        summaryWrap(
          <SoldPlayersSummaryT4
            players={players}
            teams={teams}
            tournament={tournament}
            isExiting={summaryExiting}
          />,
        )}

      {activeMode === 'top10-summary' &&
        summaryWrap(
          <Top10SummaryT4
            players={players}
            teams={teams}
            tournament={tournament}
            isExiting={summaryExiting}
          />,
        )}

      {activeMode === 'team-summary' &&
        summaryWrap(
          <TeamSummaryT4
            teams={teams}
            players={players}
            tournament={tournament}
            teamId={settings.teamWiseTeamId ?? ''}
            isExiting={summaryExiting}
          />,
        )}

      {activeMode === 'team-wise-summary' &&
        summaryWrap(
          <TeamWiseSummaryT4
            players={players}
            teams={teams}
            tournament={tournament}
            teamId={settings.teamWiseTeamId ?? ''}
            isExiting={summaryExiting}
          />,
        )}

      {activeMode === 'resting' &&
        summaryWrap(<RestingTimeT4 tournament={tournament} isExiting={summaryExiting} />)}

      {activeMode === 'team-wise-image' &&
        summaryWrap(
          <TeamWiseImageryT4
            players={players}
            teams={teams}
            tournament={tournament}
            teamId={settings.teamWiseTeamId ?? ''}
            isExiting={summaryExiting}
          />,
        )}

      {activeMode === 'wheel-spin' && wheelSpinData && (
        <WheelSpinT4 data={wheelSpinData} allPlayers={players} tournament={tournament} />
      )}

      {isLiveMode && (
        <div
          key={currentPlayer?._id ?? 'no-player'}
          className={panelExiting ? 't4fs2-panel-exit' : 't4fs2-panel-enter'}
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'center center',
            zIndex: 5,
          }}
        >
          {!waitingForNextPlayer && (
            <SecondaryImagePanelT4
              currentPlayer={currentPlayer}
              tournament={tournament}
            />
          )}

          {hasPlayer && !waitingForNextPlayer && !settings.hidePremiumCard && (
            <div
              className={isBidding ? 't4fs2-bid-active' : ''}
              style={{
                position: 'absolute',
                left: settings.bidCardLeft ?? 1576,
                top: settings.bidCardTop ?? 160,
                width: FS2_BID_T4_WIDTH,
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid var(--t4-bid-gold, #D4AF37)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
                background: 'rgba(8,12,22,0.92)',
                padding: 12,
                zIndex: 6,
                pointerEvents: 'auto',
              }}
            >
              <CurrentBidPanelT4
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

      <TickerT4
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

      {waitingForNextPlayer && isLiveMode && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 15,
            opacity: waitingExiting ? 0 : 1,
            transition: 'opacity 0.5s ease',
          }}
        >
          <RestingTimeT4
            tournament={tournament}
            isExiting={waitingExiting}
            overrideLabel="Waiting for Next Player"
          />
        </div>
      )}

      {soldToast && (
        <SoldMessageToast
          player={soldToast.player}
          team={soldToast.team}
          finalPrice={soldToast.price}
          exiting={toastExiting}
          position="bottom-right"
        />
      )}
    </Theme4Canvas>
  );
};

export default FullScreenAltT4Content;
