'use client';

/**
 * TeamWiseImageT3 — Team Standings Leaderboard (Theme 3)
 *
 * Pixel-accurate React replica of the Singular.live "Leaderboard - Olympic"
 * template (app instance 6629856, template 518 v49).
 *
 * Visual structure (1920×1080 canvas):
 *   ┌─ infoMask panel — left:192px top:54px w:1536 h:972 ───────────────────┐
 *   │  [gold accent strip — full width, 14px at bottom, z=-11]              │
 *   │  [dark panel 98.5% height — #2a2f35, z=-10]                           │
 *   │  [white title block 11% — 107px, z=-9]                                │
 *   │  [header row 16.8% — 163px, dark 90% brightness, z=-8]                │
 *   │  [table 77.5% from 18.95% — 10 staggered rows, z=-1]                  │
 *   └────────────────────────────────────────────────────────────────────────┘
 *
 * Adapted columns (auction context):
 *   # | Logo | Team Name | Sqd | Budget | Spend | Balance
 */

import React, { useEffect, useRef, useState } from 'react';
import { Theme3Canvas, THEME3_CANVAS_WIDTH, THEME3_CANVAS_HEIGHT } from './Theme3Canvas';
import type { Player, Team, Tournament } from '@/types';

// ─── Exact Singular colour tokens ─────────────────────────────────────────────
const CLR_DARK   = '#2a2f35';   // panel / header background
const CLR_GOLD   = '#b9aa62';   // accent line
const CLR_WHITE  = '#ffffff';
const CLR_MUTED  = '#cccccc';   // row divider
const CLR_DIM    = 'rgba(255,255,255,0.70)'; // stat values

// ─── Canvas geometry (pixels, 1920×1080 base) ─────────────────────────────────
const MASK_LEFT   = 0.10 * THEME3_CANVAS_WIDTH;   // 192
const MASK_TOP    = 0.05 * THEME3_CANVAS_HEIGHT;  // 54
const MASK_W      = 0.80 * THEME3_CANVAS_WIDTH;   // 1536
const MASK_H      = 0.90 * THEME3_CANVAS_HEIGHT;  // 972

// Block heights (% of MASK_H)
const TITLE_H     = 0.11  * MASK_H;  // 106.9
const HEADER_H    = 0.168 * MASK_H;  // 163.3
const TABLE_TOP   = 0.1895 * MASK_H; // 184.3  (18.95% of 972)
const TABLE_H     = 0.775  * MASK_H; // 753.3
const GOLD_STRIP  = 0.015  * MASK_H; // 14.6   (last 1.5% = gold strip)
const DARK_H      = 0.985  * MASK_H; // 957.4

const MAX_ROWS    = 10;

// ─── Column layout (% of MASK_W) — adapted from Singular header positions ─────
// Original:  PL@37.7  W@45.2  D@52.6  L@60.1  GF@67.7  GD@82.7  Pts@89.5
// Adapted:   Sqd@37.7  Budget@48  Spend@63  Bal@82.7   (big label replaced)
const COL_RANK_L  = 0.0325;  // 3.25%
const COL_RANK_W  = 0.04;

const COL_LOGO_L  = 0.0725;  // 7.25%
const COL_LOGO_W  = 0.055;

const COL_NAME_L  = 0.135;   // 13.5%
const COL_NAME_W  = 0.215;

const COL_SQD_L   = 0.377;   // matches PL header exactly
const COL_BDG_L   = 0.481;   // budget
const COL_SPD_L   = 0.601;   // spend
const COL_BAL_L   = 0.759;   // balance remaining
const COL_PTS_L   = 0.895;   // "big" column (balance highlight)
const COL_STAT_W  = 0.065;
const COL_PTS_W   = 0.09;

// Row height in the table (% of TABLE_H) — 10 rows with tight spacing
const ROW_H = TABLE_H / MAX_ROWS; // ~75.3px

// ─── Animation ────────────────────────────────────────────────────────────────
const STAGGER_MS  = 60;   // delay per row (topToBottom)
const ENTER_MS    = 360;  // slide-in duration
const EXIT_MS     = 280;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCompact(n: number): string {
  if (n === 0) return '0';
  const cr = 10_000_000;
  const lk = 100_000;
  if (Math.abs(n) >= cr) return (n / cr).toFixed(1).replace(/\.0$/, '') + 'Cr';
  if (Math.abs(n) >= lk) return (n / lk).toFixed(1).replace(/\.0$/, '') + 'L';
  return n.toLocaleString('en-IN');
}

