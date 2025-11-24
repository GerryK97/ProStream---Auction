'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import NeonCyberpunkTickerOverlay from '@/components/overlays/NeonCyberpunkTickerOverlay';

export default function NeonCyberpunkTickerPage() {
    const searchParams = useSearchParams();

    // Parse URL parameters
    const size = (searchParams.get('size') as 'small' | 'default' | 'large') || 'default';
    const color = (searchParams.get('color') as 'cyan' | 'magenta' | 'lime' | 'pink' | 'gold') || 'cyan';
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
                    <NeonCyberpunkTickerOverlay
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
