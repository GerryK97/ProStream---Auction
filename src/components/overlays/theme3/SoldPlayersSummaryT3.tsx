'use client';

import React, { useEffect, useState } from 'react';
import type { Player, Team, Tournament } from '@/types';

interface Props {
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  isExiting?: boolean;
}

const DARK = '#2a2f35';
const GOLD = '#b9aa62';
const WHITE = '#ffffff';
const MUTED = '#cccccc';
const GREEN = '#20c997';
const RED = '#ef4444';

const PANEL_LEFT = 192;
const PANEL_TOP = 54;
const PANEL_W = 1536;
const PANEL_H = 972;
const TITLE_H = 107;
const HEADER_H = 56;
const FOOTER_H = 62;
const ROWS_PER_PAGE = 10;
const PAGE_MS = 10000;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
  @keyframes t3PlayerSummaryIn {
    from { opacity: 0; transform: scale(0.97) translateY(18px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes t3PlayerSummaryRowIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes t3PlayerSummaryShine {
    from { transform: translateX(-150%) skewX(-18deg); }
    to   { transform: translateX(290%) skewX(-18deg); }
  }
`;

function formatCurrency(n?: number | null): string {
  if (!n) return '—';
  return n.toLocaleString('en-IN');
}

function playerStatus(player: Player): { label: string; color: string } {
  if (player.isSold) return { label: 'SOLD', color: GREEN };
  if (player.isUnsold) return { label: 'UNSOLD', color: RED };
  return { label: 'PENDING', color: MUTED };
}

const SoldPlayersSummaryT3: React.FC<Props> = ({ players, teams, tournament, isExiting = false }) => {
  const [page, setPage] = useState(0);

  const soldPlayers = players
    .filter(p => p.isSold && !p.isIconic)
    .sort((a, b) => (b.finalPrice ?? 0) - (a.finalPrice ?? 0) || a.name.localeCompare(b.name));
  const unsoldPlayers = players
    .filter(p => !p.isSold && p.isUnsold && !p.isIconic)
    .sort((a, b) => a.name.localeCompare(b.name));
  const pendingPlayers = players
    .filter(p => !p.isSold && !p.isUnsold && !p.isIconic)
    .sort((a, b) => a.name.localeCompare(b.name));

  const rows = [...soldPlayers, ...unsoldPlayers, ...pendingPlayers];
  const totalPlayers = players.filter(p => !p.isIconic).length;
  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const pageRows = rows.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);

  useEffect(() => { setPage(0); }, [players.length]);
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
          background: GOLD,
          boxShadow: '0 12px 48px rgba(0,0,0,0.70)',
          opacity: isExiting ? 0 : 1,
          transform: isExiting ? 'scale(0.97)' : 'scale(1)',
          transition: 'opacity 0.45s ease, transform 0.45s ease',
          animation: isExiting ? undefined : 't3PlayerSummaryIn 420ms cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: PANEL_H - 15, background: DARK }} />
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: TITLE_H, background: WHITE }} />
        <div style={{ position: 'absolute', left: 0, top: TITLE_H, right: 0, height: HEADER_H, background: DARK, filter: 'brightness(90%)' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: TITLE_H, background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.13) 100%)' }} />

        {/* Shine sweep */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 30 }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: '36%', background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.22) 50%, transparent 80%)', animation: 't3PlayerSummaryShine 1s 0.15s cubic-bezier(0.4,0,0.6,1) forwards' }} />
        </div>

        {/* Title */}
        <div style={{ position: 'absolute', left: 38, top: 22, width: 1060, color: DARK }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', lineHeight: 1 }}>
            {tournament.name}
          </div>
          <div style={{ marginTop: 10, fontSize: 40, fontWeight: 700, lineHeight: 1, textTransform: 'uppercase' }}>
            PLAYER SUMMARY
          </div>
        </div>

        <div style={{ position: 'absolute', right: 38, top: 28, textAlign: 'right', color: DARK }}>
          <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1 }}>{soldPlayers.length} / {totalPlayers}</div>
          <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>PLAYERS SOLD</div>
        </div>

        {/* Header */}
        <div style={{ position: 'absolute', left: 38, top: 122, right: 38, height: 30, display: 'grid', gridTemplateColumns: '70px 390px 180px 180px 210px 140px', columnGap: 24, alignItems: 'center', color: WHITE, fontSize: 22, fontWeight: 500 }}>
          <Header>#</Header>
          <Header>PLAYER</Header>
          <Header>CLASS</Header>
          <Header>TEAM</Header>
          <Header align="center">PRICE</Header>
          <Header align="right">STATUS</Header>
        </div>

        {/* Rows */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 184, bottom: FOOTER_H + 15, overflow: 'hidden' }}>
          {pageRows.map((p, i) => {
            const globalIndex = page * ROWS_PER_PAGE + i + 1;
            const team = teams.find(t => t._id === p.winningTeamId);
            const status = playerStatus(p);
            const meta = [p.position, p.currentClub].filter(Boolean).join(' · ');

            return (
              <div
                key={p._id}
                style={{
                  position: 'relative',
                  height: 72,
                  margin: '0 38px',
                  display: 'grid',
                  gridTemplateColumns: '70px 390px 180px 180px 210px 140px',
                  columnGap: 24,
                  alignItems: 'center',
                  borderBottom: `1px solid rgba(204,204,204,0.45)`,
                  color: WHITE,
                  animation: `t3PlayerSummaryRowIn 360ms ${0.12 + i * 0.06}s cubic-bezier(0.22,1,0.36,1) both`,
                }}
              >
                <div style={{ color: MUTED, fontSize: 28, fontWeight: 400 }}>{globalIndex}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 27, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{p.name}</div>
                  {meta && <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.62)', fontSize: 13, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</div>}
                </div>
                <div style={{ color: p.playerClass ? GOLD : MUTED, fontSize: 22, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.playerClass || '—'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  {team?.logoURL && <img src={team.logoURL} alt="" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />}
                  <span style={{ color: MUTED, fontSize: 20, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team?.shortCode ?? team?.name ?? '—'}</span>
                </div>
                <div style={{ textAlign: 'center', color: p.isSold ? GOLD : MUTED, fontSize: 25, fontWeight: 700 }}>{p.isSold ? formatCurrency(p.finalPrice) : '—'}</div>
                <div style={{ textAlign: 'right', color: status.color, fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>{status.label}</div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 15, height: FOOTER_H, background: GOLD, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', color: DARK }}>
          <FooterStat label="SOLD" value={String(soldPlayers.length)} />
          <FooterStat label="UNSOLD" value={String(unsoldPlayers.length)} />
          <FooterStat label="REMAINING" value={String(pendingPlayers.length)} />
        </div>

        {totalPages > 1 && (
          <div style={{ position: 'absolute', right: 38, bottom: FOOTER_H + 30, display: 'flex', gap: 8 }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <div key={i} style={{ width: i === page ? 22 : 8, height: 8, borderRadius: 4, background: i === page ? GOLD : 'rgba(255,255,255,0.28)', transition: 'all 0.25s ease' }} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

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

export default SoldPlayersSummaryT3;
