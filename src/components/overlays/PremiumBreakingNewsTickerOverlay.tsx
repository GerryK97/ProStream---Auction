'use client';

import React from 'react';
import { Player, Team } from '@/types';

interface PremiumBreakingNewsTickerProps {
    soldPlayers: Player[];
    teams: Team[];
    size?: 'small' | 'default' | 'large';
    effect?: 'slide-h' | 'slide-v' | 'fade';
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'yellow';
    autoplay?: boolean;
    timer?: number;
    border?: boolean;
    position?: 'top' | 'bottom';
}

const formatCurrency = (amount: number) => amount.toLocaleString();

/**
 * Premium Breaking News Style Ticker
 * Shows all sold players scrolling horizontally like a news feed
 * Based on breaking news ticker design pattern
 */
const PremiumBreakingNewsTickerOverlay: React.FC<PremiumBreakingNewsTickerProps> = ({
    soldPlayers,
    teams,
    size = 'default',
    effect = 'slide-h',
    color = 'blue',
    autoplay = true,
    timer = 5000,
    border = true,
    position = 'bottom'
}) => {
    // Early return if no sold players
    if (!soldPlayers || soldPlayers.length === 0) {
        return null;
    }

    // Size configurations
    const sizeConfig = {
        small: {
            height: 'h-[30px]',
            titleHeight: 'h-[30px]',
            fontSize: 'text-sm',
            titleFont: 'text-base',
            padding: 'px-3',
            imgSize: 'w-6 h-6',
            arrowTop: 'top-[5px]'
        },
        default: {
            height: 'h-[40px]',
            titleHeight: 'h-[40px]',
            fontSize: 'text-base',
            titleFont: 'text-lg',
            padding: 'px-4',
            imgSize: 'w-8 h-8',
            arrowTop: 'top-[10px]'
        },
        large: {
            height: 'h-[50px]',
            titleHeight: 'h-[50px]',
            fontSize: 'text-lg',
            titleFont: 'text-xl',
            padding: 'px-5',
            imgSize: 'w-10 h-10',
            arrowTop: 'top-[15px]'
        }
    };

    // Color theme configurations
    const colorConfig = {
        blue: {
            border: 'border-brand-primary',
            bg: 'bg-brand-primary',
            arrow: 'border-l-brand-primary',
            accent: 'text-brand-primary'
        },
        green: {
            border: 'border-brand-secondary',
            bg: 'bg-brand-secondary',
            arrow: 'border-l-brand-secondary',
            accent: 'text-brand-secondary'
        },
        purple: {
            border: 'border-status-purple',
            bg: 'bg-status-purple',
            arrow: 'border-l-status-purple',
            accent: 'text-status-purple'
        },
        orange: {
            border: 'border-orange-500',
            bg: 'bg-orange-500',
            arrow: 'border-l-orange-500',
            accent: 'text-orange-500'
        },
        yellow: {
            border: 'border-status-yellow',
            bg: 'bg-status-yellow',
            arrow: 'border-l-status-yellow',
            accent: 'text-status-yellow'
        }
    };

    // Speed configurations based on timer
    const getSpeedClass = () => {
        if (timer >= 10000) return 'animate-[ticker_60s_linear_infinite]';
        if (timer >= 5000) return 'animate-[ticker_30s_linear_infinite]';
        return 'animate-[ticker_15s_linear_infinite]';
    };

    const currentSize = sizeConfig[size];
    const currentColor = colorConfig[color];
    const positionClass = position === 'top' ? 'top-8' : 'bottom-8';

    return (
        <div className={`fixed ${positionClass} left-0 right-0 px-8 z-50`}>
            <div
                className={`relative ${currentSize.height} bg-white overflow-hidden ${
                    border ? `border-2 ${currentColor.border}` : ''
                }`}
            >
                {/* Title Section */}
                <div className={`inline-block ${currentSize.titleHeight} ${currentColor.bg} relative z-10`}>
                    <h2 className={`inline-block m-0 ${currentSize.padding} leading-none ${currentSize.titleFont} text-white ${currentSize.titleHeight} flex items-center`}>
                        SOLD PLAYERS
                    </h2>
                    {/* Arrow Triangle */}
                    <span
                        className={`absolute right-[-10px] ${currentSize.arrowTop} w-0 h-0 border-solid border-y-[10px] border-l-[10px] border-y-transparent ${currentColor.arrow}`}
                    />
                </div>

                {/* Scrolling Content Area */}
                <div className={`absolute left-[220px] right-0 top-0 ${currentSize.height} overflow-hidden`}>
                    <div className={`flex gap-4 ${autoplay ? getSpeedClass() : ''} whitespace-nowrap`}>
                        {/* Duplicate for seamless loop */}
                        {[...soldPlayers, ...soldPlayers].map((player, index) => {
                            const playerTeam = teams.find(t => t._id === player.winningTeamId);
                            return (
                                <div
                                    key={`${player._id}-${index}`}
                                    className={`inline-flex items-center gap-2 px-4 ${currentSize.height}`}
                                >
                                    {/* Player Photo */}
                                    <img
                                        src={player.photoURL}
                                        alt={player.name}
                                        className={`${currentSize.imgSize} rounded-full object-cover border-2 border-white shadow-lg`}
                                    />

                                    {/* Player Number */}
                                    <span className={`${currentColor.accent} font-mono`}>
                                        #{player.playerNo || player._id}
                                    </span>

                                    {/* Player Name */}
                                    <span className="font-semibold text-gray-800">
                                        {player.name}
                                    </span>

                                    {/* Separator */}
                                    <span className="text-gray-400">→</span>

                                    {/* Team Logo */}
                                    {playerTeam?.logoURL && (
                                        <img
                                            src={playerTeam.logoURL}
                                            alt={playerTeam.name}
                                            className={`${currentSize.imgSize} rounded-full object-cover border-2 border-gray-300`}
                                        />
                                    )}

                                    {/* Team Name */}
                                    <span className={`${currentColor.accent} font-semibold`}>
                                        {playerTeam?.name || 'Unknown'}
                                    </span>

                                    {/* Separator */}
                                    <span className="text-gray-400">•</span>

                                    {/* Price */}
                                    <span className="text-green-600 font-bold">
                                        ₹ {formatCurrency(player.finalPrice || 0)}
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

export default PremiumBreakingNewsTickerOverlay;
