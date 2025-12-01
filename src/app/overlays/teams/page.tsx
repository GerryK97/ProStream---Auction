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
        <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-blue-900/90">
                <div className="text-white text-center p-8 bg-blue-800/90 rounded-lg border-2 border-blue-600">
                    <div className="text-5xl mb-4 animate-pulse">⏳</div>
                    <h2 className="text-2xl font-bold">Loading Overlay...</h2>
                    <p className="text-sm mt-2 text-blue-200">Connecting to tournament data</p>
                </div>
            </div>
        }>
            <TeamsContent />
        </Suspense>
    );
}
