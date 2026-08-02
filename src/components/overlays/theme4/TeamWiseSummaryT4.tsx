'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getMinClassBasePrice } from '@/lib/playerClassUtils';
import type { Player, Team, Tournament } from '@/types';
import { formatT4Amount } from './frame15PlayerCardT4Layout';
import {
  T4_SUMMARY_ACCENT,
  T4_SUMMARY_ACCENT_DEEP,
  T4_SUMMARY_COL_HEADER,
  T4_SUMMARY_COL_HEADER_DEEP,
  T4_SUMMARY_DIVIDER,
  T4_SUMMARY_FOOTER_H,
  T4_SUMMARY_HEADER_H,
  T4_SUMMARY_MUTED,
  T4_SUMMARY_PAGE_MS,
  T4_SUMMARY_PANEL_BG,
  T4_SUMMARY_PANEL_H,
  T4_SUMMARY_PANEL_LEFT,
  T4_SUMMARY_PANEL_TOP,
  T4_SUMMARY_PANEL_W,
  T4_SUMMARY_ROW_H,
  T4_SUMMARY_ROWS_BOTTOM_PAD,
  T4_SUMMARY_ROWS_PER_PAGE,
  T4_SUMMARY_TEXT,
  T4_SUMMARY_TITLE_BOTTOM,
  T4_SUMMARY_TITLE_BOTTOM_DEEP,
  T4_SUMMARY_TITLE_BOTTOM_H,
  T4_SUMMARY_TITLE_H,
  T4_SUMMARY_TITLE_TOP,
  T4_SUMMARY_TITLE_TOP_DEEP,
  T4_SUMMARY_TITLE_TOP_H,
  T4_TEAM_WISE_COLS,
} from './soldPlayersSummaryT4Layout';

interface Props {
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  teamId?: string;
  isExiting?: boolean;
}

