'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import PremiumLeaderboardOverlay from '@/components/overlays/PremiumLeaderboardOverlay';

function PremiumLeaderboardContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;

    // Layout parameters
    const sortBy = (searchParams.get('sortBy') as 'players' | 'balance' | 'spent') || 'players';
    const position = (searchParams.get('position') as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') || 'top-right';

    // Color parameters
    const backgroundColor = searchParams.get('backgroundColor') || 'rgba(17, 24, 39, 0.95)';
    const accentColor = searchParams.get('accentColor') || '#3b82f6';
    const headerColor = searchParams.get('headerColor') || '#60a5fa';
    const textColor = searchParams.get('textColor') || '#f0f9ff';

    // Style options
    const opacity = parseInt(searchParams.get('opacity') || '100');

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ teams, tournament }) => (
                <PremiumLeaderboardOverlay
                    teams={teams}
                    tournament={tournament}
                    sortBy={sortBy}
                    position={position}
                    backgroundColor={backgroundColor}
                    accentColor={accentColor}
                    headerColor={headerColor}
                    textColor={textColor}
                    opacity={opacity}
                />
            )}
        </OverlayWrapper>
    );
}

export default function PremiumLeaderboardOverlayPage() {
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
            <PremiumLeaderboardContent />
        </Suspense>
    );
}
