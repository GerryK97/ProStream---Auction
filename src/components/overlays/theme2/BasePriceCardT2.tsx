'use client';

import React from 'react';
import { Tournament, Player } from '@/types';

interface BasePriceCardT2Props {
    tournament: Tournament | null;
    currentPlayer: Player | undefined;
    size: 'small' | 'medium';
    height: number;
}

const BASE_WIDTH = 240;
const STRIP_WIDTH = 5;

const fontSizes = {
    small:  { label: 15, amount: 36 },
    medium: { label: 15, amount: 36 },
};

const BasePriceCardT2: React.FC<BasePriceCardT2Props> = ({ tournament, currentPlayer, size, height }) => {
    if (!tournament || !tournament.basePricePerPlayer || !currentPlayer) return null;

    const fs = fontSizes[size];
    const displayAmount = tournament.basePricePerPlayer.toLocaleString();

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');`}</style>
            <div
                className="animate-slide-in-top"
                style={{
                    position: 'relative',
                    width: BASE_WIDTH,
                    height,
                    backgroundColor: 'var(--t2-bg-card)',
                    borderRadius: 5,
                    overflow: 'hidden',
                    fontFamily: "'Varela Round', sans-serif",
                    boxShadow: '0 4px 16px var(--t2-shadow-color)',
                    display: 'flex',
                    flexDirection: 'row',
                    flexShrink: 0,
                }}
            >
                {/* Gold left strip */}
                <div style={{ width: STRIP_WIDTH, flexShrink: 0, backgroundColor: 'var(--t2-accent)' }} />

                {/* Content */}
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
                        fontSize: fs.label,
                        color: 'var(--t2-text-primary)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: 1.5,
                        textAlign: 'center',
                    }}>
                        Base Price
                    </span>

                    <span style={{
                        fontSize: fs.amount,
                        fontWeight: 700,
                        color: 'var(--t2-success)',
                        lineHeight: 1,
                        textAlign: 'center',
                    }}>
                        {displayAmount}
                    </span>
                </div>
            </div>
        </>
    );
};

export default BasePriceCardT2;
