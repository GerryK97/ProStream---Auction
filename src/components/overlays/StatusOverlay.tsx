'use client';

import React from 'react';
import { Tournament, Player } from '@/types';

interface StatusOverlayProps {
    tournament: Tournament | null;
    currentPlayer: Player | undefined;
}

const StatusOverlay: React.FC<StatusOverlayProps> = ({
    tournament,
    currentPlayer
}) => {
    const isBiddingLive = tournament?.status === 'Live' && currentPlayer;

    // Don't show status overlay if bidding is active
    if (isBiddingLive) {
        return null;
    }

    let statusMessage = '';

    if (!tournament) {
        statusMessage = 'NO ACTIVE AUCTION';
    } else if (tournament.status === 'Stopped') {
        statusMessage = 'AUCTION PAUSED';
    } else if (tournament.status === 'Setup') {
        statusMessage = 'AUCTION STARTING SOON';
    } else if (tournament.status === 'Completed') {
        statusMessage = 'AUCTION COMPLETED';
    } else if (tournament.status === 'Live' && !currentPlayer) {
        statusMessage = 'AWAITING NEXT PLAYER';
    }

    if (!statusMessage) {
        return null;
    }

    return (
        <div className="w-full h-full flex items-center justify-center animate-fade-in">
            <div className="p-8 rounded-lg border-2 border-cyan-500">
                <h2 className="text-5xl font-bold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] text-center whitespace-nowrap">
                    {statusMessage}
                </h2>
            </div>
        </div>
    );
};

export default StatusOverlay;
