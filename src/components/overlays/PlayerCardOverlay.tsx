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

const formatCompact = (amount: number): string => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return `${amount}`;
};

const sizeConfig = {
    small: { card: { width: 280, height: 160 }, photo: { right: 120, width: 540 }, diagonal: { left: 80, width: 60, height: 240 }, name: { top: 34, right: 82, fontSize: 13 }, dorsal: { top: 26, right: 4, fontSize: 38 }, stats: { top: 94 }, el1Right: 150, el2Right: 98, el3Right: 46, statFontSize: 10, valFontSize: 12 },
    medium: { card: { width: 380, height: 210 }, photo: { right: 170, width: 740 }, diagonal: { left: 108, width: 80, height: 320 }, name: { top: 46, right: 112, fontSize: 17 }, dorsal: { top: 36, right: 5, fontSize: 50 }, stats: { top: 126 }, el1Right: 202, el2Right: 133, el3Right: 62, statFontSize: 12, valFontSize: 15 },
    large: { card: { width: 480, height: 250 }, photo: { right: 220, width: 940 }, diagonal: { left: 136, width: 100, height: 400 }, name: { top: 56, right: 142, fontSize: 21 }, dorsal: { top: 44, right: 6, fontSize: 62 }, stats: { top: 156 }, el1Right: 256, el2Right: 168, el3Right: 78, statFontSize: 14, valFontSize: 18 },
};

const PlayerCardOverlay: React.FC<PlayerCardOverlayProps> = ({
    currentPlayer,
    tournament,
    auctionState,
    size = 'medium',
    position = 'top',
}) => {
    const [previousBid, setPreviousBid] = useState<number>(0);
    const [bidPulseKey, setBidPulseKey] = useState<number>(0);
    const [showSoldAnimation, setShowSoldAnimation] = useState<boolean>(false);
    const [previousStatus, setPreviousStatus] = useState<string>('');

    const isBiddingLive = tournament?.status === 'Live' && currentPlayer;

    useEffect(() => {
        if (auctionState.currentBid !== previousBid && auctionState.currentBid > 0) {
            setBidPulseKey(prev => prev + 1);
            setPreviousBid(auctionState.currentBid);
        }
    }, [auctionState.currentBid, previousBid]);

    useEffect(() => {
        if (auctionState.currentAuctionStatus === 'Sold' && previousStatus !== 'Sold') {
            setShowSoldAnimation(true);
            setTimeout(() => setShowSoldAnimation(false), 2000);
        }
        setPreviousStatus(auctionState.currentAuctionStatus);
    }, [auctionState.currentAuctionStatus, previousStatus]);

    if (!currentPlayer || !isBiddingLive) return null;

    const positionClass = {
        top: 'justify-start pt-8',
        center: 'justify-center',
        bottom: 'justify-end pb-8',
    };

    const cfg = sizeConfig[size];
    const photoUrl = currentPlayer.photoURL || tournament?.logoURL || '';
    const dorsalText = currentPlayer.playerNo ? `#${currentPlayer.playerNo}` : (auctionState.currentBid > 0 ? formatCompact(auctionState.currentBid) : formatCompact(tournament?.basePricePerPlayer ?? 0));
    const bidColor = auctionState.currentBid > 0 ? '#22c55e' : '#E7C403';

    const stats = currentPlayer.stats ?? {};
    const statKeys = Object.keys(stats).slice(0, 2);

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');`}</style>
            <div className={`w-full h-full flex ${positionClass[position]} items-center px-8`}>
                <div className={`transition-all duration-500 ease-in-out ${isBiddingLive ? 'animate-slide-in-top' : 'opacity-0'}`}>
                    <div style={{
                        position: 'relative',
                        backgroundColor: 'white',
                        height: cfg.card.height,
                        width: cfg.card.width,
                        borderRadius: 6,
                        overflow: 'hidden',
                        fontFamily: "'Varela Round', sans-serif",
                        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                    }}>
                        {/* Player photo */}
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: cfg.card.width - cfg.photo.right,
                            height: cfg.card.height,
                            backgroundImage: `url("${photoUrl}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center top',
                        }} />

                        {/* Diagonal white separator */}
                        <div style={{
                            position: 'absolute',
                            width: cfg.diagonal.width,
                            height: cfg.diagonal.height,
                            backgroundColor: 'white',
                            left: cfg.diagonal.left,
                            transform: 'rotate(15deg)',
                            top: -40,
                        }} />

                        {/* Player name */}
                        <div style={{
                            zIndex: 10,
                            width: 120,
                            position: 'absolute',
                            top: cfg.name.top,
                            right: cfg.name.right,
                            fontWeight: 'bold',
                            fontSize: cfg.name.fontSize,
                            lineHeight: 1.2,
                            color: '#111',
                            textTransform: 'uppercase',
                        }}>
                            {currentPlayer.name}
                        </div>

                        {/* Player class / position badge */}
                        {(currentPlayer.playerClass || currentPlayer.position) && (
                            <div style={{
                                zIndex: 10,
                                position: 'absolute',
                                top: cfg.name.top + cfg.name.fontSize + 10,
                                right: cfg.name.right,
                                fontSize: cfg.statFontSize,
                                color: 'rgba(0,0,0,0.45)',
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                            }}>
                                {currentPlayer.playerClass || currentPlayer.position}
                            </div>
                        )}

                        {/* Dorsal / jersey number */}
                        <div style={{
                            zIndex: 10,
                            position: 'absolute',
                            top: cfg.dorsal.top,
                            right: cfg.dorsal.right,
                            width: 100,
                            color: '#E7C403',
                            fontSize: cfg.dorsal.fontSize,
                            fontWeight: 'bold',
                            lineHeight: 1,
                            textAlign: 'right',
                        }}>
                            {dorsalText}
                        </div>

                        {/* Bottom stats row */}
                        {statKeys.length > 0 && (
                            <>
                                <div style={{ zIndex: 10, position: 'absolute', top: cfg.stats.top, right: cfg.el1Right, fontSize: cfg.statFontSize, color: 'rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
                                    {statKeys[0]}<br />
                                    <span style={{ color: '#111', fontSize: cfg.valFontSize, fontWeight: 600 }}>{stats[statKeys[0]]}</span>
                                </div>
                                {statKeys[1] && (
                                    <div style={{ zIndex: 10, position: 'absolute', top: cfg.stats.top, right: cfg.el2Right, fontSize: cfg.statFontSize, color: 'rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
                                        {statKeys[1]}<br />
                                        <span style={{ color: '#111', fontSize: cfg.valFontSize, fontWeight: 600 }}>{stats[statKeys[1]]}</span>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Current bid stat */}
                        <div key={bidPulseKey} style={{ zIndex: 10, position: 'absolute', top: cfg.stats.top, right: cfg.el3Right, fontSize: cfg.statFontSize, color: 'rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
                            {auctionState.currentBid > 0 ? 'Bid' : 'Base'}<br />
                            <span style={{ color: bidColor, fontSize: cfg.valFontSize, fontWeight: 700 }}>
                                {auctionState.currentBid > 0
                                    ? formatCompact(auctionState.currentBid)
                                    : formatCompact(tournament?.basePricePerPlayer ?? 0)}
                            </span>
                        </div>

                        {/* Sold overlay */}
                        {showSoldAnimation && (
                            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(34,197,94,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                                <div style={{ fontSize: cfg.dorsal.fontSize * 1.2, fontWeight: 'bold', color: '#22c55e', textShadow: '0 0 20px rgba(34,197,94,1)', letterSpacing: 4 }}>
                                    SOLD!
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PlayerCardOverlay;
