'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useAuctionSSE } from '@/hooks/useAuctionSSE';
import { Tournament, AuctionState, Player, Team } from '@/types';
import '../../styles/animations.css';

interface OverlayWrapperProps {
    tournamentId?: string;
    children: (data: {
        tournament: Tournament | null;
        auctionState: AuctionState;
        players: Player[];
        teams: Team[];
        isConnected: boolean;
        currentPlayer: Player | undefined;
        soldPlayers: Player[];
    }) => ReactNode;
}

const OverlayWrapper: React.FC<OverlayWrapperProps> = ({
    tournamentId,
    children
}) => {
    const [liveTournamentId, setLiveTournamentId] = useState<string | null>(tournamentId || null);

    // Fetch active tournament if no tournamentId provided
    useEffect(() => {
        if (!tournamentId) {
            const loadActiveTournament = async () => {
                try {
                    const response = await fetch('/api/tournaments/active');
                    if (response.ok) {
                        const tournament = await response.json();
                        setLiveTournamentId(tournament._id);
                    }
                } catch (error) {
                    console.error('Failed to fetch active tournament:', error);
                }
            };
            loadActiveTournament();
        }
    }, [tournamentId]);

    // Use SSE hook for real-time updates
    const {
        tournament,
        auctionState,
        players,
        teams,
        isConnected,
    } = useAuctionSSE(liveTournamentId);

    const currentPlayer = players.find(p => p._id === auctionState.currentPlayerId);
    const soldPlayers = players.filter(p => p.isSold);

    return (
        <div className="w-full h-full bg-transparent text-white font-sans relative overflow-hidden">
            {/* Render children with data */}
            {children({
                tournament,
                auctionState,
                players,
                teams,
                isConnected,
                currentPlayer,
                soldPlayers,
            })}
        </div>
    );
};

export default OverlayWrapper;
