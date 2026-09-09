'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import TickerT3Shared from './TickerT3Shared';
import { Theme3Canvas } from './Theme3Canvas';
import LiveAuctionPlayerBarT3 from './LiveAuctionPlayerBarT3';
import PortraitPlayerCardT3 from './PortraitPlayerCardT3';
import TeamWiseImageryT3 from './TeamWiseImageryT3';
import SoldPlayersSummaryT3 from './SoldPlayersSummaryT3';
import Top10SummaryT3 from './Top10SummaryT3';
import RestingTimeT3 from './RestingTimeT3';
import TeamSummaryT3 from './TeamSummaryT3';
import TeamWiseSummaryT3 from './TeamWiseSummaryT3';
import WheelSpinT3 from './WheelSpinT3';
import TeamCardOverlayT3 from './TeamCardOverlayT3';
import type { Theme3ContentProps } from './types';
import { isTheme3TeamImageryMode } from './types';
import type { OverlaySettings } from '../OverlayWrapper';
import type { Player } from '@/types';

type DisplayMode = OverlaySettings['displayMode'];

const SUMMARY_MODES: DisplayMode[] = [
  'sold-summary', 'team-summary', 'team-wise-summary',
  'team-wise-image', 'top10-summary', 'resting', 'wheel-spin',
];

/** Custom (transparent) overlay — 1920×1080 canvas with live player bar + ticker. */
const CustomT3Content: React.FC<Theme3ContentProps> = ({
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
  const prevModeRef = useRef<DisplayMode>(overlaySettings.displayMode);
  /** Latch the last live player through mark-unsold (the API clears currentPlayerId immediately). */
  const stagePlayerRef = useRef<Player | undefined>(currentPlayer);
  /** Player whose reveal has finished; keeps the card down until the next player arrives. */
  const [dismissedPlayerId, setDismissedPlayerId] = useState<string | null>(null);

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

  // Clear the dismissal latch once a live player is on stage again. Covers both
  // the next player and a re-auction of the same player that was just unsold.
  useEffect(() => {
    if (!dismissedPlayerId) return;
    if (currentPlayer && !currentPlayer.isUnsold) {
      setDismissedPlayerId(null);
    }
  }, [currentPlayer, dismissedPlayerId]);

  const handleCardDismissed = useCallback(() => {
    const finished = stagePlayerRef.current?._id ?? null;
    stagePlayerRef.current = undefined;
    // State (not just the ref) so the parent re-renders and the card unmounts.
    if (finished) setDismissedPlayerId(finished);
  }, []);

  useEffect(() => {
    const incoming = overlaySettings.displayMode;
    const prev = prevModeRef.current;
    prevModeRef.current = incoming;
    if (prev === incoming) return;

    if (incoming === 'wheel-spin') {
      setActiveMode('wheel-spin');
      setSummaryExiting(false);
      return;
    }

    const prevIsSummary = SUMMARY_MODES.includes(prev);

    if (prevIsSummary && !SUMMARY_MODES.includes(incoming)) {
      setSummaryExiting(true);
      const t = setTimeout(() => { setActiveMode(incoming); setSummaryExiting(false); }, 600);
      return () => clearTimeout(t);
    }

    setActiveMode(incoming);
    setSummaryExiting(false);
  }, [overlaySettings.displayMode]);

  const showTicker = !overlaySettings.hideTickerCustom && activeMode !== 'wheel-spin';
  const isLiveMode = activeMode === 'standard' || activeMode === 'custom-ticker';
  /** Keep the card mounted through the unsold reveal even though currentPlayerId is already null. */
  const holdingUnsoldReveal = !!stagePlayer?.isUnsold && !auctionState.currentPlayerId;
  /** Once the reveal has played out, stay hidden until a different player is selected. */
  const revealAlreadyPlayed = !!stagePlayer && stagePlayer._id === dismissedPlayerId;
  const showLiveBar =
    !overlaySettings.hidePremiumCard &&
    isLiveMode &&
    tournament?.status === 'Live' &&
    !!stagePlayer &&
    !revealAlreadyPlayed &&
    (!!auctionState.currentPlayerId || holdingUnsoldReveal);
  const showTeamCards = isLiveMode && !overlaySettings.hideTeamCards;

  // The reveal components key off auctionState.currentPlayerId, so re-point it at
  // the staged player while the unsold animation is holding the card on screen.
  const cardAuctionState =
    holdingUnsoldReveal && stagePlayer
      ? { ...auctionState, currentPlayerId: stagePlayer._id }
      : auctionState;

  const isLargeCard = overlaySettings.size === 'large';

  return (
    <Theme3Canvas transparent>
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

      {/* ── Live player card (large portrait or small bar) ── */}
      {showLiveBar && stagePlayer && (
        isLargeCard ? (
          <PortraitPlayerCardT3
            key={stagePlayer._id}
            currentPlayer={stagePlayer}
            auctionState={cardAuctionState}
            teams={teams}
            tournament={tournament}
            visible={showLiveBar}
            tickerVisible={showTicker}
            onDismissed={handleCardDismissed}
          />
        ) : (
          <LiveAuctionPlayerBarT3
            key={stagePlayer._id}
            currentPlayer={stagePlayer}
            auctionState={cardAuctionState}
            teams={teams}
            tournament={tournament}
            visible={showLiveBar}
            tickerVisible={showTicker}
            align={showTeamCards ? 'left' : 'center'}
            onDismissed={handleCardDismissed}
          />
        )
      )}

      {/* ── Team cards (Custom Overlay only; live modes) ── */}
      {showTeamCards && (
        <TeamCardOverlayT3
          teams={teams}
          players={players}
          tournament={tournament}
          size={overlaySettings.teamCardSize ?? 'large'}
          position="bottom-right"
          tickerVisible={showTicker}
        />
      )}

      {/* ── Ticker ── */}
      <TickerT3Shared
        visible={showTicker}
        soldPlayers={soldPlayers}
        players={players}
        teams={teams}
        tournament={tournament}
        mode={overlaySettings.tickerMode}
        customMode={activeMode === 'custom-ticker'}
        customLine1={overlaySettings.customTickerLine1}
        customLine2={overlaySettings.customTickerLine2}
      />
    </Theme3Canvas>
  );
};

export default CustomT3Content;
