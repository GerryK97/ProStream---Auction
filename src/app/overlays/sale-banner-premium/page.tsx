'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import SoldPlayersFlipperPremium from '@/components/overlays/SoldPlayersFlipperPremium';

function SaleBannerPremiumContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;
    const position = (searchParams.get('position') as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') || 'top-right';
    const backgroundColor = searchParams.get('backgroundColor') || 'rgba(15, 23, 42, 0.95)';
    const accentColor = searchParams.get('accentColor') || '#f59e0b';
    const textColor = searchParams.get('textColor') || '#f1f5f9';
    const priceColor = searchParams.get('priceColor') || '#fbbf24';
    const opacity = parseInt(searchParams.get('opacity') || '100');
    const displayDuration = parseInt(searchParams.get('displayDuration') || '5000');

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ players, teams }) => {
                const soldPlayers = players.filter(p => p.isSold);

                return (
                    <SoldPlayersFlipperPremium
                        soldPlayers={soldPlayers}
                        teams={teams}
                        position={position}
                        backgroundColor={backgroundColor}
                        accentColor={accentColor}
                        textColor={textColor}
                        priceColor={priceColor}
                        opacity={opacity}
                        displayDuration={displayDuration}
                    />
                );
            }}
        </OverlayWrapper>
    );
}

export default function SaleBannerPremiumOverlayPage() {
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
            <SaleBannerPremiumContent />
        </Suspense>
    );
}
