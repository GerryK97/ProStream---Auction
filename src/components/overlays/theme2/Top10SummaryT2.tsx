'use client';

import React from 'react';
import { Player, Team, Tournament } from '@/types';

interface Props {
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  isExiting?: boolean;
}

const GOLD         = 'var(--t2-accent)';
const WHITE_BG     = 'var(--t2-bg-card)';
const TEXT_DARK    = 'var(--t2-text-primary)';
const TEXT_MUTED   = 'rgba(var(--t2-text-primary-rgb), 0.4)';
const TEXT_MUTED_L = 'rgba(var(--t2-text-primary-rgb), 0.5)';
const ON_ACCENT    = 'var(--t2-on-accent)';
const GREEN        = '#22c55e';
const GOLD_SEP     = 'rgba(var(--t2-accent-rgb), 0.5)';

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

const Top10SummaryT2: React.FC<Props> = ({ players, teams, tournament, isExiting = false }) => {
  const top10 = [...players]
    .filter(p => p.isSold && p.finalPrice)
    .sort((a, b) => (b.finalPrice ?? 0) - (a.finalPrice ?? 0))
    .slice(0, 10);

  const totalSold    = players.filter(p => p.isSold).length;
  const highestBid   = top10[0]?.finalPrice ?? 0;
  const top10Total   = top10.reduce((s, p) => s + (p.finalPrice ?? 0), 0);

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
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        opacity: isExiting ? 0 : 1,
        transition: isExiting ? 'opacity 0.4s ease-out' : 'none',
      }}>

        <div
          key="top10-summary"
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
              background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.65) 50%, transparent 80%)',
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
                Most Expensive
              </div>
              <div style={{ fontSize: 38, fontWeight: 700, color: TEXT_DARK, lineHeight: 1.1 }}>
                Top 10 Players
              </div>
            </div>
            <div style={{ fontSize: 14, color: TEXT_MUTED, letterSpacing: 2, flexShrink: 0, textAlign: 'right' }}>
              {tournament.name}
            </div>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: GOLD,
            padding: '10px 20px',
            flexShrink: 0,
          }}>
            <ColHeader style={{ flex: '0 0 44px', textAlign: 'left' }}>RANK</ColHeader>
            <ColHeader style={{ flex: 2.5, textAlign: 'left' }}>PLAYER</ColHeader>
            <ColHeader style={{ flex: 1.5, textAlign: 'left' }}>TEAM</ColHeader>
            <ColHeader style={{ flex: 1, textAlign: 'right' }}>PRICE</ColHeader>
          </div>

          {/* Rows */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: WHITE_BG }}>
            {top10.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 20, color: TEXT_MUTED }}>No sold players yet</span>
              </div>
            ) : (
              top10.map((p, i) => {
                const team = teams.find(t => t._id === p.winningTeamId);

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
                      borderBottom: i < top10.length - 1 ? `1px solid ${GOLD_SEP}` : 'none',
                      animation: `t2RowIn 0.4s ${0.18 + i * 0.07}s cubic-bezier(0.22, 1, 0.36, 1) both`,
                    }}
                  >
                    <div style={{ flex: '0 0 44px', fontSize: 18, fontWeight: 700, color: i === 0 ? GOLD : TEXT_MUTED }}>
                      {i + 1}
                    </div>

                    <div style={{ flex: 2.5, minWidth: 0 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                        {p.name}
                      </div>
                      {p.position && (
                        <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 400, marginTop: 1 }}>{p.position}</div>
                      )}
                    </div>

                    <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      {team?.logoURL ? (
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: `1.5px solid ${GOLD}`,
                          backgroundColor: WHITE_BG,
                        }}>
                          <img src={team.logoURL} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                      ) : null}
                      <span style={{ fontSize: 14, color: TEXT_MUTED, fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {team?.shortCode ?? team?.name ?? '—'}
                      </span>
                    </div>

                    <div style={{ flex: 1, textAlign: 'right', color: GREEN, fontWeight: 700 }}>
                      {formatCurrency(p.finalPrice ?? 0)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            backgroundColor: GOLD,
            flexShrink: 0,
            minHeight: 56,
            animation: `t2RowIn 0.4s ${0.18 + top10.length * 0.07}s cubic-bezier(0.22, 1, 0.36, 1) both`,
          }}>
            {[
              { label: 'PLAYERS SOLD', value: String(totalSold)            },
              { label: 'HIGHEST BID',  value: formatCurrency(highestBid)   },
              { label: 'TOP 10 TOTAL', value: formatCurrency(top10Total)   },
            ].map(stat => (
              <div key={stat.label} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>{stat.label}</span>
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

export default Top10SummaryT2;
