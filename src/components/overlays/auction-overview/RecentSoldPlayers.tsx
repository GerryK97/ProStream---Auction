'use client';

import React, { useEffect, useState } from 'react';
import { Player, Team } from '@/types';
import { imageOptimizers } from '@/lib/imageOptimization';

interface RecentSoldPlayersProps {
    soldPlayers: Player[];
    teams: Team[];
    maxRecent?: number;
}

const formatCurrency = (amount: number) => amount.toLocaleString();

/**
 * Displays recent sold players with slide-in animations
 */
const RecentSoldPlayers: React.FC<RecentSoldPlayersProps> = ({
    soldPlayers,
    teams,
    maxRecent = 5
}) => {
    const [displayedPlayers, setDisplayedPlayers] = useState<Player[]>([]);
    const [newPlayerKey, setNewPlayerKey] = useState(0);

    // Update displayed players when soldPlayers changes
    useEffect(() => {
        // Get most recent players (sorted by most recent first)
        const recentPlayers = [...soldPlayers]
            .slice(-maxRecent)
            .reverse();

        // Trigger animation for new player
        if (recentPlayers.length > displayedPlayers.length) {
            setNewPlayerKey(prev => prev + 1);
        }

        setDisplayedPlayers(recentPlayers);
    }, [soldPlayers, maxRecent, displayedPlayers.length]);

    if (displayedPlayers.length === 0) {
        return (
            <div className="bg-neutral-800/80 backdrop-blur-sm rounded-2xl border-2 border-pink-500 p-4 flex items-center justify-center min-h-[240px]">
                <div className="text-center">
                    <div className="text-3xl mb-2">📋</div>
                    <p className="text-sm text-neutral-400">No players sold yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-neutral-800/80 backdrop-blur-sm rounded-2xl border-2 border-pink-500 p-4">
            {/* Header */}
            <div className="text-center mb-3">
                <h3 className="text-lg font-bold text-pink-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-1">
                    RECENT SOLD
                </h3>
                <div className="h-1 w-20 mx-auto bg-gradient-to-r from-transparent via-pink-500 to-transparent rounded-full" />
            </div>

            {/* Recent Players List */}
            <div className="space-y-2">
                {displayedPlayers.map((player, index) => {
                    const playerTeam = teams.find(t => t._id === player.winningTeamId);
                    const playerNumber = player.playerNo || player._id;
                    const isHighValue = (player.finalPrice || 0) > 1000000; // >1M
                    const isLatest = index === 0;

                    return (
                        <div
                            key={`${player._id}-${index}`}
                            className={`flex items-center gap-2 p-2 rounded-lg bg-neutral-900/50 border border-neutral-700 ${
                                isLatest ? 'animate-slide-in-right' : ''
                            } ${isHighValue ? 'border-yellow-500/50' : ''}`}
                        >
                            {/* Player Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono text-cyan-400">#{playerNumber}</span>
                                    <span className="text-sm font-semibold text-white truncate">
                                        {player.name}
                                    </span>
                                </div>

                                {/* Team and Price */}
                                <div className="flex items-center gap-2">
                                    {/* Team Logo */}
                                    {playerTeam?.logoURL && (
                                        <img
                                            src={imageOptimizers.teamThumbnail(playerTeam.logoURL)}
                                            alt={playerTeam.name}
                                            className="w-5 h-5 rounded-full object-cover border border-neutral-600 animate-logo-spin"
                                        />
                                    )}

                                    {/* Team Name */}
                                    <span className="text-xs text-neutral-400 truncate">
                                        {playerTeam?.name || 'Unknown'}
                                    </span>

                                    {/* Arrow */}
                                    <span className="text-neutral-600">→</span>

                                    {/* Price */}
                                    <span
                                        className={`text-sm font-bold ${
                                            isHighValue
                                                ? 'text-yellow-400 animate-price-highlight'
                                                : 'text-green-400'
                                        }`}
                                    >
                                        {formatCurrency(player.finalPrice || 0)}
                                    </span>
                                </div>
                            </div>

                            {/* High Value Indicator */}
                            {isHighValue && (
                                <div className="text-yellow-400 text-xs">
                                    💎
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Show More Indicator */}
            {soldPlayers.length > maxRecent && (
                <div className="mt-4 text-center">
                    <p className="text-xs text-neutral-500">
                        +{soldPlayers.length - maxRecent} more players sold
                    </p>
                </div>
            )}
        </div>
    );
};

export default RecentSoldPlayers;
