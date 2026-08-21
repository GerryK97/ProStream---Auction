'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Player, Team, Tournament } from '@/types';
import { getEnabledTeamOfficials } from '@/lib/teamOfficials';
import { TICKER_T3_HEIGHT } from './TickerT3Shared';

const CANVAS_W = 1920;
const CANVAS_H = 1080;
/** Keep bottom row names above the fixed ticker rail. */
const TICKER_CLEARANCE = TICKER_T3_HEIGHT + 12;
const TOP_PAD = 48;
const CENTER_H = 148;
/** Base card size (used when a row has ≤5 cards). */
const BASE_CARD_W = 276;
const BASE_CARD_H = 368;
const CARD_GAP = 16;
const ROW_INNER_MAX = 1840;
/** Hard cap per screen; fewer slots when squadSize is smaller. */
const MAX_PLAYERS_PER_PAGE = 12;
/** Dual-row layout once a page has more than this many slots. */
const MAX_PER_ROW = 6;
const PAGE_MS = 8000;
const EXIT_MS = 420;
const ENTER_MS = 560;

function cardSizeForRow(count: number): { w: number; h: number; gap: number } {
    const n = Math.max(1, count);
    const w = Math.min(BASE_CARD_W, Math.floor((ROW_INNER_MAX - (n - 1) * CARD_GAP) / n));
    const h = Math.round(w * (BASE_CARD_H / BASE_CARD_W));
    return { w, h, gap: CARD_GAP };
}

/** Even split across two rows; each row capped at MAX_PER_ROW. */
function splitForPage(count: number): { top: number; bottom: number } {
    if (count <= MAX_PER_ROW) return { top: 0, bottom: count };
    const top = Math.min(MAX_PER_ROW, Math.ceil(count / 2));
    return { top, bottom: count - top };
}

/** Theme 3 overlay tokens — aligned with TickerT3Shared */
const T3 = {
    accent: 'var(--t3-accent, #00898c)',
    accentSoft: 'var(--t3-accent-soft, rgba(0,137,140,0.14))',
    panel: 'var(--t3-bg-panel, #202020)',
    card: 'var(--t3-bg-card, #2A2F35)',
    cardRaised: 'var(--t3-bg-card-raised, #3a4048)',
    textPrimary: 'var(--t3-text-primary, #ffffff)',
    textSecondary: 'var(--t3-text-secondary, #cccccc)',
    textMuted: 'var(--t3-text-muted, #999999)',
    onAccent: 'var(--t3-on-accent, #ffffff)',
    playerNoBg: 'var(--t3-player-no-bg, #ffffff)',
    playerNoText: 'var(--t3-player-no-text, #111827)',
    playerNoBorder: 'var(--t3-player-no-border, rgba(0,0,0,0.14))',
    shadow: 'var(--t3-shadow-color, rgba(0,0,0,0.45))',
} as const;

