'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import AuctionOverviewLED from '@/components/overlays/AuctionOverviewLED';
import '@/styles/auction-overview-animations.css';

/**
 * Auction Overview LED Overlay Page
 * Comprehensive full-screen auction display for LED screens (1920x1080)
 */
function AuctionOverviewContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;

    // Parse URL parameters
    const size = (searchParams.get('size') as 'default' | 'large') || 'default';
    const showBackground = searchParams.get('showBackground') !== 'false';
    const theme = (searchParams.get('theme') as 'dark' | 'premium' | 'vibrant') || 'premium';
    const animationSpeed = (searchParams.get('animationSpeed') as 'slow' | 'normal' | 'fast') || 'normal';
    const teamFlipDuration = parseInt(searchParams.get('teamFlipDuration') || '8') * 1000;
    const showStats = searchParams.get('showStats') !== 'false';
    const showRecentSold = searchParams.get('showRecentSold') !== 'false';
    const maxRecentSold = parseInt(searchParams.get('maxRecentSold') || '5');
    const teamsPerPage = parseInt(searchParams.get('teamsPerPage') || '10');

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ tournament, auctionState, players, teams, currentPlayer, soldPlayers }) => (
                <AuctionOverviewLED
                    tournament={tournament}
                    auctionState={auctionState}
                    players={players}
                    teams={teams}
                    currentPlayer={currentPlayer}
                    soldPlayers={soldPlayers}
                    size={size}
                    showBackground={showBackground}
                    theme={theme}
                    animationSpeed={animationSpeed}
                    teamFlipDuration={teamFlipDuration}
                    showStats={showStats}
                    showRecentSold={showRecentSold}
                    maxRecentSold={maxRecentSold}
                    teamsPerPage={teamsPerPage}
                />
            )}
        </OverlayWrapper>
    );
}

export default function AuctionOverviewPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuctionOverviewContent />
        </Suspense>
    );
}
