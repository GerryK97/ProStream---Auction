'use client';

import React from 'react';
import TickerT3Shared from './TickerT3Shared';
import { Theme3Canvas } from './Theme3Canvas';
import LiveAuctionPlayerBarT3 from './LiveAuctionPlayerBarT3';
import type { Theme3ContentProps } from './types';

/** Full Screen overlay — 1920×1080 canvas with live player bar + ticker. */
const FullScreenT3Content: React.FC<Theme3ContentProps> = ({
  soldPlayers,
  teams,
  players,
  currentPlayer,
  tournament,
  auctionState,
  overlaySettings,
}) => {
  const activeMode = overlaySettings.displayMode;
  const showTicker = !overlaySettings.hideTickerFullscreen;
  const showLiveBar =
    !overlaySettings.hidePremiumCard &&
    (activeMode === 'standard' || activeMode === 'custom-ticker') &&
    tournament?.status === 'Live' &&
    !!auctionState.currentPlayerId &&
    !!currentPlayer;

  return (
    <Theme3Canvas>
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

export default FullScreenT3Content;