type AnimPhase = 'entering' | 'visible' | 'exiting';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap');
  @keyframes t3TwiBandInTop {
    from { opacity: 0; transform: translateY(-32px) scale(0.96); filter: blur(5px); }
    to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  }
  @keyframes t3TwiBandOutTop {
    from { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    to   { opacity: 0; transform: translateY(-22px) scale(0.97); filter: blur(4px); }
  }
  @keyframes t3TwiBandInBottom {
    from { opacity: 0; transform: translateY(32px) scale(0.96); filter: blur(5px); }
    to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  }
  @keyframes t3TwiBandOutBottom {
    from { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    to   { opacity: 0; transform: translateY(22px) scale(0.97); filter: blur(4px); }
  }
  @keyframes t3TwiCardIn {
    from { opacity: 0; transform: translateY(28px) scale(0.9); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes t3TwiCardOut {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to   { opacity: 0; transform: translateY(-16px) scale(0.92); }
  }
  @keyframes t3TwiCenterIn {
    from { opacity: 0; transform: scaleX(0.88); }
    to   { opacity: 1; transform: scaleX(1); }
  }
  @keyframes t3TwiCenterOut {
    from { opacity: 1; transform: scaleX(1); }
    to   { opacity: 0; transform: scaleX(0.92); }
  }
  @keyframes t3TwiRootIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .t3-twi-anim { animation: none !important; transition: none !important; }
  }
`;

interface TeamWiseImageT3Props {
    teams: Team[];
    players: Player[];
    tournament: Tournament | null;
    teamId?: string;
    isExiting?: boolean;
}

interface TeamBlock {
    team: Team;
    players: Player[];
    total: number;
}

function buildTeamBlocks(teams: Team[], players: Player[], teamId?: string): TeamBlock[] {
    const blocks = teams
        .map(team => {
            const sold = players
                .filter(p => p.isSold && p.winningTeamId === team._id)
                .sort((a, b) => (b.finalPrice ?? 0) - (a.finalPrice ?? 0) || a.name.localeCompare(b.name));
            return {
                team,
                players: sold,
                total: sold.reduce((sum, p) => sum + (p.finalPrice ?? 0), 0),
            };
        })
        .filter(block => block.players.length > 0)
        .sort((a, b) => b.total - a.total || b.players.length - a.players.length);

    if (teamId) {
        const match = blocks.find(b => b.team._id === teamId);
        return match ? [match] : blocks;
    }
    return blocks;
}

function buildSquadSlots(soldPlayers: Player[], squadSize: number): (Player | null)[] {
    const size = Math.max(0, squadSize);
    return Array.from({ length: size }, (_, i) => soldPlayers[i] ?? null);
}

function teamPlayerPages(squadSize: number): number {
    if (squadSize <= 0) return 1;
    return Math.max(1, Math.ceil(squadSize / MAX_PLAYERS_PER_PAGE));
}

function pageSlotCount(squadSlots: (Player | null)[], page: number): number {
    const pageStart = page * MAX_PLAYERS_PER_PAGE;
    if (pageStart >= squadSlots.length) return 0;
    return Math.min(MAX_PLAYERS_PER_PAGE, squadSlots.length - pageStart);
}

function pageCardRows(
    squadSlots: (Player | null)[],
    page: number,
): { cards: (Player | null)[]; startIdx: number }[] {
    const pageStart = page * MAX_PLAYERS_PER_PAGE;
    const countOnPage = pageSlotCount(squadSlots, page);
    if (countOnPage === 0) return [];

    const { top, bottom } = splitForPage(countOnPage);
    const slots = squadSlots.slice(pageStart, pageStart + countOnPage);

    if (top === 0) {
        return [{ cards: slots, startIdx: pageStart }];
    }

    return [
        { cards: slots.slice(0, top), startIdx: pageStart },
        { cards: slots.slice(top, top + bottom), startIdx: pageStart + top },
    ];
}

function bandAnimation(phase: AnimPhase): React.CSSProperties {
    if (phase === 'entering') {
        return {
            animation: `t3TwiBandInBottom ${ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        };
    }
    if (phase === 'exiting') {
        return {
            animation: `t3TwiBandOutBottom ${EXIT_MS}ms cubic-bezier(0.4, 0, 0.2, 1) both`,
        };
    }
    return {};
}

function cardAnimation(phase: AnimPhase, cardIndex: number, rowCount: number): React.CSSProperties {
    const stagger = cardIndex * 70;
    if (phase === 'entering') {
        return {
            animation: `t3TwiCardIn ${ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${stagger}ms both`,
        };
    }
    if (phase === 'exiting') {
        const reverse = (Math.max(1, rowCount) - 1 - cardIndex) * 50;
        return {
            animation: `t3TwiCardOut ${EXIT_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${reverse}ms both`,
        };
    }
    return {};
}

function centerAnimation(phase: AnimPhase): React.CSSProperties {
    if (phase === 'entering') {
        return { animation: `t3TwiCenterIn ${ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both` };
    }
    if (phase === 'exiting') {
        return { animation: `t3TwiCenterOut ${EXIT_MS}ms cubic-bezier(0.4, 0, 0.2, 1) both` };
    }
    return {};
}

function PlayerCard({
    player,
    index,
    animPhase,
    cardIndex,
    rowCount,
    cardW,
    cardH,
}: {
    player: Player | null;
    index: number;
    animPhase: AnimPhase;
    cardIndex: number;
    rowCount: number;
    cardW: number;
    cardH: number;
}) {
    const animStyle = cardAnimation(animPhase, cardIndex, rowCount);
    const scale = cardW / BASE_CARD_W;
    const nameSize = Math.max(14, Math.round(20 * scale));
    const badgeSize = Math.max(13, Math.round(18 * scale));

    if (!player) {
        return (
            <div
                className="t3-twi-anim"
                style={{
                    width: cardW,
                    height: cardH,
                    background: T3.accentSoft,
                    border: '2px dashed var(--t3-accent-soft, rgba(0,137,140,0.35))',
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    ...animStyle,
                }}
            >
                <div style={{ fontSize: Math.round(28 * scale), fontWeight: 900, color: T3.textMuted }}>—</div>
                <div style={{ fontSize: Math.max(11, Math.round(14 * scale)), fontWeight: 700, color: T3.textSecondary, letterSpacing: '0.12em' }}>
                    OPEN SLOT
                </div>
            </div>
        );
    }

    const photoSrc = player.photoURL?.trim() || player.secondaryImageURL?.trim() || '';

    return (
        <div
            className="t3-twi-anim"
            style={{
                width: cardW,
                height: cardH,
                background: T3.card,
                border: `3px solid ${T3.accent}`,
                borderRadius: 4,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: `0 8px 24px ${T3.shadow}`,
                ...animStyle,
            }}
        >
            <div
                style={{
                    flex: 1,
                    position: 'relative',
                    background: `linear-gradient(180deg, ${T3.cardRaised} 0%, ${T3.panel} 100%)`,
                }}
            >
                {photoSrc ? (
                    <img
                        src={photoSrc}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                    />
                ) : (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: Math.round(72 * scale),
                            fontWeight: 900,
                            color: 'rgba(var(--t3-text-primary-rgb, 255,255,255), 0.12)',
                        }}
                    >
                        {player.name.charAt(0)}
                    </div>
                )}
                <div
                    style={{
                        position: 'absolute',
                        top: Math.round(10 * scale),
                        left: Math.round(10 * scale),
                        background: T3.playerNoBg,
                        color: T3.playerNoText,
                        fontSize: badgeSize,
                        fontWeight: 900,
                        padding: `${Math.round(4 * scale)}px ${Math.round(10 * scale)}px`,
                        borderRadius: 5,
                        border: `1px solid ${T3.playerNoBorder}`,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.28)',
                    }}
                >
                    #{index + 1}
                </div>
            </div>
            <div style={{ padding: `${Math.round(12 * scale)}px ${Math.round(14 * scale)}px`, background: T3.panel, flexShrink: 0 }}>
                <div
                    style={{
                        fontSize: nameSize,
                        fontWeight: 900,
                        color: T3.textPrimary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {player.name}
                </div>
            </div>
        </div>
    );
}

