'use client';

import React, { useState, useEffect } from 'react';
import { Player, Team, Tournament } from '@/types';

interface Props {
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  isExiting?: boolean;
}

const PLAYERS_PER_PAGE = 10;
const PAGE_DURATION = 10000;

const GOLD          = 'var(--t2-accent)';
const WHITE_BG      = 'var(--t2-bg-card)';
const TEXT_DARK     = 'var(--t2-text-primary)';
const TEXT_MUTED    = 'var(--t2-text-muted)';
const TEXT_MUTED_L  = 'var(--t2-text-secondary)';
const ON_ACCENT     = 'var(--t2-on-accent)';
const GREEN         = 'var(--t2-success)';
const RED           = 'var(--t2-danger)';
const GOLD_SEP      = 'var(--t2-border-subtle)';
const DOT_INACTIVE  = 'var(--t2-text-disabled)';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');

  @keyframes t2TeamIn {
    from { opacity: 0; transform: translateX(52px) scale(0.97); }
    to   { opacity: 1; transform: translateX(0)    scale(1);    }
  }

  @keyframes t2ShineSwipe {
    from { transform: translateX(-140%) skewX(-18deg); }
    to   { transform: translateX(280%)  skewX(-18deg); }
  }

  @keyframes t2RowIn {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0);     }
  }
