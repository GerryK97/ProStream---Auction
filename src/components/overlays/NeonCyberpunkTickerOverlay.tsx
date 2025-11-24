'use client';

import React from 'react';
import { Player, Team } from '@/types';

interface NeonCyberpunkTickerProps {
    soldPlayers: Player[];
    teams: Team[];
    size?: 'small' | 'default' | 'large';
    color?: 'cyan' | 'magenta' | 'lime' | 'pink' | 'gold';
    autoplay?: boolean;
    timer?: number;
    border?: boolean;
    position?: 'top' | 'bottom';
}

const formatCurrency = (amount: number) => amount.toLocaleString();

/**
 * Neon Cyberpunk Style Ticker
 * Futuristic gaming/esports aesthetic with glowing neon effects
 */
const NeonCyberpunkTickerOverlay: React.FC<NeonCyberpunkTickerProps> = ({
    soldPlayers,
    teams,
    size = 'default',
    color = 'cyan',
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
            height: 'h-[35px]',
            titleHeight: 'h-[35px]',
            fontSize: 'text-xs',
            titleFont: 'text-sm',
            padding: 'px-3',
            imgSize: 'w-7 h-7',
            hexSize: 'w-[120px] h-[35px]',
            hexClipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)'
        },
        default: {
            height: 'h-[45px]',
            titleHeight: 'h-[45px]',
            fontSize: 'text-sm',
            titleFont: 'text-base',
            padding: 'px-4',
            imgSize: 'w-9 h-9',
            hexSize: 'w-[140px] h-[45px]',
            hexClipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)'
        },
        large: {
            height: 'h-[55px]',
            titleHeight: 'h-[55px]',
            fontSize: 'text-base',
            titleFont: 'text-lg',
            padding: 'px-5',
            imgSize: 'w-11 h-11',
            hexSize: 'w-[160px] h-[55px]',
            hexClipPath: 'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)'
        }
    };

    // Neon color configurations
    const colorConfig = {
        cyan: {
            glow: 'shadow-[0_0_15px_rgba(6,182,212,0.8),0_0_30px_rgba(6,182,212,0.4)]',
            border: 'border-cyan-400',
            bg: 'from-cyan-600 to-cyan-500',
            textGlow: 'drop-shadow-[0_0_8px_rgba(6,182,212,1)]',
            accent: 'text-cyan-400',
            imgBorder: 'border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
        },
        magenta: {
            glow: 'shadow-[0_0_15px_rgba(236,72,153,0.8),0_0_30px_rgba(236,72,153,0.4)]',
            border: 'border-pink-400',
            bg: 'from-pink-600 to-fuchsia-600',
            textGlow: 'drop-shadow-[0_0_8px_rgba(236,72,153,1)]',
            accent: 'text-pink-400',
            imgBorder: 'border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.6)]'
        },
        lime: {
            glow: 'shadow-[0_0_15px_rgba(132,204,22,0.8),0_0_30px_rgba(132,204,22,0.4)]',
            border: 'border-lime-400',
            bg: 'from-lime-600 to-lime-500',
            textGlow: 'drop-shadow-[0_0_8px_rgba(132,204,22,1)]',
            accent: 'text-lime-400',
            imgBorder: 'border-lime-400 shadow-[0_0_10px_rgba(132,204,22,0.6)]'
        },
        pink: {
            glow: 'shadow-[0_0_15px_rgba(244,114,182,0.8),0_0_30px_rgba(244,114,182,0.4)]',
            border: 'border-pink-300',
            bg: 'from-pink-500 to-rose-500',
            textGlow: 'drop-shadow-[0_0_8px_rgba(244,114,182,1)]',
            accent: 'text-pink-300',
            imgBorder: 'border-pink-300 shadow-[0_0_10px_rgba(244,114,182,0.6)]'
        },
        gold: {
            glow: 'shadow-[0_0_15px_rgba(251,191,36,0.8),0_0_30px_rgba(251,191,36,0.4)]',
            border: 'border-yellow-400',
            bg: 'from-yellow-500 to-amber-500',
            textGlow: 'drop-shadow-[0_0_8px_rgba(251,191,36,1)]',
            accent: 'text-yellow-400',
            imgBorder: 'border-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
        }
    };

    // Speed configurations
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
                className={`relative ${currentSize.height} overflow-hidden ${
                    border ? `border-2 ${currentColor.border} ${currentColor.glow}` : ''
                }`}
                style={{
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)',
                    backdropFilter: 'blur(10px)'
                }}
            >
                {/* Scanline Effect Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
                    }}
                />

                {/* Title Section - Hexagonal Shape */}
                <div
                    className={`absolute left-0 ${currentSize.titleHeight} ${currentSize.hexSize} bg-gradient-to-r ${currentColor.bg} z-10 animate-neon-pulse`}
                    style={{
                        clipPath: currentSize.hexClipPath
                    }}
                >
                    <h2
                        className={`m-0 ${currentSize.padding} leading-none ${currentSize.titleFont} text-white font-mono font-bold ${currentSize.titleHeight} flex items-center tracking-wider uppercase`}
                        style={{ textShadow: '0 0 10px rgba(255,255,255,0.8)' }}
                    >
                        SOLD
                    </h2>
                </div>

                {/* Scrolling Content Area */}
                <div className={`absolute left-[160px] right-0 top-0 ${currentSize.height} overflow-hidden`}>
                    <div className={`flex gap-6 ${autoplay ? getSpeedClass() : ''} whitespace-nowrap`}>
                        {/* Duplicate for seamless loop */}
                        {[...soldPlayers, ...soldPlayers].map((player, index) => {
                            const playerTeam = teams.find(t => t._id === player.winningTeamId);
                            return (
                                <div
                                    key={`${player._id}-${index}`}
                                    className={`inline-flex items-center gap-3 px-4 ${currentSize.height}`}
                                >
                                    {/* Player Photo with Glow */}
                                    <img
                                        src={player.photoURL}
                                        alt={player.name}
                                        className={`${currentSize.imgSize} rounded-full object-cover border-2 ${currentColor.imgBorder}`}
                                    />

                                    {/* Player Number - Monospace */}
                                    <span className={`${currentColor.accent} font-mono font-bold ${currentSize.fontSize} ${currentColor.textGlow}`}>
                                        #{player.playerNo || player._id}
                                    </span>

                                    {/* Player Name */}
                                    <span className={`font-semibold text-gray-200 ${currentSize.fontSize} tracking-wide`}>
                                        {player.name.toUpperCase()}
                                    </span>

                                    {/* Separator - Arrow */}
                                    <span className={`${currentColor.accent} text-lg ${currentColor.textGlow}`}>▸</span>

                                    {/* Team Logo with Glow */}
                                    {playerTeam?.logoURL && (
                                        <img
                                            src={playerTeam.logoURL}
                                            alt={playerTeam.name}
                                            className={`${currentSize.imgSize} rounded-full object-cover border-2 ${currentColor.imgBorder}`}
                                        />
                                    )}

                                    {/* Team Name */}
                                    <span className={`${currentColor.accent} font-bold ${currentSize.fontSize} ${currentColor.textGlow} uppercase tracking-wide`}>
                                        {playerTeam?.name || 'UNKNOWN'}
                                    </span>

                                    {/* Separator - Dot */}
                                    <span className="text-gray-500 text-xl">◆</span>

                                    {/* Price with Glitch Effect */}
                                    <span className={`text-lime-400 font-mono font-bold ${currentSize.fontSize} drop-shadow-[0_0_8px_rgba(132,204,22,1)]`}>
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

export default NeonCyberpunkTickerOverlay;
