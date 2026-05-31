'use client';

import React, { useState, useEffect } from 'react';
import { Player, Tournament, AuctionState, Team } from '@/types';

interface PlayerCardT1Props {
    currentPlayer: Player | undefined;
    tournament: Tournament | null;
    auctionState: AuctionState;
    teams?: Team[];
    size?: 'small' | 'medium' | 'large';
    position?: 'top' | 'center' | 'bottom';
}

const PlayerCardT1: React.FC<PlayerCardT1Props> = ({
    currentPlayer,
    tournament,
    auctionState,
    teams = [],
    size = 'medium',
}) => {
    const [previousBid, setPreviousBid] = useState<number>(0);
    const [bidPulseKey, setBidPulseKey] = useState<number>(0);
    const [mounted, setMounted] = useState(false);
    const [animClass, setAnimClass] = useState('t1-card-enter');

    const shouldShow = !!(tournament?.status === 'Live'
        && currentPlayer
        && auctionState.currentAuctionStatus !== 'Sold');

    useEffect(() => {
        if (shouldShow) {
            setMounted(true);
            setAnimClass('t1-card-enter');
        } else if (mounted) {
            setAnimClass('t1-card-exit');
            const t = setTimeout(() => setMounted(false), 450);
            return () => clearTimeout(t);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldShow]);

    useEffect(() => {
        if (auctionState.currentBid !== previousBid && auctionState.currentBid > 0) {
            setBidPulseKey(prev => prev + 1);
            setPreviousBid(auctionState.currentBid);
        }
    }, [auctionState.currentBid, previousBid]);

    if (!mounted || !currentPlayer) return null;

    const statFields = tournament?.playerProfileFields?.statFields?.slice(0, 3) ?? [];

    const winningTeam = teams.find(t => String(t._id) === String(auctionState.winningTeamId));
    const teamInitials = winningTeam
        ? (winningTeam.shortCode || winningTeam.name).slice(0, 2).toUpperCase()
        : null;

    const playerNameParts = currentPlayer.name.split(' ');
    const watermarkLine1 = playerNameParts[0] ?? '';
    const watermarkLine2 = playerNameParts.slice(1).join(' ') || '';

    return (
        <>
            <style>{`
                @keyframes t1CardBidPulse {
                    0%   { transform: scale(1); }
                    40%  { transform: scale(1.06); }
                    100% { transform: scale(1); }
                }
                @keyframes t1CardEnter {
                    0%   { opacity: 0; transform: translateY(48px) scale(0.94); }
                    100% { opacity: 1; transform: translateY(0)    scale(1); }
                }
                @keyframes t1CardExit {
                    0%   { opacity: 1; transform: translateY(0)    scale(1); }
                    100% { opacity: 0; transform: translateY(48px) scale(0.94); }
                }
                .t1-bid-pulse  { animation: t1CardBidPulse 0.35s ease-out forwards; }
                .t1-card-enter { animation: t1CardEnter 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
                .t1-card-exit  { animation: t1CardExit  0.4s cubic-bezier(0.4,0,1,1)    forwards; }
            `}</style>

            {/* Animated wrapper */}
            <div className={animClass} style={{ willChange: 'transform, opacity' }}>

            {/* Outer card */}
            <div style={{
                width: 380,
                borderRadius: 24,
                border: '1px solid #e1e1e1',
                background: '#f9f9f9',
                boxSizing: 'border-box',
            }}>
                {/* Inner card */}
                <div style={{
                    borderRadius: 24,
                    background: 'white',
                    padding: 16,
                    outline: '1px solid #e1e1e1',
                }}>
                    {/* Image section */}
                    <div style={{ position: 'relative', overflow: 'hidden', paddingBottom: 12 }}>
                        {/* SVG goo filter */}
                        <svg style={{ position: 'absolute', width: 0, height: 0, visibility: 'hidden' }}>
                            <defs>
                                <filter id="t1-rounded-sm">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
                                    <feColorMatrix in="blur" mode="matrix"
                                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                                        result="goo" />
                                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                                </filter>
                            </defs>
                        </svg>

                        {/* Clip container with goo filter */}
                        <div style={{ overflow: 'hidden', filter: 'url(#t1-rounded-sm)' }}>
                            {/* Gradient background with clip-path */}
                            <div style={{
                                position: 'relative',
                                height: 400,
                                border: '1px solid #e1e1e1',
                                background: 'linear-gradient(to bottom, var(--t1card-gradient-from), var(--t1card-gradient-to))',
                                clipPath: 'polygon(0 0, 100% 0, 100% 95%, 50% 100%, 0 95%)',
                                overflow: 'hidden',
                            }}>
                                {/* Watermark text */}
                                <div style={{
                                    pointerEvents: 'none',
                                    position: 'absolute',
                                    left: '50%',
                                    top: 40,
                                    transform: 'translateX(-50%)',
                                    zIndex: 0,
                                    textAlign: 'center',
                                    fontSize: 96,
                                    lineHeight: '0.8em',
                                    fontWeight: 900,
                                    fontStyle: 'italic',
                                    letterSpacing: '-0.04em',
                                    textTransform: 'uppercase',
                                    color: 'white',
                                    opacity: 0.4,
                                    mixBlendMode: 'overlay',
                                    whiteSpace: 'nowrap',
                                }}>
                                    <div>{watermarkLine1}</div>
                                    {watermarkLine2 && <div>{watermarkLine2}</div>}
                                </div>

                                {/* Player photo — circular */}
                                <div style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: 60,
                                    transform: 'translateX(-50%)',
                                    width: 320,
                                    height: 320,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '4px solid rgba(255,255,255,0.6)',
                                    zIndex: 1,
                                    flexShrink: 0,
                                }}>
                                    <img
                                        src={currentPlayer.photoURL || tournament?.logoURL || ''}
                                        alt={currentPlayer.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Jersey number badge */}
                        {currentPlayer.playerNo && (
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 48,
                                height: 48,
                                borderRadius: 16,
                                background: 'linear-gradient(to bottom, var(--t1card-gradient-from), var(--t1card-gradient-to))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 24,
                                fontWeight: 900,
                                color: 'white',
                                letterSpacing: '-0.04em',
                                zIndex: 10,
                            }}>
                                {currentPlayer.playerNo}
                            </div>
                        )}

                        {/* Top-left circle — winning team logo */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: 76,
                            height: 76,
                            borderRadius: '50%',
                            border: '1px solid #e1e1e1',
                            background: 'white',
                            transform: 'translate(-50%, -50%)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'flex-end',
                            overflow: 'hidden',
                            zIndex: 10,
                        }}>
                            {winningTeam?.logoURL ? (
                                <img
                                    src={winningTeam.logoURL}
                                    alt={winningTeam.name}
                                    style={{
                                        position: 'absolute',
                                        bottom: 8,
                                        right: 8,
                                        width: 28,
                                        height: 28,
                                        objectFit: 'contain',
                                    }}
                                />
                            ) : teamInitials ? (
                                <span style={{
                                    position: 'absolute',
                                    bottom: 8,
                                    right: 8,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: 'var(--t1card-gradient-from)',
                                }}>
                                    {teamInitials}
                                </span>
                            ) : null}
                        </div>

                        {/* Top-right circle — tournament logo */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 76,
                            height: 76,
                            borderRadius: '50%',
                            border: '1px solid #e1e1e1',
                            background: 'white',
                            transform: 'translate(50%, -50%)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'flex-start',
                            overflow: 'hidden',
                            zIndex: 10,
                        }}>
                            {tournament?.logoURL ? (
                                <img
                                    src={tournament.logoURL}
                                    alt={tournament.name ?? ''}
                                    style={{
                                        position: 'absolute',
                                        bottom: 8,
                                        left: 8,
                                        width: 28,
                                        height: 28,
                                        objectFit: 'contain',
                                        borderRadius: '50%',
                                    }}
                                />
                            ) : (
                                <span style={{
                                    position: 'absolute',
                                    bottom: 8,
                                    left: 8,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: 'var(--t1card-gradient-from)',
                                }}>
                                    {tournament?.name?.slice(0, 2).toUpperCase() ?? 'PS'}
                                </span>
                            )}
                        </div>

                    </div>

                    {/* Player name + position */}
                    <div style={{
                        paddingTop: 12,
                        paddingBottom: 4,
                        textAlign: 'center',
                        color: '#1e293b',
                    }}>
                        <div style={{
                            fontSize: 22,
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            lineHeight: 1.1,
                        }}>
                            {currentPlayer.name}
                        </div>
                        {currentPlayer.position && (
                            <div style={{ fontSize: 14, marginTop: 2, color: '#64748b' }}>
                                {currentPlayer.position}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats row */}
                {statFields.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${statFields.length}, 1fr)`,
                        padding: '20px 0',
                        color: '#1e293b',
                    }}>
                        {statFields.map((field, i) => (
                            <div
                                key={field.key}
                                style={{
                                    textAlign: 'center',
                                    paddingLeft: 28,
                                    paddingRight: 28,
                                    borderLeft: i > 0 ? '1px solid #e1e1e1' : 'none',
                                }}
                            >
                                <div
                                    key={bidPulseKey}
                                    className={i === 0 ? 't1-bid-pulse' : undefined}
                                    style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}
                                >
                                    {currentPlayer.stats?.[field.key] ?? '—'}
                                </div>
                                <div style={{
                                    fontSize: 11,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    color: '#94a3b8',
                                }}>
                                    {field.label}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            </div>{/* end animated wrapper */}
        </>
    );
};

export default PlayerCardT1;
