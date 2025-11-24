'use client';

import React from 'react';
import { Team, Tournament, Player } from '@/types';
import { resolveTeamCardTheme, TeamCardThemeVariant } from './themes/teamCardThemes';

interface TeamCardsOverlayProps {
    teams: Team[];
    tournament: Tournament | null;
    currentPlayer: Player | undefined;
    layout?: 'horizontal' | 'vertical' | 'grid';
    position?: 'top' | 'bottom' | 'left' | 'right';
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
    themeVariant?: TeamCardThemeVariant;
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const hexToRgba = (hex: string, alpha: number) => {
    if (!hex) return 'transparent';
    if (!hex.startsWith('#')) {
        return hex;
    }

    const normalizedHex =
        hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;

    const r = parseInt(normalizedHex.slice(1, 3), 16);
    const g = parseInt(normalizedHex.slice(3, 5), 16);
    const b = parseInt(normalizedHex.slice(5, 7), 16);
    const safeAlpha = Math.min(Math.max(alpha, 0), 100);
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha / 100})`;
};

const TeamCardsOverlay: React.FC<TeamCardsOverlayProps> = ({
    teams,
    tournament,
    currentPlayer,
    layout = 'horizontal',
    position = 'bottom',
    useGradient,
    cardBackground,
    gradientStart,
    gradientEnd,
    borderColor,
    borderRadius,
    backgroundOpacity,
    teamNameColor,
    balanceColor,
    statsColor,
    maxBidColor,
    winningBorderColor,
    themeVariant = 'neonPulse'
}) => {
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

    const theme = resolveTeamCardTheme(themeVariant);

    const useGradientBackground = useGradient ?? theme.background.useGradient;
    const gradientStartColor = gradientStart ?? theme.background.gradientStart;
    const gradientEndColor = gradientEnd ?? theme.background.gradientEnd;
    const fallbackBackground = cardBackground ?? theme.background.solidFallback;
    const backgroundAlpha = backgroundOpacity ?? theme.background.opacity;

    const resolvedBorderRadius = borderRadius ?? theme.border.radius;
    const resolvedBorderColor = borderColor ?? theme.border.color;
    const resolvedTeamNameColor = teamNameColor ?? theme.text.teamName;
    const resolvedStatsColor = statsColor ?? theme.text.stats;
    const resolvedBalanceColor = balanceColor ?? theme.text.balance;
    const resolvedMaxBidColor = maxBidColor ?? theme.text.maxBid;
    const resolvedWinningBorderColor = winningBorderColor ?? theme.winning.borderColor;

    const shouldBlur = backgroundAlpha < 100;

    const cardSurfaceStyle = useGradientBackground
        ? { background: `linear-gradient(135deg, ${gradientStartColor} 0%, ${gradientEndColor} 100%)` }
        : {
              backgroundColor: hexToRgba(fallbackBackground, backgroundAlpha)
          };

    const layoutWrapperClasses: Record<'horizontal' | 'vertical' | 'grid', string> = {
        horizontal: 'flex flex-row flex-wrap justify-center gap-5',
        vertical: 'flex flex-col items-center gap-5',
        grid: 'grid grid-cols-1 md:grid-cols-2 gap-5'
    };

    const positionConfig: Record<'top' | 'bottom' | 'left' | 'right', string> = {
        top: 'justify-start pt-8',
        bottom: 'justify-end pb-8',
        left: 'justify-start pl-8 flex-col',
        right: 'justify-end pr-8 flex-col'
    };

    return (
        <div className={`w-full h-full flex ${positionConfig[position]} items-center px-8`}>
            <div className="transition-all duration-500 ease-in-out animate-slide-in-bottom w-full">
                <div className={layoutWrapperClasses[layout]}>
                    {teams.map(team => {
                        const maxBid = calculateMaxBid(team);
                        const isWinningTeam = currentPlayer?.winningTeamId === team._id;
                        const playersPurchased = team.playersPurchased?.length || 0;
                        const squadSize = tournament?.squadSize || 0;
                        const remainingSlots = Math.max(0, squadSize - playersPurchased);
                        const fillPercent =
                            squadSize > 0 ? Math.min(100, (playersPurchased / squadSize) * 100) : 0;

                        const accentLabel = isWinningTeam ? 'Last Sold' : theme.accentStrip.label;
                        const accentIcon = isWinningTeam ? '🏆' : theme.accentStrip.icon;
                        const accentTextColor = isWinningTeam ? resolvedTeamNameColor : theme.accentStrip.textColor;
                        const accentBackground = isWinningTeam
                            ? 'linear-gradient(90deg, rgba(251, 191, 36, 0.35), rgba(248, 113, 113, 0.2))'
                            : theme.accentStrip.background;

                        const cardShadow = isWinningTeam ? theme.winning.glow : theme.border.glow;
                        const borderTone = isWinningTeam ? resolvedWinningBorderColor : resolvedBorderColor;
                        const cardAnimation = isWinningTeam
                            ? `${theme.animation}, teamHighlight 1.2s ease-in-out infinite`
                            : theme.animation;

                        return (
                            <div
                                key={team._id}
                                className={`relative ${layout === 'grid' ? 'w-full' : 'w-80'} overflow-hidden ${
                                    shouldBlur ? 'backdrop-blur-xl' : ''
                                }`}
                                style={{
                                    borderRadius: `${resolvedBorderRadius}px`,
                                    borderWidth: `${theme.border.width}px`,
                                    borderColor: borderTone,
                                    borderStyle: 'solid',
                                    boxShadow: cardShadow,
                                    ...cardSurfaceStyle,
                                    animation: cardAnimation
                                }}
                            >
                                <div
                                    className="absolute inset-0 opacity-70 pointer-events-none"
                                    style={{
                                        background: theme.background.overlayPattern,
                                        borderRadius: `${resolvedBorderRadius}px`
                                    }}
                                />
                                <div
                                    className="absolute inset-0 opacity-70 mix-blend-screen pointer-events-none"
                                    style={{
                                        background: theme.background.noiseLayer,
                                        borderRadius: `${resolvedBorderRadius}px`
                                    }}
                                />
                                <div className="relative z-10 p-4 flex flex-col gap-3">
                                    <div
                                        className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em]"
                                        style={{ color: accentTextColor }}
                                    >
                                        <span
                                            className="flex items-center gap-2 px-2 py-1 rounded-full"
                                            style={{ background: accentBackground }}
                                        >
                                            <span>{accentIcon}</span>
                                            {accentLabel}
                                        </span>
                                        <span
                                            className="px-3 py-1 rounded-full font-semibold tracking-tight text-[11px]"
                                            style={{
                                                background: theme.accentStrip.maxBadgeBackground,
                                                color: theme.accentStrip.maxBadgeText
                                            }}
                                        >
                                            Max {formatCurrency(maxBid)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div
                                                className="absolute inset-0 blur-xl opacity-80 pointer-events-none"
                                                style={{ background: theme.logoFrame.glow }}
                                            />
                                            <div
                                                className="relative rounded-2xl p-0.5"
                                                style={{ background: theme.logoFrame.background }}
                                            >
                                                <img
                                                    src={team.logoURL}
                                                    alt={team.name}
                                                    className="w-16 h-16 rounded-2xl object-cover border shadow-lg"
                                                    style={{ borderColor: theme.logoFrame.border }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-lg truncate" style={{ color: resolvedTeamNameColor }}>
                                                {team.name}
                                            </p>
                                            <p className="text-sm" style={{ color: resolvedStatsColor }}>
                                                {playersPurchased}/{squadSize} players • {remainingSlots} slots left
                                            </p>
                                            <div className="mt-2 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${fillPercent}%`,
                                                        background: theme.accentStrip.progressColor
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs uppercase tracking-wide" style={{ color: theme.text.badge }}>
                                                Balance
                                            </p>
                                            <p className="text-xl font-mono" style={{ color: resolvedBalanceColor }}>
                                                {formatCurrency(team.currentBalance || 0)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs" style={{ color: resolvedMaxBidColor }}>
                                        <span className="flex items-center gap-2">
                                            <span
                                                className="h-2 w-2 rounded-full"
                                                style={{ backgroundColor: resolvedMaxBidColor }}
                                            />
                                            Max Bid Ready
                                        </span>
                                        <span className="font-semibold">{formatCurrency(maxBid)}</span>
                                    </div>
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
