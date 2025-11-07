'use client';

import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import StatusOverlay from '@/components/overlays/StatusOverlay';

export default function StatusOverlayPage() {
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
