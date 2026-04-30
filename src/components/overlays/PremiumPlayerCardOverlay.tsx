'use client';

import React from 'react';
import { Player, Team, Tournament } from '@/types';

interface PremiumPlayerCardOverlayProps {
    currentPlayer: Player | undefined;
    tournament: Tournament | null;
    teams: Team[];

    position?: 'center' | 'left' | 'right';
    showPlayerImage?: boolean;
    showBackgroundText?: boolean;
    showJerseyNumber?: boolean;
    showDecorativeBadges?: boolean;
    showPlayerName?: boolean;
    showRoleLabel?: boolean;
    showStatsSection?: boolean;
    showMatches?: boolean;
    showScore?: boolean;
    showWickets?: boolean;
    gradientStart?: string;
    gradientEnd?: string;
    cardBackground?: string;
    playerNameColor?: string;
    statValueColor?: string;
    statLabelColor?: string;
    statsSectionBackground?: string;
    jerseyBadgeGradientStart?: string;
    jerseyBadgeGradientEnd?: string;
    decorativeBadgeColor?: string;
    watermarkColor?: string;
    cardSize?: 'small' | 'medium' | 'large';
    borderRadius?: 'none' | 'small' | 'medium' | 'large';
    opacity?: number;
    roleLabel?: string;
    backgroundTextLine1?: string;
    backgroundTextLine2?: string;
}

const prettifyKey = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();

const PremiumPlayerCardOverlay: React.FC<PremiumPlayerCardOverlayProps> = ({
    currentPlayer,
    tournament,
    showJerseyNumber = true,
    showPlayerName = true,
    showRoleLabel = true,
    showStatsSection = true,
    cardSize = 'medium',
    opacity = 100,
}) => {
    if (!currentPlayer || tournament?.status !== 'Live') return null;

    const photoUrl = currentPlayer.photoURL || tournament?.logoURL || '';

    // Collect up to 3 stats
    const rawStats = currentPlayer.stats ?? {};
    const statEntries = Object.entries(rawStats).slice(0, 3).map(([key, val]) => ({
        label: prettifyKey(key),
        value: val,
    }));

    const dorsalText = showJerseyNumber && currentPlayer.playerNo
        ? `#${currentPlayer.playerNo}`
        : '';

    // Sizes — card container is always 494×605 for 'large' (set by CustomOverlay)
    const cfg = {
        small:  { panelH: 200, diag: 38, nameFs: 20, jerseyFs: 72,  statsH: 60 },
        medium: { panelH: 240, diag: 46, nameFs: 26, jerseyFs: 88,  statsH: 66 },
        large:  { panelH: 275, diag: 54, nameFs: 32, jerseyFs: 108, statsH: 72 },
    }[cardSize];

    // Photo height = 100% - (panelH - diag). At this height the photo's diagonal
    // bottom edge aligns perfectly with the white panel's diagonal top edge.
    const photoHeightSubtract = cfg.panelH - cfg.diag; // e.g. 275-54=221 → photo=calc(100%-221px)

    const hasStats = showStatsSection && statEntries.length > 0;

    // Dynamic name font: shrink for long names
    const nameLen = currentPlayer.name.length;
    const nameFontSize = nameLen > 18 ? cfg.nameFs * 0.72 : nameLen > 12 ? cfg.nameFs * 0.86 : cfg.nameFs;

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');`}</style>

            {/* Card — white background so no-photo state looks clean */}
            <div
                className="animate-slide-in-top"
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    backgroundColor: 'white',
                    fontFamily: "'Varela Round', sans-serif",
                    borderRadius: 6,
                    overflow: 'hidden',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
                    opacity: opacity / 100,
                }}
            >
                {/* ── Player photo — top portion, clipped diagonally at bottom ── */}
                {photoUrl && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        // Extends just far enough so its diagonal bottom aligns with the panel's diagonal top
                        height: `calc(100% - ${photoHeightSubtract}px)`,
                        overflow: 'hidden',
                        // Clip bottom edge: right side is higher, left side is lower — same 15° slope
                        clipPath: `polygon(0% 0%, 100% 0%, 100% calc(100% - ${cfg.diag}px), 0% 100%)`,
                    }}>
                        <img
                            src={photoUrl}
                            alt={currentPlayer.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center top',
                                display: 'block',
                            }}
                        />
                    </div>
                )}

                {/* ── White bottom panel — diagonal top edge ── */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: cfg.panelH,
                    background: 'var(--overlay-bg-panel)',
                    border: '1.5px solid var(--overlay-border-light)',
                    // Top edge: right side at 0px (top of panel), left side at cfg.diag px — matches photo clip
                    clipPath: `polygon(0% ${cfg.diag}px, 100% 0%, 100% 100%, 0% 100%)`,
                }}>

                    {/* Jersey / dorsal number — top right */}
                    {dorsalText && (
                        <div style={{
                            position: 'absolute',
                            top: cfg.diag - 14,
                            right: 14,
                            color: '#E7C403',
                            fontSize: cfg.jerseyFs,
                            fontWeight: 'bold',
                            lineHeight: 1,
                            letterSpacing: -3,
                        }}>
                            {dorsalText}
                        </div>
                    )}

                    {/* Player name */}
                    {showPlayerName && (
                        <div style={{
                            position: 'absolute',
                            top: cfg.diag + 10,
                            left: 18,
                            right: dorsalText ? cfg.jerseyFs + 22 : 18,
                            fontSize: nameFontSize,
                            fontWeight: 'bold',
                            color: 'var(--overlay-text-bright)',
                            textTransform: 'uppercase',
                            lineHeight: 1.15,
                        }}>
                            {currentPlayer.name}
                        </div>
                    )}

                    {/* Role / class label */}
                    {showRoleLabel && (currentPlayer.playerClass || currentPlayer.position) && (
                        <div style={{
                            position: 'absolute',
                            top: cfg.diag + 10 + nameFontSize * 1.2 + 4,
                            left: 18,
                            fontSize: 11,
                            color: 'var(--overlay-color-primary)',
                            textTransform: 'uppercase',
                            letterSpacing: 2,
                        }}>
                            {currentPlayer.playerClass || currentPlayer.position}
                        </div>
                    )}

                    {/* Stats bar */}
                    {hasStats && (
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: cfg.statsH,
                            borderTop: '1px solid var(--overlay-border-light)',
                            display: 'flex',
                        }}>
                            {statEntries.map((s, i) => (
                                <div key={i} style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    borderLeft: i > 0 ? '1px solid var(--overlay-border-light)' : 'none',
                                }}>
                                    <div style={{ fontSize: 10, color: 'var(--overlay-color-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>
                                        {s.label}
                                    </div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--overlay-text-bright)', lineHeight: 1 }}>
                                        {s.value ?? '—'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PremiumPlayerCardOverlay;
