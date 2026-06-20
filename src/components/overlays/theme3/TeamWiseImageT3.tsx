'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Player, Team, Tournament } from '@/types';
import { TICKER_T3_HEIGHT } from './TickerT3Shared';

const CANVAS_W = 1920;
const CANVAS_H = 1080;
/** Keep bottom row names above the fixed ticker rail. */
const TICKER_CLEARANCE = TICKER_T3_HEIGHT + 12;
const TOP_PAD = 14;
const CENTER_H = 148;
const FORMATION_LABEL_H = 26;
const CARD_W = 276;
const CARD_H = 368;
const FORMATION_H = FORMATION_LABEL_H + CARD_H + 10;
const PLAYERS_PER_ROW = 5;
const PLAYERS_PER_PAGE = PLAYERS_PER_ROW * 2;
const PAGE_MS = 8000;
const EXIT_MS = 420;
const ENTER_MS = 560;

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

function formatCurrency(n?: number | null): string {
    if (n == null) return '—';
    return n.toLocaleString('en-IN');
}

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
    return Math.max(1, Math.ceil(squadSize / PLAYERS_PER_PAGE));
}

function pageSlotCount(squadSlots: (Player | null)[], page: number): number {
    const pageStart = page * PLAYERS_PER_PAGE;
    if (pageStart >= squadSlots.length) return 0;
    return Math.min(PLAYERS_PER_PAGE, squadSlots.length - pageStart);
}

function isDualRowPage(squadSlots: (Player | null)[], page: number): boolean {
    return pageSlotCount(squadSlots, page) > PLAYERS_PER_ROW;
}

function rowSlots(
    squadSlots: (Player | null)[],
    page: number,
    row: 'top' | 'bottom',
): { cards: (Player | null)[]; startIdx: number } {
    const pageStart = page * PLAYERS_PER_PAGE;
    const countOnPage = pageSlotCount(squadSlots, page);

    if (countOnPage === 0) {
        return { cards: [], startIdx: pageStart };
    }

    if (!isDualRowPage(squadSlots, page)) {
        if (row === 'top') {
            return { cards: [], startIdx: pageStart };
        }
        const cards = squadSlots.slice(pageStart, pageStart + countOnPage);
        return { cards, startIdx: pageStart };
    }

    if (row === 'top') {
        const cards = squadSlots.slice(pageStart, pageStart + PLAYERS_PER_ROW);
        return { cards, startIdx: pageStart };
    }

    const bottomStart = pageStart + PLAYERS_PER_ROW;
    const cards = squadSlots.slice(bottomStart, pageStart + countOnPage);
    return { cards, startIdx: bottomStart };
}

function bandAnimation(align: 'top' | 'bottom', phase: AnimPhase): React.CSSProperties {
    if (phase === 'entering') {
        return {
            animation: `${align === 'top' ? 't3TwiBandInTop' : 't3TwiBandInBottom'} ${ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        };
    }
    if (phase === 'exiting') {
        return {
            animation: `${align === 'top' ? 't3TwiBandOutTop' : 't3TwiBandOutBottom'} ${EXIT_MS}ms cubic-bezier(0.4, 0, 0.2, 1) both`,
        };
    }
    return {};
}

function cardAnimation(phase: AnimPhase, cardIndex: number): React.CSSProperties {
    const stagger = cardIndex * 70;
    if (phase === 'entering') {
        return {
            animation: `t3TwiCardIn ${ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${stagger}ms both`,
        };
    }
    if (phase === 'exiting') {
        const reverse = (PLAYERS_PER_ROW - 1 - cardIndex) * 50;
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

function TeamLogo({ team, size = 56 }: { team: Team | null; size?: number }) {
    if (!team?.logoURL) {
        const initials = (team?.name ?? '?').slice(0, 2).toUpperCase();
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: 8,
                    background: 'rgba(0,0,0,0.35)',
                    border: `2px solid ${T3.accent}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: size * 0.32,
                    fontWeight: 900,
                    color: T3.textPrimary,
                    flexShrink: 0,
                }}
            >
                {initials}
            </div>
        );
    }
    return (
        <img
            src={team.logoURL}
            alt=""
            style={{
                width: size,
                height: size,
                objectFit: 'contain',
                flexShrink: 0,
                filter: `drop-shadow(0 2px 6px ${T3.shadow})`,
            }}
        />
    );
}

function PlayerCard({
    player,
    index,
    animPhase,
    cardIndex,
}: {
    player: Player | null;
    index: number;
    animPhase: AnimPhase;
    cardIndex: number;
}) {
    const animStyle = cardAnimation(animPhase, cardIndex);

    if (!player) {
        return (
            <div
                className="t3-twi-anim"
                style={{
                    width: CARD_W,
                    height: CARD_H,
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
                <div style={{ fontSize: 28, fontWeight: 900, color: T3.textMuted }}>—</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T3.textSecondary, letterSpacing: '0.12em' }}>
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
                width: CARD_W,
                height: CARD_H,
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
                            fontSize: 72,
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
                        top: 10,
                        left: 10,
                        background: T3.playerNoBg,
                        color: T3.playerNoText,
                        fontSize: 18,
                        fontWeight: 900,
                        padding: '4px 10px',
                        borderRadius: 5,
                        border: `1px solid ${T3.playerNoBorder}`,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.28)',
                    }}
                >
                    #{index + 1}
                </div>
            </div>
            <div style={{ padding: '12px 14px', background: T3.panel, flexShrink: 0 }}>
                <div
                    style={{
                        fontSize: 20,
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
                <div style={{ fontSize: 18, fontWeight: 800, color: T3.accent, marginTop: 3 }}>
                    {formatCurrency(player.finalPrice ?? 0)}
                </div>
            </div>
        </div>
    );
}

