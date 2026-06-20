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
const PLAYERS_PER_FORMATION = 5;
const PAGE_MS = 8000;
const EXIT_MS = 420;
const ENTER_MS = 560;
const CLR_GOLD = '#D4AF37';
const CLR_GOLD_LIGHT = '#F5E6A8';
const CLR_DARK = '#1A1A1A';
const CLR_CARD = '#2A2F35';
const CLR_MUTED = 'rgba(255,255,255,0.45)';

type AnimPhase = 'entering' | 'visible' | 'exiting';

const CSS = `
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

function buildAllTeamBlocks(teams: Team[], players: Player[], teamId?: string): TeamBlock[] {
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

function buildPairs(blocks: TeamBlock[]): [TeamBlock | null, TeamBlock | null][] {
    if (blocks.length === 0) return [[null, null]];
    const pairs: [TeamBlock | null, TeamBlock | null][] = [];
    for (let i = 0; i < blocks.length; i += 2) {
        pairs.push([blocks[i] ?? null, blocks[i + 1] ?? null]);
    }
    return pairs;
}

function playerPages(count: number): number {
    return Math.max(1, Math.ceil(count / PLAYERS_PER_FORMATION));
}

function pagePlayers(players: Player[], page: number, rowOffset = 0): (Player | null)[] {
    const start = page * PLAYERS_PER_FORMATION + rowOffset;
    const slice = players.slice(start, start + PLAYERS_PER_FORMATION);
    return Array.from({ length: PLAYERS_PER_FORMATION }, (_, i) => slice[i] ?? null);
}

/** One team on screen: top row 1–5, bottom row 6–10 per page. */
function pagePlayersDualRow(players: Player[], page: number, row: 'top' | 'bottom'): (Player | null)[] {
    const rowOffset = row === 'top' ? 0 : PLAYERS_PER_FORMATION;
    const start = page * PLAYERS_PER_FORMATION * 2 + rowOffset;
    const slice = players.slice(start, start + PLAYERS_PER_FORMATION);
    return Array.from({ length: PLAYERS_PER_FORMATION }, (_, i) => slice[i] ?? null);
}

function isDualRowMode(top: TeamBlock | null, bottom: TeamBlock | null): boolean {
    return Boolean(top && !bottom);
}

function formationCards(
    topBlock: TeamBlock | null,
    bottomBlock: TeamBlock | null,
    row: 'top' | 'bottom',
    playerPage: number,
): (Player | null)[] {
    if (isDualRowMode(topBlock, bottomBlock) && topBlock) {
        return pagePlayersDualRow(topBlock.players, playerPage, row);
    }
    const block = row === 'top' ? topBlock : bottomBlock;
    return block ? pagePlayers(block.players, playerPage) : Array(PLAYERS_PER_FORMATION).fill(null);
}

function formationStartIndex(
    topBlock: TeamBlock | null,
    bottomBlock: TeamBlock | null,
    row: 'top' | 'bottom',
    playerPage: number,
): number {
    if (isDualRowMode(topBlock, bottomBlock)) {
        const rowOffset = row === 'top' ? 0 : PLAYERS_PER_FORMATION;
        return playerPage * PLAYERS_PER_FORMATION * 2 + rowOffset;
    }
    const block = row === 'top' ? topBlock : bottomBlock;
    return playerPage * PLAYERS_PER_FORMATION;
}

function maxPlayerPages(top: TeamBlock | null, bottom: TeamBlock | null): number {
    if (isDualRowMode(top, bottom) && top) {
        return Math.max(1, Math.ceil(top.players.length / (PLAYERS_PER_FORMATION * 2)));
    }
    return Math.max(
        top ? playerPages(top.players.length) : 1,
        bottom ? playerPages(bottom.players.length) : 1,
    );
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
        const reverse = (PLAYERS_PER_FORMATION - 1 - cardIndex) * 50;
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
                    border: `2px solid ${CLR_GOLD}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: size * 0.32,
                    fontWeight: 900,
                    color: CLR_GOLD_LIGHT,
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
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
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
                    background: 'rgba(42,47,53,0.55)',
                    border: '2px dashed rgba(212,175,55,0.35)',
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    ...animStyle,
                }}
            >
                <div style={{ fontSize: 28, fontWeight: 900, color: 'rgba(212,175,55,0.5)' }}>—</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: CLR_MUTED, letterSpacing: '0.12em' }}>
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
                background: CLR_CARD,
                border: `3px solid ${CLR_GOLD}`,
                borderRadius: 4,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                ...animStyle,
            }}
        >
            <div
                style={{
                    flex: 1,
                    position: 'relative',
                    background: 'linear-gradient(180deg, #3a4048 0%, #1e2228 100%)',
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
                            color: 'rgba(255,255,255,0.12)',
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
                        background: CLR_GOLD,
                        color: CLR_DARK,
                        fontSize: 18,
                        fontWeight: 900,
                        padding: '4px 10px',
                        borderRadius: 2,
                    }}
                >
                    #{index + 1}
                </div>
            </div>
            <div style={{ padding: '12px 14px', background: CLR_DARK, flexShrink: 0 }}>
                <div
                    style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {player.name}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: CLR_GOLD, marginTop: 3 }}>
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
                        color: CLR_MUTED,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                    }}
                >
                    <span style={{ color: CLR_GOLD_LIGHT }}>
                        {block.players.length} PLAYER{block.players.length !== 1 ? 'S' : ''}
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
                        key={player?._id ?? `empty-${align}-${playerPage}-${i}`}
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

