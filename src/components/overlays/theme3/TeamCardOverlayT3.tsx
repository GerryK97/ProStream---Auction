'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TICKER_T3_HEIGHT } from './TickerT3Shared';
import type { Player, Team, Tournament } from '@/types';

const PAGE_SIZE = 5;
const PAGE_MS = 5000;
const EXIT_MS = 220;
const ENTER_MS = 320;
const BOTTOM_GAP = 16;

/** Match Player Summary summary-panel palette. */
const DARK = '#2a2f35';
const GOLD = '#b9aa62';
const WHITE = '#ffffff';
const MUTED = '#cccccc';
/** Player-list panel green (same base as TeamWiseImageBackgroundT3). */
const LIST_BG = 'linear-gradient(145deg, #0E2228 0%, #0A1A22 100%)';

const SIZE = {
  large: {
    panelWidth: 560,
    rowH: 56,
    padX: 18,
    headerH: 36,
    nameFs: 26,
    valueFs: 22,
    headerFs: 15,
    colGap: 16,
  },
  small: {
    panelWidth: 460,
    rowH: 48,
    padX: 14,
    headerH: 32,
    nameFs: 20,
    valueFs: 18,
    headerFs: 13,
    colGap: 12,
  },
} as const;

const COLS = '1fr 100px 100px';

type CardSize = 'small' | 'medium' | 'large';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
  @keyframes t3TeamCardsExit {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-14px); }
  }
  @keyframes t3TeamCardsEnter {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

/** Display amounts in K format (e.g. 100000 → 100K). */
function formatCompact(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    const text = Number.isInteger(k) ? String(k) : k.toFixed(1).replace(/\.0$/, '');
    return `${text}K`;
  }
  return String(n);
}

function soldCount(team: Team, players: Player[]): number {
  const fromRoster = team.playersPurchased?.length ?? 0;
  if (fromRoster > 0) return fromRoster;
  return players.filter(p => p.isSold && p.winningTeamId === team._id).length;
}

interface Props {
  teams: Team[];
  players: Player[];
  tournament: Tournament | null;
  size?: CardSize;
  /** Defaults to bottom-right; clearance above ticker when visible. */
  position?: 'bottom-right' | 'top-right';
  tickerVisible?: boolean;
}

export default function TeamCardOverlayT3({
  teams,
  players,
  tournament,
  size = 'large',
  position = 'bottom-right',
  tickerVisible = true,
}: Props) {
  const cfg = SIZE[size === 'small' ? 'small' : 'large'];
  const sorted = useMemo(
    () => [...teams].sort((a, b) => (b.currentBalance ?? 0) - (a.currentBalance ?? 0)),
    [teams],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const [pageIndex, setPageIndex] = useState(0);
  const [animState, setAnimState] = useState<'idle' | 'exit' | 'enter'>('idle');
  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPageIndex(0);
  }, [sorted.length]);

  useEffect(() => {
    if (sorted.length <= PAGE_SIZE) return;
    const interval = setInterval(() => {
      setAnimState('exit');
      t1.current = setTimeout(() => {
        setPageIndex(p => (p + 1) % totalPages);
        setAnimState('enter');
        t2.current = setTimeout(() => setAnimState('idle'), ENTER_MS);
      }, EXIT_MS);
    }, PAGE_MS);
    return () => {
      clearInterval(interval);
      if (t1.current) clearTimeout(t1.current);
      if (t2.current) clearTimeout(t2.current);
    };
  }, [sorted.length, totalPages]);

  if (sorted.length === 0) return null;

  const pageTeams = sorted.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);
  const animStyle: React.CSSProperties =
    animState === 'exit' ? { animation: `t3TeamCardsExit ${EXIT_MS}ms ease-in forwards` } :
    animState === 'enter' ? { animation: `t3TeamCardsEnter ${ENTER_MS}ms ease-out forwards` } :
    {};

  const bottomOffset = (tickerVisible ? TICKER_T3_HEIGHT : 0) + BOTTOM_GAP;
  const positionStyle: React.CSSProperties =
    position === 'top-right'
      ? { top: 48 }
      : { bottom: bottomOffset };

  return (
    <div
      style={{
        position: 'absolute',
        right: 48,
        zIndex: 12,
        width: cfg.panelWidth,
        fontFamily: 'Montserrat, sans-serif',
        ...positionStyle,
      }}
    >
      <style>{CSS}</style>

      <div
        style={{
          background: LIST_BG,
          borderRadius: 4,
          boxShadow: '0 12px 36px rgba(0,0,0,0.55)',
          overflow: 'hidden',
        }}
      >
        {/* Header — Player Summary white block + dark labels */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: COLS,
            columnGap: cfg.colGap,
            alignItems: 'center',
            height: cfg.headerH,
            padding: `0 ${cfg.padX}px`,
            background: WHITE,
            color: DARK,
            fontSize: cfg.headerFs,
            fontWeight: 500,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          <span>Team</span>
          <span style={{ textAlign: 'right' }}>Players</span>
          <span style={{ textAlign: 'right' }}>Balance</span>
        </div>

        {/* Rows — Player Summary list over dark green panel */}
        <div style={{ background: LIST_BG, ...animStyle }}>
          {pageTeams.map((team) => {
            const balance = team.currentBalance ?? team.initialBudget ?? 0;
            const sold = soldCount(team, players);
            const squadSize = tournament?.squadSize ?? 0;

            return (
              <div
                key={team._id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: COLS,
                  columnGap: cfg.colGap,
                  alignItems: 'center',
                  height: cfg.rowH,
                  padding: `0 ${cfg.padX}px`,
                  borderBottom: '1px solid rgba(204,204,204,0.45)',
                  color: WHITE,
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: cfg.nameFs,
                      fontWeight: 600,
                      lineHeight: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textTransform: 'capitalize',
                      width: '100%',
                    }}
                  >
                    {team.name}
                  </div>
                </div>
                <div
                  style={{
                    textAlign: 'right',
                    color: GOLD,
                    fontSize: cfg.valueFs,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {sold}/{squadSize || '—'}
                </div>
                <div
                  style={{
                    textAlign: 'right',
                    color: MUTED,
                    fontSize: cfg.valueFs,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatCompact(balance)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === pageIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === pageIndex ? GOLD : 'rgba(255,255,255,0.28)',
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
