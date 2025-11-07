'use client';

import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import CurrentBidOverlay from '@/components/overlays/CurrentBidOverlay';

export default function CurrentBidOverlayPage() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;
    const size = (searchParams.get('size') as 'small' | 'medium' | 'large') || 'medium';
    const position = (searchParams.get('position') as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center') || 'top-right';

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ auctionState, currentPlayer }) => (
                <CurrentBidOverlay
                    auctionState={auctionState}
                    currentPlayer={currentPlayer}
                    size={size}
                    position={position}
                />
            )}
        </OverlayWrapper>
    );
}
