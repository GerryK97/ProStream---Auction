'use client';

import React, { useState, useEffect } from 'react';
import { Player, Tournament, AuctionState } from '@/types';

interface PlayerCardOverlayProps {
    currentPlayer: Player | undefined;
    tournament: Tournament | null;
    auctionState: AuctionState;
    size?: 'small' | 'medium' | 'large';
    position?: 'top' | 'center' | 'bottom';
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const PlayerCardOverlay: React.FC<PlayerCardOverlayProps> = ({
    currentPlayer,
    tournament,
    auctionState,
    size = 'medium',
    position = 'top'
}) => {
    const [previousBid, setPreviousBid] = useState<number>(0);
    const [bidPulseKey, setBidPulseKey] = useState<number>(0);
    const [showSoldAnimation, setShowSoldAnimation] = useState<boolean>(false);
    const [previousStatus, setPreviousStatus] = useState<string>('');

    const isBiddingLive = tournament?.status === 'Live' && currentPlayer;

    // Detect bid changes and trigger pulse animation
    useEffect(() => {
        if (auctionState.currentBid !== previousBid && auctionState.currentBid > 0) {
            setBidPulseKey(prev => prev + 1);
            setPreviousBid(auctionState.currentBid);
        }
    }, [auctionState.currentBid, previousBid]);

    // Detect sold status and trigger celebration animation
    useEffect(() => {
        if (auctionState.currentAuctionStatus === 'Sold' && previousStatus !== 'Sold') {
            setShowSoldAnimation(true);
            setTimeout(() => setShowSoldAnimation(false), 2000);
        }
        setPreviousStatus(auctionState.currentAuctionStatus);
    }, [auctionState.currentAuctionStatus, previousStatus]);

    // Hide when no player selected
    if (!currentPlayer || !isBiddingLive) {
        return null;
    }

    // Size configurations
    const sizeConfig = {
        small: {
            container: 'p-4 gap-4',
            image: 'w-20 h-20',
            title: 'text-base',
            name: 'text-3xl',
            stat: 'text-xs',
            statValue: 'text-sm',
            bidLabel: 'text-sm',
            bidAmount: 'text-4xl',
            soldText: 'text-5xl'
        },
        medium: {
            container: 'p-6 gap-6',
            image: 'w-32 h-32',
            title: 'text-xl',
            name: 'text-5xl',
            stat: 'text-sm',
            statValue: 'text-lg',
            bidLabel: 'text-xl',
            bidAmount: 'text-6xl',
            soldText: 'text-8xl'
        },
        large: {
            container: 'p-8 gap-8',
            image: 'w-40 h-40',
            title: 'text-2xl',
            name: 'text-6xl',
            stat: 'text-base',
            statValue: 'text-xl',
            bidLabel: 'text-2xl',
            bidAmount: 'text-7xl',
            soldText: 'text-9xl'
        }
    };

    const config = sizeConfig[size];

    // Position configurations
    const positionClass = {
        top: 'justify-start pt-8',
        center: 'justify-center',
        bottom: 'justify-end pb-8'
    };

    return (
        <div className={`w-full h-full flex ${positionClass[position]} items-center px-8`}>
            <div className={`transition-all duration-500 ease-in-out ${isBiddingLive ? 'animate-slide-in-top' : 'opacity-0'}`}>
                <div className={`${config.container} rounded-lg flex items-center border-2 border-cyan-500 relative ${showSoldAnimation ? 'animate-sold-celebration' : ''}`}>
                    {/* Sold Overlay */}
                    {showSoldAnimation && (
                        <div className="absolute inset-0 bg-green-500/20 animate-sold-flash rounded-lg flex items-center justify-center">
                            <div className={`${config.soldText} font-bold text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,1)]`}>SOLD!</div>
                        </div>
                    )}

                    <img
                        src={currentPlayer.photoURL || tournament?.logoURL || ''}
                        alt={currentPlayer.name}
                        className={`${config.image} rounded-md border-4 border-cyan-500 shadow-lg ${!currentPlayer.photoURL && tournament?.logoURL ? 'object-contain' : 'object-cover'}`}
                        style={!currentPlayer.photoURL && tournament?.logoURL ? { background: '#0d1220', padding: 4 } : undefined}
                    />
                    <div>
                        <p className={`${config.title} text-cyan-400 font-semibold tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>ON THE BLOCK</p>
                        <h2 className={`${config.name} font-extrabold tracking-tight text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]`}>{currentPlayer.name}</h2>
                        <div className="flex gap-6 mt-2">
                            <div>
                                <p className={`${config.stat} text-neutral-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>Matches</p>
                                <p className={`${config.statValue} font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>{(currentPlayer as any).stats?.matchesPlayed}</p>
                            </div>
                            <div>
                                <p className={`${config.stat} text-neutral-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>Score</p>
                                <p className={`${config.statValue} font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>{(currentPlayer as any).stats?.totalScore?.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className={`${config.stat} text-neutral-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>Wickets</p>
                                <p className={`${config.statValue} font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>{(currentPlayer as any).stats?.totalWickets}</p>
                            </div>
                        </div>
                    </div>
                    <div className="ml-auto text-right">
                        <p className={`${config.bidLabel} text-white tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>CURRENT BID</p>
                        <p
                            key={bidPulseKey}
                            className={`${config.bidAmount} font-bold ${auctionState.currentBid > 0 ? 'text-green-400 animate-bid-pulse drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]' : 'text-neutral-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]'}`}
                        >
                            {formatCurrency(auctionState.currentBid)}
                        </p>
                        {auctionState.currentBid === 0 && tournament && (
                            <p className="text-sm text-neutral-300 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                Base: {formatCurrency(tournament.basePricePerPlayer)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerCardOverlay;
