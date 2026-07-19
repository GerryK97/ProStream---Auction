'use client';

import React, { useEffect, useState } from 'react';
import { TeamWiseImageBackgroundT3 } from './TeamWiseImageBackgroundT3';
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

const PANEL_LEFT = 192;
const PANEL_TOP = 54;
const PANEL_W = 1536;
const PANEL_H = 972;
const PATTERN_H = PANEL_H - 15; // matches Team Summary — accent strip at bottom
const TITLE_H = 107;
const HEADER_H = 56;
const FOOTER_H = 62;
const ROWS_PER_PAGE = 12;
/** Fits 12 rows between header and footer (available ~678px). */
const ROW_H = 56;
/** Extra clearance above footer so the last row never overlaps page dots. */
const ROWS_BOTTOM_PAD = 48;
const PAGE_MS = 10000;

/** # | PLAYER | TEAM | SOLD PRICE */
const COLS = '70px 1fr 340px 260px';

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
`;

function formatCurrency(n?: number | null): string {
  if (!n) return '—';
  return n.toLocaleString('en-IN');
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
          boxShadow: '0 12px 48px rgba(0,0,0,0.70)',
          opacity: isExiting ? 0 : 1,
          transform: isExiting ? 'scale(0.97)' : 'scale(1)',
          transition: 'opacity 0.45s ease, transform 0.45s ease',
          animation: isExiting ? undefined : 't3PlayerSummaryIn 420ms cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        <TeamWiseImageBackgroundT3 height={PATTERN_H} />

        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: TITLE_H, background: WHITE, zIndex: 3 }} />
        <div style={{ position: 'absolute', left: 0, top: TITLE_H, right: 0, height: HEADER_H, background: 'rgba(0,0,0,0.35)', zIndex: 4 }} />
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: TITLE_H, background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.13) 100%)', zIndex: 5, pointerEvents: 'none' }} />

        {/* Title */}
        <div style={{ position: 'absolute', left: 38, top: 22, width: 1060, color: DARK, zIndex: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', lineHeight: 1 }}>
            {tournament.name}
          </div>
          <div style={{ marginTop: 10, fontSize: 40, fontWeight: 700, lineHeight: 1, textTransform: 'uppercase' }}>
            PLAYER SUMMARY
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
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              {(tournament.name || 'T').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Header */}
        <div style={{ position: 'absolute', left: 38, top: 122, right: 38, height: 30, display: 'grid', gridTemplateColumns: COLS, columnGap: 28, alignItems: 'center', color: WHITE, fontSize: 22, fontWeight: 500, zIndex: 10 }}>
          <Header>#</Header>
          <Header>PLAYER</Header>
          <Header>TEAM</Header>
          <Header align="right">SOLD PRICE</Header>
        </div>

        {/* Rows — bottom pad keeps the 10th row clear of pagination dots */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 184, bottom: FOOTER_H + ROWS_BOTTOM_PAD, overflow: 'hidden', zIndex: 10 }}>
          {pageRows.map((p, i) => {
            const globalIndex = page * ROWS_PER_PAGE + i + 1;
            const team = teams.find(t => t._id === p.winningTeamId);

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
                  borderBottom: `1px solid rgba(204,204,204,0.45)`,
                  color: WHITE,
                  animation: `t3PlayerSummaryRowIn 360ms ${0.12 + i * 0.06}s cubic-bezier(0.22,1,0.36,1) both`,
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
                <div
                  style={{
                    color: MUTED,
                    fontSize: 22,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                  }}
                >
                  {team?.name ?? '—'}
                </div>
                <div style={{ textAlign: 'right', color: p.isSold ? GOLD : MUTED, fontSize: 26, fontWeight: 700 }}>
                  {p.isSold ? formatCurrency(p.finalPrice) : '—'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 15, height: FOOTER_H, background: GOLD, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', color: DARK, zIndex: 10 }}>
          <FooterStat label="SOLD" value={String(soldPlayers.length)} />
          <FooterStat label="UNSOLD" value={String(unsoldPlayers.length)} />
          <FooterStat label="REMAINING" value={String(pendingPlayers.length)} />
        </div>

        {totalPages > 1 && (
          <div
            style={{
              position: 'absolute',
              right: 38,
              bottom: FOOTER_H + 22,
              display: 'flex',
              gap: 8,
              zIndex: 12,
              pointerEvents: 'none',
            }}
          >
            {Array.from({ length: totalPages }).map((_, i) => (
              <div key={i} style={{ width: i === page ? 22 : 8, height: 8, borderRadius: 4, background: i === page ? GOLD : 'rgba(255,255,255,0.28)', transition: 'all 0.25s ease' }} />
            ))}
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

export default SoldPlayersSummaryT3;
