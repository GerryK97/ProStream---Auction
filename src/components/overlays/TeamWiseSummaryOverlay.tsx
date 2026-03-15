'use client';

import React, { useState, useEffect } from 'react';
import { Player, Team, Tournament } from '@/types';

interface TeamWiseSummaryOverlayProps {
    players: Player[];
    teams: Team[];
    tournament: Tournament | null;
    isExiting?: boolean;
}

const formatCurrency = (amount: number) => amount.toLocaleString('en-IN');

// Layout constants (1920×1080 canvas) — matches other summary overlays
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const PANEL_LEFT = 230;
const PANEL_WIDTH = 1460;
const HEADER_H = 160;        // taller than normal heading to fit logo + name
const SEPARATOR_H = 2;
const ROW_AREA_TOP_PAD = 24;
const ROW_BOTTOM_PAD = 24;
const PILL_LEFT = PANEL_LEFT + 44;   // 274
const PILL_WIDTH = PANEL_WIDTH - 88; // 1372
const PILL_H = 53;
const AVATAR_SIZE = 70;
const AVATAR_OVERLAP = (AVATAR_SIZE - PILL_H) / 2; // 8.5
const ROW_SPACING = 80;
const TEAM_DURATION = 8000;

const FONT_HEADING = "'Bebas Neue', cursive";
const FONT_ROW = "'Rajdhani', sans-serif";

const TeamWiseSummaryOverlay: React.FC<TeamWiseSummaryOverlayProps> = ({
    players,
    teams,
    tournament,
    isExiting = false,
}) => {
    const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

    // Build teams that have at least one sold player, sorted by player count desc
    const teamsWithPlayers = teams
        .map(team => ({
            team,
            soldPlayers: players
                .filter(p => p.isSold && p.winningTeamId === team._id)
                .sort((a, b) => (b.finalPrice || 0) - (a.finalPrice || 0)),
        }))
        .filter(({ soldPlayers }) => soldPlayers.length > 0)
        .sort((a, b) => b.soldPlayers.length - a.soldPlayers.length);

    const totalTeams = teamsWithPlayers.length;

    useEffect(() => {
        if (totalTeams <= 1) return;
        const timer = setInterval(() => {
            setCurrentTeamIndex(prev => (prev + 1) % totalTeams);
        }, TEAM_DURATION);
        return () => clearInterval(timer);
    }, [totalTeams]);

    // Reset to first team when team composition changes
    useEffect(() => {
        setCurrentTeamIndex(0);
    }, [totalTeams]);

    if (!tournament || totalTeams === 0) return null;

    const { team: currentTeam, soldPlayers: currentPlayers } = teamsWithPlayers[currentTeamIndex];
    const teamTotal = currentPlayers.reduce((sum, p) => sum + (p.finalPrice || 0), 0);
    const rowCount = currentPlayers.length;
    const contentH = HEADER_H + SEPARATOR_H + ROW_AREA_TOP_PAD + rowCount * ROW_SPACING + ROW_BOTTOM_PAD;
    const panelTop = Math.round((CANVAS_H - contentH) / 2);
    const firstPillTop = panelTop + HEADER_H + SEPARATOR_H + ROW_AREA_TOP_PAD;

    const dashAnim = isExiting
        ? 'summaryDashOut 0.35s ease 1.25s both'
        : 'summaryDashIn 0.30s ease 0s both';

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

                {/* ── Team Header ── */}
                <div style={{
                    position: 'absolute',
                    left: PANEL_LEFT,
                    top: panelTop,
                    width: PANEL_WIDTH,
                    height: HEADER_H,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 40,
                    paddingRight: 40,
                    gap: 28,
                    animation: dashAnim,
                }}>
                    {/* Team logo */}
                    {currentTeam.logoURL ? (
                        <img
                            src={currentTeam.logoURL}
                            alt={currentTeam.name}
                            style={{
                                width: 96,
                                height: 96,
                                objectFit: 'contain',
                                flexShrink: 0,
                                filter: 'drop-shadow(0 0 8px rgba(var(--overlay-color-primary-rgb),0.4))',
                            }}
                        />
                    ) : (
                        <div style={{
                            width: 96,
                            height: 96,
                            borderRadius: '50%',
                            background: 'rgba(var(--overlay-color-primary-rgb),0.12)',
                            border: '2px solid rgba(var(--overlay-color-primary-rgb),0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: FONT_HEADING,
                            fontSize: 30,
                            color: 'var(--overlay-color-primary)',
                            flexShrink: 0,
                        }}>
                            {currentTeam.shortCode?.slice(0, 2) ?? currentTeam.name.slice(0, 2).toUpperCase()}
                        </div>
                    )}

                    {/* Team name + sub-info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontFamily: FONT_HEADING,
                            fontSize: 72,
                            color: 'var(--overlay-color-primary)',
                            letterSpacing: 6,
                            lineHeight: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {currentTeam.name.toUpperCase()}
                        </div>
                        <div style={{
                            fontFamily: FONT_ROW,
                            fontSize: 22,
                            fontWeight: 500,
                            color: 'var(--overlay-text-subtle)',
                            letterSpacing: 2,
                            marginTop: 4,
                        }}>
                            {currentPlayers.length} PLAYER{currentPlayers.length !== 1 ? 'S' : ''}&nbsp;·&nbsp;TOTAL {formatCurrency(teamTotal)}
                        </div>
                    </div>

                    {/* Team pagination dots */}
                    {totalTeams > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            {teamsWithPlayers.map((_, i) => (
                                <div key={i} style={{
                                    width: i === currentTeamIndex ? 24 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    background: i === currentTeamIndex ? 'var(--overlay-color-primary)' : 'var(--overlay-border-accent-subtle)',
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
                    top: panelTop + HEADER_H,
                    width: PANEL_WIDTH - 40,
                    height: SEPARATOR_H,
                    background: 'linear-gradient(90deg, var(--overlay-color-primary) 0%, rgba(var(--overlay-color-primary-rgb),0.15) 100%)',
                    animation: dashAnim,
                }} />

                {/* ── Player rows ── */}
                {currentPlayers.map((player, i) => {
                    const pillTop = firstPillTop + i * ROW_SPACING;
                    const elemTop = pillTop - AVATAR_OVERLAP;
                    const initials = player.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

                    return (
                        <React.Fragment key={`${currentTeamIndex}-${player._id}`}>
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

                                {/* Avatar circle */}
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
                                            color: 'var(--overlay-color-primary)',
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
                                    fontSize: 46,
                                    fontWeight: 600,
                                    letterSpacing: 2,
                                    color: 'var(--overlay-text-bright)',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 480,
                                    overflow: 'hidden',
                                }}>
                                    {player.name}
                                </div>

                                {/* Position */}
                                <div style={{
                                    position: 'absolute',
                                    left: 595,
                                    top: 0,
                                    height: AVATAR_SIZE,
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontFamily: FONT_ROW,
                                    fontSize: 46,
                                    fontWeight: 500,
                                    letterSpacing: 2,
                                    color: 'var(--overlay-text-subtle)',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 440,
                                    overflow: 'hidden',
                                }}>
                                    {player.position ?? '—'}
                                </div>

                                {/* Sold Amount / Iconic Badge */}
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
                                    letterSpacing: player.isIconic ? 6 : 2,
                                    color: 'var(--overlay-color-primary)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {player.isIconic ? 'ICONIC' : formatCurrency(player.finalPrice || 0)}
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

export default TeamWiseSummaryOverlay;