function fmtInt(n: number): string {
  return n.toLocaleString('en-IN');
}

// ─── Sub-component: single table row ─────────────────────────────────────────
interface RowData {
  rank: number;
  team: Team;
  logoURL: string;
  squadCount: number;
  budget: number;
  spend: number;
  balance: number;
}

interface RowProps {
  row: RowData;
  index: number;        // 0-based visual row position
  visible: boolean;
  exiting: boolean;
  highlighted: boolean;
}

function LeaderboardRow({ row, index, visible, exiting, highlighted }: RowProps) {
  const [entered, setEntered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && !exiting) {
      timerRef.current = setTimeout(() => setEntered(true), index * STAGGER_MS);
    }
    if (exiting) {
      setEntered(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible, exiting, index]);

  const translateY = entered ? '0%' : '110%';
  const opacity    = entered ? 1 : 0;

  const y = TABLE_TOP + index * ROW_H;

  const hlBg = highlighted
    ? `linear-gradient(90deg, rgba(185,170,98,0.18) 0%, rgba(185,170,98,0.08) 100%)`
    : 'transparent';

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: y,
        width: MASK_W,
        height: ROW_H,
        transform: `translateY(${translateY})`,
        opacity,
        transition: `transform ${ENTER_MS}ms cubic-bezier(0.22,1,0.36,1), opacity ${ENTER_MS * 0.6}ms ease`,
        pointerEvents: 'none',
      }}
    >
      {/* Row background (for highlighted row) */}
      {highlighted && (
        <div
          style={{
            position: 'absolute',
            left: 0, top: 0,
            width: '100%', height: '100%',
            background: hlBg,
          }}
        />
      )}

      {/* Divider line at bottom */}
      <div
        style={{
          position: 'absolute',
          left: '2.5%', bottom: 0,
          width: '95%', height: 1,
          background: highlighted ? CLR_GOLD : CLR_MUTED,
          opacity: 0.45,
        }}
      />

      {/* Rank */}
      <div
        style={{
          position: 'absolute',
          left: `${COL_RANK_L * 100}%`,
          top: '18%', height: '64%', width: `${COL_RANK_W * 100}%`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 400,
          fontSize: Math.round(ROW_H * 0.48),
          color: highlighted ? CLR_GOLD : CLR_WHITE,
          lineHeight: 1,
        }}
      >
        {row.rank}
      </div>

      {/* Team Logo */}
      <div
        style={{
          position: 'absolute',
          left: `${COL_LOGO_L * 100}%`,
          top: '22.5%', height: '55%', width: `${COL_LOGO_W * 100}%`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {row.logoURL ? (
          <img
            src={row.logoURL}
            alt=""
            style={{
              maxWidth: '100%', maxHeight: '100%',
              objectFit: 'contain', display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: Math.round(ROW_H * 0.55),
              height: Math.round(ROW_H * 0.55),
              borderRadius: '50%',
              background: highlighted ? CLR_GOLD : 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
              fontSize: Math.round(ROW_H * 0.28),
              color: highlighted ? CLR_DARK : CLR_WHITE,
            }}
          >
            {row.team.shortCode?.charAt(0) ?? row.team.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Team Name */}
      <div
        style={{
          position: 'absolute',
          left: `${COL_NAME_L * 100}%`,
          top: '18%', height: '64%', width: `${COL_NAME_W * 100}%`,
          display: 'flex', alignItems: 'center',
          overflow: 'hidden',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 400,
          fontSize: Math.round(ROW_H * 0.48),
          color: highlighted ? CLR_GOLD : CLR_WHITE,
          whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          lineHeight: 1,
        }}
      >
        {row.team.name}
      </div>

      {/* Squad count */}
      <StatCell value={String(row.squadCount)} x={COL_SQD_L} rowH={ROW_H} highlighted={highlighted} />

      {/* Budget */}
      <StatCell value={fmtCompact(row.budget)} x={COL_BDG_L} rowH={ROW_H} highlighted={highlighted} />

      {/* Spend */}
      <StatCell value={fmtCompact(row.spend)} x={COL_SPD_L} rowH={ROW_H} highlighted={highlighted} />

      {/* Balance */}
      <StatCell value={fmtCompact(row.balance)} x={COL_BAL_L} rowH={ROW_H} highlighted={highlighted} />

      {/* BIG right column — balance with stronger styling */}
      <div
        style={{
          position: 'absolute',
          left: `${COL_PTS_L * 100}%`,
          top: '18%', height: '64%', width: `${COL_PTS_W * 100}%`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 600,
          fontSize: Math.round(ROW_H * 0.48),
          color: highlighted ? CLR_GOLD : CLR_WHITE,
          lineHeight: 1,
        }}
      >
        {row.squadCount}
      </div>
    </div>
  );
}

function StatCell({
  value, x, rowH, highlighted,
}: {
  value: string;
  x: number;
  rowH: number;
  highlighted: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: '21.75%', height: '56.5%', width: `${COL_STAT_W * 100}%`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 400,
        fontSize: Math.round(rowH * 0.36),
        color: highlighted ? 'rgba(185,170,98,0.9)' : CLR_DIM,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </div>
  );
}

// ─── Props & data computation ─────────────────────────────────────────────────
interface Props {
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  teamId: string;
  isExiting?: boolean;
}

function buildRows(teams: Team[], players: Player[]): RowData[] {
  const rows: RowData[] = teams.map(team => {
    const budget  = team.initialBudget ?? 0;
    const balance = team.currentBalance ?? budget;
    const spend   = Math.max(0, budget - balance);

    // Count from players array (more accurate than playersPurchased)
    const squadCount = players.filter(
      p => p.winningTeamId === team._id && p.isSold,
    ).length || team.playersPurchased?.length || 0;

    return {
      rank: 0,
      team,
      logoURL: team.logoURL ?? '',
      squadCount,
      budget,
      spend,
      balance,
    };
  });

  // Sort by spend descending (highest bidder first), then by squad
  rows.sort((a, b) => b.spend - a.spend || b.squadCount - a.squadCount);
  rows.forEach((r, i) => { r.rank = i + 1; });

  return rows.slice(0, MAX_ROWS);
}

// ─── Header column helper ─────────────────────────────────────────────────────
function HeaderCell({
  label, x, w = COL_STAT_W, fontSize,
}: {
  label: string; x: number; w?: number; fontSize: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: '12.5%', height: '3%',
        width: `${w * 100}%`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 400, fontSize,
        color: CLR_WHITE,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const TeamWiseImageT3: React.FC<Props> = ({
  players,
  teams,
  tournament,
  teamId,
  isExiting = false,
}) => {
  const rows = buildRows(teams, players);
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });

  const titleFontSize    = Math.round(MASK_H * 0.041);  // ~40px
  const subtitleFontSize = Math.round(MASK_H * 0.0205); // ~20px
  const headerFontSize   = Math.round(MASK_H * 0.0245); // ~24px

  // Panel-level enter/exit
  const [panelIn, setPanelIn] = useState(false);
  useEffect(() => {
    if (!isExiting) {
      const t = requestAnimationFrame(() => requestAnimationFrame(() => setPanelIn(true)));
      return () => cancelAnimationFrame(t as unknown as number);
    }
    setPanelIn(false);
  }, [isExiting]);

  const panelScale   = panelIn ? 1 : 0.97;
  const panelOpacity = panelIn ? 1 : 0;

  return (
    <Theme3Canvas transparent>
      {/* ── Google Font ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');

        @keyframes twi-gloss {
          0%,100% { opacity: 0.18; }
          50%      { opacity: 0.08; }
        }
      `}</style>

      {/* ── InfoMask panel ── */}
      <div
        style={{
          position: 'absolute',
          left: MASK_LEFT,
          top: MASK_TOP,
          width: MASK_W,
          height: MASK_H,
          overflow: 'hidden',
          transform: `scale(${panelScale})`,
          transformOrigin: '50% 0%',
          opacity: panelOpacity,
          transition: `transform ${ENTER_MS}ms cubic-bezier(0.22,1,0.36,1), opacity ${ENTER_MS * 0.7}ms ease`,
          boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
        }}
      >

        {/* Layer z=-11: Gold accent strip (full height — visible at bottom as strip) */}
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: CLR_GOLD,
          }}
        />

        {/* Layer z=-10: Dark panel (98.5% height — covers gold except bottom strip) */}
        <div
          style={{
            position: 'absolute',
            left: 0, top: 0,
            width: '100%', height: `${DARK_H}px`,
            background: CLR_DARK,
            zIndex: 2,
          }}
        />

        {/* Layer z=-9: White title block (11% height) */}
        <div
          style={{
            position: 'absolute',
            left: 0, top: 0,
            width: '100%', height: TITLE_H,
            background: CLR_WHITE,
            zIndex: 3,
          }}
        />

        {/* Layer z=-8: Header row background (from top, 16.8% height covers title + column headers) */}
        <div
          style={{
            position: 'absolute',
            left: 0, top: TITLE_H,
            width: '100%', height: HEADER_H - TITLE_H,
            background: CLR_DARK,
            filter: 'brightness(90%)',
            zIndex: 4,
          }}
        />

        {/* Layer z=-7: Gloss overlay on title */}
        <div
          style={{
            position: 'absolute',
            left: 0, top: 0,
            width: '100%', height: TITLE_H,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.13) 100%)',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />

        {/* ── Content layer (z=10+) ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>

          {/* Subtitle — "THIS SEASON" above title */}
          <div
            style={{
              position: 'absolute',
              left: `${0.025 * MASK_W}px`,
              top: `${0.0225 * MASK_H}px`,
              width: `${0.95 * MASK_W}px`,
              height: `${0.025 * MASK_H}px`,
              display: 'flex', alignItems: 'flex-end',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700, fontSize: subtitleFontSize,
              color: CLR_DARK, lineHeight: 1,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {tournament?.name?.toUpperCase() ?? 'AUCTION STANDINGS'}
          </div>

          {/* Title — "EPL STANDINGS" style */}
          <div
            style={{
              position: 'absolute',
              left: `${0.025 * MASK_W}px`,
              top: `${0.04 * MASK_H}px`,
              width: `${0.69 * MASK_W}px`,
              height: `${0.05 * MASK_H}px`,
              display: 'flex', alignItems: 'flex-end',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700, fontSize: titleFontSize,
              color: CLR_DARK, lineHeight: 1,
              textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}
          >
            TEAM STANDINGS
          </div>

          {/* Date — right-aligned in title block */}
          <div
            style={{
              position: 'absolute',
              left: `${0.735 * MASK_W}px`,
              top: `${0.06 * MASK_H}px`,
              width: `${0.24 * MASK_W}px`,
              height: `${0.03 * MASK_H}px`,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700, fontSize: headerFontSize,
              color: CLR_DARK, lineHeight: 1,
            }}
          >
            {today}
          </div>

          {/* ── Column headers (inside dark header row) ── */}
          {/* positioned relative to MASK_H */}
          <HeaderCell label="SQD"     x={COL_SQD_L}  fontSize={headerFontSize} />
          <HeaderCell label="BUDGET"  x={COL_BDG_L}  fontSize={headerFontSize} w={0.075} />
          <HeaderCell label="SPEND"   x={COL_SPD_L}  fontSize={headerFontSize} w={0.075} />
          <HeaderCell label="BAL"     x={COL_BAL_L}  fontSize={headerFontSize} />
          <HeaderCell label="PLAYERS" x={COL_PTS_L}  fontSize={headerFontSize} w={COL_PTS_W} />

          {/* ── Table rows ── */}
          {rows.map((row, i) => (
            <LeaderboardRow
              key={row.team._id}
              row={row}
              index={i}
              visible={!isExiting}
              exiting={isExiting}
              highlighted={row.team._id === teamId}
            />
          ))}

          {/* Empty state */}
          {rows.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: TABLE_TOP + TABLE_H / 2 - 24,
                width: '100%',
                textAlign: 'center',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 400,
                fontSize: headerFontSize,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.06em',
              }}
            >
              NO TEAMS YET
            </div>
          )}
        </div>
      </div>
    </Theme3Canvas>
  );
};

export default TeamWiseImageT3;
