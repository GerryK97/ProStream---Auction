'use client';

import React, { useMemo } from 'react';
import { Theme4Canvas } from '@/components/overlays/theme4/Theme4Canvas';
import PlayerCardT4 from '@/components/overlays/theme4/PlayerCardT4';
import { OVERLAY_PALETTES } from '@/config/overlayPalettes';
import type { AuctionState, Player, Team, Tournament } from '@/types';

/** Dev preview — /overlays/theme4-preview (no live auction required). */
export default function Theme4PreviewPage() {
  const palette = OVERLAY_PALETTES.theme4?.[0];

  const mock = useMemo(() => {
    const tournament = {
      _id: 'preview-t4',
      name: 'Theme 4 Preview',
      status: 'Live',
      basePricePerPlayer: 250000,
      overlayTheme: 'theme4',
      overlayPalette: 'default',
    } as Tournament;

    const currentPlayer = {
      _id: 'preview-player',
      name: 'Rohit Sharma',
      photoURL: 'https://res.cloudinary.com/demo/image/upload/w_600,h_750,c_fill,g_face/sample.jpg',
    } as Player;

    const auctionState = {
      currentPlayerId: currentPlayer._id,
      currentAuctionStatus: 'Bidding',
      currentBid: 250000,
      winningTeamId: undefined,
    } as unknown as AuctionState;

    return { tournament, currentPlayer, auctionState, teams: [] as Team[] };
  }, []);

  return (
    <div style={{ ...palette?.cssVars }}>
      <Theme4Canvas transparent>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(45deg, #2a2a2a 25%, transparent 25%),' +
              'linear-gradient(-45deg, #2a2a2a 25%, transparent 25%),' +
              'linear-gradient(45deg, transparent 75%, #2a2a2a 75%),' +
              'linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)',
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0, 0 16px, 16px -16px, -16px 0',
            backgroundColor: '#1a1a1a',
            zIndex: 0,
          }}
        />
        <PlayerCardT4
          currentPlayer={mock.currentPlayer}
          auctionState={mock.auctionState}
          teams={mock.teams}
          tournament={mock.tournament}
          visible
        />
      </Theme4Canvas>
    </div>
  );
}
