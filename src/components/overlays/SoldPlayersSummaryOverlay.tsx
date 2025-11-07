'use client';

import React, { useState, useEffect } from 'react';
import { Player, Team, Tournament } from '@/types';

interface SoldPlayersSummaryOverlayProps {
    players: Player[];
    teams: Team[];
    tournament: Tournament | null;
    position?: 'center' | 'top' | 'bottom';
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const SoldPlayersSummaryOverlay: React.FC<SoldPlayersSummaryOverlayProps> = ({
    players,
    teams,
    tournament,
    position = 'center'
}) => {
    const PLAYERS_PER_PAGE = 20;
    const PAGE_DURATION = 10000; // 10 seconds

    const [currentPage, setCurrentPage] = useState(0);

    // Get all sold players
    const soldPlayers = players.filter(p => p.isSold);

    // Check if all players are sold
    const totalPlayers = players.length;
    const allPlayersSold = soldPlayers.length === totalPlayers && totalPlayers > 0;

    // Hide if not all players are sold
    if (!allPlayersSold || !tournament) {
        return null;
    }

    // Sort by highest sold value
    const sortedPlayers = [...soldPlayers].sort((a, b) => (b.finalPrice || 0) - (a.finalPrice || 0));

    // Calculate pagination
    const totalPages = Math.ceil(sortedPlayers.length / PLAYERS_PER_PAGE);
    const startIndex = currentPage * PLAYERS_PER_PAGE;
    const endIndex = startIndex + PLAYERS_PER_PAGE;
    const currentPagePlayers = sortedPlayers.slice(startIndex, endIndex);

    // Auto-flip pages every 10 seconds
    useEffect(() => {
        if (totalPages <= 1) return; // No pagination needed

        const timer = setInterval(() => {
            setCurrentPage(prev => (prev + 1) % totalPages);
        }, PAGE_DURATION);

        return () => clearInterval(timer);
    }, [totalPages]);

    // Extract player number from ID
    const getPlayerNumber = (playerId: string) => playerId.replace('p', '');

    return (
        <div className="w-full h-full flex justify-center items-center animate-fade-in">
            <div className="w-[900px] flex flex-col">
                {/* Header */}
                <div className="border-2 border-cyan-500 rounded-t-lg p-6 text-center">
                    <h1 className="text-5xl font-bold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] mb-2">
                        AUCTION COMPLETE
                    </h1>
                    <p className="text-xl text-cyan-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        All {totalPlayers} Players Sold - Final Summary
                    </p>
                    {totalPages > 1 && (
                        <p className="text-sm text-neutral-300 mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            Page {currentPage + 1} of {totalPages}
                        </p>
                    )}
                </div>

                {/* List Container */}
                <div className="border-2 border-t-0 border-cyan-500 rounded-b-lg overflow-hidden">
                    {/* List Header */}
                    <div className="grid grid-cols-12 gap-4 p-3 border-b-2 border-cyan-500">
                        <div className="col-span-1 text-center">
                            <span className="text-xs font-bold text-cyan-400 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Rank</span>
                        </div>
                        <div className="col-span-1 text-center">
                            <span className="text-xs font-bold text-cyan-400 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">No.</span>
                        </div>
                        <div className="col-span-4">
                            <span className="text-xs font-bold text-cyan-400 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Player Name</span>
                        </div>
                        <div className="col-span-3">
                            <span className="text-xs font-bold text-cyan-400 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Team</span>
                        </div>
                        <div className="col-span-3 text-right">
                            <span className="text-xs font-bold text-cyan-400 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Sold Price</span>
                        </div>
                    </div>

                    {/* List Body */}
                    <div>
                        {currentPagePlayers.map((player, pageIndex) => {
                            const globalIndex = startIndex + pageIndex;
                            const playerTeam = teams.find(t => t._id === player.winningTeamId);
                            const playerNumber = getPlayerNumber(player._id);
                            const isTopThree = globalIndex < 3;

                            return (
                                <div
                                    key={player._id}
                                    className={`grid grid-cols-12 gap-4 p-3 border-b border-cyan-500/30 transition-all ${
                                        isTopThree ? 'bg-gradient-to-r from-yellow-900/20 to-transparent' : ''
                                    }`}
                                >
                                    {/* Rank */}
                                    <div className="col-span-1 flex items-center justify-center">
                                        <span className={`text-xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                                            globalIndex === 0 ? 'text-yellow-400' :
                                            globalIndex === 1 ? 'text-gray-300' :
                                            globalIndex === 2 ? 'text-orange-400' :
                                            'text-white'
                                        }`}>
                                            {globalIndex === 0 ? '🥇' : globalIndex === 1 ? '🥈' : globalIndex === 2 ? '🥉' : `${globalIndex + 1}`}
                                        </span>
                                    </div>

                                    {/* Player Number */}
                                    <div className="col-span-1 flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-b from-custom-orange to-custom-yellow flex items-center justify-center">
                                            <span className="text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                                {playerNumber}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Player Name */}
                                    <div className="col-span-4 flex items-center">
                                        <p className="font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                            {player.name}
                                        </p>
                                    </div>

                                    {/* Team */}
                                    <div className="col-span-3 flex items-center gap-2">
                                        {playerTeam && (
                                            <>
                                                <img
                                                    src={playerTeam.logoURL}
                                                    alt={playerTeam.name}
                                                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-lg"
                                                />
                                                <span className="font-semibold text-white text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate">
                                                    {playerTeam.name}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Sold Price */}
                                    <div className="col-span-3 flex items-center justify-end">
                                        <span className={`text-xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                                            isTopThree ? 'text-green-400' : 'text-white'
                                        }`}>
                                            {formatCurrency(player.finalPrice || 0)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary Footer */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-t-2 border-cyan-500">
                        <div className="col-span-9 flex items-center justify-end">
                            <span className="text-lg font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                Total Auction Value:
                            </span>
                        </div>
                        <div className="col-span-3 flex items-center justify-end">
                            <span className="text-2xl font-bold text-green-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                                {formatCurrency(sortedPlayers.reduce((sum, p) => sum + (p.finalPrice || 0), 0))}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SoldPlayersSummaryOverlay;
