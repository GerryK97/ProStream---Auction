'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import TeamCardsOverlay, { TeamCardsOverlayVariant } from '@/components/overlays/TeamCardsOverlay';

function TeamsContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;
    const layout = (searchParams.get('layout') as 'horizontal' | 'vertical' | 'grid') || 'horizontal';
    const position = (searchParams.get('position') as 'top' | 'bottom' | 'left' | 'right') || 'bottom';

    const variantParam = (searchParams.get('variant') as TeamCardsOverlayVariant) || 'neon';
    const allowedVariants: TeamCardsOverlayVariant[] = ['neon', 'ember', 'midnight'];
    const variant = allowedVariants.includes(variantParam) ? variantParam : 'neon';

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ tournament, teams, currentPlayer }) => (
                <TeamCardsOverlay
                    teams={teams}
                    tournament={tournament}
                    currentPlayer={currentPlayer}
                    layout={layout}
                    position={position}
                    variant={variant}
                />
            )}
        </OverlayWrapper>
    );
}

export default function TeamsOverlayPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TeamsContent />
        </Suspense>
    );
}
