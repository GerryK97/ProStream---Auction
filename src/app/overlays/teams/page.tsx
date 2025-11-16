'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import TeamCardsOverlay from '@/components/overlays/TeamCardsOverlay';

function TeamsContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;
    const layout = (searchParams.get('layout') as 'horizontal' | 'vertical' | 'grid') || 'horizontal';
    const position = (searchParams.get('position') as 'top' | 'bottom' | 'left' | 'right') || 'bottom';

    // Extract customization parameters
    const useGradient = searchParams.get('useGradient') === 'true';
    const cardBackground = searchParams.get('cardBackground') || 'transparent';
    const gradientStart = searchParams.get('gradientStart') || '#0891b2';
    const gradientEnd = searchParams.get('gradientEnd') || '#06b6d4';
    const borderColor = searchParams.get('borderColor') || '#06b6d4';
    const borderRadius = parseInt(searchParams.get('borderRadius') || '8');
    const backgroundOpacity = parseInt(searchParams.get('backgroundOpacity') || '100');
    const teamNameColor = searchParams.get('teamNameColor') || '#ffffff';
    const balanceColor = searchParams.get('balanceColor') || '#4ade80';
    const statsColor = searchParams.get('statsColor') || '#d4d4d8';
    const maxBidColor = searchParams.get('maxBidColor') || '#22d3ee';
    const winningBorderColor = searchParams.get('winningBorderColor') || '#ef4444';

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ tournament, teams, currentPlayer }) => (
                <TeamCardsOverlay
                    teams={teams}
                    tournament={tournament}
                    currentPlayer={currentPlayer}
                    layout={layout}
                    position={position}
                    useGradient={useGradient}
                    cardBackground={cardBackground}
                    gradientStart={gradientStart}
                    gradientEnd={gradientEnd}
                    borderColor={borderColor}
                    borderRadius={borderRadius}
                    backgroundOpacity={backgroundOpacity}
                    teamNameColor={teamNameColor}
                    balanceColor={balanceColor}
                    statsColor={statsColor}
                    maxBidColor={maxBidColor}
                    winningBorderColor={winningBorderColor}
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
