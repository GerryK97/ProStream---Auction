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
        <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-blue-900/90">
                <div className="text-white text-center p-8 bg-blue-800/90 rounded-lg border-2 border-blue-600">
                    <div className="text-5xl mb-4 animate-pulse">⏳</div>
                    <h2 className="text-2xl font-bold">Loading Overlay...</h2>
                    <p className="text-sm mt-2 text-blue-200">Connecting to tournament data</p>
                </div>
            </div>
        }>
            <PlayerCardContent />
        </Suspense>
    );
}