const FONT = '"Barlow", "Oswald", "Arial Narrow", sans-serif';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;700&display=swap');

  @keyframes t4TeamWiseIn {
    from { opacity: 0; transform: scale(0.97) translateY(18px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes t4TeamWiseRowIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .t4-team-wise-panel, .t4-team-wise-row { animation: none !important; }
  }
`;

interface TeamRoster {
  team: Team;
  soldPlayers: Player[];
}

function soldForTeam(team: Team, players: Player[]): Player[] {
  const teamId = String(team._id);
  return players
    .filter(
      p =>
        p.isSold &&
        !p.isIconic &&
        p.winningTeamId != null &&
        String(p.winningTeamId) === teamId,
    )
    .sort(
      (a, b) =>
        (b.finalPrice ?? 0) - (a.finalPrice ?? 0) || a.name.localeCompare(b.name),
    );
}

function buildTeamRosters(teams: Team[], players: Player[], teamId?: string): TeamRoster[] {
  const filterId = teamId?.trim() || '';
  const source = filterId
    ? teams.filter(t => String(t._id) === String(filterId))
    : teams;

  const mapped = source.map(team => ({
    team,
    soldPlayers: soldForTeam(team, players),
  }));

  // Locked team filter: always show that team (even with an empty roster).
  if (filterId) {
    return mapped;
  }

  // All teams: only cycle teams that have sold players.
  return mapped
    .filter(entry => entry.soldPlayers.length > 0)
    .sort((a, b) => b.soldPlayers.length - a.soldPlayers.length);
}

/**
 * Theme 4 Team-wise Summary.
 * Chrome = Player Summary (Fresh + ticker-blue). Data = Theme 3 per-team sold roster.
 */
const TeamWiseSummaryT4: React.FC<Props> = ({
  players,
  teams,
  tournament,
  teamId,
  isExiting = false,
}) => {
  const [teamIndex, setTeamIndex] = useState(0);
  const [page, setPage] = useState(0);

  const rosters = useMemo(
    () => buildTeamRosters(teams, players, teamId),
    [teams, players, teamId],
  );
  const totalTeams = rosters.length;
  const safeTeamIndex = totalTeams > 0 ? teamIndex % totalTeams : 0;
  const { team: currentTeam, soldPlayers } = rosters[safeTeamIndex] ?? {
    team: null,
    soldPlayers: [],
  };
  const totalPages = Math.max(1, Math.ceil(soldPlayers.length / T4_SUMMARY_ROWS_PER_PAGE));
  const pageRows = soldPlayers.slice(
    page * T4_SUMMARY_ROWS_PER_PAGE,
    page * T4_SUMMARY_ROWS_PER_PAGE + T4_SUMMARY_ROWS_PER_PAGE,
  );

  const balance = currentTeam?.currentBalance ?? currentTeam?.initialBudget ?? 0;
  const initial = currentTeam?.initialBudget ?? 0;
  const spent = initial - balance;
  const squadSize = tournament?.squadSize ?? 0;
  const canBuy = Math.max(0, squadSize - soldPlayers.length);
  const maxBid = (() => {
    if (!tournament || canBuy <= 0) return 0;
    if (canBuy === 1) return balance;
    const minBase = getMinClassBasePrice(tournament);
    return Math.max(0, balance - (canBuy - 1) * minBase);
  })();

  useEffect(() => {
    setTeamIndex(0);
    setPage(0);
  }, [teamId, totalTeams]);

  const paginationRef = useRef({
    totalTeams,
    totalPages,
    multiTeam: !teamId && totalTeams > 1,
    isExiting: Boolean(isExiting),
  });
  paginationRef.current = {
    totalTeams,
    totalPages,
    multiTeam: !teamId && totalTeams > 1,
    isExiting: Boolean(isExiting),
  };

  useEffect(() => {
    if (totalTeams === 0) return;

    let cancelled = false;
    let timeoutId: number | undefined;

    const scheduleNext = () => {
      if (cancelled || paginationRef.current.isExiting) return;
      const { totalPages: pages, totalTeams: teamCount } = paginationRef.current;
      if (teamCount === 1 && pages === 1) return;

      timeoutId = window.setTimeout(() => {
        if (cancelled || paginationRef.current.isExiting) return;
        setPage(prev => {
          const latest = paginationRef.current;
          if (prev + 1 < latest.totalPages) return prev + 1;
          if (latest.multiTeam && latest.totalTeams > 1) {
            setTeamIndex(i => (i + 1) % latest.totalTeams);
          }
          return 0;
        });
        scheduleNext();
      }, T4_SUMMARY_PAGE_MS);
    };

    scheduleNext();
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [teamId, totalTeams, isExiting]);

  if (!tournament) return null;

  const rowsTop = T4_SUMMARY_TITLE_H + T4_SUMMARY_HEADER_H;
  const titleSecondary = currentTeam?.name ?? 'TEAM-WISE SUMMARY';
  const emptyMessage = currentTeam
    ? 'NO SOLD PLAYERS FOR THIS TEAM'
    : 'NO SOLD PLAYERS YET';
  const showEmpty = !currentTeam || soldPlayers.length === 0;

  return (
    <>
      <style>{CSS}</style>
      <div
        key={`${currentTeam?._id ?? 'empty'}-${page}`}
        className="t4-team-wise-panel"
        data-t4-element="team-wise-summary"
        data-t4-label="Theme 4 Team-wise Summary"
        style={{
          position: 'absolute',
          left: T4_SUMMARY_PANEL_LEFT,
          top: T4_SUMMARY_PANEL_TOP,
          width: T4_SUMMARY_PANEL_W,
          height: T4_SUMMARY_PANEL_H,
          overflow: 'hidden',
          pointerEvents: 'auto',
          fontFamily: FONT,
          boxShadow: '0 12px 48px rgba(0,0,0,0.70)',
          opacity: isExiting ? 0 : 1,
          transform: isExiting ? 'scale(0.97)' : 'scale(1)',
          transition: 'opacity 0.45s ease, transform 0.45s ease',
          animation: isExiting
            ? undefined
            : 't4TeamWiseIn 420ms cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: T4_SUMMARY_PANEL_BG,
            zIndex: 0,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: T4_SUMMARY_TITLE_H,
            right: 0,
            bottom: T4_SUMMARY_FOOTER_H,
            opacity: 0.75,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.35) 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {/* Title — tournament / team name (Player Summary chrome) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            height: T4_SUMMARY_TITLE_H,
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'relative',
              height: T4_SUMMARY_TITLE_TOP_H,
              flexShrink: 0,
              background: `linear-gradient(180deg, ${T4_SUMMARY_TITLE_TOP} 0%, ${T4_SUMMARY_TITLE_TOP_DEEP} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 120px',
              boxSizing: 'border-box',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.18) 100%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                fontFamily: FONT,
                fontSize: 24,
                fontWeight: 400,
                lineHeight: 1,
                color: T4_SUMMARY_TEXT,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {tournament.name}
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              height: T4_SUMMARY_TITLE_BOTTOM_H,
              flex: 1,
              background: `linear-gradient(180deg, ${T4_SUMMARY_TITLE_BOTTOM} 0%, ${T4_SUMMARY_TITLE_BOTTOM_DEEP} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 120px',
              boxSizing: 'border-box',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,0.22) 100%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                fontFamily: FONT,
                fontSize: 40,
                fontWeight: 400,
                lineHeight: 1,
                color: T4_SUMMARY_TEXT,
                textAlign: 'center',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {titleSecondary}
            </div>
          </div>
        </div>

        {/* Team logo — right of title band */}
        {currentTeam && (
          <div
            style={{
              position: 'absolute',
              right: 16,
              top: 6,
              height: T4_SUMMARY_TITLE_H - 12,
              width: T4_SUMMARY_TITLE_H - 12,
              zIndex: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {currentTeam.logoURL ? (
              <img
                src={currentTeam.logoURL}
                alt={currentTeam.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 8,
                  border: `2px solid ${T4_SUMMARY_ACCENT}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.08)',
                  color: T4_SUMMARY_TEXT,
                  fontFamily: FONT,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                {(currentTeam.shortCode || currentTeam.name || 'T').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Column header */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: T4_SUMMARY_TITLE_H,
            right: 0,
            height: T4_SUMMARY_HEADER_H,
            zIndex: 4,
            display: 'grid',
            gridTemplateColumns: T4_TEAM_WISE_COLS,
            columnGap: 28,
            alignItems: 'center',
            padding: '0 40px',
            boxSizing: 'border-box',
            background: `linear-gradient(180deg, ${T4_SUMMARY_COL_HEADER} 0%, ${T4_SUMMARY_COL_HEADER_DEEP} 100%)`,
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 45%, rgba(0,0,0,0.2) 100%)',
              pointerEvents: 'none',
            }}
          />
          <Header>#</Header>
          <Header>PLAYER</Header>
          <Header align="right">SOLD PRICE</Header>
        </div>

        {/* Rows */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: rowsTop,
            bottom: T4_SUMMARY_FOOTER_H + T4_SUMMARY_ROWS_BOTTOM_PAD,
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          {showEmpty ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 40px',
                boxSizing: 'border-box',
                fontFamily: FONT,
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: T4_SUMMARY_MUTED,
                textAlign: 'center',
              }}
            >
              {emptyMessage}
            </div>
          ) : (
            pageRows.map((p, i) => {
              const globalIndex = page * T4_SUMMARY_ROWS_PER_PAGE + i + 1;
              return (
                <div
                  key={p._id}
                  className="t4-team-wise-row"
                  data-t4-element="team-wise-row"
                  style={{
                    position: 'relative',
                    height: T4_SUMMARY_ROW_H,
                    margin: '0 40px',
                    display: 'grid',
                    gridTemplateColumns: T4_TEAM_WISE_COLS,
                    columnGap: 28,
                    alignItems: 'center',
                    borderBottom: `1px solid ${T4_SUMMARY_DIVIDER}`,
                    color: T4_SUMMARY_TEXT,
                    animation: `t4TeamWiseRowIn 320ms ${0.08 + i * 0.045}s cubic-bezier(0.22,1,0.36,1) both`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 22,
                      fontWeight: 400,
                      color: T4_SUMMARY_MUTED,
                    }}
                  >
                    {globalIndex}
                  </div>
                  <div
                    style={{
                      minWidth: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      height: '100%',
                    }}
                  >
                    <PlayerThumb player={p} />
                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                        fontFamily: FONT,
                        fontSize: 28,
                        fontWeight: 700,
                        lineHeight: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: T4_SUMMARY_TEXT,
                      }}
                    >
                      {p.name}
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: 'right',
                      fontFamily: FONT,
                      fontSize: 24,
                      fontWeight: 400,
                      color: T4_SUMMARY_TEXT,
                    }}
                  >
                    {formatT4Amount(p.finalPrice ?? 0)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: T4_SUMMARY_FOOTER_H,
            background: `linear-gradient(180deg, ${T4_SUMMARY_ACCENT} 0%, ${T4_SUMMARY_ACCENT_DEEP} 100%)`,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            color: T4_SUMMARY_TEXT,
            zIndex: 10,
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 28%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.28) 100%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <FooterStat
            label="PLAYERS"
            value={`${soldPlayers.length}/${squadSize || '—'}`}
          />
          <FooterStat label="SPENT" value={formatT4Amount(spent)} />
          <FooterStat label="MAX BID" value={formatT4Amount(maxBid)} />
          <FooterStat label="BALANCE" value={formatT4Amount(balance)} />
        </div>

        {(totalPages > 1 || (!teamId && totalTeams > 1)) && (
          <div
            style={{
              position: 'absolute',
              right: 40,
              bottom: T4_SUMMARY_FOOTER_H + 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              zIndex: 12,
              pointerEvents: 'none',
            }}
          >
            {!teamId && totalTeams > 1 && (
              <>
                {rosters.map((_, i) => (
                  <div
                    key={`team-${i}`}
                    style={{
                      width: i === safeTeamIndex ? 22 : 8,
                      height: 8,
                      borderRadius: 4,
                      background:
                        i === safeTeamIndex ? T4_SUMMARY_ACCENT : 'rgba(255,255,255,0.28)',
                      transition: 'all 0.25s ease',
                    }}
                  />
                ))}
                {totalPages > 1 && (
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>|</span>
                )}
              </>
            )}
            {totalPages > 1 && (
              <>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div
                    key={`page-${i}`}
                    style={{
                      width: i === page ? 22 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: i === page ? T4_SUMMARY_ACCENT : 'rgba(255,255,255,0.28)',
                      transition: 'all 0.25s ease',
                    }}
                  />
                ))}
                <span
                  style={{
                    marginLeft: 6,
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  PAGE {page + 1}/{totalPages}
                </span>
              </>
            )}
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
        width: 40,
        height: 40,
        borderRadius: 6,
        flexShrink: 0,
        border: `2px solid ${T4_SUMMARY_ACCENT}`,
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
        <span
          style={{
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 700,
            color: T4_SUMMARY_ACCENT,
          }}
        >
          {initials || '?'}
        </span>
      )}
    </div>
  );
}

function Header({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        textAlign: align,
        fontFamily: FONT,
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: T4_SUMMARY_TEXT,
      }}
    >
      {children}
    </div>
  );
}

function FooterStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        minWidth: 0,
        padding: '0 8px',
      }}
    >
      <span
        style={{
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: 'uppercase',
          opacity: 0.8,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 700,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default TeamWiseSummaryT4;
