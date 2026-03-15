'use client';

import React from 'react';
import { Player, Team, Tournament } from '@/types';

interface Top10SummaryOverlayProps {
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
const HEADING_H = 110;
const SEPARATOR_H = 2;
const ROW_AREA_TOP_PAD = 20;
const ROW_BOTTOM_PAD = 20;
const RANK_COL_W = 80;           // space for #1 #2 … #10
const PILL_LEFT = PANEL_LEFT + 44 + RANK_COL_W;   // 354
const PILL_WIDTH = PANEL_WIDTH - 88 - RANK_COL_W; // 1292
const PILL_H = 53;
const AVATAR_SIZE = 70;
const AVATAR_OVERLAP = (AVATAR_SIZE - PILL_H) / 2;
const ROW_SPACING = 82;

const FONT_HEADING = "'Bebas Neue', cursive";
const FONT_ROW = "'Rajdhani', sans-serif";

const RANK_COLORS: Record<number, string> = {
    1: '#F59E0B',  // gold
    2: '#94A3B8',  // silver
    3: '#CD7F32',  // bronze
};
const getRankColor = (rank: number) => RANK_COLORS[rank] ?? '#475569';

const Top10SummaryOverlay: React.FC<Top10SummaryOverlayProps> = ({
    players,
    teams,
    isExiting = false,
}) => {
    const top10 = players
        .filter(p => p.isSold)
        .sort((a, b) => (b.finalPrice || 0) - (a.finalPrice || 0))
        .slice(0, 10);

    const totalSoldValue = top10.reduce((sum, p) => sum + (p.finalPrice || 0), 0);
    const rowCount = top10.length;

    const dashAnim = isExiting
        ? 'summaryDashOut 0.35s ease 1.25s both'
        : 'summaryDashIn 0.30s ease 0s both';

    if (rowCount === 0) {
        return (
            <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent',
            }}>
                <div style={{
                    fontFamily: FONT_HEADING,
                    fontSize: 48,
                    color: 'rgba(var(--overlay-color-primary-rgb),0.4)',
                    letterSpacing: 8,
                }}>
                    NO PLAYERS SOLD YET
                </div>
            </div>
        );
    }

    const contentH = HEADING_H + SEPARATOR_H + ROW_AREA_TOP_PAD + rowCount * ROW_SPACING + ROW_BOTTOM_PAD;
    const panelTop = Math.round((CANVAS_H - contentH) / 2);
    const firstPillTop = panelTop + HEADING_H + SEPARATOR_H + ROW_AREA_TOP_PAD;

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

                {/* ── Heading ── */}
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
                    <div>
                        <div style={{
                            fontFamily: FONT_HEADING,
                            fontSize: 64,
                            color: 'var(--overlay-color-primary)',
                            letterSpacing: 8,
                            lineHeight: 1,
                        }}>
                            TOP 10 SOLD
                        </div>
                        <div style={{
                            fontFamily: FONT_ROW,
                            fontSize: 22,
                            fontWeight: 500,
                            color: 'var(--overlay-text-subtle)',
                            letterSpacing: 2,
                            marginTop: 4,
                        }}>
                            RANKED BY HIGHEST SOLD AMOUNT &nbsp;·&nbsp; {rowCount} PLAYER{rowCount !== 1 ? 'S' : ''} &nbsp;·&nbsp; TOTAL {formatCurrency(totalSoldValue)}
                        </div>
                    </div>

                    {/* Trophy icon area */}
                    <div style={{
                        fontFamily: FONT_HEADING,
                        fontSize: 52,
                        color: 'rgba(var(--overlay-color-primary-rgb),0.25)',
                        letterSpacing: 4,
                    }}>
                        LEADERBOARD
                    </div>
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

                {/* ── Rank column header ── */}
                <div style={{
                    position: 'absolute',
                    left: PANEL_LEFT + 44,
                    top: panelTop + HEADING_H + SEPARATOR_H + 4,
                    width: RANK_COL_W,
                    height: ROW_AREA_TOP_PAD - 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: FONT_ROW,
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--overlay-text-dim)',
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    animation: dashAnim,
                }}>
                    RANK
                </div>

                {/* ── Player rows ── */}
                {top10.map((player, i) => {
                    const rank = i + 1;
                    const rankColor = getRankColor(rank);
                    const pillTop = firstPillTop + i * ROW_SPACING;
                    const elemTop = pillTop - AVATAR_OVERLAP;
                    const team = teams.find(t => t._id === player.winningTeamId);
                    const initials = player.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                    const isTop3 = rank <= 3;

                    return (
                        <React.Fragment key={player._id}>
                            {/* Rank number — to the left of pill */}
                            <div style={{
                                position: 'absolute',
                                left: PANEL_LEFT + 44,
                                top: pillTop,
                                width: RANK_COL_W,
                                height: PILL_H,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: FONT_HEADING,
                                fontSize: isTop3 ? 40 : 34,
                                color: rankColor,
                                letterSpacing: 1,
                                animation: isExiting
                                    ? `summaryRowOut 0.30s ease ${(rowCount - 1 - i) * 0.10}s both`
                                    : `summaryRowIn  0.35s ease ${0.20 + i * 0.11}s both`,
                            }}>
                                #{rank}
                            </div>

                            {/* Row wrapper (pill + avatar + text) */}
                            <div style={{
                                position: 'absolute',
                                left: PILL_LEFT - 5,
                                top: elemTop,
                                width: PILL_WIDTH + 5,
                                height: AVATAR_SIZE,
                                animation: isExiting
                                    ? `summaryRowOut 0.30s ease ${(rowCount - 1 - i) * 0.10}s both`
                                    : `summaryRowIn  0.35s ease ${0.20 + i * 0.11}s both`,
                            }}>
                                {/* Pill background */}
                                <div style={{
                                    position: 'absolute',
                                    left: 5,
                                    top: AVATAR_OVERLAP,
                                    width: PILL_WIDTH,
                                    height: PILL_H,
                                    background: isTop3 ? `rgba(${rank === 1 ? 'var(--overlay-color-primary-rgb)' : rank === 2 ? '148,163,184' : '205,127,50'},0.07)` : 'rgba(var(--overlay-color-primary-rgb),0.03)',
                                    borderRadius: 26.5,
                                    border: `1px solid ${isTop3 ? rankColor + '44' : 'var(--overlay-border-accent-subtle)'}`,
                                }} />

                                {/* Avatar */}
                                <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: AVATAR_SIZE,
                                    height: AVATAR_SIZE,
                                    borderRadius: '50%',
                                    background: '#071020',
                                    border: `2px solid ${isTop3 ? rankColor : '#2D4A6E'}`,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: isTop3 ? `0 0 14px ${rankColor}55` : 'none',
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
                                            color: rankColor,
                                            letterSpacing: 1,
                                        }}>
                                            {initials}
                                        </span>
                                    )}
                                </div>

                                {/* Player name */}
                                <div style={{
                                    position: 'absolute',
                                    left: 83,
                                    top: 0,
                                    height: AVATAR_SIZE,
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontFamily: FONT_ROW,
                                    fontSize: 44,
                                    fontWeight: 600,
                                    letterSpacing: 2,
                                    color: isTop3 ? '#FFFFFF' : '#CBD5E1',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 380,
                                    overflow: 'hidden',
                                }}>
                                    {player.name}
                                </div>

                                {/* Team name */}
                                <div style={{
                                    position: 'absolute',
                                    left: 495,
                                    top: 0,
                                    height: AVATAR_SIZE,
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontFamily: FONT_ROW,
                                    fontSize: 44,
                                    fontWeight: 500,
                                    letterSpacing: 2,
                                    color: 'var(--overlay-text-dim)',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 400,
                                    overflow: 'hidden',
                                }}>
                                    {team?.name ?? '—'}
                                </div>

                                {/* Sold amount — right aligned */}
                                <div style={{
                                    position: 'absolute',
                                    left: 935,
                                    top: 0,
                                    height: AVATAR_SIZE,
                                    width: 340,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    fontFamily: FONT_ROW,
                                    fontSize: isTop3 ? 48 : 44,
                                    fontWeight: 700,
                                    letterSpacing: 2,
                                    color: isTop3 ? rankColor : 'var(--overlay-color-primary)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {formatCurrency(player.finalPrice || 0)}
                                </div>
                            </div>

                            {/* Row divider */}
                            {i < rowCount - 1 && (
                                <div style={{
                                    position: 'absolute',
                                    left: PILL_LEFT + 10,
                                    top: pillTop + PILL_H + 12,
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

export default Top10SummaryOverlay;
