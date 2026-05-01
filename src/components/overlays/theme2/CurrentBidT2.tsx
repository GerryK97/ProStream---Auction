'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AuctionState, Team, Tournament, Player } from '@/types';

interface CurrentBidT2Props {
    auctionState: AuctionState;
    teams: Team[];
    tournament: Tournament | null;
    currentPlayer: Player | undefined;
    size: 'small' | 'medium';
    orientation: 'horizontal' | 'vertical';
    height?: number;
}

const formatCompact = (amount: number): string => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return `${amount}`;
};

const bidCardConfig = {
    small: {
        horizontal: { width: 300, height: 80 },
        vertical:   { width: 240, height: 210 },
        labelFs: 15,
        amountFs: 36,
        teamFs: 13,
        strip: 5,
    },
    medium: {
        horizontal: { width: 300, height: 80 },
        vertical:   { width: 240, height: 284 },
        labelFs: 15,
        amountFs: 36,
        teamFs: 13,
        strip: 5,
    },
};

const CurrentBidT2: React.FC<CurrentBidT2Props> = ({
    auctionState,
    teams,
    tournament,
    currentPlayer,
    size,
    orientation,
    height,
}) => {
    const isBiddingLive = tournament?.status === 'Live' && currentPlayer;
    const isBidding = auctionState.currentAuctionStatus === 'Bidding';

    const [bidPopping, setBidPopping] = useState(false);
    const prevBidRef = useRef(auctionState.currentBid);

    useEffect(() => {
        if (auctionState.currentBid !== prevBidRef.current && auctionState.currentBid > 0) {
            prevBidRef.current = auctionState.currentBid;
            setBidPopping(true);
            const t = setTimeout(() => setBidPopping(false), 350);
            return () => clearTimeout(t);
        }
        prevBidRef.current = auctionState.currentBid;
    }, [auctionState.currentBid]);

    if (!currentPlayer || !isBiddingLive) return null;

    const hasBid = auctionState.currentBid > 0;
    const cfg = bidCardConfig[size];
    const dims = orientation === 'horizontal'
        ? cfg.horizontal
        : { ...cfg.vertical, height: height ?? cfg.vertical.height };
    const teamName = hasBid && auctionState.winningTeamId
        ? teams.find(t => t._id === auctionState.winningTeamId)?.name ?? ''
        : '';
    const displayAmount = (hasBid ? auctionState.currentBid : (tournament?.basePricePerPlayer ?? 0)).toLocaleString();
    const label = hasBid ? 'Current Bid' : 'Base Price';

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');
                @keyframes t2BidGlow {
                    0%, 100% { box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 0 0 1.5px var(--t2-accent); }
                    50%       { box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 0 0 2.5px var(--t2-accent), 0 0 18px rgba(var(--t2-accent-rgb), 0.45); }
                }
                @keyframes t2BidPop {
                    0%   { transform: scale(1); }
                    40%  { transform: scale(1.12); }
                    100% { transform: scale(1); }
                }
                @keyframes t2LiveDot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%      { opacity: 0.35; transform: scale(0.6); }
                }
                .t2bid-glow   { animation: t2BidGlow 1.4s ease-in-out infinite; }
                .t2bid-pop    { animation: t2BidPop 0.35s cubic-bezier(0.22,1,0.36,1) forwards; }
                .t2bid-dot    { animation: t2LiveDot 1s ease-in-out infinite; }
            `}</style>
            <div
                className={`animate-slide-in-top${isBidding ? ' t2bid-glow' : ''}`}
                style={{
                    position: 'relative',
                    width: dims.width,
                    height: dims.height,
                    backgroundColor: 'var(--t2-bg-card)',
                    borderRadius: 5,
                    overflow: 'hidden',
                    fontFamily: "'Varela Round', sans-serif",
                    boxShadow: isBidding ? undefined : '0 4px 16px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'row',
                }}
            >
                {/* Accent left strip */}
                <div style={{ width: cfg.strip, flexShrink: 0, backgroundColor: 'var(--t2-accent)' }} />

                {orientation === 'horizontal' ? (
                    /* Horizontal layout — single row */
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 14,
                        paddingRight: 14,
                        gap: 12,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            {isBidding && (
                                <div className="t2bid-dot" style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    backgroundColor: '#22c55e', flexShrink: 0,
                                }} />
                            )}
                            <span style={{
                                fontSize: cfg.labelFs,
                                color: 'rgba(var(--t2-text-primary-rgb), 0.7)',
                                textTransform: 'uppercase',
                                letterSpacing: 1.5,
                                whiteSpace: 'nowrap',
                            }}>
                                {label}
                            </span>
                        </div>

                        <span
                            className={bidPopping ? 't2bid-pop' : ''}
                            style={{
                                fontSize: cfg.amountFs,
                                fontWeight: 700,
                                color: isBidding ? 'var(--t2-accent)' : 'var(--brand-secondary)',
                                lineHeight: 1,
                                flex: 1,
                                textAlign: 'center',
                                transition: 'color 0.3s ease',
                            }}
                        >
                            {displayAmount}
                        </span>

                        {teamName ? (
                            <span style={{
                                fontSize: cfg.teamFs,
                                color: 'rgba(var(--t2-text-primary-rgb), 0.45)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 140,
                                textAlign: 'right',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                            }}>
                                {teamName}
                            </span>
                        ) : null}
                    </div>
                ) : (
                    /* Vertical layout — flex column centered */
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px 12px',
                        gap: 6,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isBidding && (
                                <div className="t2bid-dot" style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    backgroundColor: '#22c55e', flexShrink: 0,
                                }} />
                            )}
                            <span style={{
                                fontSize: cfg.labelFs,
                                color: 'var(--t2-text-primary)',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: 1.5,
                                textAlign: 'center',
                            }}>
                                {label}
                            </span>
                        </div>

                        <span
                            className={bidPopping ? 't2bid-pop' : ''}
                            style={{
                                fontSize: cfg.amountFs,
                                fontWeight: 700,
                                color: isBidding ? 'var(--t2-accent)' : 'var(--brand-secondary)',
                                lineHeight: 1,
                                textAlign: 'center',
                                transition: 'color 0.3s ease',
                            }}
                        >
                            {displayAmount}
                        </span>

                        {teamName ? (
                            <>
                                <div style={{
                                    width: '60%',
                                    height: 1,
                                    backgroundColor: 'var(--t2-accent)',
                                    opacity: 0.5,
                                    marginTop: 4,
                                }} />
                                <span style={{
                                    fontSize: cfg.teamFs,
                                    color: 'rgba(var(--t2-text-primary-rgb), 0.45)',
                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: dims.width - cfg.strip - 24,
                                }}>
                                    {teamName}
                                </span>
                            </>
                        ) : null}
                    </div>
                )}
            </div>
        </>
    );
};

export default CurrentBidT2;
