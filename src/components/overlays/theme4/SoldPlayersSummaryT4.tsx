'use client';

import React, { useEffect, useState } from 'react';
import type { Player, Team, Tournament } from '@/types';
import { formatT4Amount } from './frame15PlayerCardT4Layout';
import {
  T4_SUMMARY_ACCENT,
  T4_SUMMARY_ACCENT_DEEP,
  T4_SUMMARY_COLS,
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
} from './soldPlayersSummaryT4Layout';

interface Props {
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  isExiting?: boolean;
}

/** Fresh Fixtures typeface — keep design system, only colors remapped. */
const FONT = '"Barlow", "Oswald", "Arial Narrow", sans-serif';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;700&display=swap');

  @keyframes t4PlayerSummaryIn {
    from { opacity: 0; transform: scale(0.97) translateY(18px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes t4PlayerSummaryRowIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .t4-summary-panel, .t4-summary-row { animation: none !important; }
  }
`;

/**
 * Theme 4 Player Summary.
 * Layout/type = overlays.uno Fresh Fixtures fullscreen.
 * Colors = two ticker-blue title bands + matching accents/footer. Fresh layout kept.
 * Data = Theme 3 sold / unsold / remaining pipeline.
 */
const SoldPlayersSummaryT4: React.FC<Props> = ({
  players,
  teams,
  tournament,
  isExiting = false,
}) => {
  const [page, setPage] = useState(0);

  const soldPlayers = players
    .filter((p) => p.isSold && !p.isIconic)
    .sort(
      (a, b) =>
        (b.finalPrice ?? 0) - (a.finalPrice ?? 0) || a.name.localeCompare(b.name),
    );
  const unsoldPlayers = players
    .filter((p) => !p.isSold && p.isUnsold && !p.isIconic)
    .sort((a, b) => a.name.localeCompare(b.name));
  const pendingPlayers = players
    .filter((p) => !p.isSold && !p.isUnsold && !p.isIconic)
    .sort((a, b) => a.name.localeCompare(b.name));

  const rows = [...soldPlayers, ...unsoldPlayers, ...pendingPlayers];
  const totalPages = Math.max(1, Math.ceil(rows.length / T4_SUMMARY_ROWS_PER_PAGE));
  const pageRows = rows.slice(
    page * T4_SUMMARY_ROWS_PER_PAGE,
    page * T4_SUMMARY_ROWS_PER_PAGE + T4_SUMMARY_ROWS_PER_PAGE,
  );

  useEffect(() => {
    setPage(0);
  }, [players.length]);

  useEffect(() => {
    if (totalPages <= 1) return;
    const t = setInterval(() => setPage((p) => (p + 1) % totalPages), T4_SUMMARY_PAGE_MS);
    return () => clearInterval(t);
  }, [totalPages]);

  if (!tournament) return null;

  const rowsTop = T4_SUMMARY_TITLE_H + T4_SUMMARY_HEADER_H;

  return (
    <>
      <style>{CSS}</style>
      <div
        className="t4-summary-panel"
        data-t4-element="player-summary"
        data-t4-label="Theme 4 Player Summary"
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
            : 't4PlayerSummaryIn 420ms cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {/* Fresh table body — remapped #202020 → Theme 4 navy */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: T4_SUMMARY_PANEL_BG,
            zIndex: 0,
          }}
        />
        {/* Soft top wash like Fresh Background Rectangle Gradient */}
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

        {/* Title — two ticker-blue bands (tournament / Player Summary) */}
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
          {/* Tournament name — lighter blue */}
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

          {/* Player Summary — footer blue, deep lightened for presence */}
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
              }}
            >
              Player Summary
            </div>
          </div>
        </div>

        {/* Logo — right of title band */}
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
          {tournament.logoURL ? (
            <img
              src={tournament.logoURL}
              alt={tournament.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
              }}
            />
          ) : null}
        </div>

        {/* Column header — ticker-blue strip, white labels */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: T4_SUMMARY_TITLE_H,
            right: 0,
            height: T4_SUMMARY_HEADER_H,
            zIndex: 4,
            display: 'grid',
            gridTemplateColumns: T4_SUMMARY_COLS,
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
          <Header>TEAM</Header>
          <Header align="right">SOLD PRICE</Header>
        </div>

        {/* Rows — Fresh white dividers + Barlow names */}
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
          {pageRows.map((p, i) => {
            const globalIndex = page * T4_SUMMARY_ROWS_PER_PAGE + i + 1;
            const team = teams.find((t) => t._id === p.winningTeamId);

            return (
              <div
                key={p._id}
                className="t4-summary-row"
                data-t4-element="player-summary-row"
                style={{
                  position: 'relative',
                  height: T4_SUMMARY_ROW_H,
                  margin: '0 40px',
                  display: 'grid',
                  gridTemplateColumns: T4_SUMMARY_COLS,
                  columnGap: 28,
                  alignItems: 'center',
                  borderBottom: `1px solid ${T4_SUMMARY_DIVIDER}`,
                  color: T4_SUMMARY_TEXT,
                  animation: `t4PlayerSummaryRowIn 320ms ${0.08 + i * 0.045}s cubic-bezier(0.22,1,0.36,1) both`,
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
                    fontFamily: FONT,
                    fontSize: 22,
                    fontWeight: 700,
                    color: T4_SUMMARY_MUTED,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                  }}
                >
                  {team?.name ?? '—'}
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
                  {p.isSold ? formatT4Amount(p.finalPrice ?? 0) : '—'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer — same shiny ticker-blue band as title */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: T4_SUMMARY_FOOTER_H,
            background: `linear-gradient(180deg, ${T4_SUMMARY_ACCENT} 0%, ${T4_SUMMARY_ACCENT_DEEP} 100%)`,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            color: T4_SUMMARY_TEXT,
            zIndex: 10,
            overflow: 'hidden',
          }}
        >
          {/* Sheen — matches ticker bar gloss */}
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
          <FooterStat label="SOLD" value={String(soldPlayers.length)} />
          <FooterStat label="UNSOLD" value={String(unsoldPlayers.length)} />
          <FooterStat label="REMAINING" value={String(pendingPlayers.length)} />
        </div>

        {totalPages > 1 && (
          <div
            style={{
              position: 'absolute',
              right: 40,
              bottom: T4_SUMMARY_FOOTER_H + 12,
              display: 'flex',
              gap: 8,
              zIndex: 12,
              pointerEvents: 'none',
            }}
          >
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === page ? 22 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === page ? T4_SUMMARY_ACCENT : 'rgba(255,255,255,0.28)',
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
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
    .map((part) => part[0])
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
        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T4_SUMMARY_ACCENT }}>
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
        letterSpacing: 1,
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
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: FONT,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: 'uppercase',
          opacity: 0.8,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default SoldPlayersSummaryT4;
