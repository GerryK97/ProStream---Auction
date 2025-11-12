'use client';

import React, { useEffect, useState } from 'react';
import { Player } from '@/types';

interface AuctionStatsProps {
    players: Player[];
    soldPlayers: Player[];
}

const formatCurrency = (amount: number) => amount.toLocaleString();

/**
 * Displays auction statistics with animated counters
 */
const AuctionStats: React.FC<AuctionStatsProps> = ({ players, soldPlayers }) => {
    const [animatedStats, setAnimatedStats] = useState({
        totalSold: 0,
        totalValue: 0,
        avgPrice: 0,
        highestBid: 0
    });

    // Calculate stats
    const totalPlayers = players.length;
    const totalSold = soldPlayers.length;
    const totalValue = soldPlayers.reduce((sum, p) => sum + (p.finalPrice || 0), 0);
    const avgPrice = totalSold > 0 ? Math.floor(totalValue / totalSold) : 0;
    const highestBid = soldPlayers.length > 0
        ? Math.max(...soldPlayers.map(p => p.finalPrice || 0))
        : 0;

    // Animate counters when stats change
    useEffect(() => {
        const duration = 1500; // 1.5 seconds
        const steps = 60;
        const interval = duration / steps;

        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setAnimatedStats({
                totalSold: Math.floor(totalSold * easeOut),
                totalValue: Math.floor(totalValue * easeOut),
                avgPrice: Math.floor(avgPrice * easeOut),
                highestBid: Math.floor(highestBid * easeOut)
            });

            if (currentStep >= steps) {
                clearInterval(timer);
                // Ensure final values are exact
                setAnimatedStats({
                    totalSold,
                    totalValue,
                    avgPrice,
                    highestBid
                });
            }
        }, interval);

        return () => clearInterval(timer);
    }, [totalSold, totalValue, avgPrice, highestBid]);

    // Progress percentage
    const progressPercent = totalPlayers > 0 ? (totalSold / totalPlayers) * 100 : 0;

    return (
        <div className="bg-neutral-800/80 backdrop-blur-sm rounded-2xl border-2 border-orange-500 p-4">
            {/* Header */}
            <div className="text-center mb-3">
                <h3 className="text-lg font-bold text-orange-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-1">
                    AUCTION STATS
                </h3>
                <div className="h-1 w-20 mx-auto bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full" />
            </div>

            {/* Stats Grid */}
            <div className="space-y-3">
                {/* Total Sold */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-neutral-400 uppercase">Total Sold</span>
                        <span className="text-base font-bold text-cyan-400 animate-stats-counter">
                            {animatedStats.totalSold}/{totalPlayers}
                        </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Total Value */}
                <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-400 uppercase">Total Value</span>
                    <span className="text-base font-bold text-green-400 animate-stats-counter">
                        {formatCurrency(animatedStats.totalValue)}
                    </span>
                </div>

                {/* Avg Price */}
                <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-400 uppercase">Avg Price</span>
                    <span className="text-base font-bold text-yellow-400 animate-stats-counter">
                        {formatCurrency(animatedStats.avgPrice)}
                    </span>
                </div>

                {/* Highest Bid */}
                <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-400 uppercase">Highest Bid</span>
                    <span className="text-base font-bold text-purple-400 animate-stats-counter">
                        {formatCurrency(animatedStats.highestBid)}
                    </span>
                </div>
            </div>

            {/* Milestone Indicators */}
            <div className="mt-3 pt-3 border-t border-neutral-700">
                <div className="flex justify-around text-xs">
                    <div className={`flex flex-col items-center ${progressPercent >= 25 ? 'text-yellow-400' : 'text-neutral-600'}`}>
                        <div className="text-lg mb-0.5">{progressPercent >= 25 ? '🥉' : '○'}</div>
                        <span className="text-[10px]">25%</span>
                    </div>
                    <div className={`flex flex-col items-center ${progressPercent >= 50 ? 'text-yellow-400' : 'text-neutral-600'}`}>
                        <div className="text-lg mb-0.5">{progressPercent >= 50 ? '🥈' : '○'}</div>
                        <span className="text-[10px]">50%</span>
                    </div>
                    <div className={`flex flex-col items-center ${progressPercent >= 75 ? 'text-yellow-400' : 'text-neutral-600'}`}>
                        <div className="text-lg mb-0.5">{progressPercent >= 75 ? '🥇' : '○'}</div>
                        <span className="text-[10px]">75%</span>
                    </div>
                    <div className={`flex flex-col items-center ${progressPercent >= 100 ? 'text-yellow-400 animate-trophy-bounce' : 'text-neutral-600'}`}>
                        <div className="text-lg mb-0.5">{progressPercent >= 100 ? '🏆' : '○'}</div>
                        <span className="text-[10px]">100%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuctionStats;
