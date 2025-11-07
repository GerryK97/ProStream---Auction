'use client';

import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import SoldPlayersTickerOverlay from '@/components/overlays/SoldPlayersTickerOverlay';

export default function TickerOverlayPage() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;
    const speed = (searchParams.get('speed') as 'slow' | 'medium' | 'fast') || 'medium';
    const position = (searchParams.get('position') as 'top' | 'bottom') || 'bottom';

    return (
        <OverlayWrapper tournamentId={tournamentId} showConnectionStatus={false}>
            {({ teams, soldPlayers }) => (
                <SoldPlayersTickerOverlay
                    soldPlayers={soldPlayers}
                    teams={teams}
                    speed={speed}
                    position={position}
                />
            )}
        </OverlayWrapper>
    );
}
