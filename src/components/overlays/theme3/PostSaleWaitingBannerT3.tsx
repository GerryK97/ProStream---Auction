'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Player, Team, Tournament } from '@/types';
import { PlayerBarBackgroundT3 } from './PlayerBarBackgroundT3';
import { getFullScreenCardHeight } from './fullScreenPlayerCardT3Layout';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';

export interface PostSaleWaitingBannerT3Props {
  tournament: Tournament | null;
  teams: Team[];
  players: Player[];
  tickerVisible?: boolean;
  isExiting?: boolean;
}

function countPlayers(players: Player[]) {
  const pool = players.filter(p => !p.isIconic);
  return {
    available: pool.filter(p => !p.isSold && !p.isUnsold).length,
    sold: pool.filter(p => p.isSold).length,
    unsold: pool.filter(p => !p.isSold && p.isUnsold).length,
  };
}

function TeamMarqueeItem({ team }: { team: Team }) {
  const initials = (team.shortCode?.slice(0, 2) ?? team.name.slice(0, 2)).toUpperCase();
  return (
    <div
      className="t3-wait-team-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 28px',
        marginRight: 48,
        borderRadius: 10,
        background: 'rgba(0,0,0,0.38)',
        border: '1px solid rgba(255,255,255,0.12)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 8,
          border: '2px solid var(--t3-bar-gold, var(--t3-accent))',
          background: 'rgba(255,255,255,0.92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {team.logoURL ? (
          <img src={team.logoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
        ) : (
          <span style={{ fontFamily: DISPLAY_FONT, fontSize: 16, fontWeight: 800, color: 'var(--t3-bar-gold, var(--t3-accent))' }}>
            {initials}
          </span>
        )}
      </div>
      <span
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--t3-text-primary)',
          whiteSpace: 'nowrap',
        }}
      >
        {team.name}
      </span>
      {team.shortCode && (
        <span
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '0.14em',
            color: 'var(--t3-text-muted)',
          }}
        >
          {team.shortCode}
        </span>
      )}
    </div>
  );
}

const PostSaleWaitingBannerT3: React.FC<PostSaleWaitingBannerT3Props> = ({
  tournament,
  teams,
  players,
  tickerVisible = false,
  isExiting = false,
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const height = getFullScreenCardHeight(tickerVisible);
  const counts = useMemo(() => countPlayers(players), [players]);

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name)),
    [teams],
  );

  const marqueeTeams = sortedTeams.length > 0 ? [...sortedTeams, ...sortedTeams] : [];
  const marqueeDuration = Math.max(28, sortedTeams.length * 6);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const tournamentLogo = tournament?.logoURL?.trim() || tournament?.wheelCenterImageURL?.trim() || '';
  const tournamentName = tournament?.name ?? 'Live Auction';
  const nameLen = tournamentName.length;
  const titleSize = nameLen > 28 ? 64 : nameLen > 20 ? 76 : 92;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Saira+Extra+Condensed:wght@600;700;800&display=swap');
        @keyframes t3WaitBannerIn {
          from { opacity: 0; transform: scale(0.98) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes t3WaitTeamScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes t3WaitStatIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes t3WaitTournamentIn {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .t3-wait-root-enter { animation: t3WaitBannerIn 520ms cubic-bezier(0.22,1,0.36,1) both; }
        .t3-wait-tournament-enter { animation: t3WaitTournamentIn 560ms cubic-bezier(0.22,1,0.36,1) 80ms both; }
        .t3-wait-stat-enter { animation: t3WaitStatIn 420ms cubic-bezier(0.22,1,0.36,1) both; }
        .t3-wait-team-track {
          display: flex;
          width: max-content;
          animation: t3WaitTeamScroll ${marqueeDuration}s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .t3-wait-root-enter, .t3-wait-tournament-enter, .t3-wait-stat-enter { animation: none !important; }
          .t3-wait-team-track { animation: none !important; }
        }
      `}</style>

      <div
        className={isExiting ? undefined : 't3-wait-root-enter'}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height,
          overflow: 'hidden',
          pointerEvents: 'none',
          opacity: isExiting ? 0 : 1,
          transform: isExiting ? 'scale(0.98)' : undefined,
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          background: 'var(--t3-gradient-canvas, var(--overlay-bg-fullscreen))',
        }}
      >
        <PlayerBarBackgroundT3 animateSkew={!reducedMotion} reducedMotion={reducedMotion} />

        {/* Tournament hero */}
        <div
          className="t3-wait-tournament-enter"
          style={{
            position: 'absolute',
            top: 48,
            left: 64,
            right: 64,
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 148,
              height: 148,
              borderRadius: 16,
              border: '3px solid var(--t3-bar-gold, var(--t3-accent))',
              background: 'rgba(255,255,255,0.96)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            }}
          >
            {tournamentLogo ? (
              <img src={tournamentLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 14 }} />
            ) : (
              <span style={{ fontFamily: DISPLAY_FONT, fontSize: 48, fontWeight: 800, color: 'var(--t3-bar-gold, var(--t3-accent))' }}>
                {tournamentName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div
            style={{
              marginTop: 28,
              fontFamily: DISPLAY_FONT,
              fontSize: titleSize,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--t3-text-primary)',
              lineHeight: 1.05,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textShadow: '0 4px 24px rgba(0,0,0,0.55)',
            }}
          >
            {tournamentName}
          </div>

          <div
            style={{
              marginTop: 16,
              fontFamily: DISPLAY_FONT,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--t3-bar-gold, var(--t3-accent))',
            }}
          >
            Waiting for Next Player
          </div>

          {tournament?.auctionDate && (
            <div
              style={{
                marginTop: 10,
                fontFamily: DISPLAY_FONT,
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--t3-text-muted)',
              }}
            >
              {new Date(tournament.auctionDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          )}
        </div>

        {/* Player pool stats */}
        <div
          style={{
            position: 'absolute',
            top: 420,
            left: 48,
            right: 48,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 28,
            zIndex: 6,
          }}
        >
          {([
            { label: 'Available', value: counts.available, color: 'var(--t3-text-primary)', delay: '200ms' },
            { label: 'Sold', value: counts.sold, color: 'var(--t3-success, #6EC49A)', delay: '280ms' },
            { label: 'Unsold', value: counts.unsold, color: 'var(--t3-danger, #D87070)', delay: '360ms' },
          ] as const).map(stat => (
            <div
              key={stat.label}
              className="t3-wait-stat-enter"
              style={{
                padding: '36px 24px',
                borderRadius: 12,
                textAlign: 'center',
                background: 'rgba(0,0,0,0.42)',
                border: '1px solid rgba(255,255,255,0.1)',
                animationDelay: stat.delay,
              }}
            >
              <div
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: 72,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: stat.color,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontFamily: DISPLAY_FONT,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--t3-text-muted)',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Scrolling team marquee */}
        {marqueeTeams.length > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: tickerVisible ? 24 : 48,
              height: 88,
              zIndex: 6,
              overflow: 'hidden',
              borderTop: '2px solid var(--t3-bar-gold, var(--t3-accent))',
              background: 'rgba(0,0,0,0.55)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 24,
                paddingRight: 16,
                zIndex: 2,
                background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 70%, transparent 100%)',
              }}
            >
              <span
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--t3-bar-gold, var(--t3-accent))',
                  whiteSpace: 'nowrap',
                }}
              >
                Teams
              </span>
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 120 }}>
              <div className="t3-wait-team-track">
                {marqueeTeams.map((team, i) => (
                  <TeamMarqueeItem key={`${team._id}-${i}`} team={team} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PostSaleWaitingBannerT3;
