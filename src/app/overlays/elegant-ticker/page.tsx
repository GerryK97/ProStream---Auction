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
        <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-blue-900/90">
                <div className="text-white text-center p-8 bg-blue-800/90 rounded-lg border-2 border-blue-600">
                    <div className="text-5xl mb-4 animate-pulse">⏳</div>
                    <h2 className="text-2xl font-bold">Loading Overlay...</h2>
                    <p className="text-sm mt-2 text-blue-200">Connecting to tournament data</p>
                </div>
            </div>
        }>
            <ElegantMinimalistTickerContent />
        </Suspense>
    );
}
