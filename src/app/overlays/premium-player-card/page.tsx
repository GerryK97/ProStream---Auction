'use client';

import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import PremiumPlayerCardOverlay from '@/components/overlays/PremiumPlayerCardOverlay';

export default function PremiumPlayerCardOverlayPage() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;
    const position = (searchParams.get('position') as 'center' | 'left' | 'right') || 'center';

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ tournament, currentPlayer, teams }) => (
                <PremiumPlayerCardOverlay
                    currentPlayer={currentPlayer}
                    tournament={tournament}
                    teams={teams}
                    position={position}
                />
            )}
        </OverlayWrapper>
    );
}
