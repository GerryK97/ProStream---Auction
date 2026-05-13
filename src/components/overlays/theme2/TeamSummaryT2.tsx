'use client';

import React from 'react';
import { Team, Tournament } from '@/types';

interface Props {
  teams: Team[];
  tournament: Tournament | null;
  isExiting?: boolean;
}

const GOLD         = 'var(--t2-accent)';
const WHITE_BG     = 'var(--t2-bg-card)';
const TEXT_DARK    = 'var(--t2-text-primary)';
const TEXT_MUTED   = 'var(--t2-text-muted)';
const TEXT_MUTED_L = 'var(--t2-text-secondary)';
const ON_ACCENT    = 'var(--t2-on-accent)';
const GREEN        = 'var(--t2-success)';
const GOLD_SEP     = 'var(--t2-border-subtle)';

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

const TeamSummaryT2: React.FC<Props> = ({ teams, tournament, isExiting = false }) => {
  const sorted = [...teams].sort((a, b) => (b.currentBalance ?? 0) - (a.currentBalance ?? 0));

  const totalBudget = sorted.reduce((s, t) => s + (t.initialBudget ?? 0), 0);
  const totalSpent  = sorted.reduce((s, t) => s + ((t.initialBudget ?? 0) - (t.currentBalance ?? t.initialBudget ?? 0)), 0);

  if (!tournament) return null;

  return (
    <>
      <style>{CSS}</style>

      <div style={{
        width: '100%',
        height: '100%',
        fontFamily: "'Varela Round'",
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 8px 32px var(--t2-shadow-color)',
        opacity: isExiting ? 0 : 1,
        transition: isExiting ? 'opacity 0.4s ease-out' : 'none',
      }}>

        <div
          key="team-summary"
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
                Team Standings
              </div>
              <div style={{ fontSize: 38, fontWeight: 700, color: TEXT_DARK, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tournament.name}
              </div>
            </div>
            <div style={{ fontSize: 14, color: TEXT_MUTED, letterSpacing: 2, flexShrink: 0 }}>
              {sorted.length} TEAMS
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
            <ColHeader style={{ flex: 2.5, textAlign: 'left' }}>TEAM</ColHeader>
            <ColHeader style={{ flex: 0.8, textAlign: 'center' }}>PLAYERS</ColHeader>
            <ColHeader style={{ flex: 1, textAlign: 'center' }}>SPENT</ColHeader>
            <ColHeader style={{ flex: 1, textAlign: 'right' }}>BALANCE</ColHeader>
          </div>

          {/* Rows */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: WHITE_BG }}>
            {sorted.map((team, i) => {
              const balance     = team.currentBalance ?? team.initialBudget ?? 0;
              const initial     = team.initialBudget ?? 0;
              const spent       = initial - balance;
              const playerCount = team.playersPurchased?.length ?? 0;

              return (
                <div
                  key={team._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 20px',
                    backgroundColor: WHITE_BG,
                    color: TEXT_DARK,
                    fontSize: 18,
                    fontWeight: 700,
                    flexShrink: 0,
                    borderBottom: i < sorted.length - 1 ? `1px solid ${GOLD_SEP}` : 'none',
                    animation: `t2RowIn 0.4s ${0.18 + i * 0.07}s cubic-bezier(0.22, 1, 0.36, 1) both`,
                  }}
                >
                  <div style={{ flex: '0 0 44px', fontSize: 18, fontWeight: 700, color: TEXT_MUTED }}>
                    {i + 1}
                  </div>

                  <div style={{ flex: 2.5, display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      flexShrink: 0,
                      border: `2px solid ${GOLD}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      backgroundColor: WHITE_BG,
                    }}>
                      {team.logoURL
                        ? <img src={team.logoURL} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        : <span style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{team.shortCode?.slice(0, 2)}</span>
                      }
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {team.name}
                    </span>
                  </div>

                  <div style={{ flex: 0.8, textAlign: 'center', color: 'var(--t2-text-secondary)', fontWeight: 700, fontSize: 19 }}>
                    {playerCount}
                  </div>

                  <div style={{ flex: 1, textAlign: 'center', color: 'var(--t2-text-primary)', fontWeight: 500, fontSize: 19 }}>
                    {formatCurrency(spent)}
                  </div>

                  <div style={{ flex: 1, textAlign: 'right', color: GREEN, fontWeight: 700 }}>
                    {formatCurrency(balance)}
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
            animation: `t2RowIn 0.4s ${0.18 + sorted.length * 0.07}s cubic-bezier(0.22, 1, 0.36, 1) both`,
          }}>
            {[
              { label: 'TEAMS',        value: String(sorted.length)    },
              { label: 'TOTAL BUDGET', value: formatCurrency(totalBudget) },
              { label: 'TOTAL SPENT',  value: formatCurrency(totalSpent)  },
            ].map(stat => (
              <div key={stat.label} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, letterSpacing: 3, color: 'color-mix(in oklab, var(--t2-on-accent) 70%, transparent)', textTransform: 'uppercase' }}>{stat.label}</span>
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

export default TeamSummaryT2;
