'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Team, AuctionState } from '@/types';

type OverlayPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface LeadingBidsOverlayProps {
    auctionState: AuctionState;
    teams: Team[];
    position?: OverlayPosition;
    isVisible: boolean;
}

function formatPrice(amount: number): string {
    return amount.toLocaleString('en-IN');
}

const positionStyle: Record<OverlayPosition, React.CSSProperties> = {
    'bottom-right': { bottom: 100, right: 48 },
    'bottom-left':  { bottom: 100, left: 48 },
    'top-right':    { top: 48,    right: 48 },
    'top-left':     { top: 48,    left: 48 },
};

function getAnimClass(pos: OverlayPosition, entering: boolean): string {
    const isLeft = pos === 'bottom-left' || pos === 'top-left';
    if (!entering) return isLeft ? 'sold-toast-exit-left' : 'sold-toast-exit';
    return isLeft ? 'sold-toast-enter-left' : 'sold-toast-enter';
}

const LeadingBidsOverlay: React.FC<LeadingBidsOverlayProps> = ({
    auctionState,
    teams,
    position = 'bottom-right',
    isVisible,
}) => {
    // Track the previous leader via history changes
    // history[last].teamId = current highest bidder during bidding
    const lastBid = auctionState.history?.[auctionState.history.length - 1];
    const secondLastBid = auctionState.history?.[auctionState.history.length - 2];

    const currentLeaderId = lastBid?.teamId ?? null;
    const previousLeaderId = secondLastBid?.teamId !== currentLeaderId ? (secondLastBid?.teamId ?? null) : null;

    const [mounted, setMounted] = useState(false);
    const [everShown, setEverShown] = useState(false);
    const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track history length for mounted/unmount timing
    const historyLenRef = useRef<number>(auctionState.history?.length ?? 0);

    useEffect(() => {
        historyLenRef.current = auctionState.history?.length ?? 0;
    }, [auctionState.history]);

    // Mount/unmount with delay for exit animation
    useEffect(() => {
        if (isVisible) {
            // Cancel any pending unmount
            if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current);
            setMounted(true);
            setEverShown(true);
        } else if (everShown) {
            // Play exit animation first, then unmount after 600ms
            unmountTimerRef.current = setTimeout(() => setMounted(false), 600);
        }
        return () => {
            if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current);
        };
    }, [isVisible, everShown]);

    if (!mounted) return null;

    const currentLeader = teams.find(t => t._id === currentLeaderId);
    const previousLeader = previousLeaderId ? teams.find(t => t._id === previousLeaderId) : null;
    const entering = isVisible;

    return (
        <div
            className={getAnimClass(position, entering)}
            style={{
                position: 'absolute',
                ...positionStyle[position],
                width: 440,
                background: 'var(--overlay-bg-panel)',
                borderRadius: 14,
                border: '1px solid var(--overlay-border-accent-subtle)',
                borderLeft: '5px solid var(--overlay-color-primary)',
                boxShadow: '0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(var(--overlay-color-primary-rgb),0.12), 0 0 60px rgba(var(--overlay-color-primary-rgb),0.08)',
                overflow: 'hidden',
                zIndex: 90,
            }}
        >
            {/* Header bar */}
            <div style={{
                background: 'linear-gradient(90deg, rgba(var(--overlay-color-primary-rgb),0.18) 0%, transparent 100%)',
                padding: '10px 20px 10px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderBottom: '1px solid var(--overlay-border-accent-subtle)',
            }}>
                <div style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: 'var(--overlay-color-primary)',
                    boxShadow: '0 0 8px rgba(var(--overlay-color-primary-rgb),0.8)',
                    flexShrink: 0,
                    animation: 'overlayPulse 1.8s ease-in-out infinite',
                }} />
                <span style={{
                    fontFamily: '"Graduate", cursive',
                    fontSize: 13,
                    letterSpacing: 5,
                    color: 'var(--overlay-color-primary)',
                    textTransform: 'uppercase',
                }}>LIVE BIDDING</span>
                <style>{`
                    @keyframes overlayPulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.4; transform: scale(0.85); }
                    }
                `}</style>
            </div>

            <div style={{ padding: '16px 22px' }}>
                {/* Current Leader */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                        {currentLeader?.logoURL ? (
                            <img
                                src={currentLeader.logoURL}
                                alt={currentLeader.name}
                                style={{
                                    width: 54, height: 54,
                                    objectFit: 'contain',
                                    flexShrink: 0,
                                    filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))',
                                }}
                            />
                        ) : (
                            <div style={{
                                width: 54, height: 54,
                                borderRadius: '50%',
                                background: 'rgba(var(--overlay-color-primary-rgb),0.15)',
                                border: '2px solid rgba(var(--overlay-color-primary-rgb),0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: '"Graduate", cursive',
                                fontSize: 16, color: 'var(--overlay-color-primary)',
                                fontWeight: 700, flexShrink: 0,
                            }}>
                                {currentLeader?.shortCode?.slice(0, 2) || '?'}
                            </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                fontFamily: '"Concert One", cursive',
                                fontSize: 20,
                                color: 'var(--overlay-text-bright)',
                                lineHeight: 1.2,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                {currentLeader ? currentLeader.name : 'Waiting for bid…'}
                            </div>
                            <div style={{
                                fontFamily: '"Graduate", cursive',
                                fontSize: 11,
                                color: 'var(--overlay-color-primary)',
                                letterSpacing: 3,
                                textTransform: 'uppercase',
                                marginTop: 2,
                            }}>
                                LEADING
                            </div>
                        </div>
                    </div>

                    {/* Current bid amount */}
                    <div style={{
                        fontFamily: '"Inconsolata", monospace',
                        fontSize: 26, fontWeight: 700,
                        color: 'var(--overlay-color-primary)',
                        textAlign: 'right', flexShrink: 0,
                        textShadow: '0 0 20px rgba(var(--overlay-color-primary-rgb),0.35)',
                        whiteSpace: 'nowrap',
                    }}>
                        {auctionState.currentBid > 0 ? formatPrice(auctionState.currentBid) : '--'}
                    </div>
                </div>

                {/* Previous Leader */}
                {previousLeader && (
                    <div style={{
                        marginTop: 14,
                        paddingTop: 14,
                        borderTop: '1px dashed var(--overlay-border-accent-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        opacity: 0.65,
                    }}>
                        {previousLeader.logoURL ? (
                            <img
                                src={previousLeader.logoURL}
                                alt={previousLeader.name}
                                style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
                            />
                        ) : (
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'var(--surface-elevated)',
                                border: '1px solid var(--overlay-border-accent-subtle)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: '"Graduate", cursive',
                                fontSize: 12, color: 'var(--overlay-text-dim)',
                                fontWeight: 700, flexShrink: 0,
                            }}>
                                {previousLeader.shortCode?.slice(0, 2)}
                            </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                fontFamily: '"Rajdhani", sans-serif',
                                fontSize: 16, fontWeight: 600,
                                color: 'var(--overlay-text-bright)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {previousLeader.name}
                            </div>
                            <div style={{
                                fontFamily: '"Graduate", cursive',
                                fontSize: 9,
                                color: 'var(--overlay-text-dim)',
                                letterSpacing: 2,
                                textTransform: 'uppercase',
                                marginTop: 2,
                            }}>
                                OUTBID
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadingBidsOverlay;
