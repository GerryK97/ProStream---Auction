'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import PremiumBreakingNewsTickerOverlay from '@/components/overlays/PremiumBreakingNewsTickerOverlay';

/**
 * Premium Breaking News Ticker Overlay Page
 * Shows one sold player at a time with smooth transitions
 * Based on breaking news ticker design pattern
 */
function PremiumTickerContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;

    // Get configuration from URL parameters
    const size = (searchParams.get('size') as 'small' | 'default' | 'large') || 'default';
    const effect = (searchParams.get('effect') as 'slide-h' | 'slide-v' | 'fade') || 'slide-h';
    const color = (searchParams.get('color') as 'blue' | 'green' | 'purple' | 'orange' | 'yellow') || 'blue';
    const autoplay = searchParams.get('autoplay') !== 'false';
    const timer = parseInt(searchParams.get('timer') || '5000');
    const border = searchParams.get('border') !== 'false';
    const position = (searchParams.get('position') as 'top' | 'bottom') || 'bottom';

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ teams, soldPlayers }) => (
                <PremiumBreakingNewsTickerOverlay
                    soldPlayers={soldPlayers}
                    teams={teams}
                    size={size}
                    effect={effect}
                    color={color}
                    autoplay={autoplay}
                    timer={timer}
                    border={border}
                    position={position}
                />
            )}
        </OverlayWrapper>
    );
}

export default function PremiumTickerPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PremiumTickerContent />
        </Suspense>
    );
}
