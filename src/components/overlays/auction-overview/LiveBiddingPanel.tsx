'use client';

import React, { useEffect, useState } from 'react';
import { AuctionState, Tournament } from '@/types';

interface LiveBiddingPanelProps {
    auctionState: AuctionState;
    tournament: Tournament | null;
    size?: 'default' | 'large';
}

const formatCurrency = (amount: number) => amount.toLocaleString();

/**
 * Displays live bidding information: current bid, status, and base price
 * NO leading team display as per user requirement
 */
const LiveBiddingPanel: React.FC<LiveBiddingPanelProps> = ({
    auctionState,
    tournament,
    size = 'default'
}) => {
    const [bidKey, setBidKey] = useState(0);
    const [previousBid, setPreviousBid] = useState(0);

    // Trigger animation when bid changes
    useEffect(() => {
        if (auctionState.currentBid !== previousBid && auctionState.currentBid > 0) {
            setBidKey(prev => prev + 1);
            setPreviousBid(auctionState.currentBid);
        }
    }, [auctionState.currentBid, previousBid]);

    const sizeConfig = {
        default: {
            bidSize: 'text-5xl',
            labelSize: 'text-xs',
            padding: 'p-4'
        },
        large: {
            bidSize: 'text-7xl',
            labelSize: 'text-base',
            padding: 'p-8'
        }
    };

    const config = sizeConfig[size];

    // Status configurations
    const statusConfig = {
        Pending: {
            color: 'text-yellow-400',
            dotColor: 'bg-yellow-400',
            animation: 'animate-status-pending'
        },
        Bidding: {
            color: 'text-green-400',
            dotColor: 'bg-green-400',
            animation: 'animate-status-pulse'
        },
        Sold: {
            color: 'text-red-400',
            dotColor: 'bg-red-400',
            animation: 'animate-bid-explosion'
        }
    };

    const currentStatus = statusConfig[auctionState.currentAuctionStatus] || statusConfig.Pending;

    return (
        <div className={`bg-neutral-800/80 backdrop-blur-sm rounded-2xl border-2 border-green-500 ${config.padding} min-h-[240px] flex flex-col justify-center`}>
            {/* Header */}
            <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-green-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-1">
                    LIVE BIDDING
                </h3>
                <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-green-500 to-transparent rounded-full" />
            </div>

            {/* Current Bid Amount */}
            <div className="text-center mb-4">
                <p className={`${config.labelSize} text-neutral-400 uppercase tracking-wide mb-2`}>
                    Current Bid
                </p>
                <div
                    key={bidKey}
                    className={`${config.bidSize} font-bold text-green-400 drop-shadow-[0_4px_12px_rgba(34,197,94,0.8)] animate-bid-explosion will-change-transform`}
                >
                    {formatCurrency(auctionState.currentBid)}
                </div>
            </div>

            {/* Status and Base Price */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-700">
                {/* Status */}
                <div className="text-center">
                    <p className={`${config.labelSize} text-neutral-400 uppercase tracking-wide mb-2`}>
                        Status
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${currentStatus.dotColor} ${currentStatus.animation}`} />
                        <span className={`text-lg font-bold ${currentStatus.color} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                            {auctionState.currentAuctionStatus.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Base Price */}
                <div className="text-center">
                    <p className={`${config.labelSize} text-neutral-400 uppercase tracking-wide mb-2`}>
                        Base Price
                    </p>
                    <span className="text-lg font-bold text-cyan-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {tournament ? formatCurrency(tournament.basePricePerPlayer) : '-'}
                    </span>
                </div>
            </div>

            {/* Bid Activity Indicator */}
            {auctionState.currentBid > 0 && auctionState.currentAuctionStatus === 'Bidding' && (
                <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/50">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-green-300 font-semibold uppercase tracking-wide">
                            Bidding Active
                        </span>
                    </div>
                </div>
            )}

            {/* No Bid State */}
            {auctionState.currentBid === 0 && auctionState.currentAuctionStatus === 'Pending' && (
                <div className="mt-4 text-center">
                    <p className="text-sm text-neutral-500 animate-fade-pulse">
                        Waiting for first bid...
                    </p>
                </div>
            )}
        </div>
    );
};

export default LiveBiddingPanel;
