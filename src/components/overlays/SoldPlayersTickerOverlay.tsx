'use client';

import React from 'react';
import { Player, Team } from '@/types';

interface SoldPlayersTickerOverlayProps {
    soldPlayers: Player[];
    teams: Team[];
    speed?: 'slow' | 'medium' | 'fast';
    position?: 'top' | 'bottom';
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const SoldPlayersTickerOverlay: React.FC<SoldPlayersTickerOverlayProps> = ({
    soldPlayers,
    teams,
    speed = 'medium',
    position = 'bottom'
}) => {
    if (soldPlayers.length === 0) {
        return null;
    }

    // Speed configurations
    const speedConfig = {
        slow: 'animate-[ticker_60s_linear_infinite]',
        medium: 'animate-[ticker_30s_linear_infinite]',
        fast: 'animate-[ticker_15s_linear_infinite]'
    };

    // Position configurations
    const positionConfig = {
        top: 'top-8',
        bottom: 'bottom-8'
    };

    return (
        <div className={`fixed ${positionConfig[position]} left-0 right-0 px-8`}>
            <div className="relative overflow-hidden rounded-lg py-2 border-2 border-cyan-500">
                <div className={`flex gap-4 ${speedConfig[speed]} whitespace-nowrap`}>
                    {/* Duplicate for seamless loop */}
                    {[...soldPlayers, ...soldPlayers].map((player, index) => {
                        const playerTeam = teams.find(t => t._id === player.winningTeamId);
                        return (
                            <div key={`${player._id}-${index}`} className="inline-flex items-center gap-2 px-4">
                                <img src={player.photoURL} alt={player.name} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-lg" />
                                <span className="text-white font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{player.name}</span>
                                <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">→</span>
                                <span className="text-cyan-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{playerTeam?.name || 'Unknown'}</span>
                                <span className="text-green-400 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{formatCurrency(player.finalPrice || 0)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SoldPlayersTickerOverlay;
