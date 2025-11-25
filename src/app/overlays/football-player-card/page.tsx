'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import FootballPlayerCardOverlay from '@/components/overlays/FootballPlayerCardOverlay';

function FootballPlayerCardContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;

    // Extract URL parameters
    const position = (searchParams.get('position') as 'center' | 'left' | 'right') || 'center';
    const primaryColor = searchParams.get('primaryColor') || '#FCD000';
    const accentColor = searchParams.get('accentColor') || '#E7C403';
    const textColor = searchParams.get('textColor') || '#1e293b';
    const statLabelColor = searchParams.get('statLabelColor') || '#64748b';
    const cardSize = (searchParams.get('cardSize') as 'small' | 'medium' | 'large') || 'medium';
    const borderRadius = (searchParams.get('borderRadius') as 'none' | 'small' | 'medium' | 'large') || 'medium';
    const showPlayerImage = searchParams.get('showPlayerImage') !== 'false';
    const showJerseyNumber = searchParams.get('showJerseyNumber') !== 'false';
    const showStats = searchParams.get('showStats') !== 'false';
    const showCurrentBid = searchParams.get('showCurrentBid') !== 'false';
    const diagonalStyle = searchParams.get('diagonalStyle') !== 'false';

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ tournament, auctionState, currentPlayer }) => (
                <FootballPlayerCardOverlay
                    currentPlayer={currentPlayer}
                    tournament={tournament}
                    auctionState={auctionState}
                    position={position}
                    primaryColor={primaryColor}
                    accentColor={accentColor}
                    textColor={textColor}
                    statLabelColor={statLabelColor}
                    cardSize={cardSize}
                    borderRadius={borderRadius}
                    showPlayerImage={showPlayerImage}
                    showJerseyNumber={showJerseyNumber}
                    showStats={showStats}
                    showCurrentBid={showCurrentBid}
                    diagonalStyle={diagonalStyle}
                />
            )}
        </OverlayWrapper>
    );
}

export default function FootballPlayerCardOverlayPage() {
    return (
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading...</div>}>
            <FootballPlayerCardContent />
        </Suspense>
    );
}
