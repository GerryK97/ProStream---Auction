'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Player, Team, Tournament } from '@/types';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import { TickerHeadRotator } from './TickerHeadRotator';
import { buildTickerHeadSlides } from './tickerHeadSlides';

/** Fixed ticker bar height within the 1920×1080 canvas. */
export const TICKER_T3_HEIGHT = 78;

const TITLE_PANEL_WIDTH = '22%';
const TICKER_FONT_SIZE = 26;
const EMPTY_FONT_SIZE = 22;
const CONTENT_PADDING_LEFT = 16;
const ITEM_SEPARATOR_MARGIN = 14;
const SOLD_DETAIL_MARGIN_LEFT = 8;
const LOGO_SEPARATOR_SIZE = 22;

/** Longest enter path: content section delay + duration */
const ENTER_MS = 670;
/** Longest exit path: accent bar delay + duration */
const EXIT_MS = 610;

const SECTION_MS = 400;
const EASE_ENTER = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_EXIT = 'cubic-bezier(0.4, 0, 0.2, 1)';

interface Props {
  soldPlayers: Player[];
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  mode: 'all' | 'sold' | 'available';
  customMode?: boolean;
  customLine1?: string;
  customLine2?: string;
  visible?: boolean;
}

type MotionPhase = 'hidden' | 'entering' | 'visible' | 'exiting';

