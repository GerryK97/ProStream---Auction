'use client';

import React, { useEffect, useRef, useState } from 'react';
import TickerT3Shared from './TickerT3Shared';
import { Theme3Canvas } from './Theme3Canvas';
import FullScreenPlayerCardT3 from './FullScreenPlayerCardT3';
import TeamWiseImageryT3 from './TeamWiseImageryT3';
import SoldPlayersSummaryT3 from './SoldPlayersSummaryT3';
import Top10SummaryT3 from './Top10SummaryT3';
import RestingTimeT3 from './RestingTimeT3';
import TeamSummaryT3 from './TeamSummaryT3';
import TeamWiseSummaryT3 from './TeamWiseSummaryT3';
import WheelSpinT3 from './WheelSpinT3';
import type { Theme3ContentProps } from './types';
import { isTheme3TeamImageryMode } from './types';
import type { OverlaySettings } from '../OverlayWrapper';
import type { Player } from '@/types';

type DisplayMode = OverlaySettings['displayMode'];

const SUMMARY_MODES: DisplayMode[] = [
  'sold-summary', 'team-summary', 'team-wise-summary',
  'team-wise-image', 'top10-summary', 'resting', 'wheel-spin',
];

const LIVE_MODES: DisplayMode[] = ['standard', 'custom-ticker'];

const SUMMARY_PANELS: DisplayMode[] = [
  'sold-summary', 'team-summary', 'team-wise-summary',
  'team-wise-image', 'top10-summary', 'resting',
];

function isSummaryPanel(mode: DisplayMode): boolean {
  return SUMMARY_PANELS.includes(mode);
}

