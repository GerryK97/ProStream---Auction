'use client';

import React from 'react';
import { Team, Tournament } from '@/types';

interface TeamSummaryOverlayProps {
    teams: Team[];
    tournament: Tournament | null;
    isExiting?: boolean;
}

const formatCurrency = (amount: number) => amount.toLocaleString('en-IN');

// Layout constants — mirrors SoldPlayersSummaryOverlay exactly
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const PANEL_LEFT = 230;
const PANEL_WIDTH = 1460;
const HEADING_H = 110;
const SEPARATOR_H = 2;
const ROW_AREA_TOP_PAD = 24;
const ROW_BOTTOM_PAD = 24;
const PILL_LEFT = PANEL_LEFT + 44;
const PILL_WIDTH = PANEL_WIDTH - 88;
const PILL_H = 53;
const AVATAR_SIZE = 70;
const AVATAR_OVERLAP = (AVATAR_SIZE - PILL_H) / 2;
const ROW_SPACING = 80;

const FONT_HEADING = "'Bebas Neue', cursive";
const FONT_ROW = "'Rajdhani', sans-serif";

const TeamSummaryOverlay: React.FC<TeamSummaryOverlayProps> = ({ teams, tournament, isExiting = false }) => {
    if (!tournament || teams.length === 0) return null;

    const sorted = [...teams].sort((a, b) => (b.currentBalance ?? 0) - (a.currentBalance ?? 0));

    const totalBudget = teams.reduce((sum, t) => sum + (t.initialBudget ?? 0), 0);
    const totalBalance = teams.reduce((sum, t) => sum + (t.currentBalance ?? 0), 0);

    const rowCount = sorted.length;
    const contentH = HEADING_H + SEPARATOR_H + ROW_AREA_TOP_PAD + rowCount * ROW_SPACING + ROW_BOTTOM_PAD;
    const panelTop = Math.round((CANVAS_H - contentH) / 2);
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
                <div>
                    <div style={{
                        fontFamily: FONT_HEADING,
                        fontSize: 64,
                        color: 'var(--overlay-color-primary)',
                        letterSpacing: 8,
                        lineHeight: 1,
                    }}>
                        TEAM SUMMARY
                    </div>
                    <div style={{
                        fontFamily: FONT_ROW,
                        fontSize: 22,
                        fontWeight: 500,
                        color: 'var(--overlay-text-subtle)',
                        letterSpacing: 2,
                        marginTop: 4,
                    }}>
                        {teams.length} TEAMS &nbsp;·&nbsp; TOTAL BUDGET {formatCurrency(totalBudget)} &nbsp;·&nbsp; TOTAL BALANCE {formatCurrency(totalBalance)}
                    </div>
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

            {/* ── Team rows ── */}
            {sorted.map((team, i) => {
                const pillTop = firstPillTop + i * ROW_SPACING;
                const elemTop = pillTop - AVATAR_OVERLAP;
                const balance = team.currentBalance ?? 0;
                const budget = team.initialBudget ?? 0;
                const spent = budget - balance;
                const initials = (team.shortCode || team.name).slice(0, 2).toUpperCase();
                const balanceColor = balance <= 0 ? 'var(--overlay-danger, #EF4444)' : 'var(--overlay-color-primary)';

                return (
                    <React.Fragment key={team._id}>
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
                                background: 'rgba(var(--overlay-color-primary-rgb),0.03)',
                                borderRadius: 26.5,
                                border: '1px solid var(--overlay-border-accent-subtle)',
                            }} />

                            {/* Avatar — team logo or initials */}
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: AVATAR_SIZE,
                                height: AVATAR_SIZE,
                                borderRadius: '50%',
                                background: 'var(--overlay-bg-fullscreen)',
                                border: '2px solid var(--overlay-color-primary)',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                {team.logoURL ? (
                                    <img
                                        src={team.logoURL}
                                        alt={team.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <span style={{
                                        fontFamily: FONT_ROW,
                                        fontSize: 24,
                                        fontWeight: 700,
                                        color: 'var(--overlay-color-primary)',
                                        letterSpacing: 1,
                                    }}>
                                        {initials}
                                    </span>
                                )}
                            </div>

                            {/* Team name */}
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
                                color: 'var(--overlay-text-bright)',
                                whiteSpace: 'nowrap',
                                maxWidth: 380,
                                overflow: 'hidden',
                            }}>
                                {team.name}
                            </div>

                            {/* Budget (col 2) */}
                            <div style={{
                                position: 'absolute',
                                left: 495,
                                top: 0,
                                height: AVATAR_SIZE,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                gap: 0,
                            }}>
                                <div style={{
                                    fontFamily: FONT_ROW,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: 'var(--overlay-text-dim)',
                                    letterSpacing: 3,
                                    textTransform: 'uppercase',
                                    lineHeight: 1,
                                }}>
                                    BUDGET
                                </div>
                                <div style={{
                                    fontFamily: FONT_ROW,
                                    fontSize: 40,
                                    fontWeight: 500,
                                    letterSpacing: 2,
                                    color: 'var(--overlay-text-subtle)',
                                    lineHeight: 1.1,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {formatCurrency(budget)}
                                </div>
                            </div>

                            {/* Spent (col 3) */}
                            <div style={{
                                position: 'absolute',
                                left: 775,
                                top: 0,
                                height: AVATAR_SIZE,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                gap: 0,
                            }}>
                                <div style={{
                                    fontFamily: FONT_ROW,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: 'var(--overlay-text-dim)',
                                    letterSpacing: 3,
                                    textTransform: 'uppercase',
                                    lineHeight: 1,
                                }}>
                                    SPENT
                                </div>
                                <div style={{
                                    fontFamily: FONT_ROW,
                                    fontSize: 40,
                                    fontWeight: 500,
                                    letterSpacing: 2,
                                    color: 'var(--overlay-text-subtle)',
                                    lineHeight: 1.1,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {formatCurrency(spent)}
                                </div>
                            </div>

                            {/* Balance (col 4) */}
                            <div style={{
                                position: 'absolute',
                                left: 1065,
                                top: 0,
                                height: AVATAR_SIZE,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                gap: 0,
                            }}>
                                <div style={{
                                    fontFamily: FONT_ROW,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: 'var(--overlay-text-dim)',
                                    letterSpacing: 3,
                                    textTransform: 'uppercase',
                                    lineHeight: 1,
                                }}>
                                    BALANCE
                                </div>
                                <div style={{
                                    fontFamily: FONT_ROW,
                                    fontSize: 40,
                                    fontWeight: 700,
                                    letterSpacing: 2,
                                    color: balanceColor,
                                    lineHeight: 1.1,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {formatCurrency(balance)}
                                </div>
                            </div>
                        </div>

                        {/* Row divider — canvas-absolute, no animation */}
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

export default TeamSummaryOverlay;
