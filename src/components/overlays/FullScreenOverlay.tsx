'use client';

import React, { useEffect, useRef, useState } from 'react';
import OverlayWrapper from './OverlayWrapper';
import SoldPlayersSummaryOverlay from './SoldPlayersSummaryOverlay';
import TeamSummaryOverlay from './TeamSummaryOverlay';
import TeamWiseSummaryOverlay from './TeamWiseSummaryOverlay';
import RestingTimeOverlay from './RestingTimeOverlay';
import Top10SummaryOverlay from './Top10SummaryOverlay';
import WheelSpinOverlay from './WheelSpinOverlay';
import SoldMessageFullScreen from './SoldMessageFullScreen';
import { AuctionState, Player, Team, Tournament } from '@/types';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import type { OverlaySettings } from './OverlayWrapper';
import type { WheelSpinEvent } from '@/types/pusher-events';

// ─── Ticker strip ─────────────────────────────────────────────────────────────

function TickerStrip({
  soldPlayers,
  players,
  teams,
  tournament,
  mode,
  customMode,
  customLine1,
  customLine2,
}: {
  soldPlayers: Player[];
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  mode: 'all' | 'sold' | 'available';
  customMode?: boolean;
  customLine1?: string;
  customLine2?: string;
}) {
  const heading   = mode === 'sold'      ? 'SOLD PLAYERS'
                  : mode === 'available' ? 'AVAILABLE'
                  : 'ALL PLAYERS';
  const emptyText = mode === 'sold'      ? 'Waiting for players to be sold…'
                  : mode === 'available' ? 'No players available…'
                  : 'No players in tournament yet…';

  // ── Custom ticker slide state ──
  const lines = customMode
    ? [customLine1, customLine2].filter((l): l is string => !!l?.trim())
    : [];
  const [lineIndex, setLineIndex] = useState(0);
  const [sliding, setSliding] = useState(false);
  const linesLenRef = useRef(lines.length);

  useEffect(() => { linesLenRef.current = lines.length; }, [lines.length]);

  useEffect(() => {
    if (!customMode || lines.length <= 1) return;
    const iv = setInterval(() => {
      setSliding(true);
      const t = setTimeout(() => {
        setLineIndex(prev => (prev + 1) % linesLenRef.current);
        setSliding(false);
      }, 600);
      return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 5000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customMode, customLine1, customLine2]);

  const nameStyle:   React.CSSProperties = { color: 'var(--overlay-text-subtle)' };
  const detailStyle: React.CSSProperties = { color: 'var(--overlay-text-muted)' };
  const sepStyle:    React.CSSProperties = { color: 'var(--overlay-border-accent-strong)' };

  const renderItem = (p: Player, keyPrefix: string): React.ReactNode => {
    if (mode === 'sold') {
      const team = teams.find(t => t._id === p.winningTeamId);
      const price = p.finalPrice?.toLocaleString('en-IN') ?? '—';
      return (
        <React.Fragment key={`${keyPrefix}-${p._id}`}>
          <span style={nameStyle}>{p.name.toUpperCase()}</span>
          <span style={detailStyle}>  ›  {team?.name ?? '—'}  ·  {price}</span>
        </React.Fragment>
      );
    }
    if (mode === 'available') {
      return (
        <React.Fragment key={`${keyPrefix}-${p._id}`}>
          <span style={nameStyle}>{p.name.toUpperCase()}</span>
          <span style={detailStyle}>  ›  {p.playerClass || '—'}  ·  {p.position || '—'}</span>
        </React.Fragment>
      );
    }
    const bp = getClassBasePrice(tournament, p);
    return (
      <React.Fragment key={`${keyPrefix}-${p._id}`}>
        <span style={nameStyle}>{p.name.toUpperCase()}</span>
        <span style={detailStyle}>  ›  {p.position || '—'}  ·  {p.playerClass || '—'}  ·  {bp.toLocaleString('en-IN')}</span>
      </React.Fragment>
    );
  };

  const sourceList = mode === 'sold'      ? soldPlayers
                   : mode === 'available' ? players.filter(p => !p.isSold)
                   : players;
  const hasItems = sourceList.length > 0;
  const duration = Math.max(20, sourceList.length * 6);

  const doubled: React.ReactNode[] = [];
  if (hasItems) {
    ['a', 'b'].forEach(prefix => {
      sourceList.forEach((p, i) => {
        if (doubled.length > 0) {
          doubled.push(<span key={`sep-${prefix}-${i}`} style={sepStyle}>   ◆   </span>);
        }
        doubled.push(renderItem(p, prefix));
      });
    });
  }

  return (
    <>
      {/* Dark ticker bar */}
      <div
        style={{
          position: 'absolute',
          left: 230,
          top: 1006,
          width: 1690,
          height: 57,
          background: 'var(--overlay-bg-ticker)',
          borderTop: '1px solid var(--overlay-border-accent-subtle)',
          borderBottom: '1px solid var(--overlay-border-light)',
        }}
      />

      {/* Scrolling text clip zone */}
      <div
        style={{
          position: 'absolute',
          left: 260,
          top: 1006,
          width: 1660,
          height: 57,
          overflow: 'hidden',
        }}
      >
        {customMode ? (
          /* ── Custom ticker: vertical slide ── */
          <div style={{
            display: 'flex', flexDirection: 'column',
            transform: sliding ? 'translateY(-100%)' : 'translateY(0%)',
            transition: sliding ? 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' : 'none',
            willChange: 'transform',
          }}>
            {[0, 1].map(offset => {
              const idx = lines.length > 0 ? (lineIndex + offset) % lines.length : 0;
              return (
                <div key={offset} style={{
                  height: 57, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Concert One", cursive', fontSize: 26, color: 'var(--overlay-text-dark)',
                  whiteSpace: 'nowrap',
                }}>
                  {lines[idx] ?? ''}
                </div>
              );
            })}
          </div>
        ) : hasItems ? (
          /* ── Normal: horizontal scroll ── */
          <div
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              whiteSpace: 'nowrap',
              animation: `fullscreenTickerScroll ${duration}s linear infinite`,
              fontFamily: '"Concert One", cursive',
              fontSize: 26,
            }}
          >
            {doubled}
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              whiteSpace: 'nowrap',
              fontFamily: '"Concert One", cursive',
              fontSize: 22,
              color: 'var(--overlay-text-dim)',
              paddingLeft: 16,
            }}
          >
            {emptyText}
          </div>
        )}
      </div>

      {/* Blue gradient pill */}
      <div
        style={{
          position: 'absolute',
          width: 335,
          height: 70,
          left: 6,
          top: 998,
          background: 'var(--overlay-bg-logo-pill)',
          borderRadius: 28,
          border: '1.5px solid var(--overlay-border-accent-strong)',
        }}
      />

      {/* Heading / branding inside pill */}
      <div
        style={{
          position: 'absolute',
          left: 6,
          top: 998,
          width: 335,
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {customMode ? (
          <>
            <img
              src="https://res.cloudinary.com/diitsd6nz/image/upload/v1760794476/ProSteam_logo_h9pb8b.png"
              alt="ProStream"
              style={{ height: 38, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
            />
            <span style={{
              color: 'var(--overlay-color-primary)',
              fontSize: 20,
              fontFamily: '"Coda Caption", cursive',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              letterSpacing: 1,
            }}>
              ProStream
            </span>
          </>
        ) : (
          <span style={{
            color: 'var(--overlay-color-primary)',
            fontSize: 24,
            fontFamily: '"Coda Caption", cursive',
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}>
            {heading}
          </span>
        )}
      </div>
    </>
  );
}

// ─── Player Auction Panel (new standard mode) ──────────────────────────────────

function PlayerAuctionPanel({
  currentPlayer,
  tournament,
  auctionState,
}: {
  currentPlayer: Player | undefined;
  tournament: Tournament | null;
  auctionState: AuctionState;
}) {
  const hasPlayer = !!currentPlayer;
  const basePrice = hasPlayer ? getClassBasePrice(tournament, currentPlayer!) : 0;
  const currentBid = auctionState.currentBid > 0
    ? auctionState.currentBid
    : (auctionState.currentAuctionStatus === 'Bidding' && hasPlayer ? basePrice : 0);
  const isSold = auctionState.currentAuctionStatus === 'Sold';
  const isBidding = auctionState.currentAuctionStatus === 'Bidding';

  const [bidPopping, setBidPopping] = useState(false);
  const prevBidRef = useRef(currentBid);
  useEffect(() => {
    if (isBidding && currentBid !== prevBidRef.current) {
      setBidPopping(true);
      const t = setTimeout(() => setBidPopping(false), 300);
      prevBidRef.current = currentBid;
      return () => clearTimeout(t);
    }
    prevBidRef.current = currentBid;
  }, [currentBid, isBidding]);

  const classConfig = tournament?.playerClasses?.find(c => c.name === currentPlayer?.playerClass);
  const classColor = classConfig?.color ?? '#6B7280';

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    fontSize: 26,
    color: 'var(--overlay-text-dim)',
    fontFamily: '"Graduate", cursive',
    letterSpacing: 6,
    textTransform: 'uppercase',
    lineHeight: 1,
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: '"Inconsolata", monospace',
    fontSize: 50,
    color: 'var(--overlay-text-subtle)',
    fontWeight: 400,
    lineHeight: '70px',
    letterSpacing: 4,
  };

  return (
    <>
      {/* ── Left photo panel ── */}
      <div
        style={{
          position: 'absolute',
          left: 72,
          top: 73,
          width: 717,
          height: 929,
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--overlay-bg-photo)',
        }}
      >
        {hasPlayer && currentPlayer!.photoURL ? (
          <img
            src={currentPlayer!.photoURL}
            alt={currentPlayer!.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          />
        ) : hasPlayer && tournament?.logoURL ? (
          /* Player exists but no photo — show tournament logo */
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--overlay-bg-photo-fallback)',
          }}>
            <img
              src={tournament.logoURL}
              alt={tournament.name}
              style={{ width: 320, height: 320, objectFit: 'contain', opacity: 0.85 }}
            />
          </div>
        ) : (
          /* No player at all */
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 24,
          }}>
            <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 22, fontFamily: '"Inconsolata", monospace', letterSpacing: 3, textTransform: 'uppercase' }}>
              Waiting for player…
            </span>
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 250,
          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Player class badge — bottom left */}
        {hasPlayer && currentPlayer!.playerClass && (
          <div style={{
            position: 'absolute',
            bottom: 32,
            left: 28,
            background: classColor,
            color: '#fff',
            fontSize: 22,
            fontFamily: '"Graduate", cursive',
            letterSpacing: 3,
            padding: '8px 20px',
            borderRadius: 8,
            fontWeight: 700,
            boxShadow: `0 0 24px ${classColor}88`,
            textTransform: 'uppercase',
          }}>
            {currentPlayer!.playerClass}
          </div>
        )}

      </div>

      {/* ── Gold vertical accent bar ── */}
      <div style={{
        position: 'absolute',
        left: 855,
        top: 73,
        width: 5,
        height: 929,
        background: 'linear-gradient(180deg, var(--overlay-color-primary) 0%, rgba(var(--overlay-color-primary-rgb),0.08) 100%)',
        borderRadius: 3,
      }} />

      {/* ── Right info panel ── */}

      {/* Player Name — hero identity, top of right panel */}
      <div style={{
        position: 'absolute',
        left: 880,
        top: 98,
        width: 700,
        fontFamily: '"Inconsolata", monospace',
        fontSize: 80,
        color: 'var(--overlay-color-primary)',
        fontWeight: 700,
        lineHeight: '90px',
        letterSpacing: 4,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textShadow: '0 0 40px rgba(var(--overlay-color-primary-rgb),0.55), 0 0 80px rgba(var(--overlay-color-primary-rgb),0.2)',
      }}>
        {hasPlayer ? currentPlayer!.name : '—'}
      </div>

      {/* Base Price — compact reference, right side of name row */}
      <div style={{ ...labelStyle, left: 1620, top: 98, fontSize: 18, letterSpacing: 5, width: 220, textAlign: 'right' }}>
        Base Price
      </div>
      <div style={{
        position: 'absolute',
        left: 1620,
        top: 120,
        width: 220,
        textAlign: 'right',
        fontFamily: '"Inconsolata", monospace',
        fontSize: 38,
        color: 'var(--overlay-color-primary)',
        fontWeight: 700,
        letterSpacing: 2,
        lineHeight: 1,
      }}>
        {hasPlayer ? basePrice.toLocaleString('en-IN') : '—'}
      </div>

      {/* Gold separator (below name) */}
      <div style={{
        position: 'absolute',
        left: 880,
        top: 200,
        width: 960,
        height: 3,
        background: 'linear-gradient(90deg, var(--overlay-color-primary) 0%, rgba(var(--overlay-color-primary-rgb),0.08) 100%)',
        borderRadius: 2,
      }} />

      {/* Current Bid — hero card */}
      <div className={isBidding ? 'fs-bid-card-active' : ''} style={{
        position: 'absolute',
        left: 880,
        top: 215,
        width: 920,
        height: 135,
        background: 'rgba(var(--overlay-color-primary-rgb),0.05)',
        border: '1px solid var(--overlay-border-accent-subtle)',
        borderRadius: 12,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}>
        <div style={{
          fontFamily: '"Graduate", cursive',
          fontSize: 20,
          color: 'var(--overlay-color-primary)',
          letterSpacing: 8,
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          Current Bid
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            className={`${isBidding ? 'fs-bid-active' : ''} ${bidPopping ? 'fs-bid-pop' : ''}`}
            style={{
              fontFamily: '"Inconsolata", monospace',
              fontSize: 88,
              color: 'var(--overlay-text-bright)',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: 4,
            }}
          >
            {hasPlayer ? currentBid.toLocaleString('en-IN') : '—'}
          </div>
          {isBidding && (
            <div className="fs-live-dot" style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--overlay-color-primary)',
              flexShrink: 0,
              alignSelf: 'center',
              marginTop: 4,
            }} />
          )}
        </div>
      </div>

      {/* Dynamic field rows: Age (optional), Position, custom Stats (optional) */}
      {(() => {
        const ppf = tournament?.playerProfileFields;
        const fields: Array<{ label: string; value: string | number }> = [];
        if (ppf?.showAge)
          fields.push({ label: 'Age', value: hasPlayer ? (currentPlayer!.age ?? '—') : '—' });
        fields.push({ label: 'Position', value: hasPlayer ? (currentPlayer!.position || '—') : '—' });
        if (ppf?.showBattingStyle)
          fields.push({ label: 'Batting Style', value: hasPlayer ? (currentPlayer!.battingStyle || '—') : '—' });
        if (ppf?.showBowlingStyle)
          fields.push({ label: 'Bowling Style', value: hasPlayer ? (currentPlayer!.bowlingStyle || '—') : '—' });
        (ppf?.statFields ?? []).forEach(sf =>
          fields.push({ label: sf.label, value: hasPlayer ? ((currentPlayer!.stats as any)?.[sf.key] ?? '—') : '—' })
        );

        const FIELD_START_Y = 362;
        // Available height = 1080 - 362 - 108 (class area + buffer)
        const AVAILABLE_H = 610;
        const FIELD_SLOT_H = fields.length > 0
          ? Math.max(76, Math.min(116, Math.floor(AVAILABLE_H / fields.length)))
          : 116;
        const valueOffset   = Math.round(FIELD_SLOT_H * 0.29); // proportional to original 34/116
        const dividerOffset = Math.round(FIELD_SLOT_H * 0.78); // proportional to original 90/116
        const valueFontSize = Math.max(34, Math.round(50 * (FIELD_SLOT_H / 116)));
        const classTop = FIELD_START_Y + fields.length * FIELD_SLOT_H + 14;

        return (
          <>
            {fields.map((f, i) => {
              const top = FIELD_START_Y + i * FIELD_SLOT_H;
              return (
                <React.Fragment key={f.label}>
                  <div style={{ ...labelStyle, left: 880, top }}>{f.label}</div>
                  <div style={{ position: 'absolute', left: 880, top: top + valueOffset, ...valueStyle, fontSize: valueFontSize }}>{f.value}</div>
                  {i < fields.length - 1 && (
                    <div style={{ position: 'absolute', left: 880, top: top + dividerOffset, width: 960, height: 1, background: 'var(--overlay-border-light)' }} />
                  )}
                </React.Fragment>
              );
            })}

            {/* CLASS row — only when tournament uses player classes */}
            {tournament?.usePlayerClasses && (tournament?.playerClasses?.length ?? 0) > 0 && (
              <>
                <div style={{ position: 'absolute', left: 880, top: classTop - 10, width: 960, height: 1, background: 'var(--overlay-border-light)' }} />
                <div style={{ ...labelStyle, left: 880, top: classTop + 6 }}>Class</div>
                {hasPlayer && currentPlayer!.playerClass ? (
                  <div style={{
                    position: 'absolute',
                    left: 880,
                    top: classTop + 40,
                    background: classColor,
                    color: '#fff',
                    fontSize: 34,
                    fontFamily: '"Inconsolata", monospace',
                    fontWeight: 700,
                    padding: '6px 24px',
                    borderRadius: 10,
                    letterSpacing: 4,
                    boxShadow: `0 0 20px ${classColor}66`,
                    textTransform: 'uppercase',
                  }}>
                    {currentPlayer!.playerClass}
                  </div>
                ) : (
                  <div style={{ position: 'absolute', left: 880, top: classTop + 40, ...valueStyle }}>—</div>
                )}
              </>
            )}
          </>
        );
      })()}


      {/* Decorative corner bracket — top right */}
      <div style={{ position: 'absolute', right: 72, top: 73, width: 60, height: 60, opacity: 0.25, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 2, background: '#fff' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 2, height: 60, background: '#fff' }} />
      </div>
      <div style={{ position: 'absolute', right: 72, bottom: 73, width: 60, height: 60, opacity: 0.25, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 60, height: 2, background: '#fff' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 2, height: 60, background: '#fff' }} />
      </div>
    </>
  );
}

