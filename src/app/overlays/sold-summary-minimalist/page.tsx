'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import SoldPlayersSummaryOverlayMinimalist from '@/components/overlays/SoldPlayersSummaryOverlayMinimalist';

function SoldSummaryMinimalistContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;
    const position = (searchParams.get('position') as 'center' | 'top' | 'bottom') || 'center';
    const backgroundColor = searchParams.get('backgroundColor') || 'rgba(255, 255, 255, 0.05)';
    const borderColor = searchParams.get('borderColor') || 'rgba(255, 255, 255, 0.1)';
    const textColor = searchParams.get('textColor') || '#ffffff';
    const accentColor = searchParams.get('accentColor') || '#6366f1';
    const itemsPerPage = parseInt(searchParams.get('itemsPerPage') || '20');

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ players, teams, tournament }) => (
                <SoldPlayersSummaryOverlayMinimalist
                    players={players}
                    teams={teams}
                    tournament={tournament}
                    position={position}
                    backgroundColor={backgroundColor}
                    borderColor={borderColor}
                    textColor={textColor}
                    accentColor={accentColor}
                    itemsPerPage={itemsPerPage}
                />
            )}
        </OverlayWrapper>
    );
}

export default function SoldSummaryMinimalistOverlayPage() {
    return (
        <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                <div className="text-white text-center p-8 rounded-2xl border backdrop-blur-lg"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                    }}>
                    <div className="text-5xl mb-4 animate-pulse">⏳</div>
                    <h2 className="text-2xl font-semibold">Loading Overlay...</h2>
                    <p className="text-sm mt-2 opacity-70">Connecting to tournament data</p>
                </div>
            </div>
        }>
            <SoldSummaryMinimalistContent />
        </Suspense>
    );
}
