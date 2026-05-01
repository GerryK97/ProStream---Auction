'use client';

import React, { useState, useEffect } from 'react';
import { Player, Team, Tournament } from '@/types';

interface Props {
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  filterTeamId?: string | null;
  isExiting?: boolean;
}

const PLAYERS_PER_PAGE = 8;
const PAGE_DURATION = 6000;

const GOLD         = 'var(--t2-accent)';
const WHITE_BG     = 'var(--t2-bg-card)';
const TEXT_DARK    = 'var(--t2-text-primary)';
const TEXT_MUTED   = 'rgba(var(--t2-text-primary-rgb), 0.4)';
const TEXT_MUTED_LIGHT = 'rgba(var(--t2-text-primary-rgb), 0.5)';
const GREEN        = '#22c55e';
const DOT_INACTIVE = 'rgba(var(--t2-text-primary-rgb), 0.15)';
const GOLD_SEP     = 'rgba(var(--t2-accent-rgb), 0.5)';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');

  /* Team card slides in from the right on each team change */
  @keyframes t2TeamIn {
    from { opacity: 0; transform: translateX(52px) scale(0.97); }
    to   { opacity: 1; transform: translateX(0)    scale(1);    }
  }

  /* Diagonal gloss streak sweeps once across the card */
  @keyframes t2ShineSwipe {
    from { transform: translateX(-140%) skewX(-18deg); }
    to   { transform: translateX(280%)  skewX(-18deg); }
  }

  /* Each player row fades up with a stagger delay */
  @keyframes t2RowIn {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0);     }
  }