`;

function formatCurrency(n: number) { return n.toLocaleString('en-IN'); }

const SoldPlayersSummaryT2: React.FC<Props> = ({ players, teams, tournament, isExiting = false }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const soldPlayers      = players.filter(p => p.isSold && !p.isIconic).sort((a, b) => (b._id > a._id ? 1 : -1));
  const unsoldPlayers    = players.filter(p => !p.isSold && p.isUnsold).sort((a, b) => a.name.localeCompare(b.name));
  const availablePlayers = players.filter(p => !p.isSold && !p.isUnsold && !p.isIconic).sort((a, b) => a.name.localeCompare(b.name));
  const allRows          = [...soldPlayers, ...unsoldPlayers, ...availablePlayers];

  const totalPages = Math.max(1, Math.ceil(allRows.length / PLAYERS_PER_PAGE));
  const pageRows   = allRows.slice(currentPage * PLAYERS_PER_PAGE, (currentPage + 1) * PLAYERS_PER_PAGE);

  const soldCount      = soldPlayers.length;
  const unsoldCount    = unsoldPlayers.length;
  const remainingCount = availablePlayers.length;
  const totalCount     = players.filter(p => !p.isIconic).length;

  useEffect(() => { setCurrentPage(0); }, [players.length]);
  useEffect(() => {
    if (totalPages <= 1) return;
    const iv = setInterval(() => setCurrentPage(p => (p + 1) % totalPages), PAGE_DURATION);
    return () => clearInterval(iv);
  }, [totalPages]);

  if (!tournament) return null;

  return (
    <>
      <style>{CSS}</style>

      <div style={{
        width: '100%',
        height: '100%',
        fontFamily: "'Varela Round', sans-serif",
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 8px 32px var(--t2-shadow-color)',
        opacity: isExiting ? 0 : 1,
        transition: isExiting ? 'opacity 0.4s ease-out' : 'none',
      }}>

        <div
          key={currentPage}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: WHITE_BG,
            animation: 't2TeamIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          {/* Shine sweep */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20, overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '40%',
              background: 'linear-gradient(105deg, transparent 20%, var(--t2-shine) 50%, transparent 80%)',
              animation: 't2ShineSwipe 1.05s 0.15s cubic-bezier(0.4, 0, 0.6, 1) forwards',
            }} />
          </div>

          {/* Header */}
          <div style={{
            position: 'relative',
            minHeight: 90,
            backgroundColor: WHITE_BG,
            borderBottom: `2px solid ${GOLD}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 32px',
            gap: 16,
            flexShrink: 0,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 4 }}>
                Sold Players
              </div>
              <div style={{ fontSize: 38, fontWeight: 700, color: TEXT_DARK, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tournament.name}
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 34, fontWeight: 700, color: GREEN, lineHeight: 1 }}>
                {soldCount} / {totalCount}
              </div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, letterSpacing: 2, marginTop: 4 }}>PLAYERS SOLD</div>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 16 }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div key={i} style={{
                    width: i === currentPage ? 20 : 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: i === currentPage ? GOLD : DOT_INACTIVE,
                    transition: 'all 0.3s ease',
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Column headers */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: GOLD,
            padding: '10px 20px',
            flexShrink: 0,
          }}>
            <ColHeader style={{ flex: '0 0 40px', textAlign: 'left' }}>#</ColHeader>
            <ColHeader style={{ flex: 2, textAlign: 'left' }}>PLAYER</ColHeader>
            <ColHeader style={{ flex: 1.2, textAlign: 'left' }}>TEAM</ColHeader>
            <ColHeader style={{ flex: 1, textAlign: 'center' }}>PRICE</ColHeader>
            <ColHeader style={{ flex: '0 0 90px', textAlign: 'right' }}>STATUS</ColHeader>
          </div>

          {/* Rows */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: WHITE_BG }}>
            {pageRows.map((p, i) => {
              const globalIdx = currentPage * PLAYERS_PER_PAGE + i;
              const team       = teams.find(t => t._id === p.winningTeamId);
              const statusColor = p.isSold ? GREEN : p.isUnsold ? RED : TEXT_MUTED;
              const statusLabel = p.isSold ? 'SOLD' : p.isUnsold ? 'UNSOLD' : 'PENDING';

              return (
                <div
                  key={p._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 20px',
                    backgroundColor: WHITE_BG,
                    color: TEXT_DARK,
                    fontSize: 18,
                    fontWeight: 700,
                    flexShrink: 0,
                    borderBottom: i < pageRows.length - 1 ? `1px solid ${GOLD_SEP}` : 'none',
                    animation: `t2RowIn 0.4s ${0.18 + i * 0.07}s cubic-bezier(0.22, 1, 0.36, 1) both`,
                  }}
                >
                  <div style={{ flex: '0 0 40px', fontSize: 14, color: TEXT_MUTED, fontWeight: 500 }}>
                    {globalIdx + 1}
                  </div>
                  <div style={{ flex: 2, minWidth: 0 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                      {p.name}
                    </div>
                    {p.position && (
                      <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, marginTop: 1 }}>{p.position}</div>
                    )}
                  </div>
                  <div style={{ flex: 1.2, fontSize: 14, color: TEXT_MUTED, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {team?.shortCode ?? team?.name ?? '—'}
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', color: GOLD, fontWeight: 700 }}>
                    {p.isSold && p.finalPrice ? formatCurrency(p.finalPrice) : '—'}
                  </div>
                  <div style={{ flex: '0 0 90px', textAlign: 'right', fontSize: 11, fontWeight: 700, letterSpacing: 2, color: statusColor }}>
                    {statusLabel}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            backgroundColor: GOLD,
            flexShrink: 0,
            minHeight: 56,
            animation: `t2RowIn 0.4s ${0.18 + pageRows.length * 0.07}s cubic-bezier(0.22, 1, 0.36, 1) both`,
          }}>
            {[
              { label: 'SOLD',      value: String(soldCount)      },
              { label: 'UNSOLD',    value: String(unsoldCount)    },
              { label: 'REMAINING', value: String(remainingCount) },
            ].map(stat => (
              <div key={stat.label} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, letterSpacing: 3, color: 'color-mix(in oklab, var(--t2-on-accent) 70%, transparent)', textTransform: 'uppercase' }}>{stat.label}</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: ON_ACCENT }}>{stat.value}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
};

function ColHeader({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: 2,
      color: ON_ACCENT,
      textTransform: 'uppercase',
      ...style,
    }}>
      {children}
    </div>
  );
}

export default SoldPlayersSummaryT2;
