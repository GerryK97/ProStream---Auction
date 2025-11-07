'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import PlayerCardOverlay from '@/components/overlays/PlayerCardOverlay';

function PlayerCardContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;
    const size = (searchParams.get('size') as 'small' | 'medium' | 'large') || 'medium';
    const position = (searchParams.get('position') as 'top' | 'center' | 'bottom') || 'top';

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ tournament, auctionState, currentPlayer }) => (
                <PlayerCardOverlay
                    currentPlayer={currentPlayer}
                    tournament={tournament}
                    auctionState={auctionState}
                    size={size}
                    position={position}
                />
            )}
        </OverlayWrapper>
    );
}

export default function PlayerCardOverlayPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PlayerCardContent />
        </Suspense>
    );
}
