'use client';

import React, { useState, useEffect } from 'react';
import { AuctionState, Player } from '@/types';

interface PremiumCurrentBidOverlayProps {
    auctionState: AuctionState;
    currentPlayer: Player | undefined;
    size?: 'small' | 'medium' | 'large';
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

    // Color customization
    backgroundColor?: string;
    borderColor?: string;
    labelColor?: string;
    bidColor?: string;
    accentColor?: string;
    shadowColor?: string;

    // Style options
    showPlayerName?: boolean;
    showGlow?: boolean;
    borderRadius?: 'none' | 'small' | 'medium' | 'large';
    opacity?: number;
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const PremiumCurrentBidOverlay: React.FC<PremiumCurrentBidOverlayProps> = ({
    auctionState,
    currentPlayer,
    size = 'medium',
    position = 'top-right',
    backgroundColor = 'rgba(17, 24, 39, 0.95)',
    borderColor = '#3b82f6',
    labelColor = '#93c5fd',
    bidColor = '#60a5fa',
    accentColor = '#2563eb',
    shadowColor = 'rgba(37, 99, 235, 0.5)',
    showPlayerName = false,
    showGlow = true,
    borderRadius = 'large',
    opacity = 100
}) => {
    const [previousBid, setPreviousBid] = useState<number>(0);
    const [bidPulseKey, setBidPulseKey] = useState<number>(0);

    // Detect bid changes and trigger pulse animation
    useEffect(() => {
        if (auctionState.currentBid !== previousBid && auctionState.currentBid > 0) {
            setBidPulseKey(prev => prev + 1);
            setPreviousBid(auctionState.currentBid);
        }
    }, [auctionState.currentBid, previousBid]);

    // Hide when no player selected
    if (!currentPlayer) {
        return null;
    }

    // Size configurations
    const sizeConfig = {
        small: {
            label: 'text-xs',
            amount: 'text-3xl',
            playerName: 'text-sm',
            padding: 'p-3',
            gap: 'gap-1',
            borderWidth: 2
        },
        medium: {
            label: 'text-base',
            amount: 'text-5xl',
            playerName: 'text-lg',
            padding: 'p-5',
            gap: 'gap-2',
            borderWidth: 3
        },
        large: {
            label: 'text-xl',
            amount: 'text-7xl',
            playerName: 'text-2xl',
            padding: 'p-7',
            gap: 'gap-3',
            borderWidth: 4
        }
    };

    const config = sizeConfig[size];

    // Position configurations
    const positionConfig = {
        'top-left': 'top-8 left-8',
        'top-right': 'top-8 right-8',
        'bottom-left': 'bottom-8 left-8',
        'bottom-right': 'bottom-8 right-8',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    };

    // Border radius configurations
    const radiusConfig = {
        none: 0,
        small: 8,
        medium: 16,
        large: 24
    };

    const borderRadiusValue = radiusConfig[borderRadius];

    return (
        <div className={`fixed ${positionConfig[position]} z-50`}>
            <div
                className={`${config.padding} backdrop-blur-xl relative overflow-hidden`}
                style={{
                    backgroundColor,
                    borderRadius: borderRadiusValue,
                    borderWidth: config.borderWidth,
                    borderColor,
                    opacity: opacity / 100,
                    boxShadow: showGlow ? `0 0 40px ${shadowColor}, 0 0 80px ${shadowColor}` : 'none'
                }}
            >
                {/* Animated background gradient */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        background: `linear-gradient(135deg, ${accentColor} 0%, transparent 60%)`,
                        borderRadius: borderRadiusValue
                    }}
                />

                {/* Shimmer effect */}
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        background: `linear-gradient(45deg, transparent, ${accentColor}40, transparent)`,
                        animation: 'shimmer 3s infinite',
                        borderRadius: borderRadiusValue
                    }}
                />

                <div className={`relative z-10 flex flex-col ${config.gap} items-center`}>
                    {/* Label */}
                    <div className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: accentColor }}
                        />
                        <p
                            className={`${config.label} font-bold tracking-[0.2em] uppercase`}
                            style={{ color: labelColor }}
                        >
                            Current Bid
                        </p>
                        <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: accentColor }}
                        />
                    </div>

                    {/* Bid Amount */}
                    <div className="relative">
                        <p
                            key={bidPulseKey}
                            className={`${config.amount} font-black tracking-tight transition-all duration-300`}
                            style={{
                                color: auctionState.currentBid > 0 ? bidColor : '#6b7280',
                                textShadow: auctionState.currentBid > 0
                                    ? `0 0 20px ${shadowColor}, 0 4px 12px rgba(0,0,0,0.9)`
                                    : '0 4px 12px rgba(0,0,0,0.9)',
                                animation: auctionState.currentBid > 0 ? 'bidPulse 0.5s ease-out' : 'none'
                            }}
                        >
                            {formatCurrency(auctionState.currentBid)}
                        </p>
                    </div>

                    {/* Player Name */}
                    {showPlayerName && (
                        <div className="flex items-center gap-2 mt-1">
                            <div
                                className="h-px flex-1"
                                style={{ backgroundColor: borderColor, opacity: 0.3 }}
                            />
                            <p
                                className={`${config.playerName} font-semibold px-3 py-1 rounded-full`}
                                style={{
                                    color: labelColor,
                                    backgroundColor: `${accentColor}20`,
                                    border: `1px solid ${borderColor}40`
                                }}
                            >
                                {currentPlayer.name}
                            </p>
                            <div
                                className="h-px flex-1"
                                style={{ backgroundColor: borderColor, opacity: 0.3 }}
                            />
                        </div>
                    )}

                    {/* Status indicator */}
                    <div className="flex items-center gap-2 mt-1">
                        <div
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{
                                backgroundColor: auctionState.currentAuctionStatus === 'Active' ? '#10b981' : '#ef4444'
                            }}
                        />
                        <p
                            className="text-xs font-medium uppercase tracking-wider"
                            style={{ color: labelColor, opacity: 0.7 }}
                        >
                            {auctionState.currentAuctionStatus}
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%) translateY(-100%);
                    }
                    100% {
                        transform: translateX(100%) translateY(100%);
                    }
                }

                @keyframes bidPulse {
                    0% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
};

export default PremiumCurrentBidOverlay;
