'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Theme4Canvas } from './Theme4Canvas';
import PlayerCardT4 from './PlayerCardT4';
import PortraitPlayerCardT4 from './PortraitPlayerCardT4';
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

type DisplayMode = OverlaySettings['displayMode'];

const SUMMARY_MODES = new Set<DisplayMode>([
  'sold-summary',
  'team-summary',
  'team-wise-summary',
  'top10-summary',
  'team-wise-image',
  'resting',
]);

function isSummaryMode(mode: DisplayMode): boolean {
  return SUMMARY_MODES.has(mode);
}

/**
 * Custom (transparent) Theme 4 overlay.
 * size=small → Frame 15 lower-third card
 * size=large → centered portrait
 * displayMode=wheel-spin → slot reel player selection
 * displayMode=sold-summary | team-summary | top10-summary | team-wise-image | resting → panels
 * ticker → Prime news-ticker bar
 */
const CustomT4Content: React.FC<Theme4ContentProps> = ({
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
  const prevModeRef = useRef<DisplayMode>(overlaySettings.displayMode);

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

  const isWheelSpin = activeMode === 'wheel-spin' && !!wheelSpinData;
  const isSummary = isSummaryMode(activeMode);
  const isCustomTicker = activeMode === 'custom-ticker';
  const showTicker =
    !overlaySettings.hideTickerCustom && !isWheelSpin && !isSummary;

  const showCard =
    !isWheelSpin &&
    !isSummary &&
    !overlaySettings.hidePremiumCard &&
    (activeMode === 'standard' || activeMode === 'custom-ticker') &&
    tournament?.status === 'Live' &&
    !!auctionState.currentPlayerId &&
    !!currentPlayer;

  const isLargeCard = overlaySettings.size === 'large';

  return (
    <Theme4Canvas transparent>
      {isSummary && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            opacity: summaryExiting ? 0 : 1,
            transform: summaryExiting ? 'scale(0.97)' : 'scale(1)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            pointerEvents: 'none',
          }}
        >
          {activeMode === 'sold-summary' && (
            <SoldPlayersSummaryT4
              players={players}
              teams={teams}
              tournament={tournament}
              isExiting={summaryExiting}
            />
          )}
          {activeMode === 'team-summary' && (
            <TeamSummaryT4
              teams={teams}
              players={players}
              tournament={tournament}
              teamId={overlaySettings.teamWiseTeamId ?? ''}
              isExiting={summaryExiting}
            />
          )}
          {activeMode === 'team-wise-summary' && (
            <TeamWiseSummaryT4
              players={players}
              teams={teams}
              tournament={tournament}
              teamId={overlaySettings.teamWiseTeamId ?? ''}
              isExiting={summaryExiting}
            />
          )}
          {activeMode === 'top10-summary' && (
            <Top10SummaryT4
              players={players}
              teams={teams}
              tournament={tournament}
              isExiting={summaryExiting}
            />
          )}
          {activeMode === 'team-wise-image' && (
            <TeamWiseImageryT4
              teams={teams}
              players={players}
              tournament={tournament}
              teamId={overlaySettings.teamWiseTeamId ?? ''}
              isExiting={summaryExiting}
            />
          )}
          {activeMode === 'resting' && (
            <RestingTimeT4 tournament={tournament} isExiting={summaryExiting} />
          )}
        </div>
      )}

      {isWheelSpin && wheelSpinData && (
        <SlotReelT4 data={wheelSpinData} allPlayers={players} tournament={tournament} />
      )}

      {showCard &&
        (isLargeCard ? (
          <PortraitPlayerCardT4
            key={auctionState.currentPlayerId}
            currentPlayer={currentPlayer}
            auctionState={auctionState}
            teams={teams}
            tournament={tournament}
            visible={showCard}
          />
        ) : (
          <PlayerCardT4
            key={auctionState.currentPlayerId}
            currentPlayer={currentPlayer}
            auctionState={auctionState}
            teams={teams}
            tournament={tournament}
            visible={showCard}
            tickerVisible={showTicker}
          />
        ))}

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

export default CustomT4Content;
