'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import SaleBanner from '@/components/overlays/SaleBanner';
import { Player, Team, AuctionState } from '@/types';

interface SaleBannerContentProps {
    auctionState: AuctionState;
    currentPlayer: Player | undefined;
    teams: Team[];
}

function SaleBannerContent({ auctionState, currentPlayer, teams }: SaleBannerContentProps) {
    const [lastSoldPlayer, setLastSoldPlayer] = useState<Player | null>(null);
    const [lastSoldTeam, setLastSoldTeam] = useState<Team | null>(null);
    const [showSaleBanner, setShowSaleBanner] = useState<boolean>(false);
    const [previousStatus, setPreviousStatus] = useState<string>('');

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
}

function SaleBannerPage() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ auctionState, currentPlayer, teams }) => (
                <SaleBannerContent
                    auctionState={auctionState}
                    currentPlayer={currentPlayer}
                    teams={teams}
                />
            )}
        </OverlayWrapper>
    );
}

export default function SaleBannerOverlayPage() {
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
            <SaleBannerPage />
        </Suspense>
    );
}
