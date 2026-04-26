'use client';

import React from 'react';
import { AuctionState, Team, Tournament, Player } from '@/types';

interface CurrentBidT2Props {
    auctionState: AuctionState;
    teams: Team[];
    tournament: Tournament | null;
    currentPlayer: Player | undefined;
    size: 'small' | 'medium';
    orientation: 'horizontal' | 'vertical';
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
}) => {
    const isBiddingLive = tournament?.status === 'Live' && currentPlayer;
    if (!currentPlayer || !isBiddingLive) return null;

    const hasBid = auctionState.currentBid > 0;
    const cfg = bidCardConfig[size];
    const dims = orientation === 'horizontal' ? cfg.horizontal : cfg.vertical;
    const teamName = hasBid && auctionState.winningTeamId
        ? teams.find(t => t._id === auctionState.winningTeamId)?.name ?? ''
        : '';
    const displayAmount = (hasBid ? auctionState.currentBid : (tournament?.basePricePerPlayer ?? 0)).toLocaleString();
    const label = hasBid ? 'Current Bid' : 'Base Price';

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');`}</style>
            <div
                className="animate-slide-in-top"
                style={{
                    position: 'relative',
                    width: dims.width,
                    height: dims.height,
                    backgroundColor: '#ffffff',
                    borderRadius: 5,
                    overflow: 'hidden',
                    fontFamily: "'Varela Round', sans-serif",
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'row',
                }}
            >
                {/* Gold left strip */}
                <div style={{ width: cfg.strip, flexShrink: 0, backgroundColor: '#E7C403' }} />

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
                        <span style={{
                            fontSize: cfg.labelFs,
                            color: 'rgba(0,0,0,0.7)',
                            textTransform: 'uppercase',
                            letterSpacing: 1.5,
                            whiteSpace: 'nowrap',
                        }}>
                            {label}
                        </span>

                        <span style={{
                            fontSize: cfg.amountFs,
                            fontWeight: 700,
                            color: 'var(--brand-secondary)',
                            lineHeight: 1,
                            flex: 1,
                            textAlign: 'center',
                        }}>
                            {displayAmount}
                        </span>

                        {teamName ? (
                            <span style={{
                                fontSize: cfg.teamFs,
                                color: 'rgba(0,0,0,0.45)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: orientation === 'horizontal' ? 140 : undefined,
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
                        <span style={{
                            fontSize: cfg.labelFs,
                            color: 'rgba(0, 0, 0, 1)',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: 1.5,
                            textAlign: 'center',
                        }}>
                            {label}
                        </span>

                        <span style={{
                            fontSize: cfg.amountFs,
                            fontWeight: 700,
                            color: 'var(--brand-secondary)',
                            lineHeight: 1,
                            textAlign: 'center',
                        }}>
                            {displayAmount}
                        </span>

                        {teamName ? (
                            <>
                                <div style={{
                                    width: '60%',
                                    height: 1,
                                    backgroundColor: '#E7C403',
                                    opacity: 0.5,
                                    marginTop: 4,
                                }} />
                                <span style={{
                                    fontSize: cfg.teamFs,
                                    color: 'rgba(0,0,0,0.45)',
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
