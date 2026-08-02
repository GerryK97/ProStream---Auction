'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Player, Team, Tournament } from '@/types';
import {
  T4_TWI_BASE_CARD_H,
  T4_TWI_BASE_CARD_W,
  T4_TWI_CANVAS_H,
  T4_TWI_CANVAS_W,
  T4_TWI_CARD_BG,
  T4_TWI_CARD_GAP,
  T4_TWI_ENTER_MS,
  T4_TWI_EXIT_MS,
  T4_TWI_GOLD,
  T4_TWI_GOLD_BAR_H,
  T4_TWI_GOLD_T4,
  T4_TWI_MAX_PER_ROW,
  T4_TWI_MAX_PLAYERS_PER_PAGE,
  T4_TWI_MUTED,
  T4_TWI_NAMEPLATE_MIN_H,
  T4_TWI_NAMEPLATE_RATIO,
  T4_TWI_PAGE_MS,
  T4_TWI_PANEL,
  T4_TWI_ROW_GAP,
  T4_TWI_ROW_INNER_MAX,
  T4_TWI_TEXT,
  T4_TWI_TEXT_TITLE,
  T4_TWI_TICKER_CLEARANCE,
  T4_TWI_TITLE_BAND_H,
  T4_TWI_TITLE_BG,
} from './teamWiseImageT4Layout';

interface Props {
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

type AnimPhase = 'entering' | 'visible' | 'exiting';

/** Champion uses Saira Extra Condensed — Barlow Condensed as close stack. */
const FONT = '"Saira Extra Condensed", "Barlow Condensed", "Oswald", "Arial Narrow", sans-serif';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Saira+Extra+Condensed:wght@600;700&family=Barlow+Condensed:wght@600;700&display=swap');

