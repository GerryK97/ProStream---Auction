'use client';

import React, { useState, useEffect } from 'react';
import { Player, Team, Tournament } from '@/types';

interface SoldPlayersSummaryOverlayMinimalistProps {
    players: Player[];
    teams: Team[];
    tournament: Tournament | null;
    position?: 'center' | 'top' | 'bottom';
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    accentColor?: string;
    itemsPerPage?: number;
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const SoldPlayersSummaryOverlayMinimalist: React.FC<SoldPlayersSummaryOverlayMinimalistProps> = ({
    players,
    teams,
    tournament,
    position = 'center',
    backgroundColor = 'rgba(255, 255, 255, 0.05)',
    borderColor = 'rgba(255, 255, 255, 0.1)',
    textColor = '#ffffff',
    accentColor = '#6366f1',
    itemsPerPage = 20
}) => {
    const PLAYERS_PER_PAGE = itemsPerPage;
    const PAGE_DURATION = 10000; // 10 seconds

    const [currentPage, setCurrentPage] = useState(0);

    // Get all sold players
    const soldPlayers = players.filter(p => p.isSold);

    // Check if all players are sold
    const totalPlayers = players.length;
    const allPlayersSold = soldPlayers.length === totalPlayers && totalPlayers > 0;

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

    // Hide if no players are sold or no tournament
    if (!tournament || soldPlayers.length === 0) {
        return null;
    }

    return (
        <div className="w-full h-full flex justify-center items-center animate-fade-in">
            <div className="w-[900px] flex flex-col">
                {/* Container with backdrop blur */}
                <div
                    className="border rounded-2xl overflow-hidden backdrop-blur-lg"
                    style={{
                        borderColor: borderColor,
                        backgroundColor: backgroundColor
                    }}
                >
                    {/* Header */}
                    <div
                        className="border-b p-6 text-center"
                        style={{
                            borderColor: borderColor
                        }}
                    >
                        <h1 className="text-4xl font-semibold mb-2"
                            style={{ color: textColor }}>
                            Auction Summary
                        </h1>
                        <p className="text-base"
                            style={{ color: `${textColor}99`, opacity: 0.7 }}>
                            {allPlayersSold
                                ? `All ${totalPlayers} sold`
                                : `${soldPlayers.length} of ${totalPlayers} sold`
                            }
                            {totalPages > 1 && ` · Page ${currentPage + 1} of ${totalPages}`}
                        </p>
                    </div>

                    {/* List Header */}
                    <div
                        className="grid grid-cols-12 gap-4 p-3 border-b"
                        style={{ borderColor: `${borderColor}80` }}
                    >
                        <div className="col-span-1 text-center">
                            <span className="text-xs font-medium uppercase tracking-wider"
                                style={{ color: `${textColor}80` }}>
                                Rank
                            </span>
                        </div>
                        <div className="col-span-1 text-center">
                            <span className="text-xs font-medium uppercase tracking-wider"
                                style={{ color: `${textColor}80` }}>
                                No.
                            </span>
                        </div>
                        <div className="col-span-4">
                            <span className="text-xs font-medium uppercase tracking-wider"
                                style={{ color: `${textColor}80` }}>
                                Player Name
                            </span>
                        </div>
                        <div className="col-span-3">
                            <span className="text-xs font-medium uppercase tracking-wider"
                                style={{ color: `${textColor}80` }}>
                                Team
                            </span>
                        </div>
                        <div className="col-span-3 text-right">
                            <span className="text-xs font-medium uppercase tracking-wider"
                                style={{ color: `${textColor}80` }}>
                                Price
                            </span>
                        </div>
                    </div>

                    {/* List Body */}
                    <div>
                        {currentPagePlayers.map((player, pageIndex) => {
                            const globalIndex = startIndex + pageIndex;
                            const playerTeam = teams.find(t => t._id === player.winningTeamId);
                            const playerNumber = player.playerNo || player._id;
                            const isTopThree = globalIndex < 3;

                            return (
                                <div
                                    key={player._id}
                                    className="grid grid-cols-12 gap-4 p-3 border-b transition-all"
                                    style={{
                                        borderColor: `${borderColor}50`
                                    }}
                                >
                                    {/* Rank */}
                                    <div className="col-span-1 flex items-center justify-center gap-2">
                                        {isTopThree && (
                                            <span className="text-lg" style={{ color: accentColor }}>●</span>
                                        )}
                                        <span className="text-base font-medium"
                                            style={{ color: textColor }}>
                                            {globalIndex + 1}
                                        </span>
                                    </div>

                                    {/* Player Number */}
                                    <div className="col-span-1 flex items-center justify-center">
                                        <div
                                            className="w-7 h-7 rounded-full flex items-center justify-center border"
                                            style={{
                                                borderColor: `${textColor}20`,
                                                backgroundColor: `${textColor}10`
                                            }}
                                        >
                                            <span className="text-xs font-medium"
                                                style={{ color: textColor }}>
                                                {playerNumber}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Player Name */}
                                    <div className="col-span-4 flex items-center">
                                        <p className="font-medium"
                                            style={{ color: textColor }}>
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
                                                    className="w-7 h-7 rounded-full object-cover border"
                                                    style={{ borderColor: `${textColor}20` }}
                                                />
                                                <span className="text-sm font-medium truncate"
                                                    style={{ color: `${textColor}cc` }}>
                                                    {playerTeam.name}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Sold Price */}
                                    <div className="col-span-3 flex items-center justify-end">
                                        <span className="text-lg font-semibold"
                                            style={{
                                                color: isTopThree ? accentColor : textColor
                                            }}>
                                            {formatCurrency(player.finalPrice || 0)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary Footer */}
                    <div
                        className="grid grid-cols-12 gap-4 p-4 border-t"
                        style={{ borderColor: borderColor }}
                    >
                        <div className="col-span-9 flex items-center justify-end">
                            <span className="text-base font-medium"
                                style={{ color: textColor }}>
                                Total:
                            </span>
                        </div>
                        <div className="col-span-3 flex items-center justify-end">
                            <span className="text-xl font-semibold"
                                style={{ color: accentColor }}>
                                {formatCurrency(sortedPlayers.reduce((sum, p) => sum + (p.finalPrice || 0), 0))}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SoldPlayersSummaryOverlayMinimalist;
