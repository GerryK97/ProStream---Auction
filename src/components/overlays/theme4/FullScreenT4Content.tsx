'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Theme4Canvas } from './Theme4Canvas';
import FullScreenPlayerCardT4 from './FullScreenPlayerCardT4';
import SlotReelT4 from './SlotReelT4';
import TickerT4 from './TickerT4';
import SoldPlayersSummaryT4 from './SoldPlayersSummaryT4';
import TeamSummaryT4 from './TeamSummaryT4';
import TeamWiseSummaryT4 from './TeamWiseSummaryT4';
import Top10SummaryT4 from './Top10SummaryT4';
import TeamWiseImageryT4 from './TeamWiseImageryT4';
import RestingTimeT4 from './RestingTimeT4';
import { T4_SUMMARY_EXIT_MS } from './soldPlayersSummaryT4Layout';
import type { Theme4ContentProps } from './types';
import type { OverlaySettings } from '../OverlayWrapper';
import type { Player } from '@/types';

type DisplayMode = OverlaySettings['displayMode'];

const SUMMARY_MODES = new Set<DisplayMode>([
  'sold-summary',
  'team-summary',
  'team-wise-summary',
  'top10-summary',
  'team-wise-image',
  'resting',
]);

const LIVE_MODES = new Set<DisplayMode>(['standard', 'custom-ticker']);

function isSummaryMode(mode: DisplayMode): boolean {
  return SUMMARY_MODES.has(mode);
}

/**
 * Full Screen Theme 4 — opaque dedicated full-bleed player card + ticker/summaries/slot reel.
 */
const FullScreenT4Content: React.FC<Theme4ContentProps> = ({
  currentPlayer,
  tournament,
  auctionState,
  overlaySettings,
  teams,
  players,
  soldPlayers,
  wheelSpinData,
}) => {
  const [activeMode, setActiveMode] = useState<DisplayMode>(overlaySettings.displayMode);
  const [summaryExiting, setSummaryExiting] = useState(false);
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
  const requestIsSummary = isSummaryMode(requestedMode);
  const requestIsWheel = requestedMode === 'wheel-spin';
  const isLiveMode = LIVE_MODES.has(activeMode);
  const isCustomTicker = activeMode === 'custom-ticker';
  const isWheelSpin = activeMode === 'wheel-spin' && !!wheelSpinData;
  const isSummary = isSummaryMode(activeMode);
  /** Prefer the live requested mode so summaries appear even if activeMode lags behind the player card. */
  const visibleSummaryMode = requestIsSummary
    ? requestedMode
    : isSummary && summaryExiting
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
      setWaitingForNextPlayer(false);
      setCardVisible(true);
      return;
    }

    // Entering a summary must be immediate — the opaque player card would cover
    // the panel if we waited on the delayed activeMode transition.
    if (isSummaryMode(incoming)) {
      setActiveMode(incoming);
      setSummaryExiting(false);
      setWaitingForNextPlayer(false);
      return;
    }

    if (isSummaryMode(prev) && incoming !== prev) {
      setSummaryExiting(true);
      const t = setTimeout(() => {
        setActiveMode(incoming);
        setSummaryExiting(false);
      }, T4_SUMMARY_EXIT_MS);
      return () => clearTimeout(t);
    }

    setActiveMode(incoming);
    setSummaryExiting(false);
  }, [overlaySettings.displayMode]);

  useEffect(() => {
    if (activeMode === 'wheel-spin') {
      setWaitingForNextPlayer(false);
      setCardVisible(true);
    }
  }, [activeMode]);

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
  }, [
    currentPlayer?._id,
    auctionState.currentPlayerId,
    isLiveMode,
    tournament?.status,
    waitingForNextPlayer,
  ]);

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
    !isSummary &&
    activeMode !== 'wheel-spin' &&
    requestedMode !== 'wheel-spin' &&
    !(activeMode === 'standard' && (showPlayerCard || showWaiting));

  const cardAuctionState =
    holdingUnsoldReveal && stagePlayer
      ? { ...auctionState, currentPlayerId: stagePlayer._id }
      : auctionState;

  return (
    <Theme4Canvas>
      {visibleSummaryMode && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            opacity: summaryExiting && !requestIsSummary ? 0 : 1,
            transform: summaryExiting && !requestIsSummary ? 'scale(0.97)' : 'scale(1)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            pointerEvents: 'none',
          }}
        >
          {visibleSummaryMode === 'sold-summary' && (
            <SoldPlayersSummaryT4
              players={players}
              teams={teams}
              tournament={tournament}
              isExiting={summaryExiting && !requestIsSummary}
            />
          )}
          {visibleSummaryMode === 'team-summary' && (
            <TeamSummaryT4
              teams={teams}
              players={players}
              tournament={tournament}
              teamId={overlaySettings.teamWiseTeamId ?? ''}
              isExiting={summaryExiting && !requestIsSummary}
            />
          )}
          {visibleSummaryMode === 'team-wise-summary' && (
            <TeamWiseSummaryT4
              players={players}
              teams={teams}
              tournament={tournament}
              teamId={overlaySettings.teamWiseTeamId ?? ''}
              isExiting={summaryExiting && !requestIsSummary}
            />
          )}
          {visibleSummaryMode === 'top10-summary' && (
            <Top10SummaryT4
              players={players}
              teams={teams}
              tournament={tournament}
              isExiting={summaryExiting && !requestIsSummary}
            />
          )}
          {visibleSummaryMode === 'team-wise-image' && (
            <TeamWiseImageryT4
              teams={teams}
              players={players}
              tournament={tournament}
              teamId={overlaySettings.teamWiseTeamId ?? ''}
              isExiting={summaryExiting && !requestIsSummary}
            />
          )}
          {visibleSummaryMode === 'resting' && (
            <RestingTimeT4 tournament={tournament} isExiting={summaryExiting && !requestIsSummary} />
          )}
        </div>
      )}

      {isWheelSpin && wheelSpinData && (
        <SlotReelT4 data={wheelSpinData} allPlayers={players} tournament={tournament} />
      )}

      {showPlayerCard && stagePlayer && (
        <FullScreenPlayerCardT4
          key={stagePlayer._id}
          currentPlayer={stagePlayer}
          auctionState={cardAuctionState}
          teams={teams}
          tournament={tournament}
          tickerVisible={showTicker}
          visible={showPlayerCard}
          onDismissed={handleCardDismissed}
        />
      )}

      {showWaiting && (
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

      <TickerT4
        soldPlayers={soldPlayers}
        players={players}
        teams={teams}
        tournament={tournament}
        mode={overlaySettings.tickerMode}
        customMode={isCustomTicker}
        customLine1={overlaySettings.customTickerLine1}
        customLine2={overlaySettings.customTickerLine2}
        visible={showTicker}
      />
    </Theme4Canvas>
  );
};

export default FullScreenT4Content;
