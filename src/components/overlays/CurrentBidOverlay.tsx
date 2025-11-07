'use client';

import React, { useState, useEffect } from 'react';
import { AuctionState, Player } from '@/types';

interface CurrentBidOverlayProps {
    auctionState: AuctionState;
    currentPlayer: Player | undefined;
    size?: 'small' | 'medium' | 'large';
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const CurrentBidOverlay: React.FC<CurrentBidOverlayProps> = ({
    auctionState,
    currentPlayer,
    size = 'medium',
    position = 'top-right'
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
            label: 'text-sm',
            amount: 'text-4xl',
            padding: 'p-3'
        },
        medium: {
            label: 'text-xl',
            amount: 'text-6xl',
            padding: 'p-4'
        },
        large: {
            label: 'text-2xl',
            amount: 'text-8xl',
            padding: 'p-6'
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

    return (
        <div className={`fixed ${positionConfig[position]}`}>
            <div className={`${config.padding} rounded-lg border-2 border-cyan-500 text-center`}>
                <p className={`${config.label} text-white tracking-wider font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>CURRENT BID</p>
                <p
                    key={bidPulseKey}
                    className={`${config.amount} font-bold ${auctionState.currentBid > 0 ? 'text-green-400 animate-bid-pulse drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]' : 'text-neutral-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]'}`}
                >
                    {formatCurrency(auctionState.currentBid)}
                </p>
            </div>
        </div>
    );
};

export default CurrentBidOverlay;
