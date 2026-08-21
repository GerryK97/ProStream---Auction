'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getMinClassBasePrice } from '@/lib/playerClassUtils';
import { getEnabledTeamOfficials } from '@/lib/teamOfficials';
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
/** Max teams per screen; extras paginate with auto-advance. */
const ROWS_PER_PAGE = 12;
const ROW_H = 59;
const PAGE_MS = 10000;

/** # | TEAM | PLAYERS | CAN BUY | MAX BID | BALANCE */
const COLS = '64px 1fr 120px 140px 200px 200px';

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

/** Remaining squad slots a team can still fill. */
function canBuyMore(team: Team, players: Player[], squadSize: number): number {
  return Math.max(0, squadSize - soldCount(team, players));
}

/**
 * Max affordable bid — same reserve rule as sell / control panel:
 * keep (remainingSlots - 1) × min base price for the rest of the squad.
 */
function calcMaxBid(
  team: Team,
  players: Player[],
  tournament: Tournament,
): number {
  const balance = team.currentBalance ?? 0;
  const remaining = canBuyMore(team, players, tournament.squadSize ?? 0);
  if (remaining <= 0) return 0;
  if (remaining === 1) return balance;
  const minBase = getMinClassBasePrice(tournament);
  return Math.max(0, balance - (remaining - 1) * minBase);
}

const TeamSummaryT3: React.FC<Props> = ({ teams, players, tournament, teamId, isExiting = false }) => {
  const [page, setPage] = useState(0);

  const sorted = useMemo(
    () => [...teams].sort((a, b) => (b.currentBalance ?? 0) - (a.currentBalance ?? 0)),
    [teams],
  );

  const totalBudget = sorted.reduce((s, t) => s + (t.initialBudget ?? 0), 0);
  const totalCanBuy = tournament
    ? sorted.reduce((s, t) => s + canBuyMore(t, players, tournament.squadSize ?? 0), 0)
    : 0;

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageRows = sorted.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);

  useEffect(() => { setPage(0); }, [teams.length, teamId]);
  useEffect(() => {
    if (totalPages <= 1) return;
    const t = setInterval(() => setPage(p => (p + 1) % totalPages), PAGE_MS);
    return () => clearInterval(t);
  }, [totalPages]);

  if (!tournament) return null;

  const squadSize = tournament.squadSize ?? 0;

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
          {tournament.logoURL ? (
            <img
              src={tournament.logoURL}
              alt={tournament.name}
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
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              {(tournament.name || 'T').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', left: 38, top: 122, right: 38, height: 30, display: 'grid', gridTemplateColumns: COLS, columnGap: 20, alignItems: 'center', color: WHITE, fontSize: 22, fontWeight: 500, zIndex: 10 }}>
          <Header>#</Header>
          <Header>TEAM</Header>
          <Header align="center">PLAYERS</Header>
          <Header align="center">CAN BUY</Header>
          <Header align="center">MAX BID</Header>
          <Header align="right">BALANCE</Header>
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, top: 184, bottom: FOOTER_H + 15, overflow: 'hidden', zIndex: 10 }}>
          {pageRows.map((team, i) => {
            const globalIndex = page * ROWS_PER_PAGE + i + 1;
            const balance = team.currentBalance ?? team.initialBudget ?? 0;
            const count = soldCount(team, players);
            const buyLeft = canBuyMore(team, players, squadSize);
            const maxBid = calcMaxBid(team, players, tournament);
            const highlighted = Boolean(teamId && team._id === teamId);

            return (
              <div
                key={team._id}
                style={{
                  position: 'relative',
                  height: ROW_H,
                  margin: '0 38px',
                  display: 'grid',
                  gridTemplateColumns: COLS,
                  columnGap: 20,
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(204,204,204,0.45)',
                  color: WHITE,
                  background: highlighted ? 'rgba(185,170,98,0.18)' : 'transparent',
                  boxShadow: highlighted ? 'inset 3px 0 0 #b9aa62' : undefined,
                  animation: `t3TeamSummaryRowIn 360ms ${0.12 + i * 0.05}s cubic-bezier(0.22,1,0.36,1) both`,
                }}
              >
                <div style={{ color: MUTED, fontSize: 26, fontWeight: 400 }}>{globalIndex}</div>
                <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                  <TeamLogo team={team} />
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
                        fontSize: 30,
                        fontWeight: 600,
                        lineHeight: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                      }}
                    >
                      {team.name}
                    </div>
                    {(() => {
                      const officials = getEnabledTeamOfficials(team, tournament);
                      if (officials.length === 0) return null;
                      return (
                        <div style={{ fontSize: 13, fontWeight: 500, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                          {officials.map(o => `${o.role}: ${o.name}`).join('  ·  ')}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div style={{ textAlign: 'center', color: MUTED, fontSize: 26, fontWeight: 700 }}>{count}/{squadSize || '—'}</div>
                <div style={{ textAlign: 'center', color: buyLeft > 0 ? GOLD : MUTED, fontSize: 26, fontWeight: 700 }}>{buyLeft}</div>
                <div style={{ textAlign: 'center', color: maxBid > 0 ? WHITE : MUTED, fontSize: 26, fontWeight: 700 }}>{formatCurrency(maxBid)}</div>
                <div style={{ textAlign: 'right', color: GREEN, fontSize: 26, fontWeight: 700 }}>{formatCurrency(balance)}</div>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 15, height: FOOTER_H, background: GOLD, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', color: DARK, zIndex: 10 }}>
          <FooterStat label="TEAMS" value={String(sorted.length)} />
          <FooterStat label="TOTAL BUDGET" value={formatCurrency(totalBudget)} />
          <FooterStat label="SLOTS LEFT" value={String(totalCanBuy)} />
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
        width: 42,
        height: 42,
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
