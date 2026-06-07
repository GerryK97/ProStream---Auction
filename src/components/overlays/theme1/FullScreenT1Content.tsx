'use client';

import React, { useEffect, useRef, useState } from 'react';
import SoldPlayersSummaryOverlay from './SoldPlayersSummaryT1';
import TeamSummaryOverlay from './TeamSummaryT1';
import TeamWiseSummaryOverlay from './TeamWiseSummaryT1';
import TeamWiseImageT1 from './TeamWiseImageT1';
import RestingTimeOverlay from './RestingTimeT1';
import Top10SummaryOverlay from './Top10SummaryT1';
import WheelSpinOverlay from '../shared/WheelSpinOverlay';
import ResilientImage from '../shared/ResilientImage';
import SoldMessageFullScreen from './SoldMessageT1';
import { AuctionState, Player, Team, Tournament } from '@/types';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import type { OverlaySettings } from '../OverlayWrapper';
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

// ─── Player Auction Panel — football card design ─────────────────────────────

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

  const photoUrl = hasPlayer
    ? (currentPlayer!.photoURL || tournament?.logoURL || '')
    : '';
  const dorsalText = hasPlayer && currentPlayer!.playerNo ? `#${currentPlayer!.playerNo}` : '';

  // Dynamic profile fields
  const ppf = tournament?.playerProfileFields;
  const fields: Array<{ label: string; value: string | number; color?: string }> = [];
  if (ppf?.showAge)
    fields.push({ label: 'Age', value: hasPlayer ? (currentPlayer!.age ?? '—') : '—' });
  fields.push({ label: 'Position', value: hasPlayer ? (currentPlayer!.position || '—') : '—' });
  if (ppf?.showBattingStyle)
    fields.push({ label: 'Batting', value: hasPlayer ? (currentPlayer!.battingStyle || '—') : '—' });
  if (ppf?.showBowlingStyle)
    fields.push({ label: 'Bowling', value: hasPlayer ? (currentPlayer!.bowlingStyle || '—') : '—' });
  (ppf?.statFields ?? []).forEach(sf =>
    fields.push({ label: sf.label, value: hasPlayer ? ((currentPlayer!.stats as any)?.[sf.key] ?? '—') : '—' })
  );
  if (tournament?.usePlayerClasses && (tournament?.playerClasses?.length ?? 0) > 0) {
    fields.push({ label: 'Class', value: hasPlayer ? (currentPlayer!.playerClass || '—') : '—', color: classColor });
  }

  // White panel geometry
  const PHOTO_LEFT = 72;
  const PHOTO_TOP = 73;
  const PHOTO_WIDTH = 730;
  const PANEL_LEFT = PHOTO_LEFT + PHOTO_WIDTH;
  const PANEL_TOP = 73;
  const PANEL_WIDTH = 1920 - PANEL_LEFT;
  const PANEL_HEIGHT = 929;

  const CONTENT_LEFT = 60;

  // Field rows
  const FIELD_START_Y = 450;
  const AVAILABLE_H = PANEL_HEIGHT - FIELD_START_Y - 30;
  const FIELD_SLOT_H = fields.length > 0
    ? Math.max(60, Math.min(100, Math.floor(AVAILABLE_H / fields.length)))
    : 90;
  const valueFontSize = Math.max(28, Math.round(42 * (FIELD_SLOT_H / 90)));

  // Player name font size
  const nameLen = hasPlayer ? currentPlayer!.name.length : 0;
  const nameFontSize = nameLen > 18 ? 52 : nameLen > 12 ? 64 : 76;

  return (
    <>
      {/* ── Left photo panel ── */}
      <div style={{
        position: 'absolute',
        left: PHOTO_LEFT,
        top: PHOTO_TOP,
        width: PHOTO_WIDTH,
        height: PANEL_HEIGHT,
        borderRadius: '16px 0 0 16px',
        overflow: 'hidden',
        background: 'var(--overlay-bg-photo, #0d1117)',
      }}>
        {photoUrl ? (
          <ResilientImage
            src={photoUrl}
            alt={hasPlayer ? currentPlayer!.name : ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 24,
          }}>
            <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 22, fontFamily: "'Varela Round', sans-serif", letterSpacing: 3, textTransform: 'uppercase' }}>
              Waiting for player…
            </span>
          </div>
        )}
      </div>

      {/* ── White right panel ── */}
      <div style={{
        position: 'absolute',
        left: PANEL_LEFT,
        top: PANEL_TOP,
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT,
        backgroundColor: 'white',
        fontFamily: "'Varela Round', sans-serif",
        boxShadow: '-12px 0 40px rgba(0,0,0,0.3)',
        borderRadius: '0 16px 16px 0',
      }}>
        {/* Jersey / dorsal number — top right, large yellow */}
        {dorsalText && (
          <div style={{
            position: 'absolute',
            top: 20,
            right: 36,
            color: '#E7C403',
            fontSize: 160,
            fontWeight: 'bold',
            lineHeight: 1,
            letterSpacing: -6,
            opacity: 0.92,
            userSelect: 'none',
          }}>
            {dorsalText}
          </div>
        )}

        {/* Player name */}
        <div style={{
          position: 'absolute',
          top: 70,
          left: CONTENT_LEFT,
          right: dorsalText ? 220 : 40,
          fontSize: nameFontSize,
          fontWeight: 'bold',
          color: '#111',
          textTransform: 'uppercase',
          lineHeight: 1.1,
        }}>
          {hasPlayer ? currentPlayer!.name : '—'}
        </div>

        {/* Role / class tag below name */}
        {hasPlayer && (currentPlayer!.playerClass || currentPlayer!.position) && (
          <div style={{
            position: 'absolute',
            top: 70 + nameFontSize * 1.15 + 6,
            left: CONTENT_LEFT,
            fontSize: 20,
            color: 'rgba(0,0,0,0.4)',
            textTransform: 'uppercase',
            letterSpacing: 4,
          }}>
            {currentPlayer!.playerClass
              ? <span style={{ background: classColor, color: '#fff', padding: '3px 14px', borderRadius: 6, fontSize: 18, letterSpacing: 3 }}>{currentPlayer!.playerClass}</span>
              : currentPlayer!.position
            }
          </div>
        )}

        {/* Horizontal divider */}
        <div style={{
          position: 'absolute',
          top: 245,
          left: CONTENT_LEFT - 20,
          right: 40,
          height: 2,
          backgroundColor: 'rgba(0,0,0,0.08)',
        }} />

        {/* Base Price */}
        <div style={{ position: 'absolute', top: 268, left: CONTENT_LEFT }}>
          <div style={{ fontSize: 16, color: 'rgba(0,0,0,0.38)', letterSpacing: 5, textTransform: 'uppercase' }}>
            Base Price
          </div>
          <div style={{ fontSize: 46, fontWeight: 700, color: '#888', lineHeight: 1.1, letterSpacing: -1 }}>
            {hasPlayer ? basePrice.toLocaleString('en-IN') : '—'}
          </div>
        </div>

        {/* Current Bid */}
        <div style={{ position: 'absolute', top: 268, left: CONTENT_LEFT + 360 }}>
          <div style={{ fontSize: 16, color: 'rgba(0,0,0,0.38)', letterSpacing: 5, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
            Current Bid
            {isBidding && (
              <div className="fs-live-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            )}
          </div>
          <div
            className={`${isBidding ? 'fs-bid-active' : ''} ${bidPopping ? 'fs-bid-pop' : ''}`}
            style={{
              fontSize: 88,
              fontWeight: 700,
              color: isBidding ? '#22c55e' : '#111',
              lineHeight: 1.05,
              letterSpacing: -3,
            }}
          >
            {hasPlayer ? currentBid.toLocaleString('en-IN') : '—'}
          </div>
        </div>

        {/* Divider before field rows */}
        <div style={{
          position: 'absolute',
          top: FIELD_START_Y - 18,
          left: CONTENT_LEFT - 20,
          right: 40,
          height: 2,
          backgroundColor: 'rgba(0,0,0,0.08)',
        }} />

        {/* Dynamic field rows */}
        {fields.map((f, i) => {
          const top = FIELD_START_Y + i * FIELD_SLOT_H;
          const safeLeft = CONTENT_LEFT - 20;
          return (
            <React.Fragment key={f.label}>
              <div style={{
                position: 'absolute',
                top,
                left: safeLeft,
                fontSize: 16,
                color: 'rgba(0,0,0,0.38)',
                letterSpacing: 4,
                textTransform: 'uppercase',
              }}>
                {f.label}
              </div>
              <div style={{
                position: 'absolute',
                top: top + 24,
                left: safeLeft,
                fontSize: valueFontSize,
                fontWeight: 700,
                color: f.color ?? '#111',
                lineHeight: 1,
              }}>
                {f.value}
              </div>
              {i < fields.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: top + FIELD_SLOT_H - 6,
                  left: safeLeft,
                  right: 40,
                  height: 1,
                  backgroundColor: 'rgba(0,0,0,0.07)',
                }} />
              )}
            </React.Fragment>
          );
        })}

        {/* SOLD stamp */}
        {isSold && (
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}>
            <div className="animate-stamp-seal" style={{
              border: '8px solid #ef4444',
              borderRadius: 16,
              padding: '14px 48px',
              background: 'rgba(239,68,68,0.06)',
            }}>
              <span style={{
                fontFamily: "'Varela Round', sans-serif",
                fontSize: 110,
                fontWeight: 700,
                color: '#ef4444',
                letterSpacing: 18,
                lineHeight: 1,
                display: 'block',
              }}>
                SOLD
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Canvas content (1920×1080) ───────────────────────────────────────────────

export function FullScreenT1Content({
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
    } else if (prev === 'sold-summary' || prev === 'team-summary' || prev === 'team-wise-summary' || prev === 'team-wise-image' || prev === 'top10-summary' || prev === 'wheel-spin' || prev === 'resting') {
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
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Concert+One&family=Coda+Caption:wght@800&family=Graduate&family=Inconsolata:wght@400;700&family=Rajdhani:wght@500;600;700&family=Varela+Round&display=swap');
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

        {/* ── Team Wise Image mode ── */}
        {activeMode === 'team-wise-image' && (
          <div className={summaryExiting ? 'fs-summary-exit' : ''} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <TeamWiseImageT1
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
