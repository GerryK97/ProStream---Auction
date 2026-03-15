'use client';

import React, { useState, useEffect } from 'react';
import { Player, Team, Tournament } from '@/types';

interface SoldPlayersSummaryOverlayProps {
    players: Player[];
    teams: Team[];
    tournament: Tournament | null;
    isExiting?: boolean;
}

const formatCurrency = (amount: number) => amount.toLocaleString('en-IN');

// Layout constants (1920×1080 canvas)
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const PANEL_LEFT = 230;
const PANEL_WIDTH = 1460;
const HEADING_H = 110;       // heading block height
const SEPARATOR_H = 2;
const ROW_AREA_TOP_PAD = 24; // gap between separator and first row
const ROW_BOTTOM_PAD = 24;   // gap after last row
const PILL_LEFT = PANEL_LEFT + 44;    // 274
const PILL_WIDTH = PANEL_WIDTH - 88;  // 1372 ≈ reference 1363
const PILL_H = 53;
const AVATAR_SIZE = 70;
const AVATAR_OVERLAP = (AVATAR_SIZE - PILL_H) / 2; // 8.5
const ROW_SPACING = 80;
const PLAYERS_PER_PAGE = 10;
const PAGE_DURATION = 10000;

const FONT_HEADING = "'Bebas Neue', cursive";
const FONT_ROW = "'Rajdhani', sans-serif";