  @keyframes t4TwiRootIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes t4TwiHeaderIn {
    from { opacity: 0; transform: translateY(-24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes t4TwiHeaderOut {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-16px); }
  }
  @keyframes t4TwiCardIn {
    from { opacity: 0; transform: translateY(28px) scale(0.94); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes t4TwiCardOut {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to   { opacity: 0; transform: translateY(-12px) scale(0.96); }
  }
  @media (prefers-reduced-motion: reduce) {
    .t4-twi-anim { animation: none !important; transition: none !important; }
  }
`;

function cardSizeForRow(count: number): { w: number; h: number; gap: number } {
  const n = Math.max(1, count);
  const w = Math.min(
    T4_TWI_BASE_CARD_W,
    Math.floor((T4_TWI_ROW_INNER_MAX - (n - 1) * T4_TWI_CARD_GAP) / n),
  );
  const h = Math.round(w * (T4_TWI_BASE_CARD_H / T4_TWI_BASE_CARD_W));
  return { w, h, gap: T4_TWI_CARD_GAP };
}

/** Split into 1–3 rows so a full page of 15 is 5+5+5. */
function splitRowSizes(count: number): number[] {
  const n = Math.max(0, count);
  if (n <= 0) return [];
  if (n <= T4_TWI_MAX_PER_ROW) return [n];
  if (n <= T4_TWI_MAX_PER_ROW * 2) {
    const top = Math.min(T4_TWI_MAX_PER_ROW, Math.ceil(n / 2));
    return [top, n - top];
  }
  const row = T4_TWI_MAX_PER_ROW;
  return [row, row, n - row * 2];
}

function buildTeamBlocks(teams: Team[], players: Player[], teamId?: string): TeamBlock[] {
  const blocks = teams
    .map((team) => {
      const sold = players
        .filter((p) => p.isSold && p.winningTeamId === team._id)
        .sort(
          (a, b) =>
            (b.finalPrice ?? 0) - (a.finalPrice ?? 0) || a.name.localeCompare(b.name),
        );
      return {
        team,
        players: sold,
        total: sold.reduce((sum, p) => sum + (p.finalPrice ?? 0), 0),
      };
    })
    .filter((block) => block.players.length > 0)
    .sort((a, b) => b.total - a.total || b.players.length - a.players.length);

  if (teamId) {
    const match = blocks.find((b) => b.team._id === teamId);
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
  return Math.max(1, Math.ceil(squadSize / T4_TWI_MAX_PLAYERS_PER_PAGE));
}

function pageSlotCount(squadSlots: (Player | null)[], page: number): number {
  const pageStart = page * T4_TWI_MAX_PLAYERS_PER_PAGE;
  if (pageStart >= squadSlots.length) return 0;
  return Math.min(T4_TWI_MAX_PLAYERS_PER_PAGE, squadSlots.length - pageStart);
}

function pageCardRows(
  squadSlots: (Player | null)[],
  page: number,
): { cards: (Player | null)[]; startIdx: number }[] {
  const pageStart = page * T4_TWI_MAX_PLAYERS_PER_PAGE;
  const countOnPage = pageSlotCount(squadSlots, page);
  if (countOnPage === 0) return [];

  const sizes = splitRowSizes(countOnPage);
  const slots = squadSlots.slice(pageStart, pageStart + countOnPage);
  const rows: { cards: (Player | null)[]; startIdx: number }[] = [];
  let offset = 0;
  for (const size of sizes) {
    rows.push({
      cards: slots.slice(offset, offset + size),
      startIdx: pageStart + offset,
    });
    offset += size;
  }
  return rows;
}

/** Full display name for compact nameplate. */
function displayPlayerName(full: string): string {
  const name = full.trim();
  return name || '—';
}

function headerAnimation(phase: AnimPhase): React.CSSProperties {
  if (phase === 'entering') {
    return {
      animation: `t4TwiHeaderIn ${T4_TWI_ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
    };
  }
  if (phase === 'exiting') {
    return {
      animation: `t4TwiHeaderOut ${T4_TWI_EXIT_MS}ms cubic-bezier(0.4, 0, 0.2, 1) both`,
    };
  }
  return {};
}

function cardAnimation(phase: AnimPhase, cardIndex: number, rowCount: number): React.CSSProperties {
  const stagger = cardIndex * 70;
  if (phase === 'entering') {
    return {
      animation: `t4TwiCardIn ${T4_TWI_ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${stagger}ms both`,
    };
  }
  if (phase === 'exiting') {
    const reverse = (Math.max(1, rowCount) - 1 - cardIndex) * 50;
    return {
      animation: `t4TwiCardOut ${T4_TWI_EXIT_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${reverse}ms both`,
    };
  }
  return {};
}

/**
 * Theme 4 Team Imagery — Champion Double Starting Lineup layout.
 * Top gold bar + dark title band + vertical headshot columns + bottom gold bar.
 * Data / rotation = Theme 3 Team Imagery.
 */
export default function TeamWiseImageT4({
  teams,
  players,
  tournament,
  teamId,
  isExiting = false,
}: Props) {
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
    const t = window.setTimeout(() => setAnimPhase('visible'), T4_TWI_ENTER_MS + 350);
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
  paginationRef.current = {
    teamCount: blocks.length,
    totalPages,
    isExiting: Boolean(isExiting),
  };

  useEffect(() => {
    if (blocks.length === 0) return;

    let cancelled = false;
    let timeoutId: number | undefined;

    const advanceSlide = () => {
      if (cancelled || paginationRef.current.isExiting) return;
      setAnimPhase('exiting');
      window.setTimeout(() => {
        if (cancelled || paginationRef.current.isExiting) return;
        setPlayerPage((prev) => {
          const { totalPages: pages, teamCount } = paginationRef.current;
          if (prev + 1 < pages) return prev + 1;
          if (teamCount > 1) {
            setTeamIndex((ti) => (ti + 1) % teamCount);
          }
          return 0;
        });
        setAnimPhase('entering');
        window.setTimeout(() => {
          if (cancelled) return;
          setAnimPhase('visible');
          scheduleNext();
        }, T4_TWI_ENTER_MS + 350);
      }, T4_TWI_EXIT_MS);
    };

    const scheduleNext = () => {
      if (cancelled || paginationRef.current.isExiting) return;
      const { teamCount, totalPages: pages } = paginationRef.current;
      if (teamCount <= 1 && pages <= 1) return;
      timeoutId = window.setTimeout(advanceSlide, T4_TWI_PAGE_MS);
    };

    const startDelay = window.setTimeout(() => {
      if (!cancelled && !paginationRef.current.isExiting) scheduleNext();
    }, T4_TWI_ENTER_MS + 350);

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
          width: T4_TWI_CANVAS_W,
          height: T4_TWI_CANVAS_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          color: T4_TWI_MUTED,
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: '0.08em',
          fontFamily: FONT,
        }}
      >
        NO SOLD PLAYERS YET
      </div>
    );
  }

  const cardRows = pageCardRows(squadSlots, playerPage);
  const headerBlockH = T4_TWI_GOLD_BAR_H + T4_TWI_TITLE_BAND_H + T4_TWI_GOLD_BAR_H;