function PlayerCardsSet({
    rows,
    animPhase,
}: {
    rows: { cards: (Player | null)[]; startIdx: number }[];
    animPhase: AnimPhase;
}) {
    if (rows.length === 0) return null;

    const maxInRow = Math.max(...rows.map(r => r.cards.length), 1);
    let { w: cardW, h: cardH, gap } = cardSizeForRow(maxInRow);

    /** Keep two-row sets inside the canvas below the top strip. */
    const availableH = CANVAS_H - TOP_PAD - TICKER_CLEARANCE - CENTER_H - 48;
    const rowGap = 20;
    const neededH = rows.length * cardH + Math.max(0, rows.length - 1) * rowGap;
    if (neededH > availableH) {
        const scale = availableH / neededH;
        cardW = Math.max(160, Math.round(cardW * scale));
        cardH = Math.max(220, Math.round(cardH * scale));
    }

    return (
        <div
            className="t3-twi-anim"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: rowGap,
                width: '100%',
                flex: 1,
                minHeight: 0,
                ...bandAnimation(animPhase),
            }}
        >
            {rows.map(row => (
                <div
                    key={`row-${row.startIdx}`}
                    style={{ display: 'flex', gap, alignItems: 'flex-end', justifyContent: 'center' }}
                >
                    {row.cards.map((player, i) => (
                        <PlayerCard
                            key={player?._id ?? `empty-${row.startIdx}-${i}`}
                            player={player}
                            index={row.startIdx + i}
                            animPhase={animPhase}
                            cardIndex={i}
                            rowCount={row.cards.length}
                            cardW={cardW}
                            cardH={cardH}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

function CenterStrip({
    block,
    tournamentName,
    tournamentLogoURL,
    teamIndex,
    teamCount,
    playerPage,
    totalPages,
    animPhase,
    officials,
}: {
    block: TeamBlock | null;
    tournamentName: string;
    tournamentLogoURL?: string | null;
    teamIndex: number;
    teamCount: number;
    playerPage: number;
    totalPages: number;
    animPhase: AnimPhase;
    officials?: { role: string; name: string; photoURL?: string }[];
}) {
    const showTeamPagination = teamCount > 1;
    const showPagePagination = totalPages > 1;
    const barText = '#ffffff';

    return (
        <div
            className="t3-twi-anim"
            style={{
                height: CENTER_H,
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                ...centerAnimation(animPhase),
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: T3.accent,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    left: 72,
                    top: 0,
                    height: CENTER_H,
                    width: CENTER_H,
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {block?.team.logoURL ? (
                    <img
                        src={block.team.logoURL}
                        alt={block.team.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                ) : (
                    <div
                        style={{
                            width: '72%',
                            height: '72%',
                            borderRadius: 10,
                            border: '2px solid rgba(255,255,255,0.55)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: barText,
                            fontSize: 28,
                            fontWeight: 800,
                            letterSpacing: 1,
                        }}
                    >
                        {(block?.team.shortCode || block?.team.name || 'T').slice(0, 2).toUpperCase()}
                    </div>
                )}
            </div>
            <div
                style={{
                    position: 'absolute',
                    right: 72,
                    top: 0,
                    height: CENTER_H,
                    width: CENTER_H,
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {tournamentLogoURL ? (
                    <img
                        src={tournamentLogoURL}
                        alt={tournamentName}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                ) : (
                    <div
                        style={{
                            width: '72%',
                            height: '72%',
                            borderRadius: 10,
                            border: '2px solid rgba(255,255,255,0.55)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: barText,
                            fontSize: 28,
                            fontWeight: 800,
                            letterSpacing: 1,
                        }}
                    >
                        {(tournamentName || 'T').slice(0, 2).toUpperCase()}
                    </div>
                )}
            </div>
            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingLeft: CENTER_H + 88,
                    paddingRight: CENTER_H + 88,
                    gap: 10,
                    fontFamily: "'Open Sans', sans-serif",
                }}
            >
            <div
                style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: barText,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {tournamentName}
            </div>

            {block ? (
                <div
                    style={{
                        fontSize: 52,
                        fontWeight: 900,
                        color: barText,
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        lineHeight: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                    }}
                >
                    {block.team.name}
                </div>
            ) : (
                <div style={{ fontSize: 28, fontWeight: 800, color: barText, letterSpacing: '0.1em' }}>—</div>
            )}

            {block && officials && officials.length > 0 && (
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                    {officials.map((o) => (
                        <div key={o.role} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            {o.photoURL && (
                                <img src={o.photoURL} alt={o.name}
                                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${barText}` }} />
                            )}
                            <div style={{ minWidth: 0, textAlign: 'left' }}>
                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: barText, opacity: 0.85, lineHeight: 1 }}>{o.role}</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: barText, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{o.name}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(showTeamPagination || showPagePagination) && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 8,
                        marginTop: 2,
                    }}
                >
                    {showTeamPagination &&
                        Array.from({ length: teamCount }).map((_, i) => (
                            <div
                                key={`team-${i}`}
                                style={{
                                    width: i === teamIndex ? 18 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    background: i === teamIndex ? barText : 'rgba(255,255,255,0.35)',
                                    transition: 'width 0.3s ease, background 0.3s ease',
                                }}
                            />
                        ))}
                    {showTeamPagination && showPagePagination && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>|</span>
                    )}
                    {showPagePagination &&
                        Array.from({ length: totalPages }).map((_, i) => (
                            <div
                                key={`page-${i}`}
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: i === playerPage ? barText : 'rgba(255,255,255,0.35)',
                                    transition: 'background 0.3s ease',
                                }}
                            />
                        ))}
                </div>
            )}
            </div>
        </div>
    );
}

export default function TeamWiseImageT3({ teams, players, tournament, teamId, isExiting }: TeamWiseImageT3Props) {
    const blocks = useMemo(() => buildTeamBlocks(teams, players, teamId), [teams, players, teamId]);
    const squadSize = Math.max(0, tournament?.squadSize ?? 0);

    const [teamIndex, setTeamIndex] = useState(0);
    const [playerPage, setPlayerPage] = useState(0);
    const [animPhase, setAnimPhase] = useState<AnimPhase>('entering');

    const safeTeamIndex = blocks.length > 0 ? teamIndex % blocks.length : 0;
    const currentBlock = blocks[safeTeamIndex] ?? null;
    const squadSlots = useMemo(
        () => (currentBlock ? buildSquadSlots(currentBlock.players, squadSize) : []),
        [currentBlock, squadSize],
    );
    const totalPages = squadSize > 0 ? teamPlayerPages(squadSize) : 1;

    useEffect(() => {
        setTeamIndex(0);
        setPlayerPage(0);
        setAnimPhase('entering');
        const t = window.setTimeout(() => setAnimPhase('visible'), ENTER_MS + 350);
        return () => window.clearTimeout(t);
    }, [teamId, blocks.length, squadSize]);

    useEffect(() => {
        if (isExiting) setAnimPhase('exiting');
    }, [isExiting]);

    const paginationRef = useRef({
        teamCount: blocks.length,
        totalPages,
        isExiting: Boolean(isExiting),
    });
    paginationRef.current = { teamCount: blocks.length, totalPages, isExiting: Boolean(isExiting) };

    useEffect(() => {
        if (blocks.length === 0) return;

        let cancelled = false;
        let timeoutId: number | undefined;

        const advanceSlide = () => {
            if (cancelled || paginationRef.current.isExiting) return;
            setAnimPhase('exiting');
            window.setTimeout(() => {
                if (cancelled || paginationRef.current.isExiting) return;
                setPlayerPage(prev => {
                    const { totalPages: pages, teamCount } = paginationRef.current;
                    if (prev + 1 < pages) return prev + 1;
                    if (teamCount > 1) {
                        setTeamIndex(ti => (ti + 1) % teamCount);
                    }
                    return 0;
                });
                setAnimPhase('entering');
                window.setTimeout(() => {
                    if (cancelled) return;
                    setAnimPhase('visible');
                    scheduleNext();
                }, ENTER_MS + 350);
            }, EXIT_MS);
        };

        const scheduleNext = () => {
            if (cancelled || paginationRef.current.isExiting) return;
            const { teamCount, totalPages: pages } = paginationRef.current;
            if (teamCount <= 1 && pages <= 1) return;

            timeoutId = window.setTimeout(advanceSlide, PAGE_MS);
        };

        const startDelay = window.setTimeout(() => {
            if (!cancelled && !paginationRef.current.isExiting) scheduleNext();
        }, ENTER_MS + 350);

        return () => {
            cancelled = true;
            window.clearTimeout(startDelay);
            if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        };
    }, [teamId, blocks.length, squadSize, isExiting]);

    if (blocks.length === 0) {
        return (
            <div
                style={{
                    width: CANVAS_W,
                    height: CANVAS_H,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    color: T3.textMuted,
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    fontFamily: "'Open Sans', sans-serif",
                }}
            >
                NO SOLD PLAYERS YET
            </div>
        );
    }

    const cardRows = pageCardRows(squadSlots, playerPage);

    return (
        <>
            <style>{CSS}</style>
            <div
                className="t3-twi-anim"
                style={{
                    width: CANVAS_W,
                    height: CANVAS_H,
                    position: 'relative',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    paddingTop: TOP_PAD,
                    paddingBottom: TICKER_CLEARANCE,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    background: 'transparent',
                    fontFamily: "'Open Sans', sans-serif",
                    animation: animPhase === 'entering' ? `t3TwiRootIn ${ENTER_MS}ms ease both` : undefined,
                }}
            >
                <CenterStrip
                    block={currentBlock}
                    tournamentName={tournament?.name ?? 'AUCTION'}
                    tournamentLogoURL={tournament?.logoURL}
                    teamIndex={safeTeamIndex}
                    teamCount={blocks.length}
                    playerPage={playerPage}
                    totalPages={totalPages}
                    animPhase={animPhase}
                    officials={currentBlock?.team ? getEnabledTeamOfficials(currentBlock.team, tournament) : undefined}
                />

                <PlayerCardsSet rows={cardRows} animPhase={animPhase} />
            </div>
        </>
    );
}
