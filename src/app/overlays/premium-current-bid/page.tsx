'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import PremiumCurrentBidOverlay from '@/components/overlays/PremiumCurrentBidOverlay';

function PremiumCurrentBidContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;

    // Layout parameters
    const size = (searchParams.get('size') as 'small' | 'medium' | 'large') || 'medium';
    const position = (searchParams.get('position') as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center') || 'top-right';

    // Color parameters
    const backgroundColor = searchParams.get('backgroundColor') || 'rgba(17, 24, 39, 0.95)';
    const borderColor = searchParams.get('borderColor') || '#3b82f6';
    const labelColor = searchParams.get('labelColor') || '#93c5fd';
    const bidColor = searchParams.get('bidColor') || '#60a5fa';
    const accentColor = searchParams.get('accentColor') || '#2563eb';
    const shadowColor = searchParams.get('shadowColor') || 'rgba(37, 99, 235, 0.5)';

    // Style options
    const showPlayerName = searchParams.get('showPlayerName') === 'true';
    const showGlow = searchParams.get('showGlow') !== 'false';
    const borderRadius = (searchParams.get('borderRadius') as 'none' | 'small' | 'medium' | 'large') || 'large';
    const opacity = parseInt(searchParams.get('opacity') || '100');

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ auctionState, currentPlayer }) => (
                <PremiumCurrentBidOverlay
                    auctionState={auctionState}
                    currentPlayer={currentPlayer}
                    size={size}
                    position={position}
                    backgroundColor={backgroundColor}
                    borderColor={borderColor}
                    labelColor={labelColor}
                    bidColor={bidColor}
                    accentColor={accentColor}
                    shadowColor={shadowColor}
                    showPlayerName={showPlayerName}
                    showGlow={showGlow}
                    borderRadius={borderRadius}
                    opacity={opacity}
                />
            )}
        </OverlayWrapper>
    );
}

export default function PremiumCurrentBidOverlayPage() {
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
            <PremiumCurrentBidContent />
        </Suspense>
    );
}
