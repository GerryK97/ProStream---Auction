'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getMinClassBasePrice } from '@/lib/playerClassUtils';
import { TeamWiseImageBackgroundT3 } from './TeamWiseImageBackgroundT3';
import type { Player, Team, Tournament } from '@/types';

interface Props {
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  teamId?: string;
  isExiting?: boolean;
}

const DARK = '#2a2f35';
const GOLD = '#b9aa62';
const WHITE = '#ffffff';
const MUTED = '#cccccc';

const PANEL_LEFT = 192;
const PANEL_TOP = 54;
const PANEL_W = 1536;
const PANEL_H = 972;
const PATTERN_H = PANEL_H - 15;
const TITLE_H = 107;
const HEADER_H = 56;
const FOOTER_H = 62;
const ROWS_PER_PAGE = 12;
/** Fits 12 rows between header and footer (available ~678px). */
const ROW_H = 56;
/** Extra clearance above footer so the last row never overlaps page dots. */
const ROWS_BOTTOM_PAD = 48;
const PAGE_MS = 10000;

/** # | PLAYER | SOLD PRICE */
const COLS = '70px 1fr 260px';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
  @keyframes t3TeamWiseIn {
    from { opacity: 0; transform: scale(0.97) translateY(18px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes t3TeamWiseRowIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

function formatCurrency(n?: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString('en-IN');
}

interface TeamRoster {
  team: Team;
  soldPlayers: Player[];
}

function buildTeamRosters(teams: Team[], players: Player[], teamId?: string): TeamRoster[] {
  const source = teamId ? teams.filter(t => t._id === teamId) : teams;
  return source
    .map(team => ({
      team,
      soldPlayers: players
        .filter(p => p.isSold && p.winningTeamId === team._id && !p.isIconic)
        .sort((a, b) => (b.finalPrice ?? 0) - (a.finalPrice ?? 0) || a.name.localeCompare(b.name)),
    }))
    .filter(entry => entry.soldPlayers.length > 0)
    .sort((a, b) => b.soldPlayers.length - a.soldPlayers.length);
}

const TeamWiseSummaryT3: React.FC<Props> = ({ players, teams, tournament, teamId, isExiting = false }) => {
  const [teamIndex, setTeamIndex] = useState(0);
  const [page, setPage] = useState(0);

  const rosters = useMemo(() => buildTeamRosters(teams, players, teamId), [teams, players, teamId]);
  const totalTeams = rosters.length;
  const safeTeamIndex = totalTeams > 0 ? teamIndex % totalTeams : 0;
  const { team: currentTeam, soldPlayers } = rosters[safeTeamIndex] ?? { team: null, soldPlayers: [] };
  const totalPages = Math.max(1, Math.ceil(soldPlayers.length / ROWS_PER_PAGE));
  const pageRows = soldPlayers.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);

  const balance = currentTeam?.currentBalance ?? currentTeam?.initialBudget ?? 0;
  const initial = currentTeam?.initialBudget ?? 0;
  const spent = initial - balance;
  const squadSize = tournament?.squadSize ?? 0;
  const canBuy = Math.max(0, squadSize - soldPlayers.length);
  const maxBid = (() => {
    if (!tournament || canBuy <= 0) return 0;
    if (canBuy === 1) return balance;
    const minBase = getMinClassBasePrice(tournament);
    return Math.max(0, balance - (canBuy - 1) * minBase);
  })();

  useEffect(() => {
    setTeamIndex(0);
    setPage(0);
  }, [teamId, totalTeams]);

  const paginationRef = useRef({ totalTeams, totalPages, multiTeam: !teamId && totalTeams > 1, isExiting: Boolean(isExiting) });
  paginationRef.current = { totalTeams, totalPages, multiTeam: !teamId && totalTeams > 1, isExiting: Boolean(isExiting) };

  useEffect(() => {
    if (totalTeams === 0) return;

    let cancelled = false;
    let timeoutId: number | undefined;

    const scheduleNext = () => {
      if (cancelled || paginationRef.current.isExiting) return;
      const { totalPages: pages, totalTeams: teams } = paginationRef.current;
      if (teams === 1 && pages === 1) return;

      timeoutId = window.setTimeout(() => {
        if (cancelled || paginationRef.current.isExiting) return;
        setPage(prev => {
          const latest = paginationRef.current;
          if (prev + 1 < latest.totalPages) return prev + 1;
          if (latest.multiTeam && latest.totalTeams > 1) {
            setTeamIndex(i => (i + 1) % latest.totalTeams);
          }
          return 0;
        });
        scheduleNext();
      }, PAGE_MS);
    };

    scheduleNext();
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [teamId, totalTeams, isExiting]);

  if (!tournament || !currentTeam) return null;

  return (
    <>
      <style>{CSS}</style>
      <div
        key={`${currentTeam._id}-${page}`}
        style={{
          position: 'absolute',
          left: PANEL_LEFT,
          top: PANEL_TOP,
          width: PANEL_W,
          height: PANEL_H,
          overflow: 'hidden',
          fontFamily: 'Montserrat, sans-serif',
          boxShadow: '0 12px 48px rgba(0,0,0,0.70)',
          opacity: isExiting ? 0 : 1,
          transform: isExiting ? 'scale(0.97)' : 'scale(1)',
          transition: 'opacity 0.45s ease, transform 0.45s ease',
          animation: isExiting ? undefined : 't3TeamWiseIn 420ms cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        <TeamWiseImageBackgroundT3 height={PATTERN_H} />

        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: TITLE_H, background: WHITE, zIndex: 3 }} />
        <div style={{ position: 'absolute', left: 0, top: TITLE_H, right: 0, height: HEADER_H, background: 'rgba(0,0,0,0.35)', zIndex: 4 }} />
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: TITLE_H, background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.13) 100%)', zIndex: 5, pointerEvents: 'none' }} />

        <div style={{ position: 'absolute', left: 38, top: 22, right: TITLE_H + 60, color: DARK, zIndex: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', lineHeight: 1 }}>
            {tournament.name}
          </div>
          <div style={{ marginTop: 10, fontSize: 40, fontWeight: 800, lineHeight: 1, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentTeam.name}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: 38,
            top: 0,
            height: TITLE_H,
            width: TITLE_H,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {currentTeam.logoURL ? (
            <img
              src={currentTeam.logoURL}
              alt={currentTeam.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 10,
                border: `2px solid ${GOLD}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: DARK,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              {(currentTeam.shortCode || currentTeam.name || 'T').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', left: 38, top: 122, right: 38, height: 30, display: 'grid', gridTemplateColumns: COLS, columnGap: 28, alignItems: 'center', color: WHITE, fontSize: 22, fontWeight: 500, zIndex: 10 }}>
          <Header>#</Header>
          <Header>PLAYER</Header>
          <Header align="right">SOLD PRICE</Header>
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, top: 184, bottom: FOOTER_H + ROWS_BOTTOM_PAD, overflow: 'hidden', zIndex: 10 }}>
          {pageRows.map((p, i) => {
            const globalIndex = page * ROWS_PER_PAGE + i + 1;

            return (
              <div
                key={p._id}
                style={{
                  position: 'relative',
                  height: ROW_H,
                  margin: '0 38px',
                  display: 'grid',
                  gridTemplateColumns: COLS,
                  columnGap: 28,
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(204,204,204,0.45)',
                  color: WHITE,
                  animation: `t3TeamWiseRowIn 360ms ${0.12 + i * 0.06}s cubic-bezier(0.22,1,0.36,1) both`,
                }}
              >
                <div style={{ color: MUTED, fontSize: 24, fontWeight: 400 }}>{globalIndex}</div>
                <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 14, height: '100%' }}>
                  <PlayerThumb player={p} />
                  <div
                    style={{
                      minWidth: 0,
                      flex: 1,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 34,
                        fontWeight: 600,
                        lineHeight: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textTransform: 'capitalize',
                        width: '100%',
                      }}
                    >
                      {p.name}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', color: GOLD, fontSize: 26, fontWeight: 700 }}>
                  {formatCurrency(p.finalPrice)}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 15, height: FOOTER_H, background: GOLD, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', color: DARK, zIndex: 10 }}>
          <FooterStat label="PLAYERS" value={`${soldPlayers.length}/${squadSize || '—'}`} />
          <FooterStat label="SPENT" value={formatCurrency(spent)} />
          <FooterStat label="MAX BID" value={formatCurrency(maxBid)} />
          <FooterStat label="BALANCE" value={formatCurrency(balance)} />
        </div>

        {(totalPages > 1 || (!teamId && totalTeams > 1)) && (
          <div style={{ position: 'absolute', right: 38, bottom: FOOTER_H + 22, display: 'flex', alignItems: 'center', gap: 10, zIndex: 12, pointerEvents: 'none' }}>
            {!teamId && totalTeams > 1 && (
              <>
                {rosters.map((_, i) => (
                  <div
                    key={`team-${i}`}
                    style={{
                      width: i === safeTeamIndex ? 22 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: i === safeTeamIndex ? GOLD : 'rgba(255,255,255,0.28)',
                      transition: 'all 0.25s ease',
                    }}
                  />
                ))}
                {totalPages > 1 && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>|</span>}
              </>
            )}
            {totalPages > 1 && (
              <>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div
                    key={`page-${i}`}
                    style={{
                      width: i === page ? 22 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: i === page ? GOLD : 'rgba(255,255,255,0.28)',
                      transition: 'all 0.25s ease',
                    }}
                  />
                ))}
                <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.55)' }}>
                  PAGE {page + 1}/{totalPages}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

function PlayerThumb({ player }: { player: Player }) {
  const src = player.photoURL?.trim() || player.secondaryImageURL?.trim() || '';
  const initials = player.name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 8,
        flexShrink: 0,
        border: `2px solid ${GOLD}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{initials || '?'}</span>
      )}
    </div>
  );
}

function Header({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'center' | 'right' }) {
  return <div style={{ textAlign: align, fontSize: 24, fontWeight: 500, color: WHITE }}>{children}</div>;
}

function FooterStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.75 }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

export default TeamWiseSummaryT3;
