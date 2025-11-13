'use client';

import React, { useMemo } from 'react';

interface SoldCelebrationProps {
    show: boolean;
}

/**
 * Celebration animation overlay when a player is sold
 * Shows confetti burst and "SOLD!" banner
 */
const SoldCelebration: React.FC<SoldCelebrationProps> = ({ show }) => {
    // Generate confetti particles once and reuse across renders
    const confettiParticles = useMemo(() => {
        return Array.from({ length: 50 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 500,
            duration: 2000 + Math.random() * 1000,
            color: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'][Math.floor(Math.random() * 5)],
            size: 8 + Math.random() * 8
        }));
    }, []);

    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {/* Border Flash */}
            <div className="absolute inset-0 border-8 border-yellow-400 animate-border-flash" />

            {/* SOLD Banner */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-sold-banner">
                <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 px-16 py-8 rounded-3xl border-4 border-white shadow-2xl transform rotate-3">
                    <h1 className="text-8xl font-black text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] tracking-wider">
                        SOLD!
                    </h1>
                </div>
            </div>

            {/* Confetti Burst */}
            <div className="absolute inset-0">
                {confettiParticles.map((particle) => (
                    <div
                        key={particle.id}
                        className="absolute top-1/2 left-1/2 animate-confetti"
                        style={{
                            left: `${particle.left}%`,
                            animationDelay: `${particle.delay}ms`,
                            animationDuration: `${particle.duration}ms`
                        }}
                    >
                        <div
                            className="rounded-sm"
                            style={{
                                width: `${particle.size}px`,
                                height: `${particle.size}px`,
                                backgroundColor: particle.color
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Celebration Burst Effect (Radial) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 rounded-full bg-yellow-400/30 animate-sold-burst" />
            </div>
        </div>
    );
};

export default SoldCelebration;
