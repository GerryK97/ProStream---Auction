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
        <Suspense fallback={<div>Loading...</div>}>
            <StatusContent />
        </Suspense>
    );
}