function FormationBand({
    block,
    cards,
    startIdx,
    align,
    playerPage,
    totalPages,
    animPhase,
}: {
    block: TeamBlock | null;
    cards: (Player | null)[];
    startIdx: number;
    align: 'top' | 'bottom';
    playerPage: number;
    totalPages: number;
    animPhase: AnimPhase;
}) {
    if (cards.length === 0) return null;

    const rowEnd = startIdx + cards.length;
    const rowLabel = block ? `SQUAD ${startIdx + 1}–${rowEnd}` : '';

    return (
        <div
            className="t3-twi-anim"
            style={{
                height: FORMATION_H,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 8,
                flexShrink: 0,
                ...bandAnimation(align, animPhase),
            }}
        >
            {block && (
                <div
                    style={{
                        height: FORMATION_LABEL_H,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        color: T3.textMuted,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                    }}
                >
                    <span style={{ color: T3.textSecondary }}>
                        {rowLabel}
                    </span>
                    {totalPages > 1 && (
                        <>
                            <span>·</span>
                            <span>
                                PAGE {playerPage + 1}/{totalPages}
                            </span>
                        </>
                    )}
                </div>
            )}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
                {cards.map((player, i) => (
                    <PlayerCard
                        key={player?._id ?? `empty-${startIdx}-${playerPage}-${i}`}
                        player={player}
                        index={startIdx + i}
                        animPhase={animPhase}
                        cardIndex={i}
                    />
                ))}
            </div>
        </div>
    );
}

function CenterStrip({
    block,
    tournamentName,
    squadSize,
    teamIndex,
    teamCount,
    playerPage,
    totalPages,
    animPhase,
}: {
    block: TeamBlock | null;
    tournamentName: string;
    squadSize: number;
    teamIndex: number;
    teamCount: number;
    playerPage: number;
    totalPages: number;
    animPhase: AnimPhase;
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
                    position: 'relative',
                    zIndex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 48px',
                    gap: 8,
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
                    maxWidth: 720,
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                        maxWidth: '100%',
                    }}
                >
                    <TeamLogo team={block.team} size={72} />
                    <div style={{ minWidth: 0, textAlign: 'left' }}>
                        <div
                            style={{
                                fontSize: 36,
                                fontWeight: 900,
                                color: barText,
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                                lineHeight: 1.05,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                            }}
                        >
                            {block.team.name}
                        </div>
                        <div
                            style={{
                                marginTop: 6,
                                fontSize: 17,
                                fontWeight: 800,
                                color: barText,
                                letterSpacing: '0.06em',
                            }}
                        >
                            SPENT {formatCurrency(block.total)} · {block.players.length}/{squadSize} SOLD
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ fontSize: 22, fontWeight: 800, color: barText, letterSpacing: '0.1em' }}>—</div>
            )}

            {(showTeamPagination || showPagePagination) && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
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

    const dualRows = isDualRowPage(squadSlots, playerPage);
    const topRow = rowSlots(squadSlots, playerPage, 'top');
    const bottomRow = rowSlots(squadSlots, playerPage, 'bottom');

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
                    justifyContent: dualRows ? 'space-between' : 'center',
                    background: 'transparent',
                    fontFamily: "'Open Sans', sans-serif",
                    animation: animPhase === 'entering' ? `t3TwiRootIn ${ENTER_MS}ms ease both` : undefined,
                }}
            >
                {dualRows ? (
                    <>
                        <FormationBand
                            block={currentBlock}
                            cards={topRow.cards}
                            startIdx={topRow.startIdx}
                            align="top"
                            playerPage={playerPage}
                            totalPages={totalPages}
                            animPhase={animPhase}
                        />

                        <CenterStrip
                            block={currentBlock}
                            tournamentName={tournament?.name ?? 'AUCTION'}
                            squadSize={squadSize}
                            teamIndex={safeTeamIndex}
                            teamCount={blocks.length}
                            playerPage={playerPage}
                            totalPages={totalPages}
                            animPhase={animPhase}
                        />

                        <FormationBand
                            block={currentBlock}
                            cards={bottomRow.cards}
                            startIdx={bottomRow.startIdx}
                            align="bottom"
                            playerPage={playerPage}
                            totalPages={totalPages}
                            animPhase={animPhase}
                        />
                    </>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            justifyContent: 'center',
                            gap: 28,
                            width: '100%',
                        }}
                    >
                        <CenterStrip
                            block={currentBlock}
                            tournamentName={tournament?.name ?? 'AUCTION'}
                            squadSize={squadSize}
                            teamIndex={safeTeamIndex}
                            teamCount={blocks.length}
                            playerPage={playerPage}
                            totalPages={totalPages}
                            animPhase={animPhase}
                        />

                        <FormationBand
                            block={currentBlock}
                            cards={bottomRow.cards}
                            startIdx={bottomRow.startIdx}
                            align="bottom"
                            playerPage={playerPage}
                            totalPages={totalPages}
                            animPhase={animPhase}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
