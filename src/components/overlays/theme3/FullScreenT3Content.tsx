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

type DisplayMode = OverlaySettings['displayMode'];

const SUMMARY_MODES: DisplayMode[] = [
  'sold-summary', 'team-summary', 'team-wise-summary',
  'team-wise-image', 'top10-summary', 'resting', 'wheel-spin',
];

const LIVE_MODES: DisplayMode[] = ['standard', 'custom-ticker'];

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
  const soldPlayerIdRef = useRef<string | undefined>(undefined);
  const waitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLiveMode = LIVE_MODES.includes(activeMode);
  const isCustomTicker = activeMode === 'custom-ticker';

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

    const prevIsSummary = SUMMARY_MODES.includes(prev);
    const nextIsSummary = SUMMARY_MODES.includes(incoming);
    const prevIsLive = LIVE_MODES.includes(prev);
    const nextIsLive = LIVE_MODES.includes(incoming);

    if (prevIsLive && !nextIsLive && !nextIsSummary) {
      setPanelExiting(true);
      const t = setTimeout(() => {
        setActiveMode(incoming);
        setPanelExiting(false);
      }, 600);
      return () => clearTimeout(t);
    }

    if (prevIsLive && nextIsLive && prev !== incoming) {
      setActiveMode(incoming);
      return;
    }

    if (prevIsSummary && !nextIsSummary) {
      setSummaryExiting(true);
      const t = setTimeout(() => {
        setActiveMode(incoming);
        setSummaryExiting(false);
      }, 600);
      return () => clearTimeout(t);
    }

    if (prevIsLive && nextIsSummary) {
      setPanelExiting(true);
      const t = setTimeout(() => {
        setActiveMode(incoming);
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
    soldPlayerIdRef.current = currentPlayer?._id;
    setCardVisible(false);
    if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
    waitingTimerRef.current = setTimeout(() => {
      setWaitingForNextPlayer(true);
      setWaitingExiting(false);
    }, 200);
  };

  const showPlayerCard =
    !overlaySettings.hidePremiumCard &&
    isLiveMode &&
    tournament?.status === 'Live' &&
    !!auctionState.currentPlayerId &&
    !!currentPlayer &&
    cardVisible &&
    !waitingForNextPlayer;

  const showWaiting =
    isLiveMode &&
    tournament?.status === 'Live' &&
    waitingForNextPlayer &&
    !overlaySettings.hidePremiumCard;

  const showTicker =
    !overlaySettings.hideTickerFullscreen &&
    activeMode !== 'wheel-spin' &&
    !(activeMode === 'standard' && (showPlayerCard || showWaiting));

  return (
    <Theme3Canvas>
      {/* ── Player Summary panel ── */}
      {activeMode === 'sold-summary' && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            opacity: summaryExiting ? 0 : 1,
            transform: summaryExiting ? 'scale(0.97)' : 'scale(1)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <SoldPlayersSummaryT3
            players={players}
            teams={teams}
            tournament={tournament}
            isExiting={summaryExiting}
          />
        </div>
      )}

      {/* ── Top 10 Sold panel ── */}
      {activeMode === 'top10-summary' && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            opacity: summaryExiting ? 0 : 1,
            transform: summaryExiting ? 'scale(0.97)' : 'scale(1)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <Top10SummaryT3
            players={players}
            teams={teams}
            tournament={tournament}
            isExiting={summaryExiting}
          />
        </div>
      )}

      {/* ── Team Summary standings panel ── */}
      {activeMode === 'team-summary' && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            opacity: summaryExiting ? 0 : 1,
            transform: summaryExiting ? 'scale(0.97)' : 'scale(1)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <TeamSummaryT3
            teams={teams}
            players={players}
            tournament={tournament}
            teamId={overlaySettings.teamWiseTeamId ?? ''}
            isExiting={summaryExiting}
          />
        </div>
      )}

      {/* ── Team-wise roster panel (one team at a time) ── */}
      {activeMode === 'team-wise-summary' && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            opacity: summaryExiting ? 0 : 1,
            transform: summaryExiting ? 'scale(0.97)' : 'scale(1)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <TeamWiseSummaryT3
            players={players}
            teams={teams}
            tournament={tournament}
            teamId={overlaySettings.teamWiseTeamId ?? ''}
            isExiting={summaryExiting}
          />
        </div>
      )}

      {/* ── Resting Time lower-third ── */}
      {activeMode === 'resting' && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            opacity: summaryExiting ? 0 : 1,
            transform: summaryExiting ? 'scale(0.97)' : 'scale(1)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <RestingTimeT3 tournament={tournament} />
        </div>
      )}

      {/* ── Team Imagery lineup panel ── */}
      {isTheme3TeamImageryMode(activeMode) && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            opacity: summaryExiting ? 0 : 1,
            transform: summaryExiting ? 'scale(0.97)' : 'scale(1)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <TeamWiseImageryT3
            players={players}
            teams={teams}
            tournament={tournament}
            teamId={overlaySettings.teamWiseTeamId ?? ''}
            isExiting={summaryExiting}
          />
        </div>
      )}

      {/* ── Wheel spin ── */}
      {activeMode === 'wheel-spin' && wheelSpinData && (
        <WheelSpinT3 data={wheelSpinData} allPlayers={players} tournament={tournament} />
      )}

      {/* ── Full-screen player card (standard / custom-ticker) ── */}
      {showPlayerCard && (
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
            key={auctionState.currentPlayerId}
            currentPlayer={currentPlayer}
            auctionState={auctionState}
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
