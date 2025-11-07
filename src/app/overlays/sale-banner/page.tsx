'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import SaleBanner from '@/components/overlays/SaleBanner';
import { Player, Team } from '@/types';

export default function SaleBannerOverlayPage() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;

    const [lastSoldPlayer, setLastSoldPlayer] = useState<Player | null>(null);
    const [lastSoldTeam, setLastSoldTeam] = useState<Team | null>(null);
    const [showSaleBanner, setShowSaleBanner] = useState<boolean>(false);
    const [previousStatus, setPreviousStatus] = useState<string>('');

    return (
        <OverlayWrapper tournamentId={tournamentId} showConnectionStatus={false}>
            {({ auctionState, currentPlayer, teams }) => {
                // Detect sold status and trigger banner
                useEffect(() => {
                    if (auctionState.currentAuctionStatus === 'Sold' && previousStatus !== 'Sold') {
                        if (currentPlayer) {
                            const soldTeam = teams.find(t => t._id === currentPlayer.winningTeamId);
                            if (soldTeam) {
                                setLastSoldPlayer(currentPlayer);
                                setLastSoldTeam(soldTeam);
                                setShowSaleBanner(true);
                            }
                        }
                    }
                    setPreviousStatus(auctionState.currentAuctionStatus);
                }, [auctionState.currentAuctionStatus, previousStatus, currentPlayer, teams]);

                // Hide banner when new player is selected
                useEffect(() => {
                    if (currentPlayer && auctionState.currentAuctionStatus !== 'Sold') {
                        setShowSaleBanner(false);
                    }
                }, [currentPlayer, auctionState.currentAuctionStatus]);

                return (
                    <>
                        {showSaleBanner && lastSoldPlayer && lastSoldTeam && (
                            <SaleBanner
                                player={lastSoldPlayer}
                                team={lastSoldTeam}
                                onComplete={() => setShowSaleBanner(false)}
                            />
                        )}
                    </>
                );
            }}
        </OverlayWrapper>
    );
}
