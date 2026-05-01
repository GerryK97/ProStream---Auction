'use client';

import React from 'react';
import { Tournament } from '@/types';
import '../../../styles/animations.css';

interface RestingTimeT1Props {
    tournament: Tournament | null;
    overrideLabel?: string;
}

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const CX = CANVAS_W / 2; // 960
const CY = CANVAS_H / 2; // 540
const COIN_SIZE = 300;

const FONT_HEADING = "'Bebas Neue', cursive";
const FONT_BODY = "'Rajdhani', sans-serif";

const RestingTimeT1: React.FC<RestingTimeT1Props> = ({ tournament, overrideLabel }) => {
    const fallbackLabel = tournament?.name?.slice(0, 2).toUpperCase() ?? 'PS';

    // Coin faces: front = tournament logo (fallback to streamer logo),
    // back = streamer/auctioner logo (fallback to tournament logo).
    // If both missing, both faces show the fallback letters.
    const tournamentLogo = tournament?.logoURL ?? null;
    const streamerLogo = tournament?.wheelCenterImageURL ?? null;
    const frontSrc = tournamentLogo ?? streamerLogo;
    const backSrc = streamerLogo ?? tournamentLogo;

    const faceBase: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        background: 'linear-gradient(145deg, var(--overlay-bg-panel) 0%, var(--overlay-bg-fullscreen) 100%)',
    };

    const renderFace = (src: string | null, extraStyle?: React.CSSProperties) => (
        <div style={{ ...faceBase, ...extraStyle }}>
            {src ? (
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <span style={{
                    fontFamily: FONT_HEADING,
                    fontSize: 110,
                    color: 'var(--overlay-color-primary)',
                    letterSpacing: 8,
                    lineHeight: 1,
                    display: 'block',
                }}>
                    {fallbackLabel}
                </span>
            )}
        </div>
    );

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
            <div style={{ width: CANVAS_W, height: CANVAS_H, position: 'relative', overflow: 'hidden', flexShrink: 0,
                background: 'radial-gradient(ellipse at center, var(--overlay-bg-panel) 0%, var(--overlay-bg-fullscreen) 65%, #000 100%)',
            }}>

                {/* ── Ambient color blobs ── */}
                <div style={{
                    position: 'absolute', left: -100, top: -80,
                    width: 600, height: 600, borderRadius: '50%',
                    background: 'rgba(var(--overlay-color-primary-rgb),0.07)',
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


                {/* ── Coin — pulseGlow on outer wrapper; inner flips in 3D with two faces ── */}
                <div style={{
                    position: 'absolute',
                    left: CX - COIN_SIZE / 2,
                    top: CY - COIN_SIZE / 2,
                    width: COIN_SIZE,
                    height: COIN_SIZE,
                    borderRadius: '50%',
                    animation: 'pulseGlow 2.5s ease-in-out infinite',
                }}>
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        transformStyle: 'preserve-3d',
                        animation: 'coinFlip 3s linear infinite',
                    }}>
                        {renderFace(frontSrc, { border: '5px solid var(--overlay-color-primary)' })}
                        {renderFace(backSrc, { border: '5px solid var(--overlay-color-primary)', transform: 'rotateY(180deg)' })}
                    </div>
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
                    color: 'var(--overlay-text-bright)',
                    letterSpacing: 10,
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    textShadow: '0 0 20px rgba(var(--overlay-text-bright-rgb, 203,213,225),0.3)',
                }}>
                    {overrideLabel ?? tournament?.name ?? 'PROSTREAM AUCTION'}
                </div>

            </div>
        </div>
    );
};

export default RestingTimeT1;
