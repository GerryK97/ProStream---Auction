'use client';

import React from 'react';
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

const PANEL_LEFT = 192;
const PANEL_TOP = 54;
const PANEL_W = 1536;
const PANEL_H = 972;
const TITLE_H = 107;
const HEADER_H = 56;
const FOOTER_H = 62;

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
  @keyframes t3Top10Shine {
    from { transform: translateX(-150%) skewX(-18deg); }
    to   { transform: translateX(290%) skewX(-18deg); }
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

  const totalSold = players.filter(p => p.isSold && !p.isIconic).length;
  const highestBid = top10[0]?.finalPrice ?? 0;
  const top10Total = top10.reduce((sum, p) => sum + (p.finalPrice ?? 0), 0);

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
          animation: isExiting ? undefined : 't3Top10In 420ms cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: PANEL_H - 15, background: DARK }} />
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: TITLE_H, background: WHITE }} />
        <div style={{ position: 'absolute', left: 0, top: TITLE_H, right: 0, height: HEADER_H, background: DARK, filter: 'brightness(90%)' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: TITLE_H, background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.13) 100%)' }} />

        {/* Shine sweep */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 30 }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: '36%', background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.22) 50%, transparent 80%)', animation: 't3Top10Shine 1s 0.15s cubic-bezier(0.4,0,0.6,1) forwards' }} />
        </div>

        {/* Title */}
        <div style={{ position: 'absolute', left: 38, top: 22, width: 1060, color: DARK }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', lineHeight: 1 }}>
            {tournament.name}
          </div>
          <div style={{ marginTop: 10, fontSize: 40, fontWeight: 700, lineHeight: 1, textTransform: 'uppercase' }}>
            TOP 10 SOLD PLAYERS
          </div>
        </div>

        <div style={{ position: 'absolute', right: 38, top: 28, textAlign: 'right', color: DARK }}>
          <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1 }}>{formatCurrency(highestBid)}</div>
          <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>HIGHEST BID</div>
        </div>

        {/* Header */}
        <div style={{ position: 'absolute', left: 38, top: 122, right: 38, height: 30, display: 'grid', gridTemplateColumns: '70px 520px 300px 250px', columnGap: 34, alignItems: 'center', color: WHITE, fontSize: 22, fontWeight: 500 }}>
          <Header>#</Header>
          <Header>PLAYER</Header>
          <Header>TEAM</Header>
          <Header align="right">PRICE</Header>
        </div>

        {/* Rows */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 184, bottom: FOOTER_H + 15, overflow: 'hidden' }}>
          {top10.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.42)', fontSize: 28, fontWeight: 500, letterSpacing: 2 }}>
              NO SOLD PLAYERS YET
            </div>
          ) : (
            top10.map((player, index) => {
              const team = teams.find(t => t._id === player.winningTeamId);
              const meta = [player.position, player.playerClass].filter(Boolean).join(' · ');
              const isPodium = index < 3;

              return (
                <div
                  key={player._id}
                  style={{
                    position: 'relative',
                    height: 72,
                    margin: '0 38px',
                    display: 'grid',
                    gridTemplateColumns: '70px 520px 300px 250px',
                    columnGap: 34,
                    alignItems: 'center',
                    borderBottom: `1px solid rgba(204,204,204,0.45)`,
                    background: index === 0 ? 'linear-gradient(90deg, rgba(185,170,98,0.16) 0%, rgba(185,170,98,0.04) 100%)' : 'transparent',
                    color: WHITE,
                    animation: `t3Top10RowIn 360ms ${0.12 + index * 0.06}s cubic-bezier(0.22,1,0.36,1) both`,
                  }}
                >
                  <div style={{ color: isPodium ? GOLD : MUTED, fontSize: 30, fontWeight: isPodium ? 700 : 400 }}>
                    {index + 1}
                  </div>

                  <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <PlayerThumb player={player} rank={index + 1} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 28, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize', color: isPodium ? GOLD : WHITE }}>
                        {player.name}
                      </div>
                      {meta && <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.62)', fontSize: 13, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</div>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    {team?.logoURL && <img src={team.logoURL} alt="" style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0 }} />}
                    <span style={{ color: MUTED, fontSize: 22, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team?.shortCode ?? team?.name ?? '—'}</span>
                  </div>

                  <div style={{ textAlign: 'right', color: GREEN, fontSize: 30, fontWeight: 700 }}>
                    {formatCurrency(player.finalPrice)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 15, height: FOOTER_H, background: GOLD, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', color: DARK }}>
          <FooterStat label="PLAYERS SOLD" value={String(totalSold)} />
          <FooterStat label="HIGHEST BID" value={formatCurrency(highestBid)} />
          <FooterStat label="TOP 10 TOTAL" value={formatCurrency(top10Total)} />
        </div>
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
        width: 50,
        height: 50,
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

function FooterStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.75 }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

export default Top10SummaryT3;
