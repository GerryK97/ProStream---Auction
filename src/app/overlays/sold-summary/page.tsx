'use client';

import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import SoldPlayersSummaryOverlay from '@/components/overlays/SoldPlayersSummaryOverlay';

export default function SoldSummaryOverlayPage() {
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
