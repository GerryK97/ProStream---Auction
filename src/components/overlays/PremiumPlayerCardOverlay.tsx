'use client';

import React from 'react';
import { Player, Team, Tournament } from '@/types';
import ClassBadge from '@/components/shared/ClassBadge';

interface PremiumPlayerCardOverlayProps {
    currentPlayer: Player | undefined;
    tournament: Tournament | null;
    teams: Team[];

    // Position
    position?: 'center' | 'left' | 'right';

    // Visibility settings
    showPlayerImage?: boolean;
    showBackgroundText?: boolean;
    showJerseyNumber?: boolean;
    showDecorativeBadges?: boolean;
    showPlayerName?: boolean;
    showRoleLabel?: boolean;
    showStatsSection?: boolean;
    showMatches?: boolean;
    showScore?: boolean;
    showWickets?: boolean;

    // Color settings
    gradientStart?: string;
    gradientEnd?: string;
    cardBackground?: string;
    playerNameColor?: string;
    statValueColor?: string;
    statLabelColor?: string;
    statsSectionBackground?: string;
    jerseyBadgeGradientStart?: string;
    jerseyBadgeGradientEnd?: string;
    decorativeBadgeColor?: string;
    watermarkColor?: string;

    // Layout settings
    cardSize?: 'small' | 'medium' | 'large';
    borderRadius?: 'none' | 'small' | 'medium' | 'large';
    opacity?: number;

    // Content settings
    roleLabel?: string;
    backgroundTextLine1?: string;
    backgroundTextLine2?: string;
}