`;

const formatAmount = (v: number): string => v.toLocaleString('en-IN');

const TeamWiseSummaryT2: React.FC<Props> = ({
  players,
  teams,
  tournament,
  filterTeamId = null,
  isExiting = false,
}) => {
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [currentPage, setCurrentPage]           = useState(0);

  const teamsWithPlayers = (filterTeamId ? teams.filter(t => t._id === filterTeamId) : teams)
    .map(team => ({
      team,
      soldPlayers: players
        .filter(p => p.isSold && p.winningTeamId === team._id)
        .sort((a, b) => (b.finalPrice ?? 0) - (a.finalPrice ?? 0)),
    }))
    .filter(({ soldPlayers }) => soldPlayers.length > 0)
    .sort((a, b) => b.soldPlayers.length - a.soldPlayers.length);

  const totalTeams = teamsWithPlayers.length;
  const { team: currentTeam, soldPlayers: allCurrentPlayers } =
    teamsWithPlayers[currentTeamIndex] ?? { team: null, soldPlayers: [] };

  const totalPages = Math.max(1, Math.ceil(allCurrentPlayers.length / PLAYERS_PER_PAGE));

  useEffect(() => { setCurrentPage(0); }, [currentTeamIndex, filterTeamId]);
  useEffect(() => { setCurrentTeamIndex(0); setCurrentPage(0); }, [totalTeams, filterTeamId]);

  useEffect(() => {
    if (totalTeams === 0 || (totalTeams === 1 && totalPages === 1)) return;
    const timer = setInterval(() => {
      setCurrentPage(prev => {
        const next = prev + 1;
        if (next < totalPages) return next;
        if (!filterTeamId && totalTeams > 1) {
          setCurrentTeamIndex(i => (i + 1) % totalTeams);
        }
        return 0;
      });
    }, PAGE_DURATION);
    return () => clearInterval(timer);
  }, [totalTeams, totalPages, filterTeamId]);

  if (!tournament || totalTeams === 0 || !currentTeam) return null;

  const pageStart      = currentPage * PLAYERS_PER_PAGE;
  const currentPlayers = allCurrentPlayers.slice(pageStart, pageStart + PLAYERS_PER_PAGE);

  const balance   = currentTeam.currentBalance ?? currentTeam.initialBudget ?? 0;
  const initial   = currentTeam.initialBudget ?? 0;
  const spent     = initial - balance;
  const teamTotal = allCurrentPlayers.reduce((s, p) => s + (p.finalPrice ?? 0), 0);

  const statFields = (tournament.playerProfileFields?.statFields ?? []).slice(0, 3);
  const hasRole    = currentPlayers.some(p => p.position);

  return (
    <>
      <style>{CSS}</style>

      {/* ── OUTER SHELL — exit fade + border-radius clipping for shine ── */}
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

        {/* ── ANIMATED CONTENT — key forces remount → fresh animations on every team ── */}
        <div
          key={currentTeamIndex}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: WHITE_BG,
            animation: 't2TeamIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          {/* ── SHINE SWEEP — absolute, clipped by outer overflow:hidden ── */}
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 20,
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '40%',
              background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.65) 50%, transparent 80%)',
              animation: 't2ShineSwipe 1.05s 0.15s cubic-bezier(0.4, 0, 0.6, 1) forwards',
            }} />
          </div>

          {/* ── HEADER ── */}
          <div style={{
            position: 'relative',
            minHeight: 90,
            backgroundColor: WHITE_BG,
            borderBottom: `2px solid ${GOLD}`,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 140,
            paddingRight: 32,
            gap: 16,
            flexShrink: 0,
          }}>
            {/* Team logo */}
            <div style={{
              position: 'absolute',
              left: 24,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 80,
              height: 80,
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 0 18px rgba(0,0,0,0.15)',
              backgroundColor: 'rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: `2px solid ${GOLD}`,
            }}>
              {currentTeam.logoURL ? (
                <img
                  src={currentTeam.logoURL}
                  alt={currentTeam.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: GOLD, fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>
                  {(currentTeam.shortCode ?? currentTeam.name).slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Team name + sub-line */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 38,
                fontWeight: 700,
                color: TEXT_DARK,
                textTransform: 'uppercase',
                lineHeight: 1.1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {currentTeam.name}
              </div>
              <div style={{ fontSize: 15, color: TEXT_MUTED, marginTop: 3, letterSpacing: 1 }}>
                {allCurrentPlayers.length} PLAYER{allCurrentPlayers.length !== 1 ? 'S' : ''}&nbsp;·&nbsp;TOTAL&nbsp;
                <span style={{ color: GOLD }}>{formatAmount(teamTotal)}</span>
                {totalPages > 1 && (
                  <span style={{ marginLeft: 12, opacity: 0.6 }}>
                    PAGE {currentPage + 1}/{totalPages}
                  </span>
                )}
              </div>
            </div>

            {/* Pagination dots — team indicator */}
            {totalTeams > 1 && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {teamsWithPlayers.map((_, i) => (
                  <div key={i} style={{
                    width: i === currentTeamIndex ? 20 : 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: i === currentTeamIndex ? GOLD : DOT_INACTIVE,
                    transition: 'all 0.3s ease',
                  }} />
                ))}
              </div>
            )}
            {/* Pagination dots — page indicator */}
            {totalTeams === 1 && totalPages > 1 && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
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

          {/* ── TABLE COLUMN HEADERS ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: GOLD,
            padding: '10px 20px',
            flexShrink: 0,
          }}>
            <ColHeader flex={2}   align="left">NAME</ColHeader>
            {hasRole && <ColHeader flex={1.5} align="left">ROLE</ColHeader>}
            {statFields.map(f => (
              <ColHeader key={f.key} flex={0.9} align="center">{f.label.toUpperCase()}</ColHeader>
            ))}
            <ColHeader flex={1} align="right">PRICE</ColHeader>
          </div>

          {/* ── PLAYER ROWS — all white, gold separator, staggered entry ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: WHITE_BG }}>
            {currentPlayers.map((player, i) => (
              <div
                key={`${currentTeamIndex}-${currentPage}-${player._id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 20px',
                  backgroundColor: WHITE_BG,
                  color: TEXT_DARK,
                  fontSize: 19,
                  fontWeight: 700,
                  flexShrink: 0,
                  borderBottom: i < currentPlayers.length - 1 ? `1px solid ${GOLD_SEP}` : 'none',
                  animation: `t2RowIn 0.4s ${0.18 + i * 0.07}s cubic-bezier(0.22, 1, 0.36, 1) both`,
                }}
              >
                {/* Name */}
                <div style={{ flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                  {player.name}
                </div>
                {/* Role */}
                {hasRole && (
                  <div style={{ flex: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: TEXT_MUTED, fontSize: 15, fontWeight: 400 }}>
                    {player.position ?? '—'}
                  </div>
                )}
                {/* Stat columns */}
                {statFields.map(f => (
                  <div key={f.key} style={{ flex: 0.9, textAlign: 'center' }}>
                    {player.stats?.[f.key] ?? '—'}
                  </div>
                ))}
                {/* Price — gold accent on white bg */}
                <div style={{ flex: 1, textAlign: 'right', color: GOLD, fontWeight: 700 }}>
                  {player.isIconic ? 'ICONIC' : (player.finalPrice ? formatAmount(player.finalPrice) : '—')}
                </div>
              </div>
            ))}
          </div>

          {/* ── STATS FOOTER BAR — slides in after last row ── */}
          <div style={{
            display: 'flex',
            backgroundColor: GOLD,
            flexShrink: 0,
            minHeight: 56,
            animation: `t2RowIn 0.4s ${0.18 + currentPlayers.length * 0.07}s cubic-bezier(0.22, 1, 0.36, 1) both`,
          }}>
            {[
              { label: 'PLAYERS', value: String(allCurrentPlayers.length), color: TEXT_DARK },
              { label: 'SPENT',   value: formatAmount(spent),             color: TEXT_DARK },
              { label: 'BALANCE', value: formatAmount(balance),           color: GREEN     },
            ].map(stat => (
              <div key={stat.label} style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}>
                <span style={{ fontSize: 11, letterSpacing: 3, color: TEXT_MUTED_LIGHT, textTransform: 'uppercase' }}>
                  {stat.label}
                </span>
                <span style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

        </div>{/* end animated content */}
      </div>
    </>
  );
};

function ColHeader({ children, flex, align }: {
  children: React.ReactNode;
  flex: number;
  align: 'left' | 'center' | 'right';
}) {
  return (
    <div style={{
      flex,
      textAlign: align,
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: 2,
      color: TEXT_DARK,
      textTransform: 'uppercase',
    }}>
      {children}
    </div>
  );
}

export default TeamWiseSummaryT2;
