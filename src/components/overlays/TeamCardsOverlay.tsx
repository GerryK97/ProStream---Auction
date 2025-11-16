'use client';

import React from 'react';
import { Team, Tournament, Player } from '@/types';

interface TeamCardsOverlayProps {
    teams: Team[];
    tournament: Tournament | null;
    currentPlayer: Player | undefined;
    layout?: 'horizontal' | 'vertical' | 'grid';
    position?: 'top' | 'bottom' | 'left' | 'right';
    // Customization props
    useGradient?: boolean;
    cardBackground?: string;
    gradientStart?: string;
    gradientEnd?: string;
    borderColor?: string;
    borderRadius?: number;
    backgroundOpacity?: number;
    teamNameColor?: string;
    balanceColor?: string;
    statsColor?: string;
    maxBidColor?: string;
    winningBorderColor?: string;
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const TeamCardsOverlay: React.FC<TeamCardsOverlayProps> = ({
    teams,
    tournament,
    currentPlayer,
    layout = 'horizontal',
    position = 'bottom',
    useGradient = false,
    cardBackground = 'transparent',
    gradientStart = '#0891b2',
    gradientEnd = '#06b6d4',
    borderColor = '#06b6d4',
    borderRadius = 8,
    backgroundOpacity = 100,
    teamNameColor = '#ffffff',
    balanceColor = '#4ade80',
    statsColor = '#d4d4d8',
    maxBidColor = '#22d3ee',
    winningBorderColor = '#ef4444'
}) => {
    // Calculate max bid for teams
    const calculateMaxBid = (team: Team) => {
        if (!tournament || !team.currentBalance) return 0;

        const squadSize = tournament.squadSize;
        const basePrice = tournament.basePricePerPlayer;
        const playersPurchased = team.playersPurchased?.length || 0;
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

    // Helper function to convert hex to rgba
    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
    };

    // Generate background style
    const getBackgroundStyle = () => {
        if (useGradient) {
            const startRgba = hexToRgba(gradientStart, backgroundOpacity);
            const endRgba = hexToRgba(gradientEnd, backgroundOpacity);
            return {
                background: `linear-gradient(135deg, ${startRgba} 0%, ${endRgba} 100%)`
            };
        } else {
            return {
                backgroundColor: hexToRgba(cardBackground, backgroundOpacity)
            };
        }
    };

    // Determine if backdrop blur should be applied
    const shouldBlur = backgroundOpacity < 100;

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
                        const playersPurchased = team.playersPurchased?.length || 0;
                        const squadSize = tournament?.squadSize || 0;

                        return (
                            <div
                                key={team._id}
                                className={`p-3 flex items-center gap-3 ${layout === 'grid' ? 'w-full' : 'w-64'} border-2 transition-all ${
                                    shouldBlur ? 'backdrop-blur-sm' : ''
                                }`}
                                style={{
                                    ...getBackgroundStyle(),
                                    borderColor: isWinningTeam ? winningBorderColor : borderColor,
                                    borderRadius: `${borderRadius}px`,
                                    ...(isWinningTeam && { animation: 'team-highlight 1s ease-in-out infinite' })
                                }}
                            >
                                <img src={team.logoURL} alt={team.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg" />
                                <div className="flex-grow min-w-0">
                                    <p
                                        className="font-bold truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                        style={{ color: teamNameColor }}
                                    >
                                        {team.name}
                                    </p>
                                    <p
                                        className="text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                        style={{ color: statsColor }}
                                    >
                                        {playersPurchased}/{squadSize} players
                                    </p>
                                    <p
                                        className="text-lg font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                        style={{ color: balanceColor }}
                                    >
                                        {formatCurrency(team.currentBalance || 0)}
                                    </p>
                                    <p
                                        className="text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                        style={{ color: maxBidColor }}
                                    >
                                        Max: {formatCurrency(maxBid)}
                                    </p>
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
