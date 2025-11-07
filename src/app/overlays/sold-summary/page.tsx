'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import SoldPlayersSummaryOverlay from '@/components/overlays/SoldPlayersSummaryOverlay';

function SoldSummaryContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;
    const position = (searchParams.get('position') as 'center' | 'top' | 'bottom') || 'center';

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ players, teams, tournament }) => (
                <SoldPlayersSummaryOverlay
                    players={players}
                    teams={teams}
                    tournament={tournament}
                    position={position}
                />
            )}
        </OverlayWrapper>
    );
}

export default function SoldSummaryOverlayPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SoldSummaryContent />
        </Suspense>
    );
}