function TeamCenterBlock({
    block,
    align,
    dualRowContinuation,
}: {
    block: TeamBlock | null;
    align: 'left' | 'right';
    dualRowContinuation?: boolean;
}) {
    if (dualRowContinuation && block) {
        return (
            <div style={{ textAlign: 'right' }}>
                <div
                    style={{
                        fontSize: 28,
                        fontWeight: 900,
                        color: CLR_DARK,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                    }}
                >
                    Players 6–10
                </div>
                <div
                    style={{
                        marginTop: 6,
                        fontSize: 15,
                        fontWeight: 800,
                        color: 'rgba(26,26,26,0.72)',
                        letterSpacing: '0.08em',
                    }}
                >
                    {block.team.name}
                </div>
            </div>
        );
    }

    if (!block) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start', opacity: 0.35 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: CLR_MUTED, letterSpacing: '0.1em' }}>—</span>
            </div>
        );
    }

    const { team, total, players } = block;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexDirection: align === 'right' ? 'row-reverse' : 'row',
                textAlign: align === 'right' ? 'right' : 'left',
                maxWidth: '100%',
            }}
        >
            <TeamLogo team={team} size={64} />
            <div style={{ minWidth: 0 }}>
                <div
                    style={{
                        fontSize: 34,
                        fontWeight: 900,
                        color: CLR_DARK,
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
                    {team.name}
                </div>
                <div
                    style={{
                        marginTop: 6,
                        fontSize: 16,
                        fontWeight: 800,
                        color: 'rgba(26,26,26,0.72)',
                        letterSpacing: '0.08em',
                    }}
                >
                    SPENT {formatCurrency(total)} · {players.length} SOLD
                </div>
            </div>
        </div>
    );
}

function CenterStrip({
    topBlock,
    bottomBlock,
    tournamentName,
    pairIndex,
    pairCount,
    playerPage,
    maxPages,
    dualRowMode,
    animPhase,
}: {
    topBlock: TeamBlock | null;
    bottomBlock: TeamBlock | null;
    tournamentName: string;
    pairIndex: number;
    pairCount: number;
    playerPage: number;
    maxPages: number;
    dualRowMode?: boolean;
    animPhase: AnimPhase;
}) {
    return (
        <div
            className="t3-twi-anim"
            style={{
                height: CENTER_H,
                flexShrink: 0,
                background: `linear-gradient(90deg, ${CLR_GOLD} 0%, ${CLR_GOLD_LIGHT} 50%, ${CLR_GOLD} 100%)`,
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                padding: '0 40px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)',
                position: 'relative',
                ...centerAnimation(animPhase),
            }}
        >
            <TeamCenterBlock block={topBlock} align="left" />

            <div style={{ textAlign: 'center', padding: '0 24px' }}>
                <div
                    style={{
                        fontSize: 52,
                        fontWeight: 900,
                        color: CLR_DARK,
                        letterSpacing: '0.08em',
                        lineHeight: 1,
                        textShadow: '0 1px 0 rgba(255,255,255,0.35)',
                    }}
                >
                    {dualRowMode ? 'LINEUP' : 'VS'}
                </div>
                <div
                    style={{
                        marginTop: 6,
                        fontSize: 13,
                        fontWeight: 800,
                        color: 'rgba(26,26,26,0.65)',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        maxWidth: 280,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {tournamentName}
                </div>
                {(pairCount > 1 || maxPages > 1) && (
                    <div
                        style={{
                            marginTop: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                        }}
                    >
                        {pairCount > 1 &&
                            Array.from({ length: pairCount }).map((_, i) => (
                                <div
                                    key={`pair-${i}`}
                                    style={{
                                        width: i === pairIndex ? 18 : 8,
                                        height: 8,
                                        borderRadius: 4,
                                        background: i === pairIndex ? CLR_DARK : 'rgba(26,26,26,0.35)',
                                        transition: 'width 0.3s ease, background 0.3s ease',
                                    }}
                                />
                            ))}
                        {pairCount > 1 && maxPages > 1 && (
                            <span style={{ color: 'rgba(26,26,26,0.4)', fontSize: 10 }}>|</span>
                        )}
                        {maxPages > 1 &&
                            Array.from({ length: maxPages }).map((_, i) => (
                                <div
                                    key={`page-${i}`}
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: i === playerPage ? CLR_DARK : 'rgba(26,26,26,0.35)',
                                        transition: 'background 0.3s ease',
                                    }}
                                />
                            ))}
                    </div>
                )}
            </div>

            <TeamCenterBlock block={bottomBlock} align="right" dualRowContinuation={dualRowMode} />
        </div>
    );
}

