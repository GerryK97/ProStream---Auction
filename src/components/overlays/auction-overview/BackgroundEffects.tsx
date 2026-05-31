'use client';

import React, { useMemo } from 'react';

interface BackgroundEffectsProps {
    theme?: 'dark' | 'premium' | 'vibrant';
    showBackground?: boolean;
}

/**
 * Animated background with gradient shift and floating particles
 * for the Auction Overview LED display
 */
const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({
    theme = 'premium',
    showBackground = true
}) => {
    // Generate random particles
    const particles = useMemo(() => {
        return Array.from({ length: 25 }, (_, i) => ({
            id: i,
            size: Math.random() * 4 + 2, // 2-6px
            startX: Math.random() * 100, // 0-100vw
            startY: Math.random() * 100, // 0-100vh
            tx: (Math.random() - 0.5) * 200, // -100 to 100vw
            ty: (Math.random() - 0.5) * 200, // -100 to 100vh
            delay: Math.random() * 30, // 0-30s
            duration: 20 + Math.random() * 20 // 20-40s
        }));
    }, []);

    if (!showBackground) {
        return null;
    }

    // Theme-based gradient configurations
    const gradients = {
        dark: 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900',
        premium: 'bg-gradient-to-br from-blue-950 via-cyan-900 to-purple-950',
        vibrant: 'bg-gradient-to-br from-orange-900 via-pink-900 to-purple-900'
    };

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Animated gradient background */}
            <div
                className={`absolute inset-0 ${gradients[theme]} animate-gradient-shift opacity-90`}
                style={{
                    backgroundSize: '200% 200%'
                }}
            />

            {/* Radial gradient overlay for depth */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.5) 100%)'
                }}
            />

            {/* Floating particles */}
            <div className="absolute inset-0">
                {particles.map((particle) => (
                    <div
                        key={particle.id}
                        className="absolute rounded-full bg-cyan-400/30 animate-float-particle will-change-transform"
                        style={{
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            left: `${particle.startX}%`,
                            top: `${particle.startY}%`,
                            '--tx': `${particle.tx}vw`,
                            '--ty': `${particle.ty}vh`,
                            animationDelay: `${particle.delay}s`,
                            animationDuration: `${particle.duration}s`
                        } as React.CSSProperties}
                    />
                ))}
            </div>

            {/* Radial pulse effects from center */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div
                    className="absolute w-32 h-32 rounded-full bg-cyan-500/10 animate-radial-pulse"
                    style={{ animationDelay: '0s' }}
                />
                <div
                    className="absolute w-32 h-32 rounded-full bg-purple-500/10 animate-radial-pulse"
                    style={{ animationDelay: '1s' }}
                />
                <div
                    className="absolute w-32 h-32 rounded-full bg-blue-500/10 animate-radial-pulse"
                    style={{ animationDelay: '2s' }}
                />
            </div>

            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}
            />
        </div>
    );
};

export default BackgroundEffects;