/** Full Screen overlay — 1920×1080 canvas with full-screen player card + ticker. */
const FullScreenT3Content: React.FC<Theme3ContentProps> = ({
  soldPlayers,
  teams,
  players,
  currentPlayer,
  tournament,
  auctionState,
  overlaySettings,
  wheelSpinData,
}) => {
  const [activeMode, setActiveMode] = useState<DisplayMode>(overlaySettings.displayMode);
  const [summaryExiting, setSummaryExiting] = useState(false);
  const [panelExiting, setPanelExiting] = useState(false);
  const [waitingForNextPlayer, setWaitingForNextPlayer] = useState(false);
  const [waitingExiting, setWaitingExiting] = useState(false);
  const [cardVisible, setCardVisible] = useState(true);
  const prevModeRef = useRef<DisplayMode>(overlaySettings.displayMode);
  /** Latch last live player through mark-unsold (API clears currentPlayerId immediately). */
  const stagePlayerRef = useRef<Player | undefined>(currentPlayer);
  const soldPlayerIdRef = useRef<string | undefined>(undefined);
  const waitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync during render so the card never unmounts for a frame before isUnsold lands.
  if (currentPlayer) {
    stagePlayerRef.current = currentPlayer;
  } else if (stagePlayerRef.current) {
    const updated = players.find(p => p._id === stagePlayerRef.current!._id);
    if (updated?.isUnsold) {
      stagePlayerRef.current = updated;
    }
  }

  const stagePlayer =
    currentPlayer ??
    (stagePlayerRef.current?.isUnsold ? stagePlayerRef.current : undefined);

  const requestedMode = overlaySettings.displayMode;
  const requestIsSummary = isSummaryPanel(requestedMode);
  const requestIsWheel = requestedMode === 'wheel-spin';
  const isLiveMode = LIVE_MODES.includes(activeMode);
  const isCustomTicker = activeMode === 'custom-ticker';
  const visibleSummaryMode = requestIsSummary
    ? requestedMode
    : isSummaryPanel(activeMode) && summaryExiting
      ? activeMode
      : null;

  useEffect(() => {
    const incoming = overlaySettings.displayMode;
    const prev = prevModeRef.current;
    prevModeRef.current = incoming;
    if (prev === incoming) return;

    if (incoming === 'wheel-spin') {
      setActiveMode('wheel-spin');
      setSummaryExiting(false);
      setPanelExiting(false);
      setWaitingForNextPlayer(false);
      setCardVisible(true);
      return;
    }

    // Entering a summary must be synchronous. A delayed setActiveMode is
    // cancelled by React Strict Mode cleanup, which leaves the opaque player
    // card on screen forever.
    if (isSummaryPanel(incoming)) {
      setActiveMode(incoming);
      setSummaryExiting(false);
      setPanelExiting(true);
      setWaitingForNextPlayer(false);
      return;
    }

    const prevIsSummary = SUMMARY_MODES.includes(prev);
    const nextIsLive = LIVE_MODES.includes(incoming);
    const prevIsLive = LIVE_MODES.includes(prev);

    if (prevIsLive && nextIsLive && prev !== incoming) {
      setActiveMode(incoming);
      return;
    }

    if (prevIsSummary && !SUMMARY_MODES.includes(incoming)) {
      setSummaryExiting(true);
      const t = setTimeout(() => {
        setActiveMode(incoming);
        setSummaryExiting(false);
        setPanelExiting(false);
      }, 600);
      return () => clearTimeout(t);
    }

    setActiveMode(incoming);
    setSummaryExiting(false);
    setPanelExiting(false);
  }, [overlaySettings.displayMode]);

  useEffect(() => {
    if (activeMode === 'wheel-spin') {
      setWaitingForNextPlayer(false);
      setCardVisible(true);
    }
  }, [activeMode]);

  // Wheel-spin exit is timer-driven via overlaySettings.displayMode (OverlayWrapper).
  // Do not bail on currentPlayerId — select-player fires mid-spin on purpose.

  useEffect(() => {
    if (
      isLiveMode &&
      tournament?.status === 'Live' &&
      auctionState.currentPlayerId &&
      currentPlayer &&
      waitingForNextPlayer &&
      currentPlayer._id !== soldPlayerIdRef.current
    ) {
      if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
      setWaitingExiting(true);
      const t = setTimeout(() => {
        setWaitingForNextPlayer(false);
        setWaitingExiting(false);
        setCardVisible(true);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [currentPlayer?._id, auctionState.currentPlayerId, isLiveMode, tournament?.status, waitingForNextPlayer]);

  const handleCardDismissed = () => {
    soldPlayerIdRef.current = stagePlayer?._id;
    stagePlayerRef.current = undefined;
    setCardVisible(false);
    if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
    waitingTimerRef.current = setTimeout(() => {
      setWaitingForNextPlayer(true);
      setWaitingExiting(false);
    }, 200);
  };

  const holdingUnsoldReveal = !!stagePlayer?.isUnsold && !auctionState.currentPlayerId;

  const showPlayerCard =
    !overlaySettings.hidePremiumCard &&
    isLiveMode &&
    !requestIsSummary &&
    !requestIsWheel &&
    tournament?.status === 'Live' &&
    !!stagePlayer &&
    (!!auctionState.currentPlayerId || holdingUnsoldReveal) &&
    cardVisible &&
    !waitingForNextPlayer;

  const cardAuctionState =
    holdingUnsoldReveal && stagePlayer
      ? { ...auctionState, currentPlayerId: stagePlayer._id }
      : auctionState;

  const showWaiting =
    isLiveMode &&
    !requestIsSummary &&
    !requestIsWheel &&
    tournament?.status === 'Live' &&
    waitingForNextPlayer &&
    !overlaySettings.hidePremiumCard;

  const showTicker =
    !overlaySettings.hideTickerFullscreen &&
    !requestIsSummary &&
    !requestIsWheel &&
    activeMode !== 'wheel-spin' &&
    !(activeMode === 'standard' && (showPlayerCard || showWaiting));

  const summaryExitingNow = summaryExiting && !requestIsSummary;

  return (
    <Theme3Canvas>
      {visibleSummaryMode && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            opacity: summaryExitingNow ? 0 : 1,
            transform: summaryExitingNow ? 'scale(0.97)' : 'scale(1)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            pointerEvents: 'none',
          }}
        >
          {visibleSummaryMode === 'sold-summary' && (
            <SoldPlayersSummaryT3
              players={players}
              teams={teams}
              tournament={tournament}
              isExiting={summaryExitingNow}
            />
          )}
          {visibleSummaryMode === 'top10-summary' && (
            <Top10SummaryT3
              players={players}
              teams={teams}
              tournament={tournament}
              isExiting={summaryExitingNow}
            />
          )}
          {visibleSummaryMode === 'team-summary' && (
            <TeamSummaryT3
              teams={teams}
              players={players}
              tournament={tournament}
              teamId={overlaySettings.teamWiseTeamId ?? ''}
              isExiting={summaryExitingNow}
            />
          )}
          {visibleSummaryMode === 'team-wise-summary' && (
            <TeamWiseSummaryT3
              players={players}
              teams={teams}
              tournament={tournament}
              teamId={overlaySettings.teamWiseTeamId ?? ''}
              isExiting={summaryExitingNow}
            />
          )}
          {visibleSummaryMode === 'resting' && (
            <RestingTimeT3 tournament={tournament} />
          )}
          {isTheme3TeamImageryMode(visibleSummaryMode) && (
            <TeamWiseImageryT3
              players={players}
              teams={teams}
              tournament={tournament}
              teamId={overlaySettings.teamWiseTeamId ?? ''}
              isExiting={summaryExitingNow}
            />
          )}
        </div>
      )}

      {/* ── Wheel spin ── */}
      {(activeMode === 'wheel-spin' || requestIsWheel) && wheelSpinData && (
        <WheelSpinT3 data={wheelSpinData} allPlayers={players} tournament={tournament} />
      )}

      {/* ── Full-screen player card (standard / custom-ticker) ── */}
      {showPlayerCard && stagePlayer && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            opacity: panelExiting ? 0 : 1,
            transform: panelExiting ? 'scale(0.98)' : 'scale(1)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <FullScreenPlayerCardT3
            key={stagePlayer._id}
            currentPlayer={stagePlayer}
            auctionState={cardAuctionState}
            teams={teams}
            tournament={tournament}
            tickerVisible={showTicker && isCustomTicker}
            visible={showPlayerCard}
            onDismissed={handleCardDismissed}
          />
        </div>
      )}

      {/* ── Waiting for next player ── */}
      {showWaiting && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 15,
            opacity: waitingExiting ? 0 : 1,
            transform: waitingExiting ? 'scale(0.98)' : 'scale(1)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <RestingTimeT3 tournament={tournament} overrideLabel="Waiting for Next Player" />
        </div>
      )}

      {/* ── Ticker ── */}
      <TickerT3Shared
        visible={showTicker}
        soldPlayers={soldPlayers}
        players={players}
        teams={teams}
        tournament={tournament}
        mode={overlaySettings.tickerMode}
        customMode={isCustomTicker}
        customLine1={overlaySettings.customTickerLine1}
        customLine2={overlaySettings.customTickerLine2}
      />
    </Theme3Canvas>
  );
};

export default FullScreenT3Content;
