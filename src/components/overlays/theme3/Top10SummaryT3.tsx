'use client';

import React from 'react';
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
const PATTERN_H = PANEL_H - 15;
const TITLE_H = 107;
const HEADER_H = 56;
const FOOTER_H = 62;
const ROW_H = 66;

/** # | PLAYER | TEAM | PRICE */
const COLS = '70px 1fr 340px 260px';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
  @keyframes t3Top10In {
    from { opacity: 0; transform: scale(0.97) translateY(18px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes t3Top10RowIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

function formatCurrency(n?: number | null): string {
  if (!n) return '—';
  return n.toLocaleString('en-IN');
}

const Top10SummaryT3: React.FC<Props> = ({ players, teams, tournament, isExiting = false }) => {
  const top10 = [...players]
    .filter(p => p.isSold && !p.isIconic && p.finalPrice)
    .sort((a, b) => (b.finalPrice ?? 0) - (a.finalPrice ?? 0) || a.name.localeCompare(b.name))
    .slice(0, 10);

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
          animation: isExiting ? undefined : 't3Top10In 420ms cubic-bezier(0.22,1,0.36,1) both',
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
            TOP 10 SOLD PLAYERS
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
          {tournament?.logoURL ? (
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
              {(tournament?.name || 'T').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Header */}
        <div style={{ position: 'absolute', left: 38, top: 122, right: 38, height: 30, display: 'grid', gridTemplateColumns: COLS, columnGap: 28, alignItems: 'center', color: WHITE, fontSize: 22, fontWeight: 500, zIndex: 10 }}>
          <Header>#</Header>
          <Header>PLAYER</Header>
          <Header>TEAM</Header>
          <Header align="right">PRICE</Header>
        </div>

        {/* Rows */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 184, bottom: FOOTER_H + 15, overflow: 'hidden', zIndex: 10 }}>
          {top10.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.42)', fontSize: 28, fontWeight: 500, letterSpacing: 2 }}>
              NO SOLD PLAYERS YET
            </div>
          ) : (
            top10.map((player, index) => {
              const team = teams.find(t => t._id === player.winningTeamId);
              const isPodium = index < 3;

              return (
                <div
                  key={player._id}
                  style={{
                    position: 'relative',
                    height: ROW_H,
                    margin: '0 38px',
                    display: 'grid',
                    gridTemplateColumns: COLS,
                    columnGap: 28,
                    alignItems: 'center',
                    borderBottom: `1px solid rgba(204,204,204,0.45)`,
                    background: index === 0 ? 'linear-gradient(90deg, rgba(185,170,98,0.16) 0%, rgba(185,170,98,0.04) 100%)' : 'transparent',
                    color: WHITE,
                    animation: `t3Top10RowIn 360ms ${0.12 + index * 0.06}s cubic-bezier(0.22,1,0.36,1) both`,
                  }}
                >
                  <div style={{ color: isPodium ? GOLD : MUTED, fontSize: 28, fontWeight: isPodium ? 700 : 400 }}>
                    {index + 1}
                  </div>

                  <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 16, height: '100%' }}>
                    <PlayerThumb player={player} rank={index + 1} />
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
                          fontSize: 38,
                          fontWeight: 600,
                          lineHeight: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textTransform: 'capitalize',
                          width: '100%',
                          color: isPodium ? GOLD : WHITE,
                        }}
                      >
                        {player.name}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      color: MUTED,
                      fontSize: 24,
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                  >
                    {team?.name ?? '—'}
                  </div>

                  <div style={{ textAlign: 'right', color: GOLD, fontSize: 28, fontWeight: 700 }}>
                    {formatCurrency(player.finalPrice)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer strip */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 15, height: FOOTER_H, background: GOLD, zIndex: 10 }} />
      </div>
    </>
  );
};

function PlayerThumb({ player, rank }: { player: Player; rank: number }) {
  const src = player.photoURL?.trim() || player.secondaryImageURL?.trim() || '';
  const initials = player.name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  const isPodium = rank <= 3;

  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 8,
        flexShrink: 0,
        border: `2px solid ${isPodium ? GOLD : 'rgba(185,170,98,0.65)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
        boxShadow: isPodium ? '0 0 16px rgba(185,170,98,0.28)' : undefined,
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
        <span style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{initials || '?'}</span>
      )}
    </div>
  );
}

function Header({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'center' | 'right' }) {
  return <div style={{ textAlign: align, fontSize: 24, fontWeight: 500, color: WHITE }}>{children}</div>;
}

export default Top10SummaryT3;
