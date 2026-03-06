'use client';

import React from 'react';
import { Tournament } from '@/types';
import '../../styles/animations.css';

interface RestingTimeOverlayProps {
    tournament: Tournament | null;
}

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const CX = CANVAS_W / 2; // 960
const CY = CANVAS_H / 2; // 540
const COIN_SIZE = 300;

const FONT_HEADING = "'Bebas Neue', cursive";
const FONT_BODY = "'Rajdhani', sans-serif";

const RestingTimeOverlay: React.FC<RestingTimeOverlayProps> = ({ tournament }) => {
    const fallbackLabel = tournament?.name?.slice(0, 2).toUpperCase() ?? 'PS';

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
            <div style={{ width: CANVAS_W, height: CANVAS_H, position: 'relative', overflow: 'hidden', flexShrink: 0,
                background: 'radial-gradient(ellipse at center, #0A1628 0%, #050B14 60%, #000 100%)',
            }}>

                {/* ── Ambient color blobs ── */}
                <div style={{
                    position: 'absolute', left: -100, top: -80,
                    width: 600, height: 600, borderRadius: '50%',
                    background: 'rgba(245,158,11,0.07)',
                    filter: 'blur(120px)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', right: -100, bottom: -80,
                    width: 700, height: 700, borderRadius: '50%',
                    background: 'rgba(20,184,166,0.06)',
                    filter: 'blur(140px)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', right: 100, top: -60,
                    width: 500, height: 500, borderRadius: '50%',
                    background: 'rgba(139,92,246,0.06)',
                    filter: 'blur(100px)',
                    pointerEvents: 'none',
                }} />


                {/* ── Coin — glow + flip combined in one animation declaration ── */}
                <div style={{
                    position: 'absolute',
                    left: CX - COIN_SIZE / 2,
                    top: CY - COIN_SIZE / 2,
                    width: COIN_SIZE,
                    height: COIN_SIZE,
                    borderRadius: '50%',
                    border: '5px solid #F59E0B',
                    background: 'linear-gradient(145deg, #0D1B2A 0%, #071020 100%)',
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    // Combine both animations on the same element to avoid class-override conflict
                    animation: 'coinFlip 3s linear infinite, pulseGlow 2.5s ease-in-out infinite',
                }}>
                    {tournament?.logoURL ? (
                        <img
                            src={tournament.logoURL}
                            alt={tournament.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <span style={{
                            fontFamily: FONT_HEADING,
                            fontSize: 110,
                            color: '#F59E0B',
                            letterSpacing: 8,
                            lineHeight: 1,
                            display: 'block',
                        }}>
                            {fallbackLabel}
                        </span>
                    )}
                </div>

                {/* ── Tournament name ── */}
                <div style={{
                    position: 'absolute',
                    left: CX,
                    top: CY + COIN_SIZE / 2 + 36,
                    transform: 'translateX(-50%)',
                    fontFamily: FONT_BODY,
                    fontSize: 38,
                    fontWeight: 600,
                    color: '#CBD5E1',
                    letterSpacing: 10,
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    textShadow: '0 0 20px rgba(203,213,225,0.3)',
                }}>
                    {tournament?.name ?? 'PROSTREAM AUCTION'}
                </div>

            </div>
        </div>
    );
};

export default RestingTimeOverlay;