// ─── Canvas content (1920×1080) ───────────────────────────────────────────────

function FullScreenOverlayContent({
  soldPlayers,
  teams,
  players,
  currentPlayer,
  tournament,
  auctionState,
  overlaySettings,
  wheelSpinData,
}: {
  soldPlayers: Player[];
  teams: Team[];
  players: Player[];
  currentPlayer: Player | undefined;
  tournament: Tournament | null;
  auctionState: AuctionState;
  overlaySettings: OverlaySettings;
  wheelSpinData: WheelSpinEvent | null;
}) {
  const [scale, setScale] = useState(1);

  // Always large — size control in AuctionControlPanel has no effect here
  const effectiveSettings: OverlaySettings = { ...overlaySettings, size: 'large' };

  // ScaleY animation state
  const [activeMode, setActiveMode] = useState(effectiveSettings.displayMode);
  const [panelExiting, setPanelExiting] = useState(false);
  const [summaryExiting, setSummaryExiting] = useState(false);
  const prevDisplayModeRef = useRef(effectiveSettings.displayMode);

  // Sold message toast state
  const [soldToast, setSoldToast] = useState<{ player: Player; team: Team; price: number } | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const prevAuctionStatusRef = useRef<string | null>(null);
  const toastTimersRef = useRef<{ exit: ReturnType<typeof setTimeout> | null; clear: ReturnType<typeof setTimeout> | null }>({ exit: null, clear: null });

  useEffect(() => {
    const incoming = effectiveSettings.displayMode;
    const prev = prevDisplayModeRef.current;
    prevDisplayModeRef.current = incoming;

    if (prev === incoming) return;

    if (prev === 'standard' || prev === 'custom-ticker') {
      if (incoming === 'standard' || incoming === 'custom-ticker') {
        // Both show the player panel — switch immediately, just the ticker changes
        setActiveMode(incoming);
        return;
      }
      if (incoming === 'wheel-spin') {
        // Wheel spin has its own enter animation — switch immediately so full spin is visible
        setActiveMode('wheel-spin');
        return;
      }
      setPanelExiting(true);
      const t = setTimeout(() => {
        setActiveMode(incoming);
        setPanelExiting(false);
      }, 1500);
      return () => clearTimeout(t);
    } else if (prev === 'sold-summary' || prev === 'team-summary' || prev === 'team-wise-summary' || prev === 'top10-summary' || prev === 'wheel-spin' || prev === 'resting') {
      setSummaryExiting(true);
      const t = setTimeout(() => {
        setActiveMode(incoming);
        setSummaryExiting(false);
      }, 1800);
      return () => clearTimeout(t);
    } else {
      setActiveMode(incoming);
      setPanelExiting(false);
    }
  }, [effectiveSettings.displayMode]);

  useEffect(() => {
    const updateScale = () => {
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Sold message — show when auction transitions to 'Sold', stays until next player
  useEffect(() => {
    const status = auctionState.currentAuctionStatus;
    if (status === 'Sold' && prevAuctionStatusRef.current !== 'Sold') {
      const winningTeam = teams.find(t => t._id === currentPlayer?.winningTeamId);
      const price = currentPlayer?.finalPrice ?? (auctionState.currentBid || 0);
      if (currentPlayer && winningTeam) {
        if (toastTimersRef.current.exit)  clearTimeout(toastTimersRef.current.exit);
        if (toastTimersRef.current.clear) clearTimeout(toastTimersRef.current.clear);
        setSoldToast({ player: currentPlayer, team: winningTeam, price });
        setToastExiting(false);
      }
    }
    prevAuctionStatusRef.current = status;
  }, [auctionState.currentAuctionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dismiss sold message when a new player is selected for auction
  useEffect(() => {
    if (!soldToast) return;
    if (currentPlayer && currentPlayer._id !== soldToast.player._id) {
      if (toastTimersRef.current.exit)  clearTimeout(toastTimersRef.current.exit);
      if (toastTimersRef.current.clear) clearTimeout(toastTimersRef.current.clear);
      setToastExiting(true);
      toastTimersRef.current.clear = setTimeout(() => {
        setSoldToast(null);
        setToastExiting(false);
      }, 600);
    }
  }, [currentPlayer?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Immediately clear sold message when wheel spin starts (it covers the wheel at zIndex 200)
  useEffect(() => {
    if (effectiveSettings.displayMode === 'wheel-spin') {
      if (toastTimersRef.current.exit)  clearTimeout(toastTimersRef.current.exit);
      if (toastTimersRef.current.clear) clearTimeout(toastTimersRef.current.clear);
      setSoldToast(null);
      setToastExiting(false);
    }
  }, [effectiveSettings.displayMode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'linear-gradient(160deg, #0a0a14 0%, #111827 60%, #0d1117 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Concert+One&family=Coda+Caption:wght@800&family=Graduate&family=Inconsolata:wght@400;700&family=Rajdhani:wght@500;600;700&display=swap');
        @keyframes fullscreenTickerScroll {
          0%   { transform: translateY(-50%) translateX(0); }
          100% { transform: translateY(-50%) translateX(-50%); }
        }
        @keyframes bidActivePulse {
          0%, 100% { text-shadow: 0 0 0px var(--overlay-color-primary); }
          50%      { text-shadow: 0 0 40px var(--overlay-color-primary), 0 0 80px rgba(var(--overlay-color-primary-rgb),0.5), 0 0 120px rgba(var(--overlay-color-primary-rgb),0.2); }
        }
        .fs-bid-active { animation: bidActivePulse 1.5s ease-in-out infinite; }
        @keyframes liveDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.35; transform: scale(0.65); }
        }
        .fs-live-dot { animation: liveDotPulse 1.2s ease-in-out infinite; }
        @keyframes playerPanelEnter {
          0%   { transform: scaleX(0)   scaleY(0.004); }
          28%  { transform: scaleX(1)   scaleY(0.004); }
          100% { transform: scaleX(1)   scaleY(1);     }
        }
        @keyframes playerPanelExit {
          0%   { transform: scaleX(1)   scaleY(1);     }
          65%  { transform: scaleX(1)   scaleY(0.004); }
          100% { transform: scaleX(0)   scaleY(0.004); }
        }
        .fs-panel-enter {
          animation: playerPanelEnter 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: center center;
        }
        .fs-panel-exit {
          animation: playerPanelExit 1.5s ease-in forwards;
          transform-origin: center center;
        }
        @keyframes bidCardPulse {
          0%, 100% { box-shadow: none; }
          50%      { box-shadow: 0 0 24px rgba(var(--overlay-color-primary-rgb),0.22), inset 0 0 16px rgba(var(--overlay-color-primary-rgb),0.06); }
        }
        .fs-bid-card-active { animation: bidCardPulse 1.5s ease-in-out infinite; }
        @keyframes bidValuePop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .fs-bid-pop { animation: bidValuePop 0.3s ease-out forwards; }
        @keyframes summaryFadeOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.97); }
        }
        .fs-summary-exit { animation: summaryFadeOut 0.5s ease-in forwards; }
      `}</style>

      {/* 1920×1080 canvas scaled to fit viewport */}
      <div
        style={{
          width: 1920,
          height: 1080,
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          background: 'var(--overlay-bg-fullscreen)',
        }}
      >
        {/* ── Resting Time mode ── */}
        {activeMode === 'resting' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <RestingTimeOverlay tournament={tournament} />
          </div>
        )}

        {/* ── Sold Player Summary mode ── */}
        {activeMode === 'sold-summary' && (
          <div className={summaryExiting ? 'fs-summary-exit' : ''} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <SoldPlayersSummaryOverlay
              players={players}
              teams={teams}
              tournament={tournament}
              isExiting={summaryExiting}
            />
          </div>
        )}

        {/* ── Team Summary mode ── */}
        {activeMode === 'team-summary' && (
          <div className={summaryExiting ? 'fs-summary-exit' : ''} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <TeamSummaryOverlay
              teams={teams}
              tournament={tournament}
              isExiting={summaryExiting}
            />
          </div>
        )}

        {/* ── Top 10 Sold Summary mode ── */}
        {activeMode === 'top10-summary' && (
          <div className={summaryExiting ? 'fs-summary-exit' : ''} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <Top10SummaryOverlay
              players={players}
              teams={teams}
              tournament={tournament}
              isExiting={summaryExiting}
            />
          </div>
        )}

        {/* ── Team Wise Summary mode ── */}
        {activeMode === 'team-wise-summary' && (
          <div className={summaryExiting ? 'fs-summary-exit' : ''} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <TeamWiseSummaryOverlay
              players={players}
              teams={teams}
              tournament={tournament}
              isExiting={summaryExiting}
              filterTeamId={overlaySettings.teamWiseTeamId}
            />
          </div>
        )}

        {/* ── Wheel Spin mode ── */}
        {activeMode === 'wheel-spin' && wheelSpinData && (
          <div className={summaryExiting ? 'fs-summary-exit' : ''} style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <WheelSpinOverlay data={wheelSpinData} />
          </div>
        )}

        {/* ── New Player Auction Panel ── (standard + custom-ticker modes, with ScaleY enter/exit) */}
        {(activeMode === 'standard' || activeMode === 'custom-ticker') && (
          <div
            key={currentPlayer?._id ?? 'no-player'}
            className={panelExiting ? 'fs-panel-exit' : 'fs-panel-enter'}
            style={{ position: 'absolute', inset: 0, transformOrigin: 'center center' }}
          >
            <PlayerAuctionPanel
              currentPlayer={currentPlayer}
              tournament={tournament}
              auctionState={auctionState}
            />
          </div>
        )}

        {/* ── Ticker strip ── */}
        {!effectiveSettings.hideTickerFullscreen && (
          <TickerStrip
            soldPlayers={soldPlayers}
            players={players}
            teams={teams}
            tournament={tournament}
            mode={effectiveSettings.tickerMode}
            customMode={activeMode === 'custom-ticker'}
            customLine1={effectiveSettings.customTickerLine1}
            customLine2={effectiveSettings.customTickerLine2}
          />
        )}

        {/* Full-screen sold message — covers everything including ticker */}
        {soldToast && (
          <SoldMessageFullScreen
            player={soldToast.player}
            team={soldToast.team}
            finalPrice={soldToast.price}
            exiting={toastExiting}
          />
        )}
      </div>
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export default function FullScreenOverlay({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: 'var(--overlay-bg-fullscreen)' }}>
      <OverlayWrapper tournamentId={tournamentId}>
        {({ soldPlayers, teams, players, currentPlayer, tournament, auctionState, overlaySettings, wheelSpinData }) => (
          <FullScreenOverlayContent
            soldPlayers={soldPlayers}
            teams={teams}
            players={players}
            currentPlayer={currentPlayer}
            tournament={tournament}
            auctionState={auctionState}
            overlaySettings={overlaySettings}
            wheelSpinData={wheelSpinData}
          />
        )}
      </OverlayWrapper>
    </div>
  );
}