  return (
    <>
      <style>{CSS}</style>
      <div
        className="t4-twi-anim"
        data-t4-element="team-imagery"
        data-t4-label="Theme 4 Team Imagery Champion"
        style={{
          width: T4_TWI_CANVAS_W,
          height: T4_TWI_CANVAS_H,
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          background: 'transparent',
          fontFamily: FONT,
          pointerEvents: 'auto',
          opacity: isExiting ? 0 : 1,
          transition: 'opacity 0.4s ease',
          animation:
            animPhase === 'entering' ? `t4TwiRootIn ${T4_TWI_ENTER_MS}ms ease both` : undefined,
        }}
      >
        {/* Champion Top Rectangle — thin gold bar */}
        <GoldBar />

        <TitleBand
          block={currentBlock}
          tournamentName={tournament?.name ?? ''}
          tournamentLogoURL={tournament?.logoURL}
          teamIndex={safeTeamIndex}
          teamCount={blocks.length}
          playerPage={playerPage}
          totalPages={totalPages}
          animPhase={animPhase}
        />

        {/* Second gold rule under title (Champion dual-bar feel) */}
        <GoldBar />

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingBottom: T4_TWI_TICKER_CLEARANCE + T4_TWI_GOLD_BAR_H,
            boxSizing: 'border-box',
          }}
        >
          <PlayerCardsSet
            rows={cardRows}
            animPhase={animPhase}
            headerBlockH={headerBlockH}
          />
        </div>

        {/* Champion Btm Rectangle — thin gold bar above ticker clearance */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: T4_TWI_TICKER_CLEARANCE,
            height: T4_TWI_GOLD_BAR_H,
            zIndex: 5,
          }}
        >
          <GoldBar />
        </div>
      </div>
    </>
  );
}

function GoldBar() {
  return (
    <div
      aria-hidden
      style={{
        height: T4_TWI_GOLD_BAR_H,
        flexShrink: 0,
        width: '100%',
        background: `linear-gradient(180deg, #f0c44a 0%, ${T4_TWI_GOLD} 45%, #c48900 100%)`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.35)',
      }}
    />
  );
}

