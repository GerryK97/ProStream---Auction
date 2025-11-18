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

  return (
    <OverlayWrapper tournamentId={tournamentId}>
      {({ tournament, auctionState, currentPlayer }) => (
        <PlayerHighlightLED
          tournament={tournament}
          auctionState={auctionState}
          currentPlayer={currentPlayer}
          showBackground={showBackground}
          spotlightDuration={Math.max(2000, spotlightSeconds * 1000)}
        />
      )}
    </OverlayWrapper>
  );
}

export default function PlayerHighlightLEDPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading overlay…</div>}>
      <PlayerHighlightLEDContent />
    </Suspense>
  );
}
