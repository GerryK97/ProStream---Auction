'use client';

import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import TeamCardsOverlay from '@/components/overlays/TeamCardsOverlay';

export default function TeamsOverlayPage() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;
    const layout = (searchParams.get('layout') as 'horizontal' | 'vertical' | 'grid') || 'horizontal';
    const position = (searchParams.get('position') as 'top' | 'bottom' | 'left' | 'right') || 'bottom';

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ tournament, teams, currentPlayer }) => (
                <TeamCardsOverlay
                    teams={teams}
                    tournament={tournament}
                    currentPlayer={currentPlayer}
                    layout={layout}
                    position={position}
                />
            )}
        </OverlayWrapper>
    );
}
