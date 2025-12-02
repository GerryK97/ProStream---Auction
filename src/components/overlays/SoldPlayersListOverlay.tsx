'use client';

import React, { useState, useEffect } from 'react';
import { Player, Team } from '@/types';

interface SoldPlayersListOverlayProps {
    soldPlayers: Player[];
    teams: Team[];
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    backgroundColor?: string;
    opacity?: number;
    displayDuration?: number; // Duration in milliseconds to show each player
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const SoldPlayersListOverlay: React.FC<SoldPlayersListOverlayProps> = ({
    soldPlayers,
    teams,
    position = 'top-right',
    backgroundColor = 'rgba(17, 24, 39, 0.95)',
    opacity = 100,
    displayDuration = 5000 // Default 5 seconds per player
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);

    // Sort by most recent first (assuming higher ID or later timestamp)
    const sortedPlayers = [...soldPlayers].reverse();

    useEffect(() => {
        if (sortedPlayers.length === 0) return;

        const interval = setInterval(() => {
            setIsFlipping(true);

            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % sortedPlayers.length);
                setIsFlipping(false);
            }, 300); // Flip animation duration
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
        <div className={`fixed ${positionConfig[position]} w-96 z-50`} style={{ opacity: opacity / 100 }}>
            <div
                className="rounded-2xl backdrop-blur-xl relative overflow-hidden"
                style={{
                    backgroundColor,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(34, 197, 94, 0.3)'
                }}
            >
                {/* Animated background gradient */}
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        background: 'linear-gradient(135deg, #22c55e 0%, transparent 60%)'
                    }}
                />

                {/* Header */}
                <div className="relative z-10 p-6 pb-4">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-1 h-8 rounded-full bg-green-500"
                            />
                            <h3 className="text-2xl font-bold tracking-tight text-green-400">
                                SOLD PLAYERS
                            </h3>
                        </div>
                        <div
                            className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider"
                            style={{
                                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                color: '#86efac',
                                border: '1px solid rgba(34, 197, 94, 0.4)'
                            }}
                        >
                            {currentIndex + 1} / {soldPlayers.length}
                        </div>
                    </div>
                    <div
                        className="h-px w-full mt-3"
                        style={{
                            background: 'linear-gradient(90deg, #22c55e, transparent)'
                        }}
                    />
                </div>

                {/* Player Card with Flip Animation */}
                <div className="relative z-10 px-6 pb-6">
                    <div
                        className={`relative rounded-xl p-4 transition-all duration-300 ${isFlipping ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
                        style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.08)',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                        }}
                    >
                        <div className="flex items-center gap-4">
                            {/* Player Photo */}
                            <div className="relative">
                                <img
                                    src={currentPlayer.photoURL}
                                    alt={currentPlayer.name}
                                    className="w-20 h-20 rounded-full object-cover border-2 shadow-lg"
                                    style={{ borderColor: '#22c55e' }}
                                />
                                {/* Checkmark badge */}
                                <div
                                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2"
                                    style={{ borderColor: backgroundColor }}
                                >
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Player Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-lg text-white break-words" style={{ lineHeight: '1.2' }}>
                                    {currentPlayer.name}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    {team && (
                                        <>
                                            <img
                                                src={team.logoURL}
                                                alt={team.name}
                                                className="w-6 h-6 rounded-full object-cover border"
                                                style={{ borderColor: 'rgba(255,255,255,0.3)' }}
                                            />
                                            <span className="text-sm text-gray-300 break-words" style={{ lineHeight: '1.2' }}>
                                                {team.name}
                                            </span>
                                        </>
                                    )}
                                </div>
                                {/* Price */}
                                <div className="mt-3">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">
                                        Final Price
                                    </p>
                                    <p className="text-2xl font-bold text-green-400 mt-1">
                                        ₹{formatCurrency(currentPlayer.finalPrice || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full"
                                style={{
                                    animation: `progress ${displayDuration}ms linear`,
                                    animationFillMode: 'forwards'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes progress {
                    from {
                        width: 0%;
                    }
                    to {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default SoldPlayersListOverlay;
