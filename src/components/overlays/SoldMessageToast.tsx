'use client';

import React from 'react';
import { Player, Team } from '@/types';

type SoldMessagePosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface SoldMessageToastProps {
    player: Player;
    team: Team;
    finalPrice: number;
    exiting: boolean;
    position?: SoldMessagePosition;
}

function formatPrice(amount: number): string {
    return amount.toLocaleString('en-IN');
}

const positionStyle: Record<SoldMessagePosition, React.CSSProperties> = {
    'bottom-right': { bottom: 120, right: 48 },
    'bottom-left':  { bottom: 120, left: 48 },
    'top-right':    { top: 48, right: 48 },
    'top-left':     { top: 48, left: 48 },
};

function getAnimClass(pos: SoldMessagePosition, exiting: boolean): string {
    const isLeft = pos === 'bottom-left' || pos === 'top-left';
    if (exiting) return isLeft ? 'sold-toast-exit-left' : 'sold-toast-exit';
    return isLeft ? 'sold-toast-enter-left' : 'sold-toast-enter';
}

const SoldMessageToast: React.FC<SoldMessageToastProps> = ({ player, team, finalPrice, exiting, position = 'bottom-right' }) => (
    <div
        className={getAnimClass(position, exiting)}
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
            zIndex: 100,
        }}
    >
        {/* Top accent bar */}
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
            }} />
            <span style={{
                fontFamily: '"Graduate", cursive',
                fontSize: 13,
                letterSpacing: 5,
                color: 'var(--overlay-color-primary)',
                textTransform: 'uppercase',
            }}>SOLD</span>
        </div>

        {/* Player name section */}
        <div style={{ padding: '18px 22px 14px 22px' }}>
            <div style={{
                fontFamily: '"Inconsolata", monospace',
                fontSize: 38,
                fontWeight: 700,
                color: 'var(--overlay-color-primary)',
                letterSpacing: 2,
                lineHeight: 1.1,
                textShadow: '0 0 30px rgba(var(--overlay-color-primary-rgb),0.4)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}>
                {player.name}
            </div>
            {(player.position || player.playerClass) && (
                <div style={{
                    fontFamily: '"Graduate", cursive',
                    fontSize: 13,
                    color: 'var(--overlay-text-dim)',
                    letterSpacing: 2,
                    marginTop: 4,
                    textTransform: 'uppercase',
                }}>
                    {[player.playerClass, player.position].filter(Boolean).join(' · ')}
                </div>
            )}
        </div>

        {/* Divider */}
        <div style={{
            height: 1,
            margin: '0 22px',
            background: 'linear-gradient(90deg, rgba(var(--overlay-color-primary-rgb),0.35) 0%, transparent 100%)',
        }} />

        {/* Team + Price section */}
        <div style={{
            padding: '14px 22px 20px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
        }}>
            {/* Team identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                {team.logoURL ? (
                    <img
                        src={team.logoURL}
                        alt={team.name}
                        style={{
                            width: 54,
                            height: 54,
                            objectFit: 'contain',
                            flexShrink: 0,
                            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))',
                        }}
                    />
                ) : (
                    <div style={{
                        width: 54,
                        height: 54,
                        borderRadius: '50%',
                        background: 'rgba(var(--overlay-color-primary-rgb),0.15)',
                        border: '2px solid rgba(var(--overlay-color-primary-rgb),0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: '"Graduate", cursive',
                        fontSize: 16,
                        color: 'var(--overlay-color-primary)',
                        fontWeight: 700,
                        flexShrink: 0,
                    }}>
                        {team.shortCode?.slice(0, 2)}
                    </div>
                )}
                <div style={{ minWidth: 0 }}>
                    <div style={{
                        fontFamily: '"Concert One", cursive',
                        fontSize: 20,
                        color: 'var(--overlay-text-bright)',
                        lineHeight: 1.2,
                        letterSpacing: 0.5,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {team.name}
                    </div>
                    {team.shortCode && (
                        <div style={{
                            fontFamily: '"Graduate", cursive',
                            fontSize: 11,
                            color: 'var(--overlay-text-dim)',
                            letterSpacing: 3,
                            textTransform: 'uppercase',
                            marginTop: 2,
                        }}>
                            {team.shortCode}
                        </div>
                    )}
                </div>
            </div>

            {/* Final price */}
            <div style={{
                fontFamily: '"Inconsolata", monospace',
                fontSize: 26,
                fontWeight: 700,
                color: 'var(--overlay-color-primary)',
                textAlign: 'right',
                flexShrink: 0,
                textShadow: '0 0 20px rgba(var(--overlay-color-primary-rgb),0.35)',
                whiteSpace: 'nowrap',
            }}>
                {formatPrice(finalPrice)}
            </div>
        </div>
    </div>
);

export default SoldMessageToast;
