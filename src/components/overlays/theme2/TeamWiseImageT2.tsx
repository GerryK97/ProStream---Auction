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

const PLAYERS_PER_PAGE = 15;
const PAGE_DURATION = 6000;
const COLS = 5;
const GRID_AVAIL_H = 762; // 940 total − 90 header − 56 footer − 32 grid padding
const NAME_H = 40;
const MAX_IMG_H = 380;

const GOLD           = 'var(--t2-accent)';
const WHITE_BG       = 'var(--t2-bg-card)';
const TEXT_DARK      = 'var(--t2-text-primary)';
const TEXT_MUTED     = 'var(--t2-text-muted)';
const TEXT_MUTED_LIGHT = 'var(--t2-text-secondary)';
const GREEN          = 'var(--t2-success)';
const DOT_INACTIVE   = 'var(--t2-text-disabled)';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');

  @keyframes t2ImgTeamIn {
    from { opacity: 0; transform: translateX(52px) scale(0.97); }
    to   { opacity: 1; transform: translateX(0)    scale(1);    }
  }

  @keyframes t2ImgShineSwipe {
    from { transform: translateX(-140%) skewX(-18deg); }
    to   { transform: translateX(280%)  skewX(-18deg); }
  }

  @keyframes t2ImgCardIn {
    from { opacity: 0; transform: translateY(16px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
`;

const formatAmount = (v: number): string => v.toLocaleString('en-IN');

const TeamWiseImageT2: React.FC<Props> = ({
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

  // Dynamic sizing: rows are based on the team's total count (capped at PLAYERS_PER_PAGE)
  // so card size stays consistent across pages of the same team.
  const rows   = Math.max(1, Math.ceil(Math.min(allCurrentPlayers.length, PLAYERS_PER_PAGE) / COLS));
  const imageH = Math.min(MAX_IMG_H, Math.max(100, Math.floor((GRID_AVAIL_H - (rows - 1) * 12) / rows) - NAME_H));

  const balance = currentTeam.currentBalance ?? currentTeam.initialBudget ?? 0;
  const initial = currentTeam.initialBudget ?? 0;
  const spent   = initial - balance;

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
          key={currentTeamIndex}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: WHITE_BG,
            animation: 't2ImgTeamIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
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
              animation: 't2ImgShineSwipe 1.05s 0.15s cubic-bezier(0.4, 0, 0.6, 1) forwards',
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
              boxShadow: '0 0 18px var(--t2-shadow-color)',
              backgroundColor: 'var(--t2-bg-muted)',
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
                {allCurrentPlayers.length} PLAYER{allCurrentPlayers.length !== 1 ? 'S' : ''}&nbsp;·&nbsp;FULL SQUAD
                {totalPages > 1 && (
                  <span style={{ marginLeft: 12, opacity: 0.6 }}>
                    PAGE {currentPage + 1}/{totalPages}
                  </span>
                )}
              </div>
            </div>

            {/* Team pagination dots */}
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
            {/* Page pagination dots (single-team multi-page) */}
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

          {/* Player image grid */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            padding: '16px 24px',
            backgroundColor: WHITE_BG,
            overflow: 'hidden',
            alignContent: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}>
            {currentPlayers.map((player, i) => (
              <div
                key={`${currentTeamIndex}-${currentPage}-${player._id}`}
                style={{
                  width: `calc((100% - ${(COLS - 1) * 12}px) / ${COLS})`,
                  display: 'flex',
                  flexDirection: 'column',
                  flexShrink: 0,
                  animation: `t2ImgCardIn 0.4s ${0.1 + i * 0.05}s cubic-bezier(0.22, 1, 0.36, 1) both`,
                }}
              >
                {/* Photo */}
                <div style={{
                  width: '100%',
                  height: imageH,
                  background: 'var(--t2-bg-muted)',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '6px 6px 0 0',
                  flexShrink: 0,
                }}>
                  {player.photoURL ? (
                    <img
                      src={player.photoURL}
                      alt={player.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'top center',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(180deg, var(--t2-accent-soft) 0%, var(--t2-accent-soft) 100%)`,
                    }}>
                      <span style={{ color: 'var(--t2-border-accent)', fontSize: 64, fontWeight: 900 }}>
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name strip */}
                <div style={{
                  width: '100%',
                  height: 40,
                  background: GOLD,
                  color: TEXT_DARK,
                  textAlign: 'center',
                  padding: '0 6px',
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                  borderRadius: '0 0 6px 6px',
                }}>
                  {player.name}
                </div>
              </div>
            ))}
          </div>

          {/* Stats footer bar */}
          <div style={{
            display: 'flex',
            backgroundColor: GOLD,
            flexShrink: 0,
            minHeight: 56,
          }}>
            {[
              { label: 'PLAYERS', value: String(allCurrentPlayers.length), color: TEXT_DARK },
              { label: 'SPENT',   value: formatAmount(spent),               color: TEXT_DARK },
              { label: 'BALANCE', value: formatAmount(balance),             color: GREEN     },
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

        </div>
      </div>
    </>
  );
};

export default TeamWiseImageT2;
