'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import LeaderboardOverlay from '@/components/overlays/LeaderboardOverlay';

function LeaderboardContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;
    const sortBy = (searchParams.get('sortBy') as 'players' | 'balance' | 'spent') || 'players';
    const position = (searchParams.get('position') as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') || 'top-right';

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ teams, tournament }) => (
                <LeaderboardOverlay
                    teams={teams}
                    tournament={tournament}
                    sortBy={sortBy}
                    position={position}
                />
            )}
        </OverlayWrapper>
    );
}

export default function LeaderboardOverlayPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LeaderboardContent />
        </Suspense>
    );
}
