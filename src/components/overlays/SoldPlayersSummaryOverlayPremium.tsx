'use client';

import React, { useState, useEffect } from 'react';
import { Player, Team, Tournament } from '@/types';

interface SoldPlayersSummaryOverlayPremiumProps {
    players: Player[];
    teams: Team[];
    tournament: Tournament | null;
    position?: 'center' | 'top' | 'bottom';
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    priceColor?: string;
    itemsPerPage?: number;
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const SoldPlayersSummaryOverlayPremium: React.FC<SoldPlayersSummaryOverlayPremiumProps> = ({
    players,
    teams,
    tournament,
    position = 'center',
    accentColor = '#f59e0b',
    backgroundColor = 'rgba(15, 23, 42, 0.95)',
    textColor = '#f1f5f9',
    priceColor = '#fbbf24',
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

    // Metallic rank badge styles for top 3
    const getRankBadgeStyle = (globalIndex: number) => {
        if (globalIndex === 0) {
            return { background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)' }; // Gold
        } else if (globalIndex === 1) {
            return { background: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 50%, #c0c0c0 100%)' }; // Silver
        } else if (globalIndex === 2) {
            return { background: 'linear-gradient(135deg, #cd7f32 0%, #f5a962 50%, #cd7f32 100%)' }; // Bronze
        }
        return {};
    };

    return (
        <div className="w-full h-full flex justify-center items-center animate-fade-in">
            <div className="w-[900px] flex flex-col">
                {/* Header */}
                <div
                    className="border-2 rounded-t-lg p-6 text-center relative overflow-hidden"
                    style={{
                        borderColor: accentColor,
                        background: `linear-gradient(135deg, ${accentColor}15 0%, ${backgroundColor} 100%)`,
                        boxShadow: `0 0 30px ${accentColor}30`
                    }}
                >
                    {/* Premium Background Pattern */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-full"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                                backgroundSize: '32px 32px',
                                color: accentColor
                            }}
                        />
                    </div>

                    <h1 className="text-4xl font-bold tracking-wide drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] mb-2 relative z-10"
                        style={{ color: textColor, letterSpacing: '0.05em' }}>
                        🏆 {allPlayersSold
                            ? `All ${totalPlayers} Players Sold - Final Summary`
                            : `${soldPlayers.length} of ${totalPlayers} Players Sold`
                        }
                    </h1>
                    {totalPages > 1 && (
                        <p className="text-sm mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] relative z-10"
                            style={{ color: `${textColor}80` }}>
                            Page {currentPage + 1} of {totalPages}
                        </p>
                    )}

                    {/* Decorative corners */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg" style={{ borderColor: accentColor }} />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg" style={{ borderColor: accentColor }} />
                </div>

                {/* List Container */}
                <div className="border-2 border-t-0 rounded-b-lg overflow-hidden"
                    style={{
                        borderColor: accentColor,
                        backgroundColor: backgroundColor,
                        boxShadow: `0 0 30px ${accentColor}30`
                    }}>
                    {/* List Header */}
                    <div className="grid grid-cols-12 gap-4 p-3 border-b-2"
                        style={{ borderColor: accentColor }}>
                        <div className="col-span-1 text-center">
                            <span className="text-xs font-bold uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                style={{ color: accentColor, letterSpacing: '0.05em' }}>
                                Rank
                            </span>
                        </div>
                        <div className="col-span-1 text-center">
                            <span className="text-xs font-bold uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                style={{ color: accentColor, letterSpacing: '0.05em' }}>
                                No.
                            </span>
                        </div>
                        <div className="col-span-4">
                            <span className="text-xs font-bold uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                style={{ color: accentColor, letterSpacing: '0.05em' }}>
                                Player Name
                            </span>
                        </div>
                        <div className="col-span-3">
                            <span className="text-xs font-bold uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                style={{ color: accentColor, letterSpacing: '0.05em' }}>
                                Team
                            </span>
                        </div>
                        <div className="col-span-3 text-right">
                            <span className="text-xs font-bold uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                style={{ color: accentColor, letterSpacing: '0.05em' }}>
                                Sold Price
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
                                    className={`grid grid-cols-12 gap-4 p-3 border-b transition-all ${isTopThree ? 'relative' : ''}`}
                                    style={{
                                        borderColor: `${accentColor}30`,
                                        ...(isTopThree && {
                                            background: `linear-gradient(90deg, ${accentColor}10 0%, transparent 60%)`
                                        })
                                    }}
                                >
                                    {/* Animated shine effect on top 3 */}
                                    {isTopThree && (
                                        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                                            <div className="animate-shine-slow absolute inset-0"
                                                style={{
                                                    background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
                                                    transform: 'skewX(-20deg) translateX(-100%)',
                                                    animation: 'shine 3s ease-in-out infinite'
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Rank */}
                                    <div className="col-span-1 flex items-center justify-center relative z-10">
                                        {isTopThree ? (
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 shadow-lg"
                                                style={{
                                                    ...getRankBadgeStyle(globalIndex),
                                                    borderColor: 'rgba(0,0,0,0.3)',
                                                    color: '#000',
                                                    boxShadow: `0 4px 12px ${accentColor}50`
                                                }}
                                            >
                                                {globalIndex === 0 ? '🥇' : globalIndex === 1 ? '🥈' : '🥉'}
                                            </div>
                                        ) : (
                                            <span className="text-xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                                style={{ color: textColor }}>
                                                {globalIndex + 1}
                                            </span>
                                        )}
                                    </div>

                                    {/* Player Number */}
                                    <div className="col-span-1 flex items-center justify-center relative z-10">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-md"
                                            style={{
                                                background: isTopThree
                                                    ? `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`
                                                    : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                borderColor: isTopThree ? accentColor : 'rgba(255,255,255,0.2)'
                                            }}
                                        >
                                            <span className="text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                                style={{ color: textColor }}>
                                                {playerNumber}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Player Name */}
                                    <div className="col-span-4 flex items-center relative z-10">
                                        <p className="font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                            style={{ color: textColor }}>
                                            {player.name}
                                        </p>
                                    </div>

                                    {/* Team */}
                                    <div className="col-span-3 flex items-center gap-2 relative z-10">
                                        {playerTeam && (
                                            <>
                                                <img
                                                    src={playerTeam.logoURL}
                                                    alt={playerTeam.name}
                                                    className="w-8 h-8 rounded-full object-cover border-2 shadow-lg"
                                                    style={{ borderColor: textColor }}
                                                />
                                                <span className="font-semibold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate"
                                                    style={{ color: textColor }}>
                                                    {playerTeam.name}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Sold Price */}
                                    <div className="col-span-3 flex items-center justify-end relative z-10">
                                        <span className="text-xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                            style={{
                                                color: isTopThree ? priceColor : textColor
                                            }}>
                                            {formatCurrency(player.finalPrice || 0)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary Footer */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-t-2"
                        style={{
                            borderColor: accentColor,
                            background: `linear-gradient(180deg, transparent 0%, ${accentColor}10 100%)`
                        }}>
                        <div className="col-span-9 flex items-center justify-end">
                            <span className="text-lg font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                style={{ color: textColor, letterSpacing: '0.05em' }}>
                                Total Auction Value:
                            </span>
                        </div>
                        <div className="col-span-3 flex items-center justify-end">
                            <span className="text-2xl font-bold drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
                                style={{ color: priceColor }}>
                                {formatCurrency(sortedPlayers.reduce((sum, p) => sum + (p.finalPrice || 0), 0))}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes shine {
                    0% {
                        transform: skewX(-20deg) translateX(-100%);
                    }
                    100% {
                        transform: skewX(-20deg) translateX(200%);
                    }
                }
            `}</style>
        </div>
    );
};

export default SoldPlayersSummaryOverlayPremium;
