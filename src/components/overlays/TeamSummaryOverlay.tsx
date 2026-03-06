'use client';

import React from 'react';
import { Team, Tournament } from '@/types';

interface TeamSummaryOverlayProps {
    teams: Team[];
    tournament: Tournament | null;
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

const TeamSummaryOverlay: React.FC<TeamSummaryOverlayProps> = ({ teams, tournament }) => {
    if (!tournament || teams.length === 0) return null;

    const sorted = [...teams].sort((a, b) => (b.currentBalance ?? 0) - (a.currentBalance ?? 0));

    const totalBudget = teams.reduce((sum, t) => sum + (t.initialBudget ?? 0), 0);
    const totalBalance = teams.reduce((sum, t) => sum + (t.currentBalance ?? 0), 0);

    const rowCount = sorted.length;
    const contentH = HEADING_H + SEPARATOR_H + ROW_AREA_TOP_PAD + rowCount * ROW_SPACING + ROW_BOTTOM_PAD;
    const panelTop = Math.round((CANVAS_H - contentH) / 2);
    const firstPillTop = panelTop + HEADING_H + SEPARATOR_H + ROW_AREA_TOP_PAD;

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
        <div style={{ width: CANVAS_W, height: CANVAS_H, position: 'relative', background: 'transparent', overflow: 'hidden', flexShrink: 0 }}>

            {/* ── Background panel ── */}
            <div style={{
                position: 'absolute',
                left: PANEL_LEFT,
                top: panelTop,
                width: PANEL_WIDTH,
                height: contentH,
                background: '#0D1B2A',
                borderRadius: 20,
                border: '1px solid #1E3A5F',
            }} />

            {/* Left gold accent bar */}
            <div style={{
                position: 'absolute',
                left: PANEL_LEFT,
                top: panelTop + 20,
                width: 5,
                height: contentH - 40,
                background: '#F59E0B',
                borderRadius: '0 0 4px 4px',
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
            }}>
                <div>
                    <div style={{
                        fontFamily: FONT_HEADING,
                        fontSize: 64,
                        color: '#F59E0B',
                        letterSpacing: 8,
                        lineHeight: 1,
                    }}>
                        TEAM SUMMARY
                    </div>
                    <div style={{
                        fontFamily: FONT_ROW,
                        fontSize: 22,
                        fontWeight: 500,
                        color: '#64748B',
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
                background: 'linear-gradient(90deg, #F59E0B 0%, rgba(245,158,11,0.15) 100%)',
            }} />

            {/* ── Team rows ── */}
            {sorted.map((team, i) => {
                const pillTop = firstPillTop + i * ROW_SPACING;
                const elemTop = pillTop - AVATAR_OVERLAP;
                const balance = team.currentBalance ?? 0;
                const budget = team.initialBudget ?? 0;
                const spent = budget - balance;
                const initials = (team.shortCode || team.name).slice(0, 2).toUpperCase();
                const balanceColor = balance <= 0 ? '#EF4444' : '#F59E0B';

                return (
                    <React.Fragment key={team._id}>
                        {/* Row pill */}
                        <div style={{
                            position: 'absolute',
                            left: PILL_LEFT,
                            top: pillTop,
                            width: PILL_WIDTH,
                            height: PILL_H,
                            background: '#0A1628',
                            borderRadius: 26.5,
                            border: '1px solid #1E3A5F',
                        }} />

                        {/* Avatar — team logo or initials */}
                        <div style={{
                            position: 'absolute',
                            left: PILL_LEFT - 5,
                            top: elemTop,
                            width: AVATAR_SIZE,
                            height: AVATAR_SIZE,
                            borderRadius: '50%',
                            background: '#071020',
                            border: '2px solid #F59E0B',
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
                                    color: '#F59E0B',
                                    letterSpacing: 1,
                                }}>
                                    {initials}
                                </span>
                            )}
                        </div>

                        {/* Team name */}
                        <div style={{
                            position: 'absolute',
                            left: PILL_LEFT + 78,
                            top: elemTop,
                            height: AVATAR_SIZE,
                            display: 'flex',
                            alignItems: 'center',
                            fontFamily: FONT_ROW,
                            fontSize: 46,
                            fontWeight: 600,
                            letterSpacing: 2,
                            color: '#FFFFFF',
                            whiteSpace: 'nowrap',
                            maxWidth: 380,
                            overflow: 'hidden',
                        }}>
                            {team.name}
                        </div>

                        {/* Budget (col 2) */}
                        <div style={{
                            position: 'absolute',
                            left: PILL_LEFT + 490,
                            top: elemTop,
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
                                color: '#475569',
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
                                color: '#94A3B8',
                                lineHeight: 1.1,
                                whiteSpace: 'nowrap',
                            }}>
                                {formatCurrency(budget)}
                            </div>
                        </div>

                        {/* Spent (col 3) */}
                        <div style={{
                            position: 'absolute',
                            left: PILL_LEFT + 770,
                            top: elemTop,
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
                                color: '#475569',
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
                                color: '#94A3B8',
                                lineHeight: 1.1,
                                whiteSpace: 'nowrap',
                            }}>
                                {formatCurrency(spent)}
                            </div>
                        </div>

                        {/* Balance (col 4) */}
                        <div style={{
                            position: 'absolute',
                            left: PILL_LEFT + 1060,
                            top: elemTop,
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
                                color: '#475569',
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

                        {/* Row divider */}
                        {i < rowCount - 1 && (
                            <div style={{
                                position: 'absolute',
                                left: PILL_LEFT + 10,
                                top: pillTop + PILL_H + 13,
                                width: PILL_WIDTH - 20,
                                height: 1,
                                background: 'rgba(30,58,95,0.5)',
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