function TitleBand({
  block,
  tournamentName,
  tournamentLogoURL,
  teamIndex,
  teamCount,
  playerPage,
  totalPages,
  animPhase,
}: {
  block: TeamBlock | null;
  tournamentName: string;
  tournamentLogoURL?: string | null;
  teamIndex: number;
  teamCount: number;
  playerPage: number;
  totalPages: number;
  animPhase: AnimPhase;
}) {
  const showTeamPagination = teamCount > 1;
  const showPagePagination = totalPages > 1;

  return (
    <div
      className="t4-twi-anim"
      style={{
        position: 'relative',
        height: T4_TWI_TITLE_BAND_H,
        flexShrink: 0,
        background: T4_TWI_TITLE_BG,
        overflow: 'hidden',
        ...headerAnimation(animPhase),
      }}
    >
      {/* Team badge — left (Champion Team Badge) */}
      <div
        style={{
          position: 'absolute',
          left: '2.5%',
          top: '50%',
          transform: 'translateY(-50%)',
          height: '78%',
          width: '7.5%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        {block?.team.logoURL ? (
          <img
            src={block.team.logoURL}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : null}
      </div>

      {/* Tournament / opposite badge — right */}
      <div
        style={{
          position: 'absolute',
          right: '2.5%',
          top: '50%',
          transform: 'translateY(-50%)',
          height: '78%',
          width: '7.5%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        {tournamentLogoURL ? (
          <img
            src={tournamentLogoURL}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : null}
      </div>

      {/* Team name — Champion title type */}
      <div
        style={{
          position: 'absolute',
          left: '12%',
          right: '12%',
          top: '50%',
          transform: 'translateY(-50%)',
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 63,
            fontWeight: 700,
            lineHeight: 1,
            color: T4_TWI_TEXT_TITLE,
            textTransform: 'uppercase',
            letterSpacing: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {block?.team.name ?? '—'}
        </div>
        {tournamentName ? (
          <div
            style={{
              marginTop: 6,
              fontFamily: FONT,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: T4_TWI_MUTED,
            }}
          >
            {tournamentName}
          </div>
        ) : null}
        {(showTeamPagination || showPagePagination) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
            }}
          >
            {showTeamPagination &&
              Array.from({ length: teamCount }).map((_, i) => (
                <div
                  key={`t-${i}`}
                  style={{
                    width: i === teamIndex ? 18 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: i === teamIndex ? T4_TWI_GOLD : 'rgba(255,255,255,0.28)',
                  }}
                />
              ))}
            {showTeamPagination && showPagePagination && (
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>|</span>
            )}
            {showPagePagination &&
              Array.from({ length: totalPages }).map((_, i) => (
                <div
                  key={`p-${i}`}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: i === playerPage ? T4_TWI_GOLD : 'rgba(255,255,255,0.28)',
                  }}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerCardsSet({
  rows,
  animPhase,
  headerBlockH,
}: {
  rows: { cards: (Player | null)[]; startIdx: number }[];
  animPhase: AnimPhase;
  headerBlockH: number;
}) {
  if (rows.length === 0) return null;

  const maxInRow = Math.max(...rows.map((r) => r.cards.length), 1);
  let { w: cardW, h: cardH, gap } = cardSizeForRow(maxInRow);

  const availableH =
    T4_TWI_CANVAS_H - headerBlockH - T4_TWI_TICKER_CLEARANCE - T4_TWI_GOLD_BAR_H - 28;
  const rowGap = T4_TWI_ROW_GAP;
  const neededH = rows.length * cardH + Math.max(0, rows.length - 1) * rowGap;
  if (neededH > availableH) {
    const scale = availableH / neededH;
    cardW = Math.max(150, Math.round(cardW * scale));
    cardH = Math.max(200, Math.round(cardH * scale));
  }

  return (
    <div
      className="t4-twi-anim"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: rowGap,
        width: '100%',
        padding: '8px 40px 0',
        boxSizing: 'border-box',
      }}
    >
      {rows.map((row) => (
        <div
          key={`row-${row.startIdx}`}
          style={{ display: 'flex', gap, alignItems: 'flex-end', justifyContent: 'center' }}
        >
          {row.cards.map((player, i) => (
            <PlayerColumn
              key={player?._id ?? `empty-${row.startIdx}-${i}`}
              player={player}
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

/**
 * Compact Champion column: shorter headshot + name-only plate.
 */
function PlayerColumn({
  player,
  animPhase,
  cardIndex,
  rowCount,
  cardW,
  cardH,
}: {
  player: Player | null;
  animPhase: AnimPhase;
  cardIndex: number;
  rowCount: number;
  cardW: number;
  cardH: number;
}) {
  const animStyle = cardAnimation(animPhase, cardIndex, rowCount);
  const plateH = Math.max(
    T4_TWI_NAMEPLATE_MIN_H,
    Math.round(cardH * T4_TWI_NAMEPLATE_RATIO),
  );
  const photoH = Math.max(1, cardH - plateH);
  const scale = cardW / T4_TWI_BASE_CARD_W;
  const namePx = Math.max(16, Math.round(26 * scale));

  if (!player) {
    return (
      <div
        className="t4-twi-anim"
        style={{
          width: cardW,
          height: cardH,
          background: T4_TWI_CARD_BG,
          borderTop: `2px solid ${T4_TWI_GOLD_T4}`,
          display: 'flex',
          flexDirection: 'column',
          ...animStyle,
        }}
      >
        <div
          style={{
            height: photoH,
            background: `linear-gradient(180deg, #2a2a2a 0%, ${T4_TWI_PANEL} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T4_TWI_MUTED,
            fontFamily: FONT,
            fontSize: Math.round(22 * scale),
            fontWeight: 700,
            letterSpacing: '0.12em',
          }}
        >
          OPEN
        </div>
        <div
          style={{
            height: plateH,
            background: T4_TWI_CARD_BG,
            borderTop: `1px solid rgba(237,169,0,0.35)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T4_TWI_MUTED,
            fontFamily: FONT,
            fontSize: Math.round(18 * scale),
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          SLOT
        </div>
      </div>
    );
  }

  const photoSrc = player.photoURL?.trim() || player.secondaryImageURL?.trim() || '';
  const name = displayPlayerName(player.name);

  return (
    <div
      className="t4-twi-anim"
      style={{
        width: cardW,
        height: cardH,
        background: T4_TWI_CARD_BG,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
        ...animStyle,
      }}
    >
      <div style={{ position: 'relative', height: photoH, background: T4_TWI_PANEL }}>
        {photoSrc ? (
          <img
            src={photoSrc}
            alt=""
            referrerPolicy="no-referrer"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top center',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT,
              fontSize: Math.round(64 * scale),
              fontWeight: 700,
              color: 'rgba(255,255,255,0.12)',
            }}
          >
            {name.charAt(0)}
          </div>
        )}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '22%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(20,20,20,0.9) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Name only — compact plate */}
      <div
        style={{
          height: plateH,
          background: T4_TWI_CARD_BG,
          padding: `0 ${Math.round(8 * scale)}px`,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: `2px solid ${T4_TWI_GOLD}`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: namePx,
            fontWeight: 700,
            lineHeight: 1.1,
            color: T4_TWI_TEXT,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
          }}
        >
          {name}
        </div>
      </div>
    </div>
  );
}
