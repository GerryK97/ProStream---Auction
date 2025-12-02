'use client';

import React, { useState, useEffect } from 'react';
import { Player, Team } from '@/types';

interface SoldPlayersFlipperPremiumProps {
    soldPlayers: Player[];
    teams: Team[];
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    backgroundColor?: string;
    accentColor?: string;
    textColor?: string;
    priceColor?: string;
    opacity?: number;
    displayDuration?: number;
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const SoldPlayersFlipperPremium: React.FC<SoldPlayersFlipperPremiumProps> = ({
    soldPlayers,
    teams,
    position = 'top-right',
    backgroundColor = 'rgba(15, 23, 42, 0.95)',
    accentColor = '#f59e0b',
    textColor = '#f1f5f9',
    priceColor = '#fbbf24',
    opacity = 100,
    displayDuration = 5000
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);

    // Sort by most recent first
    const sortedPlayers = [...soldPlayers].reverse();

    useEffect(() => {
        if (sortedPlayers.length === 0) return;

        const interval = setInterval(() => {
            setIsFlipping(true);

            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % sortedPlayers.length);
                setIsFlipping(false);
            }, 400);
        }, displayDuration);

        return () => clearInterval(interval);
    }, [sortedPlayers.length, displayDuration]);

    if (!soldPlayers || soldPlayers.length === 0) {
        return null;
    }

    const currentPlayer = sortedPlayers[currentIndex];
    const team = teams.find(t => t._id === currentPlayer.winningTeamId);

    // Position configurations
    const positionConfig = {
        'top-left': 'top-8 left-8',
        'top-right': 'top-8 right-8',
        'bottom-left': 'bottom-8 left-8',
        'bottom-right': 'bottom-8 right-8'
    };

    return (
        <div className={`fixed ${positionConfig[position]} w-[420px] z-50`} style={{ opacity: opacity / 100 }}>
            <div
                className="rounded-3xl backdrop-blur-2xl relative overflow-hidden shadow-2xl"
                style={{
                    backgroundColor,
                    border: `2px solid ${accentColor}40`,
                    boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${accentColor}20`
                }}
            >
                {/* Decorative corner elements */}
                <div
                    className="absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl"
                    style={{ backgroundColor: accentColor }}
                />
                <div
                    className="absolute bottom-0 left-0 w-32 h-32 opacity-20 blur-3xl"
                    style={{ backgroundColor: accentColor }}
                />

                {/* Animated border glow */}
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none rounded-3xl"
                    style={{
                        background: `linear-gradient(135deg, ${accentColor}20 0%, transparent 50%, ${accentColor}20 100%)`,
                        animation: 'pulse 3s ease-in-out infinite'
                    }}
                />

                {/* Header */}
                <div className="relative z-10 p-6 pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Trophy icon */}
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{
                                    backgroundColor: `${accentColor}20`,
                                    border: `2px solid ${accentColor}`
                                }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke={accentColor} viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold tracking-wider uppercase" style={{ color: `${textColor}CC` }}>
                                    Player Sold
                                </h3>
                                <p className="text-xs" style={{ color: `${textColor}80` }}>
                                    {currentIndex + 1} of {soldPlayers.length}
                                </p>
                            </div>
                        </div>
                        {/* Sold badge */}
                        <div
                            className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)`,
                                color: '#000',
                                boxShadow: `0 4px 12px ${accentColor}60`
                            }}
                        >
                            SOLD
                        </div>
                    </div>
                </div>

                {/* Player Card with Flip Animation */}
                <div className="relative z-10 px-6 pb-6">
                    <div
                        className={`relative transition-all duration-400 ${isFlipping ? 'scale-90 opacity-0 rotate-y-90' : 'scale-100 opacity-100 rotate-y-0'}`}
                        style={{
                            backgroundColor: `${accentColor}08`,
                            border: `1px solid ${accentColor}30`,
                            borderRadius: '24px',
                            padding: '24px'
                        }}
                    >
                        <div className="flex items-start gap-5">
                            {/* Player Photo with Frame */}
                            <div className="relative flex-shrink-0">
                                <div
                                    className="absolute inset-0 rounded-2xl blur-xl opacity-60"
                                    style={{ backgroundColor: accentColor }}
                                />
                                <div
                                    className="relative rounded-2xl p-1"
                                    style={{
                                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`,
                                    }}
                                >
                                    <img
                                        src={currentPlayer.photoURL}
                                        alt={currentPlayer.name}
                                        className="w-24 h-24 rounded-xl object-cover"
                                    />
                                </div>
                                {/* Checkmark badge */}
                                <div
                                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)`,
                                        border: `3px solid ${backgroundColor}`
                                    }}
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Player Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-xl break-words mb-1" style={{ color: textColor, lineHeight: '1.3' }}>
                                    {currentPlayer.name}
                                </p>

                                {/* Team Info */}
                                {team && (
                                    <div
                                        className="flex items-center gap-2 mb-4 p-2 rounded-xl"
                                        style={{
                                            backgroundColor: `${accentColor}10`,
                                            border: `1px solid ${accentColor}20`
                                        }}
                                    >
                                        <img
                                            src={team.logoURL}
                                            alt={team.name}
                                            className="w-7 h-7 rounded-full object-cover border-2"
                                            style={{ borderColor: accentColor }}
                                        />
                                        <span className="text-sm font-medium break-words" style={{ color: `${textColor}E6`, lineHeight: '1.2' }}>
                                            {team.name}
                                        </span>
                                    </div>
                                )}

                                {/* Price Section */}
                                <div
                                    className="p-3 rounded-xl"
                                    style={{
                                        background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`,
                                        border: `1px solid ${accentColor}40`
                                    }}
                                >
                                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: `${textColor}99` }}>
                                        Final Price
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-bold" style={{ color: priceColor }}>₹</span>
                                        <span className="text-3xl font-black tracking-tight" style={{ color: priceColor }}>
                                            {formatCurrency(currentPlayer.finalPrice || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative corner accent */}
                        <div
                            className="absolute top-2 right-2 w-16 h-16 opacity-10 rounded-full"
                            style={{
                                background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`
                            }}
                        />
                    </div>

                    {/* Progress bar with glow */}
                    <div className="mt-4 relative">
                        <div
                            className="h-2 rounded-full overflow-hidden"
                            style={{
                                backgroundColor: `${accentColor}15`,
                                boxShadow: `inset 0 1px 3px ${accentColor}20`
                            }}
                        >
                            <div
                                className="h-full rounded-full relative"
                                style={{
                                    background: `linear-gradient(90deg, ${accentColor}, ${accentColor}DD)`,
                                    animation: `progress ${displayDuration}ms linear`,
                                    animationFillMode: 'forwards',
                                    boxShadow: `0 0 12px ${accentColor}80`
                                }}
                            >
                                {/* Shimmer effect */}
                                <div
                                    className="absolute inset-0 opacity-40"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                                        animation: 'shimmer 2s infinite'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default SoldPlayersFlipperPremium;
