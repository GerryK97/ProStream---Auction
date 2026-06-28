'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { TeamWiseImageBackgroundT3 } from './TeamWiseImageBackgroundT3';
import type { Player, Team, Tournament } from '@/types';

interface Props {
  teams: Team[];
  players: Player[];
  tournament: Tournament | null;
  teamId?: string;
  isExiting?: boolean;
}

const DARK = '#2a2f35';
const GOLD = '#b9aa62';
const WHITE = '#ffffff';
const MUTED = '#cccccc';
const GREEN = '#20c997';

const PANEL_LEFT = 192;
const PANEL_TOP = 54;
const PANEL_W = 1536;
const PANEL_H = 972;
const PATTERN_H = PANEL_H - 15;
const TITLE_H = 107;
const HEADER_H = 56;
const FOOTER_H = 62;
const ROWS_PER_PAGE = 10;
const PAGE_MS = 10000;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
  @keyframes t3TeamSummaryIn {
    from { opacity: 0; transform: scale(0.97) translateY(18px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes t3TeamSummaryRowIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

function formatCurrency(n?: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString('en-IN');
}

function soldCount(team: Team, players: Player[]): number {
  const fromRoster = team.playersPurchased?.length ?? 0;
  if (fromRoster > 0) return fromRoster;
  return players.filter(p => p.isSold && p.winningTeamId === team._id).length;
}

const TeamSummaryT3: React.FC<Props> = ({ teams, players, tournament, teamId, isExiting = false }) => {
  const [page, setPage] = useState(0);

  const sorted = useMemo(
    () => [...teams].sort((a, b) => (b.currentBalance ?? 0) - (a.currentBalance ?? 0)),
    [teams],
  );

  const totalBudget = sorted.reduce((s, t) => s + (t.initialBudget ?? 0), 0);
  const totalSpent = sorted.reduce(
    (s, t) => s + ((t.initialBudget ?? 0) - (t.currentBalance ?? t.initialBudget ?? 0)),
    0,
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageRows = sorted.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);

  useEffect(() => { setPage(0); }, [teams.length, teamId]);
  useEffect(() => {
    if (totalPages <= 1) return;
    const t = setInterval(() => setPage(p => (p + 1) % totalPages), PAGE_MS);
    return () => clearInterval(t);
  }, [totalPages]);

  if (!tournament) return null;

  return (
    <>
      <style>{CSS}</style>
      <div
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
          animation: isExiting ? undefined : 't3TeamSummaryIn 420ms cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        <TeamWiseImageBackgroundT3 height={PATTERN_H} />

        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: TITLE_H, background: WHITE, zIndex: 3 }} />
        <div style={{ position: 'absolute', left: 0, top: TITLE_H, right: 0, height: HEADER_H, background: 'rgba(0,0,0,0.35)', zIndex: 4 }} />
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: TITLE_H, background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.13) 100%)', zIndex: 5, pointerEvents: 'none' }} />

        <div style={{ position: 'absolute', left: 38, top: 22, width: 1060, color: DARK, zIndex: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', lineHeight: 1 }}>
            {tournament.name}
          </div>
          <div style={{ marginTop: 10, fontSize: 40, fontWeight: 700, lineHeight: 1, textTransform: 'uppercase' }}>
            TEAM SUMMARY
          </div>
        </div>

        <div style={{ position: 'absolute', right: 38, top: 28, textAlign: 'right', color: DARK, zIndex: 10 }}>
          <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1 }}>{sorted.length}</div>
          <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>TEAMS</div>
        </div>

        <div style={{ position: 'absolute', left: 38, top: 122, right: 38, height: 30, display: 'grid', gridTemplateColumns: '70px 560px 160px 220px 220px', columnGap: 24, alignItems: 'center', color: WHITE, fontSize: 22, fontWeight: 500, zIndex: 10 }}>
          <Header>#</Header>
          <Header>TEAM</Header>
          <Header align="center">PLAYERS</Header>
          <Header align="center">SPENT</Header>
          <Header align="right">BALANCE</Header>
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, top: 184, bottom: FOOTER_H + 15, overflow: 'hidden', zIndex: 10 }}>
          {pageRows.map((team, i) => {
            const globalIndex = page * ROWS_PER_PAGE + i + 1;
            const balance = team.currentBalance ?? team.initialBudget ?? 0;
            const initial = team.initialBudget ?? 0;
            const spent = initial - balance;
            const count = soldCount(team, players);
            const highlighted = Boolean(teamId && team._id === teamId);

            return (
              <div
                key={team._id}
                style={{
                  position: 'relative',
                  height: 72,
                  margin: '0 38px',
                  display: 'grid',
                  gridTemplateColumns: '70px 560px 160px 220px 220px',
                  columnGap: 24,
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(204,204,204,0.45)',
                  color: WHITE,
                  background: highlighted ? 'rgba(185,170,98,0.18)' : 'transparent',
                  boxShadow: highlighted ? 'inset 3px 0 0 #b9aa62' : undefined,
                  animation: `t3TeamSummaryRowIn 360ms ${0.12 + i * 0.06}s cubic-bezier(0.22,1,0.36,1) both`,
                }}
              >
                <div style={{ color: MUTED, fontSize: 28, fontWeight: 400 }}>{globalIndex}</div>
                <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <TeamLogo team={team} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 27, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</div>
                    {team.shortCode && (
                      <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.62)', fontSize: 13, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase' }}>{team.shortCode}</div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'center', color: MUTED, fontSize: 25, fontWeight: 700 }}>{count}</div>
                <div style={{ textAlign: 'center', color: GOLD, fontSize: 25, fontWeight: 700 }}>{formatCurrency(spent)}</div>
                <div style={{ textAlign: 'right', color: GREEN, fontSize: 25, fontWeight: 700 }}>{formatCurrency(balance)}</div>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 15, height: FOOTER_H, background: GOLD, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', color: DARK, zIndex: 10 }}>
          <FooterStat label="TEAMS" value={String(sorted.length)} />
          <FooterStat label="TOTAL BUDGET" value={formatCurrency(totalBudget)} />
          <FooterStat label="TOTAL SPENT" value={formatCurrency(totalSpent)} />
        </div>

        {totalPages > 1 && (
          <div style={{ position: 'absolute', right: 38, bottom: FOOTER_H + 30, display: 'flex', gap: 8, zIndex: 10 }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <div key={i} style={{ width: i === page ? 22 : 8, height: 8, borderRadius: 4, background: i === page ? GOLD : 'rgba(255,255,255,0.28)', transition: 'all 0.25s ease' }} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

function TeamLogo({ team }: { team: Team }) {
  return (
    <div
      style={{
        width: 48,
        height: 48,
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
      {team.logoURL ? (
        <img src={team.logoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <span style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{team.shortCode?.slice(0, 2) ?? '?'}</span>
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

export default TeamSummaryT3;
