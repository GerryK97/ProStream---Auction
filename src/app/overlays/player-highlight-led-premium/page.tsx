'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import PlayerHighlightLEDPremium from '@/components/overlays/PlayerHighlightLEDPremium';

function PlayerHighlightLEDPremiumContent() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournament') || undefined;
  const showBackground = searchParams.get('showBackground') !== 'false';
  const spotlightSeconds = parseInt(searchParams.get('spotlightSeconds') || '5', 10);
  const showTeams = searchParams.get('showTeams') !== 'false';
  const showSold = searchParams.get('showSold') !== 'false';
  const soldItems = parseInt(searchParams.get('soldItems') || '5', 10);
  const soldFlipSeconds = parseInt(searchParams.get('soldFlipSeconds') || '8', 10);
  const accentColor = searchParams.get('accentColor') || '#f59e0b';
  const backgroundColor = searchParams.get('backgroundColor') || 'rgba(15, 23, 42, 0.95)';
  const textColor = searchParams.get('textColor') || '#f1f5f9';
  const bidColor = searchParams.get('bidColor') || '#fbbf24';

  return (
    <OverlayWrapper tournamentId={tournamentId}>
      {({ tournament, auctionState, currentPlayer, teams, soldPlayers }) => (
        <PlayerHighlightLEDPremium
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
          accentColor={accentColor}
          backgroundColor={backgroundColor}
          textColor={textColor}
          bidColor={bidColor}
        />
      )}
    </OverlayWrapper>
  );
}

export default function PlayerHighlightLEDPremiumPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900/90 to-black">
        <div className="text-white text-center p-8 bg-amber-800/90 rounded-lg border-2 border-amber-600">
          <div className="text-5xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold">Loading Premium Overlay...</h2>
          <p className="text-sm mt-2 text-amber-200">Connecting to tournament data</p>
        </div>
      </div>
    }>
      <PlayerHighlightLEDPremiumContent />
    </Suspense>
  );
}
