'use client';

import React, { useState, useEffect } from 'react';
import { Player, Team, Tournament } from '@/types';
import { getEnabledTeamOfficials } from '@/lib/teamOfficials';
import ResilientImage from '@/components/overlays/shared/ResilientImage';

interface Props {
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  filterTeamId?: string | null;
  isExiting?: boolean;
}

const PLAYERS_PER_PAGE = 15;
const PAGE_DURATION    = 6000;
const COLS             = 5;
const NAME_H           = 42;
const CARD_ASPECT      = '4 / 5';

const FONT_HEADING = "'Bebas Neue', cursive";
const FONT_BODY    = "'Rajdhani', sans-serif";

const formatAmount = (v: number) => v.toLocaleString('en-IN');

const TeamWiseImageT1: React.FC<Props> = ({
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
  const rows           = Math.max(1, Math.ceil(currentPlayers.length / COLS));
  const balance        = currentTeam.currentBalance ?? currentTeam.initialBudget ?? 0;
  const initial        = currentTeam.initialBudget ?? 0;
  const spent          = initial - balance;

  const dashAnim = isExiting
    ? 'summaryDashOut 0.35s ease 1.25s both'
    : 'summaryDashIn 0.30s ease 0s both';

  return (
    <>
      <style>{`
        @keyframes summaryDashIn  { from { transform: translateY(-28px); opacity: 0; } to { transform: translateY(0);     opacity: 1; } }
        @keyframes summaryDashOut { from { transform: translateY(0);     opacity: 1; } to { transform: translateY(-28px); opacity: 0; } }
        @keyframes t1ImgTeamIn    { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes t1ImgCardIn    { from { opacity: 0; transform: translateY(16px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes t1ImgShine     { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(320%) skewX(-18deg); } }
      `}</style>

      {/* Outer panel */}
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'var(--overlay-bg-panel)',
        borderRadius: 20,
        border: '1px solid var(--overlay-border-accent-subtle)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: dashAnim,
      }}>

        {/* Gold left accent bar */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 20,
          width: 5,
          height: 'calc(100% - 40px)',
          background: 'var(--overlay-color-primary)',
          borderRadius: '0 0 4px 4px',
          zIndex: 1,
        }} />

        {/* Shine sweep on team change */}
        <div
          key={`shine-${currentTeamIndex}`}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20, overflow: 'hidden' }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '40%',
            background: 'linear-gradient(105deg, transparent 20%, rgba(var(--overlay-color-primary-rgb),0.07) 50%, transparent 80%)',
            animation: 't1ImgShine 1.1s 0.1s cubic-bezier(0.4, 0, 0.6, 1) forwards',
          }} />
        </div>

        {/* ── Header ── */}
        <div
          key={`header-${currentTeamIndex}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 130,
            flexShrink: 0,
            paddingLeft: 40,
            paddingRight: 40,
            gap: 24,
            animation: 't1ImgTeamIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          {/* Team logo / initials fallback */}
          {currentTeam.logoURL ? (
            <ResilientImage
              src={currentTeam.logoURL}
              alt={currentTeam.name}
              style={{
                width: 96,
                height: 96,
                objectFit: 'contain',
                flexShrink: 0,
                filter: 'drop-shadow(0 0 8px rgba(var(--overlay-color-primary-rgb),0.4))',
              }}
            />
          ) : (
            <div style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'rgba(var(--overlay-color-primary-rgb),0.12)',
              border: '2px solid rgba(var(--overlay-color-primary-rgb),0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT_HEADING,
              fontSize: 30,
              color: 'var(--overlay-color-primary)',
              flexShrink: 0,
            }}>
              {currentTeam.shortCode?.slice(0, 2) ?? currentTeam.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          {/* Team name + sub-info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: FONT_HEADING,
              fontSize: 68,
              color: 'var(--overlay-color-primary)',
              letterSpacing: 5,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {currentTeam.name.toUpperCase()}
            </div>
            {(() => {
              const officials = getEnabledTeamOfficials(currentTeam, tournament);
              if (officials.length === 0) return null;
              return (
                <div style={{ display: 'flex', gap: 18, marginTop: 6, flexWrap: 'wrap' }}>
                  {officials.map((o) => (
                    <div key={o.role} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      {o.photoURL && (
                        <ResilientImage src={o.photoURL} alt={o.name}
                          style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--overlay-color-primary)' }} />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--overlay-color-primary)', lineHeight: 1 }}>{o.role}</div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 17, fontWeight: 500, color: 'var(--overlay-text-subtle)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div style={{
              fontFamily: FONT_BODY,
              fontSize: 20,
              fontWeight: 500,
              color: 'var(--overlay-text-subtle)',
              letterSpacing: 2,
              marginTop: 4,
            }}>
              {allCurrentPlayers.length} PLAYER{allCurrentPlayers.length !== 1 ? 'S' : ''}
              {totalPages > 1 && (
                <span style={{ marginLeft: 16, opacity: 0.7 }}>
                  PAGE {currentPage + 1}/{totalPages}
                </span>
              )}
            </div>
          </div>

          {/* Team pagination dots (multi-team) */}
          {totalTeams > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {teamsWithPlayers.map((_, i) => (
                <div key={i} style={{
                  width: i === currentTeamIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === currentTeamIndex
                    ? 'var(--overlay-color-primary)'
                    : 'var(--overlay-border-accent-subtle)',
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </div>
          )}

          {/* Page pagination dots (single-team, multi-page) */}
          {totalTeams === 1 && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <div key={i} style={{
                  width: i === currentPage ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === currentPage
                    ? 'var(--overlay-color-primary)'
                    : 'var(--overlay-border-accent-subtle)',
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Gold separator */}
        <div style={{
          height: 2,
          marginLeft: 20,
          marginRight: 20,
          flexShrink: 0,
          background: 'linear-gradient(90deg, var(--overlay-color-primary) 0%, rgba(var(--overlay-color-primary-rgb),0.15) 100%)',
        }} />

        {/* ── Photo grid ── */}
        <div
          key={`grid-${currentTeamIndex}-${currentPage}`}
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            gap: 12,
            padding: '16px 24px',
            overflow: 'hidden',
            alignItems: 'center',
            justifyItems: 'center',
            boxSizing: 'border-box',
            minHeight: 0,
          }}
        >
          {currentPlayers.map((player, i) => (
            <div
              key={`${currentTeamIndex}-${currentPage}-${player._id}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxWidth: '100%',
                aspectRatio: CARD_ASPECT,
                minWidth: 0,
                minHeight: 0,
                borderRadius: 8,
                overflow: 'hidden',
                animation: `t1ImgCardIn 0.4s ${0.08 + i * 0.05}s cubic-bezier(0.22, 1, 0.36, 1) both`,
              }}
            >
              {/* Photo area */}
              <div style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--overlay-bg-photo)',
                minHeight: 0,
              }}>
                {player.photoURL ? (
                  <ResilientImage
                    src={player.photoURL}
                    alt={player.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'top center',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(180deg, rgba(var(--overlay-color-primary-rgb),0.07) 0%, rgba(var(--overlay-color-primary-rgb),0.18) 100%)',
                  }}>
                    <span style={{
                      fontFamily: FONT_HEADING,
                      fontSize: 56,
                      color: 'rgba(var(--overlay-color-primary-rgb),0.45)',
                    }}>
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Name strip */}
              <div style={{
                height: NAME_H,
                flexShrink: 0,
                background: 'var(--overlay-color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
                fontFamily: FONT_HEADING,
                fontSize: 17,
                color: '#0d0d0d',
                textTransform: 'uppercase',
                letterSpacing: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box',
              }}>
                {player.name}
              </div>
            </div>
          ))}
        </div>

        {/* ── Stats footer ── */}
        <div style={{
          display: 'flex',
          height: 72,
          flexShrink: 0,
          borderTop: '1px solid var(--overlay-border-accent-subtle)',
          background: 'rgba(var(--overlay-color-primary-rgb),0.06)',
        }}>
          {([
            { label: 'PLAYERS', value: String(allCurrentPlayers.length), gold: true  },
            { label: 'SPENT',   value: formatAmount(spent),               gold: true  },
            { label: 'BALANCE', value: formatAmount(balance),             gold: false },
          ] as const).map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && (
                <div style={{
                  width: 1,
                  height: '55%',
                  alignSelf: 'center',
                  background: 'var(--overlay-border-accent-subtle)',
                }} />
              )}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}>
                <span style={{
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: 3,
                  color: 'var(--overlay-text-muted)',
                  textTransform: 'uppercase',
                }}>
                  {stat.label}
                </span>
                <span style={{
                  fontFamily: FONT_HEADING,
                  fontSize: 32,
                  letterSpacing: 2,
                  lineHeight: 1,
                  color: stat.gold ? 'var(--overlay-color-primary)' : 'var(--overlay-color-success)',
                }}>
                  {stat.value}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

      </div>
    </>
  );
};

export default TeamWiseImageT1;