/** Lower ticker — overlays.uno "Fresh" layout with ProStream auction data. */
const TickerT3Shared: React.FC<Props> = ({
  soldPlayers,
  players,
  teams,
  tournament,
  mode,
  customMode,
  customLine1,
  customLine2,
  visible = true,
}) => {
  const heading =
    mode === 'sold'
      ? 'SOLD PLAYERS'
      : mode === 'available'
        ? 'AVAILABLE'
        : 'ALL PLAYERS';

  const titleLabel = customMode
    ? (tournament?.name?.toUpperCase() ?? 'PROSTREAM')
    : heading;

  const headSlides = useMemo(
    () => buildTickerHeadSlides(titleLabel, tournament),
    [titleLabel, tournament],
  );

  const emptyText =
    mode === 'sold'
      ? 'Waiting for players to be sold…'
      : mode === 'available'
        ? 'No players available…'
        : 'No players in tournament yet…';

  const lines = customMode ? [customLine1, customLine2].filter((l): l is string => !!l?.trim()) : [];
  const [lineIndex, setLineIndex] = useState(0);
  const [sliding, setSliding] = useState(false);
  const linesLenRef = useRef(lines.length);

  const [phase, setPhase] = useState<MotionPhase>(() => (visible ? 'entering' : 'hidden'));
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    linesLenRef.current = lines.length;
  }, [lines.length]);

  useEffect(() => {
    if (!customMode || lines.length <= 1) return;
    const iv = setInterval(() => {
      setSliding(true);
      const t = setTimeout(() => {
        setLineIndex(p => (p + 1) % linesLenRef.current);
        setSliding(false);
      }, 450);
      return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 5000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customMode, customLine1, customLine2]);

  useEffect(() => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    if (visible) {
      setPhase(prev => {
        if (prev === 'visible') return prev;
        enterTimerRef.current = setTimeout(() => setPhase('visible'), ENTER_MS);
        return 'entering';
      });
      return;
    }

    setPhase(prev => {
      if (prev === 'hidden') return prev;
      exitTimerRef.current = setTimeout(() => setPhase('hidden'), EXIT_MS);
      return 'exiting';
    });
  }, [visible]);

  useEffect(
    () => () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    },
    [],
  );

  const source =
    mode === 'sold'
      ? soldPlayers
      : mode === 'available'
        ? players.filter(p => !p.isSold)
        : players;

  const duration = Math.max(20, source.length * 6);

  const tickerTextStyle: React.CSSProperties = {
    fontFamily: "'Open Sans', sans-serif",
    fontSize: TICKER_FONT_SIZE,
    lineHeight: 1,
    color: 'var(--t3-text-primary, #ffffff)',
  };

  const detailTextStyle: React.CSSProperties = {
    ...tickerTextStyle,
    marginLeft: SOLD_DETAIL_MARGIN_LEFT,
    opacity: 0.85,
  };

  const renderLogoSeparator = (key: string) => {
    const logoUrl = tournament?.logoURL;
    if (logoUrl) {
      return (
        <span
          key={key}
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: `0 ${ITEM_SEPARATOR_MARGIN}px`,
            verticalAlign: 'middle',
            flexShrink: 0,
          }}
        >
          <img
            src={logoUrl}
            alt=""
            style={{
              width: LOGO_SEPARATOR_SIZE,
              height: LOGO_SEPARATOR_SIZE,
              objectFit: 'contain',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.08)',
              padding: 2,
            }}
          />
        </span>
      );
    }
    return (
      <span
        key={key}
        style={{ ...tickerTextStyle, margin: `0 ${ITEM_SEPARATOR_MARGIN}px`, opacity: 0.6 }}
      >
        ·
      </span>
    );
  };

  const renderPlayerNoBadge = (p: Player, listIndex: number) => {
    const label = p.playerNo?.trim() || String(listIndex + 1).padStart(3, '0');
    return (
      <span
        className="t3-ticker-player-no"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 32,
          height: 26,
          padding: '0 8px',
          marginRight: 10,
          background: 'var(--t3-player-no-bg, #ffffff)',
          border: '1px solid var(--t3-player-no-border, rgba(0,0,0,0.14))',
          borderRadius: 5,
          boxShadow: '0 1px 4px rgba(0,0,0,0.28)',
          fontFamily: "'Open Sans', sans-serif",
          fontSize: 15,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '0.04em',
          color: 'var(--t3-player-no-text, #111827)',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
    );
  };

  const renderPlayerItem = (p: Player, i: number, keyPrefix: string) => {
    const team = mode === 'sold' ? teams.find(t => t._id === p.winningTeamId) : null;
    const basePrice = getClassBasePrice(tournament, p);

    return (
      <React.Fragment key={`${keyPrefix}-${p._id}-${i}`}>
        {i > 0 && renderLogoSeparator(`sep-${keyPrefix}-${i}`)}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            verticalAlign: 'middle',
          }}
        >
          {renderPlayerNoBadge(p, i)}
          <span style={{ ...tickerTextStyle, fontWeight: 600 }}>{p.name.toUpperCase()}</span>
        </span>
        {mode === 'sold' && (
          <span style={detailTextStyle}>
            › {team?.name ?? '—'} · {p.finalPrice?.toLocaleString('en-IN') ?? '—'}
          </span>
        )}
        {(mode === 'all' || mode === 'available') && (
          <span style={detailTextStyle}>
            › Base {basePrice.toLocaleString('en-IN')}
          </span>
        )}
      </React.Fragment>
    );
  };

  if (phase === 'hidden') return null;

  const motionRootClass =
    phase === 'entering' ? 't3-ticker-enter' : phase === 'exiting' ? 't3-ticker-exit' : '';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@700&family=Open+Sans:wght@400;600&display=swap');

        @keyframes t3TickerScroll {
          0%   { transform: translateY(-50%) translateX(0); }
          100% { transform: translateY(-50%) translateX(-50%); }
        }

        .t3-ticker-player-no {
          --t3-player-no-bg: #ffffff;
          --t3-player-no-text: #111827;
          --t3-player-no-border: rgba(0, 0, 0, 0.14);
        }

        /* ── Assemble (appear) — bottom rail → gradient → title → content ── */
        @keyframes t3AccentEnter {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes t3GradientEnter {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes t3TitleEnter {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes t3ContentEnter {
          from { transform: translateX(48px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }

        /* ── Dismantle (disappear) — content → title → gradient → rail ── */
        @keyframes t3ContentExit {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(48px); opacity: 0; }
        }
        @keyframes t3TitleExit {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(-100%); opacity: 0; }
        }
        @keyframes t3GradientExit {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes t3AccentExit {
          from { transform: translateY(0); opacity: 1; }
          to   { transform: translateY(100%); opacity: 0; }
        }

        .t3-ticker-enter .t3-ticker-accent-bar {
          animation: t3AccentEnter ${SECTION_MS}ms ${EASE_ENTER} 0ms both;
        }
        .t3-ticker-enter .t3-ticker-gradient {
          animation: t3GradientEnter ${SECTION_MS}ms ${EASE_ENTER} 90ms both;
        }
        .t3-ticker-enter .t3-ticker-title-panel {
          animation: t3TitleEnter ${SECTION_MS}ms ${EASE_ENTER} 180ms both;
        }
        .t3-ticker-enter .t3-ticker-content-zone {
          animation: t3ContentEnter ${SECTION_MS}ms ${EASE_ENTER} 270ms both;
        }

        .t3-ticker-exit .t3-ticker-content-zone {
          animation: t3ContentExit ${SECTION_MS}ms ${EASE_EXIT} 0ms both;
        }
        .t3-ticker-exit .t3-ticker-title-panel {
          animation: t3TitleExit ${SECTION_MS}ms ${EASE_EXIT} 90ms both;
        }
        .t3-ticker-exit .t3-ticker-gradient {
          animation: t3GradientExit ${SECTION_MS}ms ${EASE_EXIT} 150ms both;
        }
        .t3-ticker-exit .t3-ticker-accent-bar {
          animation: t3AccentExit ${SECTION_MS}ms ${EASE_EXIT} 210ms both;
        }

        @media (prefers-reduced-motion: reduce) {
          .t3-ticker-enter .t3-ticker-accent-bar,
          .t3-ticker-enter .t3-ticker-gradient,
          .t3-ticker-enter .t3-ticker-title-panel,
          .t3-ticker-enter .t3-ticker-content-zone,
          .t3-ticker-exit .t3-ticker-accent-bar,
          .t3-ticker-exit .t3-ticker-gradient,
          .t3-ticker-exit .t3-ticker-title-panel,
          .t3-ticker-exit .t3-ticker-content-zone {
            animation-duration: 0.01ms !important;
            animation-delay: 0ms !important;
          }
        }
      `}</style>

      <div
        className={motionRootClass}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: TICKER_T3_HEIGHT,
          zIndex: 50,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Section 1: accent rail */}
        <div
          className="t3-ticker-accent-bar"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--t3-accent, #00898c)',
            willChange: 'transform, opacity',
          }}
        />

        {/* Section 2: gradient overlay */}
        <div
          className="t3-ticker-gradient"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
            willChange: 'opacity',
          }}
        />

        {/* Section 3: title panel */}
        <div
          className="t3-ticker-title-panel"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: TITLE_PANEL_WIDTH,
            height: TICKER_T3_HEIGHT,
            background: 'var(--t3-bg-panel, #202020)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            boxShadow: '4px 0 12px rgba(0,0,0,0.25)',
            willChange: 'transform, opacity',
            overflow: 'hidden',
          }}
        >
          <TickerHeadRotator
            slides={headSlides}
            active={phase === 'visible'}
            height={TICKER_T3_HEIGHT}
          />
        </div>

        {/* Section 4: scrolling content */}
        <div
          className="t3-ticker-content-zone"
          style={{
            position: 'absolute',
            left: TITLE_PANEL_WIDTH,
            top: 0,
            right: 0,
            height: TICKER_T3_HEIGHT,
            overflow: 'hidden',
            zIndex: 2,
            willChange: 'transform, opacity',
          }}
        >
          {customMode ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: TICKER_T3_HEIGHT * 2,
                transform: sliding ? `translateY(-${TICKER_T3_HEIGHT}px)` : 'translateY(0)',
                transition: sliding ? 'transform 0.45s cubic-bezier(0.4,0,0.2,1)' : 'none',
              }}
            >
              {[0, 1].map(offset => (
                <div
                  key={offset}
                  style={{
                    height: TICKER_T3_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: CONTENT_PADDING_LEFT,
                    ...tickerTextStyle,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lines[(lineIndex + offset) % (lines.length || 1)] ?? ''}
                </div>
              ))}
            </div>
          ) : source.length > 0 ? (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                whiteSpace: 'nowrap',
                animation: phase === 'visible' ? `t3TickerScroll ${duration}s linear infinite` : 'none',
                paddingLeft: CONTENT_PADDING_LEFT,
                ...tickerTextStyle,
              }}
            >
              {[...source, ...source].map((p, i) => renderPlayerItem(p, i, 'scroll'))}
            </div>
          ) : (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                paddingLeft: CONTENT_PADDING_LEFT,
                ...tickerTextStyle,
                fontSize: EMPTY_FONT_SIZE,
                opacity: 0.65,
              }}
            >
              {emptyText}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TickerT3Shared;
