'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import StatusOverlay from '@/components/overlays/StatusOverlay';

function StatusContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ tournament, currentPlayer }) => (
                <StatusOverlay
                    tournament={tournament}
                    currentPlayer={currentPlayer}
                />
            )}
        </OverlayWrapper>
    );
}

export default function StatusOverlayPage() {
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
            <StatusContent />
        </Suspense>
    );
}
