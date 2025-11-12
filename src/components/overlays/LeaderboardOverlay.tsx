'use client';

import React from 'react';
import { Team, Tournament } from '@/types';

interface LeaderboardOverlayProps {
    teams: Team[];
    tournament: Tournament | null;
    sortBy?: 'players' | 'balance' | 'spent';
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const LeaderboardOverlay: React.FC<LeaderboardOverlayProps> = ({
    teams,
    tournament,
    sortBy = 'players',
    position = 'top-right'
}) => {
    if (teams.length === 0 || !tournament) {
        return null;
    }

    // Sort teams based on sortBy parameter
    const sortedTeams = [...teams].sort((a, b) => {
        if (sortBy === 'players') {
            return (b.playersPurchased?.length || 0) - (a.playersPurchased?.length || 0);
        } else if (sortBy === 'balance') {
            return (b.currentBalance || 0) - (a.currentBalance || 0);
        } else if (sortBy === 'spent') {
            const aSpent = (a.initialBudget || tournament.budgetPerTeam) - (a.currentBalance || 0);
            const bSpent = (b.initialBudget || tournament.budgetPerTeam) - (b.currentBalance || 0);
            return bSpent - aSpent;
        }
        return 0;
    });

    // Position configurations
    const positionConfig = {
        'top-left': 'top-8 left-8',
        'top-right': 'top-8 right-8',
        'bottom-left': 'bottom-8 left-8',
        'bottom-right': 'bottom-8 right-8'
    };

    return (
        <div className={`fixed ${positionConfig[position]} w-80`}>
            <div className="rounded-lg border-2 border-cyan-500 p-4">
                <h3 className="text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-3 text-center border-b-2 border-cyan-500 pb-2">
                    TEAM STANDINGS
                </h3>
                <ul className="space-y-2">
                    {sortedTeams.map((team, index) => {
                        const playersPurchased = team.playersPurchased?.length || 0;
                        const squadSize = tournament.squadSize;
                        const moneySpent = (team.initialBudget || tournament.budgetPerTeam) - (team.currentBalance || 0);

                        return (
                            <li key={team._id} className={`flex items-center gap-3 p-2 rounded-md ${index === 0 ? 'border-2 border-yellow-400' : 'border border-cyan-500'}`}>
                                <span className={`text-xl font-bold ${index === 0 ? 'text-yellow-400' : 'text-white'} w-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                                    {index + 1}.
                                </span>
                                <img src={team.logoURL} alt={team.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-lg" />
                                <div className="flex-grow">
                                    <p className="font-semibold text-white truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{team.name}</p>
                                    <div className="flex gap-3 text-xs">
                                        <span className="text-neutral-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{playersPurchased}/{squadSize}</span>
                                        <span className="text-green-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{formatCurrency(team.currentBalance || 0)}</span>
                                        {sortBy === 'spent' && (
                                            <span className="text-red-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Spent: {formatCurrency(moneySpent)}</span>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default LeaderboardOverlay;
