'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import ElegantMinimalistTickerOverlay from '@/components/overlays/ElegantMinimalistTickerOverlay';

function ElegantMinimalistTickerContent() {
    const searchParams = useSearchParams();

    // Parse URL parameters
    const size = (searchParams.get('size') as 'small' | 'default' | 'large') || 'default';
    const color = (searchParams.get('color') as 'champagne' | 'platinum' | 'rose' | 'navy' | 'charcoal') || 'champagne';
    const autoplay = searchParams.get('autoplay') !== 'false';
    const timer = parseInt(searchParams.get('timer') || '5000');
    const border = searchParams.get('border') !== 'false';
    const position = (searchParams.get('position') as 'top' | 'bottom') || 'bottom';

    return (
        <OverlayWrapper>
            {({ players, teams }) => {
                // Filter sold players
                const soldPlayers = players.filter(p => p.isSold);

                return (
                    <ElegantMinimalistTickerOverlay
                        soldPlayers={soldPlayers}
                        teams={teams}
                        size={size}
                        color={color}
                        autoplay={autoplay}
                        timer={timer}
                        border={border}
                        position={position}
                    />
                );
            }}
        </OverlayWrapper>
    );
}

export default function ElegantMinimalistTickerPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ElegantMinimalistTickerContent />
        </Suspense>
    );
}