export default function TeamWiseImageT3({ teams, players, tournament, teamId, isExiting }: TeamWiseImageT3Props) {
    const blocks = useMemo(() => buildAllTeamBlocks(teams, players, teamId), [teams, players, teamId]);
    const pairs = useMemo(() => buildPairs(blocks), [blocks]);

    const [pairIndex, setPairIndex] = useState(0);
    const [playerPage, setPlayerPage] = useState(0);
    const [animPhase, setAnimPhase] = useState<AnimPhase>('entering');

    const safePairIndex = pairs.length > 0 ? pairIndex % pairs.length : 0;
    const [topBlock, bottomBlock] = pairs[safePairIndex] ?? [null, null];
    const maxPages = maxPlayerPages(topBlock, bottomBlock);

    useEffect(() => {
        setPairIndex(0);
        setPlayerPage(0);
        setAnimPhase('entering');
        const t = window.setTimeout(() => setAnimPhase('visible'), ENTER_MS + 350);
        return () => window.clearTimeout(t);
    }, [teamId, blocks.length]);

    useEffect(() => {
        if (isExiting) setAnimPhase('exiting');
    }, [isExiting]);

    const paginationRef = useRef({ pairCount: pairs.length, maxPages, isExiting: Boolean(isExiting) });
    paginationRef.current = { pairCount: pairs.length, maxPages, isExiting: Boolean(isExiting) };

    useEffect(() => {
        if (pairs.length === 0) return;

        let cancelled = false;
        let timeoutId: number | undefined;

        const advanceSlide = () => {
            if (cancelled || paginationRef.current.isExiting) return;
            setAnimPhase('exiting');
            window.setTimeout(() => {
                if (cancelled || paginationRef.current.isExiting) return;
                setPlayerPage(prev => {
                    const { maxPages: pages, pairCount } = paginationRef.current;
                    if (prev + 1 < pages) return prev + 1;
                    if (pairCount > 1) {
                        setPairIndex(pi => (pi + 1) % pairCount);
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
            const { pairCount, maxPages: pages } = paginationRef.current;
            if (pairCount <= 1 && pages <= 1) return;

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
    }, [teamId, blocks.length, isExiting]);

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
                    color: CLR_MUTED,
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                }}
            >
                NO SOLD PLAYERS YET
            </div>
        );
    }

    const topPages = isDualRowMode(topBlock, bottomBlock) && topBlock
        ? maxPages
        : topBlock ? playerPages(topBlock.players.length) : 1;
    const bottomPages = isDualRowMode(topBlock, bottomBlock) && topBlock
        ? maxPages
        : bottomBlock ? playerPages(bottomBlock.players.length) : 1;

    const topCards = formationCards(topBlock, bottomBlock, 'top', playerPage);
    const bottomCards = formationCards(topBlock, bottomBlock, 'bottom', playerPage);
    const topStartIdx = formationStartIndex(topBlock, bottomBlock, 'top', playerPage);
    const bottomStartIdx = formationStartIndex(topBlock, bottomBlock, 'bottom', playerPage);
    const bottomDisplayBlock = isDualRowMode(topBlock, bottomBlock) ? topBlock : bottomBlock;
    const dualRowMode = isDualRowMode(topBlock, bottomBlock);

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
                    justifyContent: 'space-between',
                    background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    animation: animPhase === 'entering' ? `t3TwiRootIn ${ENTER_MS}ms ease both` : undefined,
                }}
            >
            <FormationBand
                block={topBlock}
                cards={topCards}
                startIdx={topStartIdx}
                align="top"
                playerPage={playerPage}
                totalPages={topPages}
                animPhase={animPhase}
            />

            <CenterStrip
                topBlock={topBlock}
                bottomBlock={dualRowMode ? topBlock : bottomBlock}
                tournamentName={tournament?.name ?? 'AUCTION'}
                pairIndex={safePairIndex}
                pairCount={pairs.length}
                playerPage={playerPage}
                maxPages={maxPages}
                dualRowMode={dualRowMode}
                animPhase={animPhase}
            />

            <FormationBand
                block={bottomDisplayBlock}
                cards={bottomCards}
                startIdx={bottomStartIdx}
                align="bottom"
                playerPage={playerPage}
                totalPages={bottomPages}
                animPhase={animPhase}
            />
            </div>
        </>
    );
}
