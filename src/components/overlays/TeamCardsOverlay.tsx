'use client';

import React from 'react';
import { Team, Tournament, Player } from '@/types';

interface TeamCardsOverlayProps {
    teams: Team[];
    tournament: Tournament | null;
    currentPlayer: Player | undefined;
    layout?: 'horizontal' | 'vertical' | 'grid';
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const TeamCardsOverlay: React.FC<TeamCardsOverlayProps> = ({
    teams,
    tournament,
    currentPlayer,
    layout = 'horizontal',
    position = 'bottom'
}) => {
    // Calculate max bid for teams
    const calculateMaxBid = (team: Team) => {
        if (!tournament) return 0;

        const squadSize = tournament.squadSize;
        const basePrice = tournament.basePricePerPlayer;
        const playersPurchased = team.playersPurchased.length;
        const remainingPlayers = squadSize - playersPurchased;

        if (remainingPlayers <= 1) {
            return team.currentBalance;
        }

        const reservedAmount = (remainingPlayers - 1) * basePrice;
        const maxBid = team.currentBalance - reservedAmount;
        return Math.max(0, maxBid);
    };

    if (teams.length === 0 || !tournament) {
        return null;
    }

    // Layout configurations
    const layoutConfig = {
        horizontal: 'flex-row flex-wrap justify-center',
        vertical: 'flex-col items-center',
        grid: 'grid grid-cols-2 gap-4'
    };

    // Position configurations
    const positionConfig = {
        top: 'justify-start pt-8',
        bottom: 'justify-end pb-8',
        left: 'justify-start pl-8 flex-col',
        right: 'justify-end pr-8 flex-col'
    };

    return (
        <div className={`w-full h-full flex ${positionConfig[position]} items-center px-8`}>
            <div className="transition-all duration-500 ease-in-out animate-slide-in-bottom">
                <div className={`flex ${layoutConfig[layout]} gap-4`}>
                    {teams.map(team => {
                        const maxBid = calculateMaxBid(team);
                        const isWinningTeam = currentPlayer?.winningTeamId === team._id;
                        const playersPurchased = team.playersPurchased.length;
                        const squadSize = tournament?.squadSize || 0;

                        return (
                            <div
                                key={team._id}
                                className={`p-3 rounded-lg flex items-center gap-3 ${layout === 'grid' ? 'w-full' : 'w-64'} border-2 transition-all ${
                                    isWinningTeam ? 'border-red-500 animate-team-highlight' : 'border-cyan-500'
                                }`}
                            >
                                <img src={team.logoURL} alt={team.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg" />
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold truncate text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{team.name}</p>
                                    <p className="text-sm text-neutral-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{playersPurchased}/{squadSize} players</p>
                                    <p className="text-lg font-mono text-green-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{formatCurrency(team.currentBalance)}</p>
                                    <p className="text-xs text-cyan-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Max: {formatCurrency(maxBid)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TeamCardsOverlay;
