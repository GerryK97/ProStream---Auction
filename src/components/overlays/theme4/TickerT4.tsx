'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Player, Team, Tournament } from '@/types';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import { formatT4Amount } from './frame15PlayerCardT4Layout';

/**
 * Theme 4 ticker — overlays.uno “RSS News Ticker · Prime” layout.
 * Exact visual system from the Prime reference: navy bar, slate category, gloss, PT Sans Narrow.
 */

/** Bar height on 1920×1080 — half of original Prime 130px. */
export const TICKER_T4_HEIGHT = 65;

/** Left category panel — wider to absorb diagonal cut. */
const CATEGORY_WIDTH_PCT = 22;

/** Scroll starts after the diagonal tip so text clears the gold wedge. */
const SCROLL_LEFT_PCT = 20;

/** Prime scroll bar + Theme 4 gold diagonal header. */
const PRIME_BAR = '#0a3d8d';
const PRIME_TEXT = '#ffffff';
const CAT_GOLD_HI = '#F3E2A0';
const CAT_GOLD = '#D4AF37';
const CAT_GOLD_DEEP = '#A67C1A';
/** Near-black on gold for strong broadcast contrast */
const CAT_TEXT = '#05070C';

const FONT = '"PT Sans Narrow", "Oswald", "Arial Narrow", sans-serif';
const CATEGORY_FONT_SIZE = 32;
const SCROLL_FONT_SIZE = 26;

const ENTER_MS = 720;
const EXIT_MS = 560;
const SECTION_MS = 420;
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

function categoryHeading(mode: Props['mode']): string {
  if (mode === 'sold') return 'SOLD PLAYERS';
  if (mode === 'available') return 'AVAILABLE';
  return 'ALL PLAYERS';
}

/** Mode label only — no tournament name (fits compact bar). */
function categoryLabel(mode: Props['mode'], customMode?: boolean): string {
  if (customMode) return 'LIVE UPDATE';
  return categoryHeading(mode);
}

