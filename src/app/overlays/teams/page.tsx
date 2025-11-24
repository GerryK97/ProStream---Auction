'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import TeamCardsOverlay from '@/components/overlays/TeamCardsOverlay';
import type { TeamCardThemeVariant } from '@/components/overlays/themes/teamCardThemes';

function TeamsContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;
    const layout = (searchParams.get('layout') as 'horizontal' | 'vertical' | 'grid') || 'horizontal';
    const position = (searchParams.get('position') as 'top' | 'bottom' | 'left' | 'right') || 'bottom';

    // Extract customization parameters only when explicitly provided
    const useGradientParam = searchParams.get('useGradient');
    const useGradient = useGradientParam !== null ? useGradientParam === 'true' : undefined;
    const cardBackground = searchParams.get('cardBackground') || undefined;
    const gradientStart = searchParams.get('gradientStart') || undefined;
    const gradientEnd = searchParams.get('gradientEnd') || undefined;
    const borderColor = searchParams.get('borderColor') || undefined;

    const parseNumberParam = (value: string | null) => {
        if (!value) return undefined;
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? undefined : parsed;
    };

    const borderRadius = parseNumberParam(searchParams.get('borderRadius'));
    const backgroundOpacity = parseNumberParam(searchParams.get('backgroundOpacity'));
    const teamNameColor = searchParams.get('teamNameColor') || undefined;
    const balanceColor = searchParams.get('balanceColor') || undefined;
    const statsColor = searchParams.get('statsColor') || undefined;
    const maxBidColor = searchParams.get('maxBidColor') || undefined;
    const winningBorderColor = searchParams.get('winningBorderColor') || undefined;

    const themeParam = searchParams.get('themeVariant') as TeamCardThemeVariant | null;
    const availableThemes: TeamCardThemeVariant[] = ['neonPulse', 'emberPulse'];
    const themeVariant = themeParam && availableThemes.includes(themeParam) ? themeParam : 'neonPulse';

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
                    themeVariant={themeVariant}
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
