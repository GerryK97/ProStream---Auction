'use client';

import React from 'react';
import { Player, Team } from '@/types';

interface ElegantMinimalistTickerProps {
    soldPlayers: Player[];
    teams: Team[];
    size?: 'small' | 'default' | 'large';
    color?: 'champagne' | 'platinum' | 'rose' | 'navy' | 'charcoal';
    autoplay?: boolean;
    timer?: number;
    border?: boolean;
    position?: 'top' | 'bottom';
}

const formatCurrency = (amount: number) => amount.toLocaleString();

/**
 * Elegant Minimalist Style Ticker
 * Sophisticated luxury aesthetic with frosted glass and refined typography
 */
const ElegantMinimalistTickerOverlay: React.FC<ElegantMinimalistTickerProps> = ({
    soldPlayers,
    teams,
    size = 'default',
    color = 'champagne',
    autoplay = true,
    timer = 5000,
    border = true,
    position = 'bottom'
}) => {
    // Early return if no sold players
    if (!soldPlayers || soldPlayers.length === 0) {
        return null;
    }

    // Size configurations with generous spacing
    const sizeConfig = {
        small: {
            height: 'h-[50px]',
            titleHeight: 'h-[50px]',
            fontSize: 'text-sm',
            titleFont: 'text-base',
            padding: 'px-6',
            imgSize: 'w-9 h-9',
            titleWidth: 'w-[180px]'
        },
        default: {
            height: 'h-[65px]',
            titleHeight: 'h-[65px]',
            fontSize: 'text-base',
            titleFont: 'text-lg',
            padding: 'px-8',
            imgSize: 'w-12 h-12',
            titleWidth: 'w-[200px]'
        },
        large: {
            height: 'h-[80px]',
            titleHeight: 'h-[80px]',
            fontSize: 'text-lg',
            titleFont: 'text-xl',
            padding: 'px-10',
            imgSize: 'w-14 h-14',
            titleWidth: 'w-[220px]'
        }
    };

    // Elegant color configurations
    const colorConfig = {
        champagne: {
            border: 'border-amber-200',
            titleBg: 'from-amber-100 via-yellow-50 to-amber-100',
            titleText: 'text-amber-800',
            accent: 'text-amber-700',
            glass: 'bg-white/40'
        },
        platinum: {
            border: 'border-gray-300',
            titleBg: 'from-gray-200 via-gray-100 to-gray-200',
            titleText: 'text-gray-800',
            accent: 'text-gray-700',
            glass: 'bg-gray-50/40'
        },
        rose: {
            border: 'border-rose-200',
            titleBg: 'from-rose-100 via-pink-50 to-rose-100',
            titleText: 'text-rose-800',
            accent: 'text-rose-700',
            glass: 'bg-rose-50/40'
        },
        navy: {
            border: 'border-blue-300',
            titleBg: 'from-blue-100 via-indigo-50 to-blue-100',
            titleText: 'text-blue-900',
            accent: 'text-blue-700',
            glass: 'bg-blue-50/40'
        },
        charcoal: {
            border: 'border-slate-400',
            titleBg: 'from-slate-300 via-slate-200 to-slate-300',
            titleText: 'text-slate-900',
            accent: 'text-slate-700',
            glass: 'bg-slate-100/40'
        }
    };

    // Slower, elegant animation speed
    const getSpeedClass = () => {
        if (timer >= 10000) return 'animate-[elegant-ticker_80s_ease-in-out_infinite]';
        if (timer >= 5000) return 'animate-[elegant-ticker_50s_ease-in-out_infinite]';
        return 'animate-[elegant-ticker_30s_ease-in-out_infinite]';
    };

    const currentSize = sizeConfig[size];
    const currentColor = colorConfig[color];
    const positionClass = position === 'top' ? 'top-8' : 'bottom-8';

    return (
        <div className={`fixed ${positionClass} left-0 right-0 px-12 z-50`}>
            <div
                className={`relative ${currentSize.height} overflow-hidden rounded-full ${
                    border ? `border ${currentColor.border}` : ''
                } backdrop-blur-lg ${currentColor.glass}`}
                style={{
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255,255,255,0.5)'
                }}
            >
                {/* Title Section - Rounded Pill */}
                <div
                    className={`absolute left-4 ${currentSize.titleHeight} ${currentSize.titleWidth} bg-gradient-to-r ${currentColor.titleBg} rounded-full flex items-center justify-center z-10`}
                    style={{
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                    }}
                >
                    <h2
                        className={`m-0 leading-none ${currentSize.titleFont} ${currentColor.titleText} font-serif tracking-wide`}
                        style={{ fontWeight: 500 }}
                    >
                        Sold Players
                    </h2>
                </div>

                {/* Scrolling Content Area */}
                <div className={`absolute left-[240px] right-0 top-0 ${currentSize.height} overflow-hidden`}>
                    {/* Fade gradient on left edge */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
                        style={{
                            background: 'linear-gradient(to right, rgba(255,255,255,0.4), transparent)'
                        }}
                    />

                    {/* Fade gradient on right edge */}
                    <div
                        className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
                        style={{
                            background: 'linear-gradient(to left, rgba(255,255,255,0.4), transparent)'
                        }}
                    />

                    <div className={`flex gap-12 ${autoplay ? getSpeedClass() : ''} whitespace-nowrap`}>
                        {/* Duplicate for seamless loop */}
                        {[...soldPlayers, ...soldPlayers].map((player, index) => {
                            const playerTeam = teams.find(t => t._id === player.winningTeamId);
                            return (
                                <div
                                    key={`${player._id}-${index}`}
                                    className={`inline-flex items-center gap-4 ${currentSize.padding} ${currentSize.height}`}
                                >
                                    {/* Player Photo with Subtle Shadow */}
                                    <img
                                        src={player.photoURL}
                                        alt={player.name}
                                        className={`${currentSize.imgSize} rounded-full object-cover border-2 border-white`}
                                        style={{
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                                        }}
                                    />

                                    {/* Player Name - Elegant Typography */}
                                    <span className={`${currentSize.fontSize} text-gray-800 font-light tracking-wide`}>
                                        {player.name}
                                    </span>

                                    {/* Separator - Subtle Dot */}
                                    <span className="text-gray-300 text-sm">•</span>

                                    {/* Team Logo with Subtle Shadow */}
                                    {playerTeam?.logoURL && (
                                        <img
                                            src={playerTeam.logoURL}
                                            alt={playerTeam.name}
                                            className={`${currentSize.imgSize} rounded-full object-cover border-2 border-white`}
                                            style={{
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                                            }}
                                        />
                                    )}

                                    {/* Team Name */}
                                    <span className={`${currentColor.accent} ${currentSize.fontSize} font-medium tracking-wide`}>
                                        {playerTeam?.name || 'Unknown'}
                                    </span>

                                    {/* Separator */}
                                    <span className="text-gray-300 text-sm">•</span>

                                    {/* Price - Sophisticated Green */}
                                    <span className={`text-emerald-700 ${currentSize.fontSize} font-semibold tracking-wide`}>
                                        {formatCurrency(player.finalPrice || 0)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ElegantMinimalistTickerOverlay;
