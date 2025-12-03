'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import PlayerHighlightLEDMinimalist from '@/components/overlays/PlayerHighlightLEDMinimalist';

function PlayerHighlightLEDMinimalistContent() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournament') || undefined;
  const showBackground = searchParams.get('showBackground') !== 'false';
  const spotlightSeconds = parseInt(searchParams.get('spotlightSeconds') || '5', 10);
  const showTeams = searchParams.get('showTeams') !== 'false';
  const showSold = searchParams.get('showSold') !== 'false';
  const soldItems = parseInt(searchParams.get('soldItems') || '5', 10);
  const soldFlipSeconds = parseInt(searchParams.get('soldFlipSeconds') || '8', 10);
  const backgroundColor = searchParams.get('backgroundColor') || 'rgba(255, 255, 255, 0.03)';
  const borderColor = searchParams.get('borderColor') || 'rgba(255, 255, 255, 0.1)';
  const textColor = searchParams.get('textColor') || '#ffffff';
  const accentColor = searchParams.get('accentColor') || '#6366f1';

  return (
    <OverlayWrapper tournamentId={tournamentId}>
      {({ tournament, auctionState, currentPlayer, teams, soldPlayers }) => (
        <PlayerHighlightLEDMinimalist
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
          backgroundColor={backgroundColor}
          borderColor={borderColor}
          textColor={textColor}
          accentColor={accentColor}
        />
      )}
    </OverlayWrapper>
  );
}

export default function PlayerHighlightLEDMinimalistPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-white text-center p-8 bg-white/5 rounded-lg border border-white/10">
          <div className="text-5xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-2xl font-semibold">Loading Minimalist Overlay...</h2>
          <p className="text-sm mt-2 text-white/60">Connecting to tournament data</p>
        </div>
      </div>
    }>
      <PlayerHighlightLEDMinimalistContent />
    </Suspense>
  );
}
