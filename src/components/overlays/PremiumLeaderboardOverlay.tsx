'use client';

import React from 'react';
import { Team, Tournament } from '@/types';

interface PremiumLeaderboardOverlayProps {
    teams: Team[];
    tournament: Tournament | null;
    sortBy?: 'players' | 'balance' | 'spent';
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    backgroundColor?: string;
    opacity?: number;
    accentColor?: string;
    headerColor?: string;
    textColor?: string;
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const PremiumLeaderboardOverlay: React.FC<PremiumLeaderboardOverlayProps> = ({
    teams,
    tournament,
    sortBy = 'players',
    position = 'top-right',
    backgroundColor = 'rgba(17, 24, 39, 0.95)',
    opacity = 100,
    accentColor = '#3b82f6',
    headerColor = '#60a5fa',
    textColor = '#f0f9ff'
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

    // Get sort label
    const getSortLabel = () => {
        if (sortBy === 'players') return 'BY PLAYERS';
        if (sortBy === 'balance') return 'BY BALANCE';
        return 'BY SPENT';
    };

    return (
        <div className={`fixed ${positionConfig[position]} w-96 z-50`} style={{ opacity: opacity / 100 }}>
            <div
                className="rounded-2xl backdrop-blur-xl relative overflow-hidden"
                style={{
                    backgroundColor,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${accentColor}40`
                }}
            >
                {/* Animated background gradient */}
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        background: `linear-gradient(135deg, ${accentColor} 0%, transparent 60%)`
                    }}
                />

                {/* Header */}
                <div className="relative z-10 p-6 pb-4">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-1 h-8 rounded-full"
                                style={{ backgroundColor: accentColor }}
                            />
                            <h3
                                className="text-2xl font-bold tracking-tight"
                                style={{ color: headerColor }}
                            >
                                LEADERBOARD
                            </h3>
                        </div>
                        <div
                            className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider"
                            style={{
                                backgroundColor: `${accentColor}20`,
                                color: headerColor,
                                border: `1px solid ${accentColor}40`
                            }}
                        >
                            {getSortLabel()}
                        </div>
                    </div>
                    <div
                        className="h-px w-full mt-3"
                        style={{
                            background: `linear-gradient(90deg, ${accentColor}, transparent)`
                        }}
                    />
                </div>

                {/* Teams List */}
                <div className="relative z-10 px-6 pb-6 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {sortedTeams.map((team, index) => {
                        const playersPurchased = team.playersPurchased?.length || 0;
                        const squadSize = tournament.squadSize;
                        const moneySpent = (team.initialBudget || tournament.budgetPerTeam) - (team.currentBalance || 0);
                        const isTopTeam = index === 0;

                        return (
                            <div
                                key={team._id}
                                className="relative rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]"
                                style={{
                                    backgroundColor: isTopTeam ? `${accentColor}15` : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${isTopTeam ? accentColor : 'rgba(255,255,255,0.05)'}`,
                                    boxShadow: isTopTeam ? `0 0 20px ${accentColor}30` : 'none'
                                }}
                            >
                                {/* Rank badge */}
                                <div
                                    className="absolute -left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                                    style={{
                                        backgroundColor: isTopTeam ? '#fbbf24' : accentColor,
                                        color: isTopTeam ? '#000' : '#fff',
                                        boxShadow: isTopTeam ? '0 4px 12px rgba(251, 191, 36, 0.4)' : `0 4px 12px ${accentColor}40`
                                    }}
                                >
                                    {index + 1}
                                </div>

                                <div className="flex items-center gap-4 ml-4">
                                    {/* Team Logo */}
                                    <div className="relative">
                                        {isTopTeam && (
                                            <div
                                                className="absolute inset-0 blur-md opacity-60 rounded-full"
                                                style={{ backgroundColor: '#fbbf24' }}
                                            />
                                        )}
                                        <img
                                            src={team.logoURL}
                                            alt={team.name}
                                            className="relative w-14 h-14 rounded-full object-cover border-2 shadow-lg"
                                            style={{
                                                borderColor: isTopTeam ? '#fbbf24' : accentColor
                                            }}
                                        />
                                    </div>

                                    {/* Team Info */}
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className="font-bold text-base mb-1 truncate"
                                            style={{ color: textColor }}
                                        >
                                            {team.name}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{ backgroundColor: accentColor }}
                                                />
                                                <span style={{ color: `${textColor}CC` }}>
                                                    {playersPurchased}/{squadSize} Players
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{ backgroundColor: '#10b981' }}
                                                />
                                                <span style={{ color: '#10b981' }}>
                                                    ₹{formatCurrency(team.currentBalance || 0)}
                                                </span>
                                            </div>
                                        </div>
                                        {sortBy === 'spent' && (
                                            <div className="flex items-center gap-1.5 text-xs mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                <span className="text-red-400">
                                                    Spent: ₹{formatCurrency(moneySpent)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${accentColor}60;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${accentColor}80;
                }
            `}</style>
        </div>
    );
};

export default PremiumLeaderboardOverlay;
