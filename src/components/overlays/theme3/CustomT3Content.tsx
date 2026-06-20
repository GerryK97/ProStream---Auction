'use client';

import React, { useEffect, useRef, useState } from 'react';
import TickerT3Shared from './TickerT3Shared';
import { Theme3Canvas } from './Theme3Canvas';
import LiveAuctionPlayerBarT3 from './LiveAuctionPlayerBarT3';
import TeamWiseImageT3 from './TeamWiseImageT3';
import type { Theme3ContentProps } from './types';
import type { OverlaySettings } from '../OverlayWrapper';

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
}) => {
  const [activeMode, setActiveMode] = useState<DisplayMode>(overlaySettings.displayMode);
  const [summaryExiting, setSummaryExiting] = useState(false);
  const prevModeRef = useRef<DisplayMode>(overlaySettings.displayMode);

  useEffect(() => {
    const incoming = overlaySettings.displayMode;
    const prev = prevModeRef.current;
    prevModeRef.current = incoming;
    if (prev === incoming) return;

    const prevIsSummary = SUMMARY_MODES.includes(prev);

    if (prevIsSummary && !SUMMARY_MODES.includes(incoming)) {
      setSummaryExiting(true);
      const t = setTimeout(() => { setActiveMode(incoming); setSummaryExiting(false); }, 600);
      return () => clearTimeout(t);
    }

    setActiveMode(incoming);
    setSummaryExiting(false);
  }, [overlaySettings.displayMode]);

  const showTicker = !overlaySettings.hideTickerCustom;
  const showLiveBar =
    !overlaySettings.hidePremiumCard &&
    (activeMode === 'standard' || activeMode === 'custom-ticker') &&
    tournament?.status === 'Live' &&
    !!auctionState.currentPlayerId &&
    !!currentPlayer;

  return (
    <Theme3Canvas transparent>
      {/* ── Team Imagery leaderboard ── */}
      {activeMode === 'team-wise-image' && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            opacity: summaryExiting ? 0 : 1,
            transform: summaryExiting ? 'scale(0.97)' : 'scale(1)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <TeamWiseImageT3
            players={players}
            teams={teams}
            tournament={tournament}
            teamId={overlaySettings.teamWiseTeamId ?? ''}
            isExiting={summaryExiting}
          />
        </div>
      )}

      {/* ── Live player bar ── */}
      {showLiveBar && (
        <LiveAuctionPlayerBarT3
          key={auctionState.currentPlayerId}
          currentPlayer={currentPlayer}
          auctionState={auctionState}
          teams={teams}
          tournament={tournament}
          visible={showLiveBar}
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
