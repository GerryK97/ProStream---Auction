'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import PlayerHighlightLED from '@/components/overlays/PlayerHighlightLED';

function PlayerHighlightLEDContent() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournament') || undefined;
  const showBackground = searchParams.get('showBackground') !== 'false';
  const spotlightSeconds = parseInt(searchParams.get('spotlightSeconds') || '5', 10);
  const showTeams = searchParams.get('showTeams') !== 'false';
  const showSold = searchParams.get('showSold') !== 'false';
  const soldItems = parseInt(searchParams.get('soldItems') || '5', 10);
  const soldFlipSeconds = parseInt(searchParams.get('soldFlipSeconds') || '8', 10);

  return (
    <OverlayWrapper tournamentId={tournamentId}>
      {({ tournament, auctionState, currentPlayer, teams, soldPlayers }) => (
        <PlayerHighlightLED
          tournament={tournament}
          auctionState={auctionState}
          currentPlayer={currentPlayer}
          teams={teams}
          soldPlayers={soldPlayers}
          showBackground={showBackground}
          spotlightDuration={Math.max(2000, spotlightSeconds * 1000)}
          showTeams={showTeams}
          showSoldFlip={showSold}
          soldItemsPerPage={Math.max(3, soldItems)}
          soldFlipDuration={Math.max(3000, soldFlipSeconds * 1000)}
        />
      )}
    </OverlayWrapper>
  );
}

export default function PlayerHighlightLEDPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-blue-900/90">
        <div className="text-white text-center p-8 bg-blue-800/90 rounded-lg border-2 border-blue-600">
          <div className="text-5xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold">Loading Overlay...</h2>
          <p className="text-sm mt-2 text-blue-200">Connecting to tournament data</p>
        </div>
      </div>
    }>
      <PlayerHighlightLEDContent />
    </Suspense>
  );
}
