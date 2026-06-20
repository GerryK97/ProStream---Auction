'use client';

/**
 * TeamWiseImageT3 / TeamWiseImageryT3
 *
 * Redesign based on the provided saved overlays.uno sample:
 * "Double Starting Lineup - Bold".
 *
 * Sample structure extracted from Singular DOM:
 * - Team 1 Formation: top 0.1%, height 42.4%, transform-origin bottom
 * - Team 2 Formation: top 57.4%, height 42.4%, transform-origin top
 * - Middle band with team names and VS
 * - 5 player cards per team
 * - Each player card contains: background logo, darken overlay, headshot,
 *   side position/number, first name, last name
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { Player, Team, Tournament } from '@/types';

interface Props {
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  teamId: string;
  isExiting?: boolean;
}

const CANVAS_W = 1920;
const CANVAS_H = 1080;

const FORMATION_H = 458; // 42.4% of 1080
const TOP_FORMATION_Y = 1;
const BOTTOM_FORMATION_Y = 620; // 57.4% of 1080
const CARD_W = 300;
const CARD_H = 400;
const CARD_GAP = 18;
const CARD_TOP = 28;
const LEFT_PAD = 156;

const DARK = '#101214';
const PANEL = '#1b1f24';
const GOLD = '#b9aa62';
const WHITE = '#ffffff';
const LIGHT = '#ebebeb';
const MUTED = 'rgba(255,255,255,0.68)';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');

  @keyframes t3LineupFormationTopIn {
    from { opacity: 0; transform: translateY(-34px) scaleY(0.94); }
    to   { opacity: 1; transform: translateY(0) scaleY(1); }
  }
  @keyframes t3LineupFormationBottomIn {
    from { opacity: 0; transform: translateY(34px) scaleY(0.94); }
    to   { opacity: 1; transform: translateY(0) scaleY(1); }
  }
  @keyframes t3LineupCardIn {
    from { opacity: 0; transform: translateY(28px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes t3LineupCenterIn {
    from { opacity: 0; transform: scaleX(0.88); }
    to   { opacity: 1; transform: scaleX(1); }
  }
  @keyframes t3LineupShine {
    from { transform: translateX(-160%) skewX(-18deg); }
    to   { transform: translateX(310%) skewX(-18deg); }
  }
`;

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: '', last: parts[0] ?? '' };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

function imageForPlayer(player: Player): string {
  return player.photoURL?.trim() || player.secondaryImageURL?.trim() || '';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || '?';
}

function formatMoney(n?: number | null): string {
  if (!n) return '—';
  return n.toLocaleString('en-IN');
}

interface TeamBlock {
  team: Team;
  players: Player[];
  total: number;
}

function buildTeamBlocks(teams: Team[], players: Player[], teamId: string): [TeamBlock | null, TeamBlock | null] {
  const blocks = teams
    .map(team => {
      const sold = players
        .filter(p => p.isSold && p.winningTeamId === team._id)
        .sort((a, b) => (b.finalPrice ?? 0) - (a.finalPrice ?? 0) || a.name.localeCompare(b.name));
      return {
        team,
        players: sold.slice(0, 5),
        total: sold.reduce((sum, p) => sum + (p.finalPrice ?? 0), 0),
      };
    })
    .filter(block => block.players.length > 0)
    .sort((a, b) => b.total - a.total || b.players.length - a.players.length);

  if (blocks.length === 0) {
    const fallback = teams.slice(0, 2).map(team => ({ team, players: [], total: 0 }));
    return [fallback[0] ?? null, fallback[1] ?? null];
  }

  const selected = teamId ? blocks.find(block => block.team._id === teamId) : null;
  const first = selected ?? blocks[0] ?? null;
  const second = blocks.find(block => block.team._id !== first?.team._id) ?? blocks[1] ?? null;
  return [first, second];
}

function teamLabel(team: Team | null): { top: string; bottom: string } {
  if (!team) return { top: 'TEAM', bottom: '—' };
  const parts = team.name.trim().split(/\s+/);
  if (parts.length <= 1) return { top: team.shortCode || 'TEAM', bottom: team.name.toUpperCase() };
  return {
    top: parts.slice(0, -1).join(' '),
    bottom: parts[parts.length - 1].toUpperCase(),
  };
}

const TeamWiseImageT3: React.FC<Props> = ({ players, teams, tournament, teamId, isExiting = false }) => {
  const [entered, setEntered] = useState(false);
  const [topBlock, bottomBlock] = useMemo(
    () => buildTeamBlocks(teams, players, teamId),
    [teams, players, teamId],
  );

  useEffect(() => {
    if (isExiting) {
      setEntered(false);
      return;
    }
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(raf);
  }, [isExiting, topBlock?.team._id, bottomBlock?.team._id]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: CANVAS_W,
        height: CANVAS_H,
        overflow: 'hidden',
        fontFamily: 'Roboto, Helvetica, sans-serif',
        opacity: entered ? 1 : 0,
        transition: 'opacity 280ms ease',
      }}
    >
      <style>{CSS}</style>

      {/* Transparent OBS-safe background with subtle dark focus vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.24), rgba(0,0,0,0.02) 58%, rgba(0,0,0,0) 78%)',
        }}
      />

      <FormationBand
        block={topBlock}
        side="top"
        y={TOP_FORMATION_Y}
        visible={entered}
        delay={0}
      />

      <CenterStrip
        tournament={tournament}
        topTeam={topBlock?.team ?? null}
        bottomTeam={bottomBlock?.team ?? null}
        topTotal={topBlock?.total ?? 0}
        bottomTotal={bottomBlock?.total ?? 0}
        visible={entered}
      />

      <FormationBand
        block={bottomBlock}
        side="bottom"
        y={BOTTOM_FORMATION_Y}
        visible={entered}
        delay={120}
      />
    </div>
  );
};

function FormationBand({
  block,
  side,
  y,
  visible,
  delay,
}: {
  block: TeamBlock | null;
  side: 'top' | 'bottom';
  y: number;
  visible: boolean;
  delay: number;
}) {
  const team = block?.team ?? null;
  const lineup = Array.from({ length: 5 }, (_, i) => block?.players[i] ?? null);
  const reverse = side === 'bottom';

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: y,
        width: '100%',
        height: FORMATION_H,
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transformOrigin: side === 'top' ? '50% 100%' : '50% 0%',
        animation: visible
          ? `${side === 'top' ? 't3LineupFormationTopIn' : 't3LineupFormationBottomIn'} 520ms ${delay}ms cubic-bezier(0.22,1,0.36,1) both`
          : undefined,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          background: `linear-gradient(${side === 'top' ? '180deg' : '0deg'}, rgba(16,18,20,0.98), rgba(16,18,20,0.76))`,
          borderTop: side === 'bottom' ? `2px solid ${GOLD}` : undefined,
          borderBottom: side === 'top' ? `2px solid ${GOLD}` : undefined,
        }}
      />

      {/* Oversized team logo watermark, matching sample Logo widget (-15%, 130%, opacity) */}
      {team?.logoURL && (
        <img
          src={team.logoURL}
          alt=""
          style={{
            position: 'absolute',
            right: side === 'top' ? -170 : undefined,
            left: side === 'bottom' ? -170 : undefined,
            top: -80,
            width: 560,
            height: 560,
            objectFit: 'contain',
            opacity: 0.16,
            filter: 'grayscale(1) contrast(1.2)',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          left: LEFT_PAD,
          top: CARD_TOP,
          display: 'flex',
          flexDirection: reverse ? 'row-reverse' : 'row',
          gap: CARD_GAP,
        }}
      >
        {lineup.map((player, index) => (
          <PlayerCard
            key={player?._id ?? `${side}-empty-${index}`}
            player={player}
            team={team}
            index={index}
            reverse={reverse}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerCard({
  player,
  team,
  index,
  reverse,
}: {
  player: Player | null;
  team: Team | null;
  index: number;
  reverse: boolean;
}) {
  const name = splitName(player?.name ?? 'AVAILABLE SLOT');
  const photo = player ? imageForPlayer(player) : '';
  const number = player?.playerNo?.trim() || String(index + 1);
  const position = player?.position?.trim() || player?.playerClass?.trim() || '—';

  return (
    <div
      style={{
        position: 'relative',
        width: CARD_W,
        height: CARD_H,
        overflow: 'hidden',
        background: PANEL,
        boxShadow: '0 16px 36px rgba(0,0,0,0.46)',
        animation: `t3LineupCardIn 430ms ${0.18 + index * 0.07}s cubic-bezier(0.22,1,0.36,1) both`,
      }}
    >
      {/* Logo widget behind headshot */}
      {team?.logoURL && (
        <img
          src={team.logoURL}
          alt=""
          style={{
            position: 'absolute',
            left: '-15%',
            top: '-15%',
            width: '130%',
            height: '130%',
            objectFit: 'contain',
            opacity: player ? 0.32 : 0.46,
            filter: 'grayscale(1)',
          }}
        />
      )}

      {/* Headshot widget */}
      {photo ? (
        <img
          src={photo}
          alt=""
          referrerPolicy="no-referrer"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.50)',
            fontSize: 58,
            fontWeight: 900,
            letterSpacing: 2,
          }}
        >
          {player ? initials(player.name) : team?.shortCode?.slice(0, 2).toUpperCase() ?? '—'}
        </div>
      )}

      {/* Darken widget */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.28) 42%, rgba(0,0,0,0.80) 100%)',
          opacity: 0.88,
        }}
      />

      {/* Side Position and Number labels, matching sample layout */}
      <div
        style={{
          position: 'absolute',
          left: reverse ? undefined : 0,
          right: reverse ? 0 : undefined,
          top: '8%',
          width: '15%',
          height: '40%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          color: LIGHT,
          fontSize: 22,
          fontWeight: 900,
          writingMode: 'vertical-rl',
          transform: reverse ? 'rotate(180deg)' : 'none',
          letterSpacing: 1,
        }}
      >
        {position.toUpperCase()}
      </div>
      <div
        style={{
          position: 'absolute',
          left: reverse ? undefined : 0,
          right: reverse ? 0 : undefined,
          top: '52%',
          width: '15%',
          height: '40%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          color: GOLD,
          fontSize: 44,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {number}
      </div>

      {/* First/Last name text block */}
      <div
        style={{
          position: 'absolute',
          left: reverse ? '0%' : '17.5%',
          right: reverse ? '17.5%' : '0%',
          top: '6.75%',
          width: '82.5%',
          height: '42.5%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: reverse ? 'flex-end' : 'flex-start',
          color: WHITE,
          fontSize: 25,
          fontWeight: 500,
          textAlign: reverse ? 'right' : 'left',
          padding: '0 16px',
          boxSizing: 'border-box',
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}
      >
        {name.first || (player ? '' : team?.name ?? '')}
      </div>
      <div
        style={{
          position: 'absolute',
          left: reverse ? '0%' : '17.5%',
          right: reverse ? '17.5%' : '0%',
          top: '46.25%',
          width: '82.5%',
          height: '51.5%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: reverse ? 'flex-end' : 'flex-start',
          color: WHITE,
          fontSize: 42,
          fontWeight: 900,
          textTransform: 'uppercase',
          textAlign: reverse ? 'right' : 'left',
          padding: '0 16px 20px',
          boxSizing: 'border-box',
          lineHeight: 0.92,
          textShadow: '0 2px 10px rgba(0,0,0,0.9)',
          overflow: 'hidden',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name.last}
        </span>
      </div>

      {/* Price strip adapted for auction */}
      {player?.finalPrice && (
        <div
          style={{
            position: 'absolute',
            left: reverse ? 0 : undefined,
            right: reverse ? undefined : 0,
            top: 0,
            padding: '7px 10px',
            background: GOLD,
            color: DARK,
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: 0.5,
          }}
        >
          {formatMoney(player.finalPrice)}
        </div>
      )}
    </div>
  );
}

function CenterStrip({
  tournament,
  topTeam,
  bottomTeam,
  topTotal,
  bottomTotal,
  visible,
}: {
  tournament: Tournament | null;
  topTeam: Team | null;
  bottomTeam: Team | null;
  topTotal: number;
  bottomTotal: number;
  visible: boolean;
}) {
  const top = teamLabel(topTeam);
  const bottom = teamLabel(bottomTeam);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 458,
        width: '100%',
        height: 162,
        display: 'grid',
        gridTemplateColumns: '1fr 190px 1fr',
        alignItems: 'center',
        background: 'linear-gradient(90deg, rgba(185,170,98,0.92), rgba(235,235,235,0.98), rgba(185,170,98,0.92))',
        boxShadow: '0 0 44px rgba(0,0,0,0.42)',
        transformOrigin: '50% 50%',
        animation: visible ? 't3LineupCenterIn 420ms 160ms cubic-bezier(0.22,1,0.36,1) both' : undefined,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: '38%', background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.42) 50%, transparent 80%)', animation: 't3LineupShine 1.1s 0.25s cubic-bezier(0.4,0,0.6,1) forwards' }} />
      </div>

      <TeamNameBlock label={top} total={topTotal} align="right" />
      <div style={{ textAlign: 'center', color: DARK }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.78 }}>
          {tournament?.name ?? 'AUCTION'}
        </div>
        <div style={{ fontSize: 58, fontWeight: 900, lineHeight: 0.95, letterSpacing: 1 }}>VS</div>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.72 }}>TEAM IMAGERY</div>
      </div>
      <TeamNameBlock label={bottom} total={bottomTotal} align="left" />
    </div>
  );
}

function TeamNameBlock({ label, total, align }: { label: { top: string; bottom: string }; total: number; align: 'left' | 'right' }) {
  return (
    <div style={{ padding: align === 'right' ? '0 34px 0 0' : '0 0 0 34px', textAlign: align, color: DARK, minWidth: 0 }}>
      <div style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label.top}</div>
      <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 0.95, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label.bottom}</div>
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 900, letterSpacing: 2, opacity: 0.70 }}>SPENT {formatMoney(total)}</div>
    </div>
  );
}

export default TeamWiseImageT3;