const SoldPlayersSummaryOverlay: React.FC<SoldPlayersSummaryOverlayProps> = ({
    players,
    teams,
    tournament,
    isExiting = false,
}) => {
    const [currentPage, setCurrentPage] = useState(0);

    const soldPlayers = players
        .filter(p => p.isSold)
        .sort((a, b) => (b._id > a._id ? 1 : -1));

    const explicitlyUnsoldPlayers = players
        .filter(p => !p.isSold && p.isUnsold)
        .sort((a, b) => a.name.localeCompare(b.name));

    const availablePlayers = players
        .filter(p => !p.isSold && !p.isUnsold)
        .sort((a, b) => a.name.localeCompare(b.name));

    const allPlayers = [...soldPlayers, ...explicitlyUnsoldPlayers, ...availablePlayers];
    const totalPages = Math.ceil(allPlayers.length / PLAYERS_PER_PAGE);
    const startIndex = currentPage * PLAYERS_PER_PAGE;
    const currentPagePlayers = allPlayers.slice(startIndex, startIndex + PLAYERS_PER_PAGE);

    const totalSoldValue = soldPlayers.reduce((sum, p) => sum + (p.finalPrice || 0), 0);

    useEffect(() => {
        if (totalPages <= 1) return;
        const timer = setInterval(() => {
            setCurrentPage(prev => (prev + 1) % totalPages);
        }, PAGE_DURATION);
        return () => clearInterval(timer);
    }, [totalPages]);

    useEffect(() => {
        setCurrentPage(0);
    }, [soldPlayers.length, explicitlyUnsoldPlayers.length, availablePlayers.length]);

    if (!tournament || allPlayers.length === 0) return null;

    const rowCount = currentPagePlayers.length;
    const contentH = HEADING_H + SEPARATOR_H + ROW_AREA_TOP_PAD + rowCount * ROW_SPACING + ROW_BOTTOM_PAD;
    const panelTop = Math.round((CANVAS_H - contentH) / 2);

    // First pill's top within canvas
    const firstPillTop = panelTop + HEADING_H + SEPARATOR_H + ROW_AREA_TOP_PAD;

    const dashAnim = isExiting ? 'summaryDashOut 0.35s ease 1.25s both' : 'summaryDashIn 0.30s ease 0s both';

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
        <style>{`
            @keyframes summaryDashIn  { 0% { transform: translateY(-28px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
            @keyframes summaryDashOut { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-28px); opacity: 0; } }
            @keyframes summaryRowIn   { 0% { transform: translateX(-55px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
            @keyframes summaryRowOut  { 0% { transform: translateX(0); opacity: 1; } 100% { transform: translateX(55px); opacity: 0; } }
        `}</style>
        <div style={{ width: CANVAS_W, height: CANVAS_H, position: 'relative', background: 'transparent', overflow: 'hidden', flexShrink: 0 }}>

            {/* ── Background panel ── */}
            <div style={{
                position: 'absolute',
                left: PANEL_LEFT,
                top: panelTop,
                width: PANEL_WIDTH,
                height: contentH,
                background: 'var(--overlay-bg-panel)',
                borderRadius: 20,
                border: '1px solid var(--overlay-border-accent-subtle)',
                animation: dashAnim,
            }} />

            {/* Left gold accent bar */}
            <div style={{
                position: 'absolute',
                left: PANEL_LEFT,
                top: panelTop + 20,
                width: 5,
                height: contentH - 40,
                background: 'var(--overlay-color-primary)',
                borderRadius: '0 0 4px 4px',
                animation: dashAnim,
            }} />

            {/* ── Heading area ── */}
            <div style={{
                position: 'absolute',
                left: PANEL_LEFT,
                top: panelTop,
                width: PANEL_WIDTH,
                height: HEADING_H,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 40,
                paddingRight: 40,
                justifyContent: 'space-between',
                animation: dashAnim,
            }}>
                {/* Title + subtext */}
                <div>
                    <div style={{
                        fontFamily: FONT_HEADING,
                        fontSize: 64,
                        color: 'var(--overlay-color-primary)',
                        letterSpacing: 8,
                        lineHeight: 1,
                    }}>
                        PLAYER SUMMARY
                    </div>
                    <div style={{
                        fontFamily: FONT_ROW,
                        fontSize: 22,
                        fontWeight: 500,
                        color: 'var(--overlay-text-subtle)',
                        letterSpacing: 2,
                        marginTop: 4,
                    }}>
                        {soldPlayers.length} SOLD &nbsp;·&nbsp; {explicitlyUnsoldPlayers.length} UNSOLD &nbsp;·&nbsp; {availablePlayers.length} AVAILABLE &nbsp;·&nbsp; TOTAL {formatCurrency(totalSoldValue)}
                    </div>
                </div>

                {/* Pagination dots */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <div key={i} style={{
                                width: i === currentPage ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                background: i === currentPage ? 'var(--overlay-color-primary)' : 'var(--overlay-border-accent-subtle)',
                                transition: 'all 0.3s ease',
                            }} />
                        ))}
                    </div>
                )}
            </div>

            {/* Gold separator */}
            <div style={{
                position: 'absolute',
                left: PANEL_LEFT + 20,
                top: panelTop + HEADING_H,
                width: PANEL_WIDTH - 40,
                height: SEPARATOR_H,
                background: 'linear-gradient(90deg, var(--overlay-color-primary) 0%, rgba(var(--overlay-color-primary-rgb),0.15) 100%)',
                animation: dashAnim,
            }} />

            {/* ── Player rows ── */}
            {currentPagePlayers.map((player, i) => {
                const isSold      = !!player.isSold;
                const isUnsold    = !isSold && !!player.isUnsold;
                const pillTop = firstPillTop + i * ROW_SPACING;
                const elemTop = pillTop - AVATAR_OVERLAP;
                const team = isSold ? teams.find(t => t._id === player.winningTeamId) : null;
                const initials = player.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

                return (
                    <React.Fragment key={`${currentPage}-${player._id}`}>
                        {/* Animated row wrapper */}
                        <div style={{
                            position: 'absolute',
                            left: PILL_LEFT - 5,
                            top: elemTop,
                            width: PILL_WIDTH + 5,
                            height: AVATAR_SIZE,
                            animation: isExiting
                                ? `summaryRowOut 0.30s ease ${(rowCount - 1 - i) * 0.12}s both`
                                : `summaryRowIn  0.35s ease ${0.25 + i * 0.13}s both`,
                        }}>
                            {/* Row pill */}
                            <div style={{
                                position: 'absolute',
                                left: 5,
                                top: AVATAR_OVERLAP,
                                width: PILL_WIDTH,
                                height: PILL_H,
                                background: isSold ? 'rgba(var(--overlay-color-primary-rgb),0.03)' : isUnsold ? 'rgba(var(--overlay-text-dim-rgb, 107, 114, 128), 0.05)' : 'rgba(var(--overlay-text-dim-rgb, 107, 114, 128), 0.05)',
                                borderRadius: 26.5,
                                border: `1px solid ${isSold ? 'var(--overlay-border-accent-subtle)' : isUnsold ? 'rgba(var(--overlay-danger-rgb, 239, 68, 68), 0.2)' : 'var(--overlay-border-light)'}`,
                            }} />

                            {/* Avatar circle — player photo */}
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: AVATAR_SIZE,
                                height: AVATAR_SIZE,
                                borderRadius: '50%',
                                background: 'var(--overlay-bg-fullscreen)',
                                border: `2px solid ${isSold ? 'var(--overlay-color-primary)' : isUnsold ? 'var(--overlay-danger, #EF4444)' : 'var(--overlay-border-light)'}`,
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                filter: isSold ? 'none' : 'grayscale(80%)',
                            }}>
                                {player.photoURL ? (
                                    <img
                                        src={player.photoURL}
                                        alt={player.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <span style={{
                                        fontFamily: FONT_ROW,
                                        fontSize: 24,
                                        fontWeight: 700,
                                        color: isSold ? 'var(--overlay-color-primary)' : isUnsold ? 'var(--overlay-danger, #EF4444)' : 'var(--overlay-text-dim)',
                                        letterSpacing: 1,
                                    }}>
                                        {initials}
                                    </span>
                                )}
                            </div>

                            <div style={{
                                position: 'absolute',
                                left: 83,
                                top: 0,
                                height: AVATAR_SIZE,
                                display: 'flex',
                                alignItems: 'center',
                                fontFamily: FONT_ROW,
                                fontSize: 46,
                                fontWeight: 600,
                                letterSpacing: 2,
                                color: isSold ? 'var(--overlay-text-bright)' : isUnsold ? 'var(--overlay-text-subtle)' : 'var(--overlay-text-dim)',
                                whiteSpace: 'nowrap',
                                maxWidth: 380,
                                overflow: 'hidden',
                            }}>
                                {player.name}
                            </div>

                            <div style={{
                                position: 'absolute',
                                left: 495,
                                top: 0,
                                height: AVATAR_SIZE,
                                display: 'flex',
                                alignItems: 'center',
                                fontFamily: FONT_ROW,
                                fontSize: 46,
                                fontWeight: isSold ? 500 : 700,
                                letterSpacing: 2,
                                color: isSold ? 'var(--overlay-text-subtle)' : isUnsold ? 'var(--overlay-danger, #EF4444)' : 'var(--overlay-text-dim)',
                                whiteSpace: 'nowrap',
                                maxWidth: 540,
                                overflow: 'hidden',
                            }}>
                                {isSold ? (team?.name ?? '—') : isUnsold ? 'UNSOLD' : 'AVAILABLE'}
                            </div>

                            {/* Amount — sold only */}
                            {isSold && (
                                <div style={{
                                    position: 'absolute',
                                    left: 1075,
                                    top: 0,
                                    height: AVATAR_SIZE,
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontFamily: FONT_ROW,
                                    fontSize: 46,
                                    fontWeight: 700,
                                    letterSpacing: 2,
                                    color: 'var(--overlay-color-primary)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {formatCurrency(player.finalPrice || 0)}
                                </div>
                            )}
                        </div>

                        {/* Subtle row divider — canvas-absolute, no animation */}
                        {i < rowCount - 1 && (
                            <div style={{
                                position: 'absolute',
                                left: PILL_LEFT + 10,
                                top: pillTop + PILL_H + 13,
                                width: PILL_WIDTH - 20,
                                height: 1,
                                background: 'var(--overlay-border-accent-subtle)',
                            }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
        </div>
    );
};

export default SoldPlayersSummaryOverlay;
