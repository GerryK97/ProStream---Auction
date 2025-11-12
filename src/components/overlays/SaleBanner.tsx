'use client';

import React, { useEffect, useState } from 'react';
import { Player, Team } from '@/types';
import '../../styles/animations.css';

interface SaleBannerProps {
    player: Player;
    team: Team;
    onComplete?: () => void;
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const SaleBanner: React.FC<SaleBannerProps> = ({ player, team, onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Auto-hide after 4 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
                if (onComplete) onComplete();
            }, 500); // Wait for slide-out animation
        }, 4000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div
            className={`fixed top-8 right-8 z-50 ${
                isVisible ? 'animate-slide-in-right' : 'animate-slide-out-left'
            }`}
        >
            <div className="p-4 rounded-lg border-2 border-green-400 min-w-[400px]">
                <div className="flex items-center gap-4">
                    {/* Checkmark Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-green-400 text-sm font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">SOLD!</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <img
                                src={player.photoURL}
                                alt={player.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-lg"
                            />
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{player.name}</span>
                                <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">→</span>
                                <img
                                    src={team.logoURL}
                                    alt={team.name}
                                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-lg"
                                />
                                <span className="font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{team.name}</span>
                            </div>
                        </div>
                        <div className="mt-1">
                            <span className="text-2xl font-bold text-green-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                {formatCurrency(player.finalPrice || 0)}
                            </span>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(() => {
                                if (onComplete) onComplete();
                            }, 500);
                        }}
                        className="flex-shrink-0 text-white hover:text-green-400 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SaleBanner;
