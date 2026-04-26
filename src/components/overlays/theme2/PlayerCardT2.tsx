'use client';

import React, { useState, useEffect } from 'react';
import { Player, Tournament, AuctionState } from '@/types';

interface PlayerCardT2Props {
    currentPlayer: Player | undefined;
    tournament: Tournament | null;
    auctionState: AuctionState;
    size?: 'small' | 'medium' | 'large';
    position?: 'top' | 'center' | 'bottom';
}

const formatCompact = (amount: number): string => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return `${amount}`;
};

export const sizeConfig = {
    small: {
        card: { width: 420, height: 210 },
        photoWidth: 190,
        panelWidth: 230,
        panelPaddingLeft: 14,
        nameLeftOffset: 20,
        diagonal: { left: 160, width: 88, height: 320 },
        jerseyFs: 57,
        nameFontSize: 26,
        typeFontSize: 20,
        priceLabelFs: 24,
        priceValueFs: 40,
        statFontSize: 11,
        valFontSize: 14,
    },
    medium: {
        card: { width: 568, height: 284 },
        photoWidth: 257,
        panelWidth: 311,
        panelPaddingLeft: 19,
        nameLeftOffset: 27,
        diagonal: { left: 216, width: 119, height: 432 },
        jerseyFs: 77,
        nameFontSize: 35,
        typeFontSize: 27,
        priceLabelFs: 32,
        priceValueFs: 54,
        statFontSize: 15,
        valFontSize: 19,
    },
    large: {
        card: { width: 480, height: 250 },
        photoWidth: 255,
        panelWidth: 225,
        panelPaddingLeft: 28,
        nameLeftOffset: 24,
        diagonal: { left: 136, width: 100, height: 400 },
        jerseyFs: 46,
        nameFontSize: 22,
        typeFontSize: 14,
        priceLabelFs: 12,
        priceValueFs: 32,
        statFontSize: 11,
        valFontSize: 14,
    },
};

const PlayerCardT2: React.FC<PlayerCardT2Props> = ({
    currentPlayer,
    tournament,
    auctionState,
    size = 'medium',
    position = 'top',
}) => {
    const [showSoldAnimation, setShowSoldAnimation] = useState<boolean>(false);
    const [previousStatus, setPreviousStatus] = useState<string>('');

    const isBiddingLive = tournament?.status === 'Live' && currentPlayer;

    useEffect(() => {
        if (auctionState.currentAuctionStatus === 'Sold' && previousStatus !== 'Sold') {
            setShowSoldAnimation(true);
            setTimeout(() => setShowSoldAnimation(false), 2000);
        }
        setPreviousStatus(auctionState.currentAuctionStatus);
    }, [auctionState.currentAuctionStatus, previousStatus]);

    if (!currentPlayer || !isBiddingLive) return null;

    const positionClass = {
        top:    'justify-start pt-8',
        center: 'justify-center',
        bottom: 'justify-end pb-8',
    };

    const cfg = sizeConfig[size];
    const photoUrl = currentPlayer.photoURL || tournament?.logoURL || '';
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
                        borderRadius: 5,
                        overflow: 'hidden',
                        fontFamily: "'Varela Round', sans-serif",
                        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                    }}>
                        {/* Player photo */}
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: cfg.photoWidth,
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

                        {/* Right panel — flex column layout */}
                        <div style={{
                            zIndex: 10,
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: cfg.panelWidth,
                            height: cfg.card.height,
                            backgroundColor: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            paddingTop: 8,
                            paddingBottom: 8,
                            paddingLeft: cfg.panelPaddingLeft,
                            paddingRight: 10,
                            boxSizing: 'border-box',
                        }}>
                            {/* Row 1: Player No + Base/Bid price */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
                                {currentPlayer.playerNo ? (
                                    <div style={{ color: '#E7C403', fontSize: cfg.jerseyFs, fontWeight: 'bold', lineHeight: 1, flexShrink: 0, display: 'inline-block', transform: 'scaleY(1.3)', transformOrigin: 'top left' }}>
                                        {currentPlayer.playerNo}
                                    </div>
                                ) : <div />}
                                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                    <div style={{ fontSize: cfg.priceLabelFs, color: 'rgba(0,0,0,0.4)', lineHeight: 1.2 }}>
                                        Base
                                    </div>
                                    <div style={{ color: '#E7C403', fontSize: cfg.priceValueFs, fontWeight: 700, lineHeight: 1 }}>
                                        {formatCompact(tournament?.basePricePerPlayer ?? 0)}
                                    </div>
                                </div>
                            </div>

                            {/* Spacer — pushes name/type to bottom */}
                            <div style={{ flex: 1 }} />

                            {/* Player type / position */}
                            {(currentPlayer.playerClass || currentPlayer.position) && (
                                <div style={{
                                    marginBottom: 2,
                                    position: 'relative',
                                    left: -cfg.nameLeftOffset,
                                    fontSize: cfg.typeFontSize,
                                    color: 'rgba(0,0,0,0.45)',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}>
                                    {currentPlayer.playerClass || currentPlayer.position}
                                </div>
                            )}

                            {/* Player name — full width, wraps if needed */}
                            <div style={{
                                marginBottom: 6,
                                position: 'relative',
                                left: -cfg.nameLeftOffset,
                                fontSize: cfg.nameFontSize,
                                fontWeight: 'bold',
                                color: '#111',
                                textTransform: 'uppercase',
                                lineHeight: 1.15,
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                            }}>
                                {currentPlayer.name}
                            </div>

                            {/* Stats row at bottom */}
                            {statKeys.length > 0 && (
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    {statKeys.slice(0, 2).map((key) => (
                                        <div key={key} style={{ textAlign: 'center', fontSize: cfg.statFontSize, color: 'rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
                                            {key}<br />
                                            <span style={{ color: '#111', fontSize: cfg.valFontSize, fontWeight: 600 }}>{stats[key]}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sold flash overlay */}
                        {showSoldAnimation && (
                            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(34,197,94,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                                <div style={{ fontSize: cfg.jerseyFs * 1.2, fontWeight: 'bold', color: '#22c55e', textShadow: '0 0 20px rgba(34,197,94,1)', letterSpacing: 4 }}>
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

export default PlayerCardT2;