const PremiumPlayerCardOverlay: React.FC<PremiumPlayerCardOverlayProps> = ({
    currentPlayer,
    tournament,
    teams,
    position = 'center',

    // Visibility defaults
    showPlayerImage = true,
    showBackgroundText = true,
    showJerseyNumber = true,
    showDecorativeBadges = true,
    showPlayerName = true,
    showRoleLabel = true,
    showStatsSection = true,
    showMatches = true,
    showScore = true,
    showWickets = true,

    // Color defaults
    gradientStart = 'var(--overlay-color-primary, #FFC919)',
    gradientEnd = 'var(--overlay-color-secondary, #FFCC00)',
    cardBackground = 'var(--overlay-bg-card, #ffffff)',
    playerNameColor = 'var(--overlay-text-card, #1e293b)',
    statValueColor = 'var(--overlay-text-card, #1e293b)',
    statLabelColor = 'var(--overlay-text-card-dim, #9ca3af)',
    statsSectionBackground = 'var(--overlay-bg-card-alt, #f1f5f9)',
    jerseyBadgeGradientStart = 'var(--overlay-color-primary, #FFC919)',
    jerseyBadgeGradientEnd = 'var(--overlay-color-secondary, #FFCC00)',
    decorativeBadgeColor = 'var(--overlay-bg-card, #ffffff)',
    watermarkColor = 'rgba(var(--overlay-text-card-rgb, 30, 41, 59), 0.1)',

    // Layout defaults
    cardSize = 'medium',
    borderRadius = 'large',
    opacity = 100,

    // Content defaults
    roleLabel = 'Player',
    backgroundTextLine1 = '',
    backgroundTextLine2 = ''
}) => {
    // Hide when no player selected
    if (!currentPlayer || tournament?.status !== 'Live') {
        return null;
    }

    // Position configurations
    const positionConfig = {
        'center': 'justify-center',
        'left': 'justify-start pl-8',
        'right': 'justify-end pr-8'
    };

    // Size configurations
    const sizeConfig = {
        small: { width: 300, imageHeight: 300, circleSize: 240, jerseySize: 10, nameFontSize: '24px' },
        medium: { width: 380, imageHeight: 400, circleSize: 320, jerseySize: 12, nameFontSize: '32px' },
        large: { width: 460, imageHeight: 480, circleSize: 400, jerseySize: 14, nameFontSize: '40px' }
    };

    const size = sizeConfig[cardSize];

    // Border radius mapping
    const radiusMap = {
        none: 'rounded-none',
        small: 'rounded-lg',
        medium: 'rounded-2xl',
        large: 'rounded-3xl'
    };

    // Extract player number
    const playerNumber = currentPlayer.playerNo || currentPlayer._id;

    // Calculate visible stats count for grid
    const stats = (currentPlayer as any).stats;
    const visibleStats = [
        showMatches && stats && { value: stats.matchesPlayed, label: 'Matches' },
        showScore && stats && { value: stats.totalScore, label: 'Score' },
        showWickets && stats && { value: stats.totalWickets, label: 'Wickets' }
    ].filter(Boolean);

    // Use custom background text for watermark
    const watermarkLine1 = backgroundTextLine1;
    const watermarkLine2 = backgroundTextLine2;

    // Output Player name with dynamic scale string
    const nameLength = currentPlayer.name.length;
    let dynamicFontSize = size.nameFontSize;
    if (nameLength > 12 && nameLength <= 18) {
        dynamicFontSize = `calc(${size.nameFontSize} * 0.85)`;
    } else if (nameLength > 18) {
        dynamicFontSize = `calc(${size.nameFontSize} * 0.70)`;
    }

    return (
        <div className={`w-full h-full flex items-center ${positionConfig[position]}`}>
            <div
                className="animate-slide-in-top"
                style={{
                    width: `${size.width}px`,
                    opacity: opacity / 100
                }}
            >
                <div className={`${radiusMap[borderRadius]} border border-custom-gray-200 bg-custom-gray-100 dark:border-custom-gray-600 dark:bg-custom-gray-700`}>
                    <div
                        className={`${radiusMap[borderRadius]} p-4 ring-1 ring-custom-gray-200 dark:ring-custom-gray-600`}
                        style={{ backgroundColor: cardBackground }}
                    >
                        {/* Player Image Section */}
                        <div className="relative overflow-hidden pb-3">
                            <div className="overflow-hidden">
                                <div
                                    className={`relative border border-custom-gray-200 rounded-lg dark:border-custom-gray-600`}
                                    style={{
                                        height: `${size.imageHeight}px`,
                                        background: `linear-gradient(to bottom, ${gradientStart}, ${gradientEnd})`
                                    }}
                                >
                                    {/* Background Text Watermark */}
                                    {showBackgroundText && (watermarkLine1 || watermarkLine2) && (
                                        <div className="pointer-events-none absolute left-1/2 top-10 -z-10 ml-8 -translate-x-1/2 text-center text-9xl font-extrabold tracking-tighter uppercase italic opacity-40 mix-blend-overlay">
                                            {watermarkLine1 && (
                                                <div
                                                    className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
                                                    style={{ color: watermarkColor }}
                                                >
                                                    {watermarkLine1}
                                                </div>
                                            )}
                                            {watermarkLine2 && (
                                                <div
                                                    className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
                                                    style={{ color: watermarkColor }}
                                                >
                                                    {watermarkLine2}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Player Image - Circular */}
                                    {showPlayerImage && (currentPlayer.photoURL || tournament?.logoURL) && (
                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border-4 overflow-hidden" style={{
                                            width: `${size.circleSize}px`,
                                            height: `${size.circleSize}px`,
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                            background: !currentPlayer.photoURL ? '#0d1220' : undefined,
                                        }}>
                                            <img
                                                src={currentPlayer.photoURL || tournament?.logoURL || ''}
                                                alt={currentPlayer.name}
                                                className={`w-full h-full ${!currentPlayer.photoURL ? 'object-contain p-4' : 'object-cover'}`}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Jersey Number Badge */}
                            {showJerseyNumber && (
                                <div
                                    className="absolute start-1/2 bottom-0 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-2xl text-2xl/none font-extrabold tracking-tighter text-white"
                                    style={{
                                        background: `linear-gradient(to bottom, ${jerseyBadgeGradientStart}, ${jerseyBadgeGradientEnd})`
                                    }}
                                >
                                    {playerNumber}
                                </div>
                            )}

                            {/* White Cutout Badges (Top Left and Top Right) */}
                            {showDecorativeBadges && (
                                <>
                                    <div
                                        className="absolute left-0 top-0 aspect-square w-[76px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-custom-gray-200 dark:border-custom-gray-600"
                                        style={{ backgroundColor: decorativeBadgeColor }}
                                    ></div>
                                    <div
                                        className="absolute right-0 top-0 aspect-square w-[76px] translate-x-1/2 -translate-y-1/2 rounded-full border border-custom-gray-200 dark:border-custom-gray-600"
                                        style={{ backgroundColor: decorativeBadgeColor }}
                                    ></div>
                                </>
                            )}
                        </div>

                        {/* Player Name Section */}
                        {(showPlayerName || showRoleLabel) && (
                            <div className="pt-3 pb-2 text-center flex flex-col items-center justify-center">
                                {showPlayerName && (
                                    <h2
                                        className="leading-none font-black tracking-tight uppercase w-full break-words"
                                        style={{
                                            color: playerNameColor,
                                            fontSize: dynamicFontSize,
                                            textWrap: 'balance'
                                        }}
                                    >
                                        {currentPlayer.name}
                                    </h2>
                                )}
                                {showRoleLabel && (
                                    currentPlayer.playerClass && tournament?.usePlayerClasses ? (
                                        <div className="flex justify-center mt-2">
                                            <ClassBadge
                                                tournament={tournament}
                                                player={currentPlayer}
                                                variant="inline"
                                                showIcon={true}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="text-sm font-extrabold uppercase tracking-widest mt-1.5"
                                            style={{ color: jerseyBadgeGradientStart }}
                                        >
                                            {currentPlayer.position || roleLabel}
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    {/* Stats Section */}
                    {showStatsSection && visibleStats.length > 0 && (
                        <div
                            className="grid divide-x divide-custom-gray-200 py-5 px-4 dark:divide-custom-gray-600 rounded-lg"
                            style={{
                                gridTemplateColumns: `repeat(${visibleStats.length}, 1fr)`,
                                backgroundColor: statsSectionBackground
                            }}
                        >
                            {visibleStats.map((stat: any, index) => (
                                <div key={index} className="px-7 text-center">
                                    <div
                                        className="mb-2 text-sm font-bold"
                                        style={{ color: statValueColor }}
                                    >
                                        {stat.value}
                                    </div>
                                    <div
                                        className="text-2xs uppercase"
                                        style={{ color: statLabelColor }}
                                    >
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* SVG Filter for rounded edges effect */}
                <svg className="invisible absolute" width="0" height="0" xmlns="http://www.w3.org/2000/svg" version="1.1">
                    <defs>
                        <filter id="rounded-sm">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur-sm"></feGaussianBlur>
                            <feColorMatrix in="blur-sm" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo"></feColorMatrix>
                            <feComposite in="SourceGraphic" in2="goo" operator="atop"></feComposite>
                        </filter>
                    </defs>
                </svg>
            </div>
        </div>
    );
};

export default PremiumPlayerCardOverlay;