const TickerT4: React.FC<Props> = ({
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
  const heading = categoryLabel(mode, customMode);

  const emptyText =
    mode === 'sold'
      ? 'Waiting for players to be sold…'
      : mode === 'available'
        ? 'No players available…'
        : 'No players in tournament yet…';

  const lines = customMode
    ? [customLine1, customLine2].filter((l): l is string => !!l?.trim())
    : [];
  const [lineIndex, setLineIndex] = useState(0);
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
      setLineIndex((p) => (p + 1) % linesLenRef.current);
    }, 5000);
    return () => clearInterval(iv);
  }, [customMode, customLine1, customLine2, lines.length]);

  useEffect(() => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    if (visible) {
      setPhase((prev) => {
        if (prev === 'visible') return prev;
        enterTimerRef.current = setTimeout(() => setPhase('visible'), ENTER_MS);
        return 'entering';
      });
      return;
    }

    setPhase((prev) => {
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

  const source = useMemo(() => {
    if (mode === 'sold') return soldPlayers;
    if (mode === 'available') return players.filter((p) => !p.isSold);
    return players;
  }, [mode, soldPlayers, players]);

  const duration = Math.max(22, source.length * 6);
  const logoUrl = tournament?.logoURL?.trim() || '';

  const tickerItemStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    fontFamily: FONT,
    fontWeight: 400,
    fontSize: SCROLL_FONT_SIZE,
    lineHeight: 1,
    color: PRIME_TEXT,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };

  const renderLogoSeparator = (key: string) => (
    <span
      key={key}
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 18px',
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          style={{
            width: 22,
            height: 22,
            objectFit: 'contain',
            borderRadius: 3,
            background: 'rgba(255,255,255,0.1)',
            padding: 2,
          }}
        />
      ) : (
        <span style={{ ...tickerItemStyle, opacity: 0.55, fontSize: 18 }}>·</span>
      )}
    </span>
  );

  const renderPlayerItem = (p: Player, i: number, keyPrefix: string) => {
    const team = mode === 'sold' ? teams.find((t) => t._id === p.winningTeamId) : null;
    const basePrice = getClassBasePrice(tournament, p);
    const no = p.playerNo?.trim()
      ? String(parseInt(p.playerNo, 10) || p.playerNo.trim())
      : String(i + 1);
    const detail =
      mode === 'sold'
        ? ` — ${team?.name ?? '—'} · ${formatT4Amount(p.finalPrice ?? 0)}`
        : ` — Base ${formatT4Amount(basePrice)}`;

    return (
      <span key={`${keyPrefix}-${p._id}-${i}`} style={tickerItemStyle}>
        <span style={{ fontWeight: 700, marginRight: 8 }}>{no}</span>
        <span style={{ fontWeight: 600 }}>{p.name.toUpperCase()}</span>
        <span style={{ opacity: 0.9 }}>{detail}</span>
      </span>
    );
  };

  const renderMarqueeTrack = (copy: number) => (
    <span
      key={copy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        paddingRight: 8,
        flexShrink: 0,
      }}
    >
      {source.length === 0 ? (
        <span style={tickerItemStyle}>{emptyText}</span>
      ) : (
        source.map((p, i) => (
          <React.Fragment key={`${copy}-${p._id}-${i}`}>
            {i > 0 && renderLogoSeparator(`sep-${copy}-${i}`)}
            {renderPlayerItem(p, i, `c${copy}`)}
          </React.Fragment>
        ))
      )}
      {source.length > 0 && renderLogoSeparator(`sep-end-${copy}`)}
    </span>
  );

  const customText =
    lines.length > 0 ? lines[lineIndex % lines.length] : emptyText;

  if (phase === 'hidden') return null;

  const motionRootClass =
    phase === 'entering' ? 't4-ticker-enter' : phase === 'exiting' ? 't4-ticker-exit' : '';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=PT+Sans+Narrow:wght@400;700&display=swap');

        @keyframes t4TickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes t4TickerBarEnter {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes t4TickerCatEnter {
          from { transform: translateX(-110%) skewX(-8deg); opacity: 0; }
          to   { transform: translateX(0) skewX(0deg); opacity: 1; }
        }
        @keyframes t4TickerTextEnter {
          from { opacity: 0; transform: translateX(36px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes t4TickerBarExit {
          from { transform: translateY(0); opacity: 1; }
          to   { transform: translateY(100%); opacity: 0; }
        }
        @keyframes t4TickerCatExit {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(-110%); opacity: 0; }
        }
        @keyframes t4TickerTextExit {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(36px); }
        }
        @keyframes t4TickerCatShine {
          0%   { transform: translateX(-130%) skewX(-18deg); opacity: 0; }
          25%  { opacity: 0.85; }
          55%  { opacity: 0.45; }
          100% { transform: translateX(220%) skewX(-18deg); opacity: 0; }
        }
        @keyframes t4TickerCatPulse {
          0%, 100% { filter: brightness(1); box-shadow: 6px 0 18px rgba(212,175,55,0.28); }
          50%      { filter: brightness(1.08); box-shadow: 8px 0 28px rgba(243,226,160,0.45); }
        }
        @keyframes t4TickerCatEdge {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        @keyframes t4TickerCatLabel {
          0%, 100% { letter-spacing: 1.6px; }
          50%      { letter-spacing: 2.4px; }
        }

        .t4-ticker-enter .t4-ticker-bar {
          animation: t4TickerBarEnter ${SECTION_MS}ms ${EASE_ENTER} 0ms both;
        }
        .t4-ticker-enter .t4-ticker-category {
          animation: t4TickerCatEnter ${SECTION_MS}ms ${EASE_ENTER} 120ms both;
        }
        .t4-ticker-enter .t4-ticker-scroll-zone {
          animation: t4TickerTextEnter ${SECTION_MS}ms ${EASE_ENTER} 220ms both;
        }

        .t4-ticker-exit .t4-ticker-scroll-zone {
          animation: t4TickerTextExit ${SECTION_MS}ms ${EASE_EXIT} 0ms both;
        }
        .t4-ticker-exit .t4-ticker-category {
          animation: t4TickerCatExit ${SECTION_MS}ms ${EASE_EXIT} 90ms both;
        }
        .t4-ticker-exit .t4-ticker-bar {
          animation: t4TickerBarExit ${SECTION_MS}ms ${EASE_EXIT} 180ms both;
        }

        .t4-ticker-cat-shine {
          animation: t4TickerCatShine 3.6s ease-in-out infinite;
        }
        .t4-ticker-cat-pulse {
          animation: t4TickerCatPulse 2.8s ease-in-out infinite;
        }
        .t4-ticker-cat-edge {
          animation: t4TickerCatEdge 2.2s ease-in-out infinite;
        }
        .t4-ticker-cat-label {
          animation: t4TickerCatLabel 3.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .t4-ticker-enter .t4-ticker-bar,
          .t4-ticker-enter .t4-ticker-category,
          .t4-ticker-enter .t4-ticker-scroll-zone,
          .t4-ticker-exit .t4-ticker-bar,
          .t4-ticker-exit .t4-ticker-category,
          .t4-ticker-exit .t4-ticker-scroll-zone,
          .t4-ticker-marquee,
          .t4-ticker-cat-shine,
          .t4-ticker-cat-pulse,
          .t4-ticker-cat-edge,
          .t4-ticker-cat-label {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className={motionRootClass}
        data-t4-element="ticker"
        data-t4-label="Theme 4 Prime Ticker"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: TICKER_T4_HEIGHT,
          zIndex: 50,
          // Preview selection: shell + zones must receive hits (OBS still ignores interaction)
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}
      >
        {/* Full-bleed bar — Prime #0a3d8d */}
        <div
          className="t4-ticker-bar"
          data-t4-element="ticker-bar"
          style={{
            position: 'absolute',
            inset: 0,
            background: PRIME_BAR,
            willChange: 'transform, opacity',
            pointerEvents: 'auto',
          }}
        />

        {/* Top gloss (Prime vertical white→clear→soft black) */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(0,0,0,0) 9.2%, rgba(0,0,0,0) 37.7%, rgba(0,0,0,0.2) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Category — diagonal gold wedge (Theme 4) */}
        <div
          className="t4-ticker-category t4-ticker-cat-pulse"
          data-t4-element="ticker-category"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${CATEGORY_WIDTH_PCT}%`,
            height: '100%',
            zIndex: 3,
            // Diagonal cut on the right edge
            clipPath: 'polygon(0 0, calc(100% - 36px) 0, 100% 100%, 0 100%)',
            background: `linear-gradient(125deg, ${CAT_GOLD_HI} 0%, ${CAT_GOLD} 42%, ${CAT_GOLD_DEEP} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            willChange: 'transform, opacity, filter',
            pointerEvents: 'auto',
          }}
        >
          {/* Soft depth wash */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 42%, rgba(0,0,0,0.22) 100%)',
              pointerEvents: 'none',
            }}
          />
          {/* Travelling shine */}
          <div
            aria-hidden
            className="t4-ticker-cat-shine"
            style={{
              position: 'absolute',
              top: '-20%',
              bottom: '-20%',
              left: 0,
              width: '36%',
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 48%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
          {/* Bright diagonal edge highlight */}
          <div
            aria-hidden
            className="t4-ticker-cat-edge"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 36,
              height: '100%',
              background: `linear-gradient(115deg, transparent 35%, ${CAT_GOLD_HI} 52%, transparent 70%)`,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              width: '82%',
              paddingRight: 22,
              textAlign: 'center',
              overflow: 'hidden',
            }}
          >
            <span
              className="t4-ticker-cat-label"
              style={{
                display: 'inline-block',
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: CATEGORY_FONT_SIZE,
                lineHeight: 1,
                color: CAT_TEXT,
                letterSpacing: 2,
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textTransform: 'uppercase',
                textShadow:
                  '0 1px 0 rgba(255,248,220,0.85), 0 0 1px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.25)',
                WebkitFontSmoothing: 'antialiased',
              }}
            >
              {heading}
            </span>
          </div>
        </div>

        {/* Scrolling text — clears the diagonal tip */}
        <div
          className="t4-ticker-scroll-zone"
          data-t4-element="ticker-scroll"
          style={{
            position: 'absolute',
            left: `${SCROLL_LEFT_PCT}%`,
            top: '15%',
            height: '70%',
            right: 0,
            zIndex: 2,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            willChange: 'transform, opacity',
            pointerEvents: 'auto',
          }}
        >
          {customMode ? (
            <div
              style={{
                width: '100%',
                padding: '0 20px',
                fontFamily: FONT,
                fontWeight: 400,
                fontSize: SCROLL_FONT_SIZE,
                lineHeight: 1,
                color: PRIME_TEXT,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {customText}
            </div>
          ) : (
            <div
              className="t4-ticker-marquee"
              style={{
                display: 'flex',
                width: 'max-content',
                alignItems: 'center',
                animation: `t4TickerScroll ${duration}s linear infinite`,
                willChange: 'transform',
              }}
            >
              {[0, 1].map((copy) => renderMarqueeTrack(copy))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TickerT4;
