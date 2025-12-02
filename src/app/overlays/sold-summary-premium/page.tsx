'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import SoldPlayersSummaryOverlayPremium from '@/components/overlays/SoldPlayersSummaryOverlayPremium';

function SoldSummaryPremiumContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;
    const position = (searchParams.get('position') as 'center' | 'top' | 'bottom') || 'center';
    const accentColor = searchParams.get('accentColor') || '#f59e0b';
    const backgroundColor = searchParams.get('backgroundColor') || 'rgba(15, 23, 42, 0.95)';
    const textColor = searchParams.get('textColor') || '#f1f5f9';
    const priceColor = searchParams.get('priceColor') || '#fbbf24';
    const itemsPerPage = parseInt(searchParams.get('itemsPerPage') || '20');

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ players, teams, tournament }) => (
                <SoldPlayersSummaryOverlayPremium
                    players={players}
                    teams={teams}
                    tournament={tournament}
                    position={position}
                    accentColor={accentColor}
                    backgroundColor={backgroundColor}
                    textColor={textColor}
                    priceColor={priceColor}
                    itemsPerPage={itemsPerPage}
                />
            )}
        </OverlayWrapper>
    );
}

export default function SoldSummaryPremiumOverlayPage() {
    return (
        <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900/90 to-slate-900/90">
                <div className="text-white text-center p-8 bg-slate-800/90 rounded-lg border-2 border-amber-500">
                    <div className="text-5xl mb-4 animate-pulse">⏳</div>
                    <h2 className="text-2xl font-bold">Loading Premium Overlay...</h2>
                    <p className="text-sm mt-2 text-amber-200">Connecting to tournament data</p>
                </div>
            </div>
        }>
            <SoldSummaryPremiumContent />
        </Suspense>
    );
}
