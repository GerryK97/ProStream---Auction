'use client';

import React, { useEffect, useRef, useState } from 'react';
import SoldPlayersSummaryOverlay from './SoldPlayersSummaryT1';
import TeamSummaryOverlay from './TeamSummaryT1';
import TeamWiseSummaryOverlay from './TeamWiseSummaryT1';
import RestingTimeOverlay from './RestingTimeT1';
import Top10SummaryOverlay from './Top10SummaryT1';
import WheelSpinOverlay from '../shared/WheelSpinOverlay';
import SoldMessageToast from '../shared/SoldMessageToast';
import ResilientImage from '../shared/ResilientImage';
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

// ─── Secondary Image Panel ─────────────────────────────────────────────────────

function SecondaryImagePanel({
  currentPlayer,
  tournament,
}: {
  currentPlayer: Player | undefined;
  tournament: Tournament | null;
}) {
  const hasPlayer = !!currentPlayer;
  const imgSrc = currentPlayer?.secondaryImageURL || currentPlayer?.photoURL || null;

  if (!hasPlayer) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
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
    );
  }

  if (imgSrc) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <ResilientImage
          src={imgSrc}
          alt={currentPlayer!.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
        />
        {/* Bottom gradient fade — blends image into ticker zone */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 140,
          background: 'linear-gradient(to bottom, transparent 0%, var(--overlay-bg-fullscreen, #0a0a14) 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    );
  }

  // Player exists but no images — show tournament logo or placeholder
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 24,
      background: 'var(--overlay-bg-photo-fallback)',
    }}>
      {tournament?.logoURL ? (
        <ResilientImage
          src={tournament.logoURL}
          alt={tournament.name}
          style={{ width: 320, height: 320, objectFit: 'contain', opacity: 0.85 }}
        />
      ) : (
        <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
      )}
    </div>
  );
}

// ─── Canvas content (1920×1080) ───────────────────────────────────────────────

export function FullScreenAltT1Content({
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

  // Always large
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

  // Waiting-for-next-player state (shown after sold toast clears)
  const [waitingForNextPlayer, setWaitingForNextPlayer] = useState(false);
  const [waitingExiting, setWaitingExiting] = useState(false);
  const soldPlayerIdRef = useRef<string | undefined>(undefined);
  const waitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bid pop animation
  const [bidPopping, setBidPopping] = useState(false);
  const prevBidRef = useRef(auctionState.currentBid);
  useEffect(() => {
    if (auctionState.currentAuctionStatus === 'Bidding' && auctionState.currentBid !== prevBidRef.current) {
      setBidPopping(true);
      const t = setTimeout(() => setBidPopping(false), 300);
      prevBidRef.current = auctionState.currentBid;
      return () => clearTimeout(t);
    }
    prevBidRef.current = auctionState.currentBid;
  }, [auctionState.currentBid, auctionState.currentAuctionStatus]);

  useEffect(() => {
    const incoming = effectiveSettings.displayMode;
    const prev = prevDisplayModeRef.current;
    prevDisplayModeRef.current = incoming;

    if (prev === incoming) return;

    if (prev === 'standard' || prev === 'custom-ticker') {
      if (incoming === 'standard' || incoming === 'custom-ticker') {
        setActiveMode(incoming);
        return;
      }
      if (incoming === 'wheel-spin') {
        setActiveMode('wheel-spin');
        return;
      }
      setPanelExiting(true);
      const t = setTimeout(() => {
        setActiveMode(incoming);
        setPanelExiting(false);
      }, 1500);
      return () => clearTimeout(t);
    } else if (prev === 'wheel-spin') {
      setSummaryExiting(true);
      const t = setTimeout(() => {
        setActiveMode(incoming);
        setSummaryExiting(false);
      }, 500);
      return () => clearTimeout(t);
    } else if (prev === 'sold-summary' || prev === 'team-summary' || prev === 'team-wise-summary' || prev === 'top10-summary' || prev === 'resting') {
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

  // Exit wheel-spin immediately when a player is selected so the profile
  // appears as soon as auction:player-selected arrives, not after the timer.
  useEffect(() => {
    if (!auctionState.currentPlayerId) return;
    if (activeMode !== 'wheel-spin') return;
    prevDisplayModeRef.current = 'standard';
    setActiveMode('standard');
    setSummaryExiting(false);
    setPanelExiting(false);
  }, [auctionState.currentPlayerId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const updateScale = () => {
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Sold message — show when auction transitions to 'Sold'
  useEffect(() => {
    const status = auctionState.currentAuctionStatus;
    if (status === 'Sold' && prevAuctionStatusRef.current !== 'Sold') {
      const winningTeam = teams.find(t => t._id === currentPlayer?.winningTeamId);
      const price = currentPlayer?.finalPrice ?? (auctionState.currentBid || 0);
      if (currentPlayer && winningTeam) {
        if (toastTimersRef.current.exit)  clearTimeout(toastTimersRef.current.exit);
        if (toastTimersRef.current.clear) clearTimeout(toastTimersRef.current.clear);
        if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
        soldPlayerIdRef.current = currentPlayer._id;
        setSoldToast({ player: currentPlayer, team: winningTeam, price });
        setToastExiting(false);
        setWaitingForNextPlayer(false);
        setWaitingExiting(false);
        toastTimersRef.current.exit  = setTimeout(() => setToastExiting(true), 4400);
        toastTimersRef.current.clear = setTimeout(() => { setSoldToast(null); setToastExiting(false); }, 5000);
        // After toast clears, transition to waiting-for-next-player state
        waitingTimerRef.current = setTimeout(() => { setWaitingForNextPlayer(true); setWaitingExiting(false); }, 5000);
      }
    }
    prevAuctionStatusRef.current = status;
  }, [auctionState.currentAuctionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dismiss sold toast / waiting state when a new player is selected
  useEffect(() => {
    if (!soldToast && !waitingForNextPlayer) return;
    if (currentPlayer && currentPlayer._id !== soldPlayerIdRef.current) {
      // Cancel waiting timer if new player arrives before 5 s
      if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
      // Exit waiting state if already showing
      if (waitingForNextPlayer) {
        setWaitingExiting(true);
        setTimeout(() => { setWaitingForNextPlayer(false); setWaitingExiting(false); }, 600);
      }
      // Dismiss toast immediately — no exit animation needed when next player is arriving
      if (soldToast) {
        if (toastTimersRef.current.exit)  clearTimeout(toastTimersRef.current.exit);
        if (toastTimersRef.current.clear) clearTimeout(toastTimersRef.current.clear);
        setSoldToast(null);
        setToastExiting(false);
      }
    }
  }, [currentPlayer?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear sold message immediately when wheel spin starts
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
          50%      { text-shadow: 0 0 40px var(--overlay-color-primary), 0 0 80px rgba(var(--overlay-color-primary-rgb),0.5); }
        }
        .fs2-bid-active { animation: bidActivePulse 1.5s ease-in-out infinite; }
        @keyframes liveDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.35; transform: scale(0.65); }
        }
        .fs2-live-dot { animation: liveDotPulse 1.2s ease-in-out infinite; }
        @keyframes bidValuePop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .fs2-bid-pop { animation: bidValuePop 0.3s ease-out forwards; }
        @keyframes bidCardPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.6); }
          50%      { box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 24px rgba(var(--overlay-color-primary-rgb),0.22); }
        }
        .fs2-bid-card-active { animation: bidCardPulse 1.5s ease-in-out infinite; }
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
        .fs2-panel-enter {
          animation: playerPanelEnter 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: center center;
        }
        .fs2-panel-exit {
          animation: playerPanelExit 1.5s ease-in forwards;
          transform-origin: center center;
        }
        @keyframes summaryFadeOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.97); }
        }
        .fs2-summary-exit { animation: summaryFadeOut 0.5s ease-in forwards; }
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
          <div className={summaryExiting ? 'fs2-summary-exit' : ''} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
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
          <div className={summaryExiting ? 'fs2-summary-exit' : ''} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <TeamSummaryOverlay
              teams={teams}
              tournament={tournament}
              isExiting={summaryExiting}
            />
          </div>
        )}

        {/* ── Top 10 Sold Summary mode ── */}
        {activeMode === 'top10-summary' && (
          <div className={summaryExiting ? 'fs2-summary-exit' : ''} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
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
          <div className={summaryExiting ? 'fs2-summary-exit' : ''} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
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
          <div className={summaryExiting ? 'fs2-summary-exit' : ''} style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <WheelSpinOverlay data={wheelSpinData} />
          </div>
        )}

        {/* ── Secondary Image Panel + Current Bid card — animate together ── */}
        {(activeMode === 'standard' || activeMode === 'custom-ticker') && (
          <div
            key={currentPlayer?._id ?? 'no-player'}
            className={panelExiting ? 'fs2-panel-exit' : 'fs2-panel-enter'}
            style={{ position: 'absolute', inset: 0, transformOrigin: 'center center' }}
          >
            {!waitingForNextPlayer && (
              <SecondaryImagePanel
                currentPlayer={currentPlayer}
                tournament={tournament}
              />
            )}
            {/* Current Bid card — top-right, overlaid on the image */}
            {(() => {
              const isBidding = auctionState.currentAuctionStatus === 'Bidding';
              const hasPlayer = !!currentPlayer;
              const basePrice = hasPlayer ? getClassBasePrice(tournament, currentPlayer!) : 0;
              const currentBid = auctionState.currentBid > 0
                ? auctionState.currentBid
                : (isBidding && hasPlayer ? basePrice : 0);
              return (
                <div
                  className={isBidding ? 'fs2-bid-card-active' : ''}
                  style={{
                    position: 'absolute',
                    left: effectiveSettings.bidCardLeft,
                    top: effectiveSettings.bidCardTop,
                    width: 320,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid var(--overlay-border-accent-subtle)',
                    borderRadius: 14,
                    padding: '16px 24px 20px 24px',
                    display: waitingForNextPlayer ? 'none' : 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    zIndex: 5,
                  }}
                >
                  <div style={{
                    fontFamily: '"Graduate", cursive',
                    fontSize: 15,
                    color: 'var(--overlay-color-primary)',
                    letterSpacing: 6,
                    textTransform: 'uppercase',
                    lineHeight: 1,
                  }}>
                    Current Bid
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      className={`${isBidding ? 'fs2-bid-active' : ''} ${bidPopping ? 'fs2-bid-pop' : ''}`}
                      style={{
                        fontFamily: '"Inconsolata", monospace',
                        fontSize: 64,
                        color: 'var(--overlay-text-bright)',
                        fontWeight: 700,
                        lineHeight: 1,
                        letterSpacing: 3,
                      }}
                    >
                      {hasPlayer ? currentBid.toLocaleString('en-IN') : '—'}
                    </div>
                    {isBidding && (
                      <div className="fs2-live-dot" style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: 'var(--overlay-color-primary)',
                        flexShrink: 0,
                        alignSelf: 'center',
                        marginTop: 4,
                      }} />
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Ticker strip ── */}
        {!effectiveSettings.hideTickerFullscreen && <TickerStrip
          soldPlayers={soldPlayers}
          players={players}
          teams={teams}
          tournament={tournament}
          mode={effectiveSettings.tickerMode}
          customMode={activeMode === 'custom-ticker'}
          customLine1={effectiveSettings.customTickerLine1}
          customLine2={effectiveSettings.customTickerLine2}
        />}

        {/* ── Waiting for next player (post-sale resting state) ── */}
        {waitingForNextPlayer && (activeMode === 'standard' || activeMode === 'custom-ticker') && (
          <div
            className={waitingExiting ? 'fs2-summary-exit' : 'animate-fade-in'}
            style={{ position: 'absolute', inset: 0, zIndex: 6 }}
          >
            <RestingTimeOverlay tournament={tournament} overrideLabel="Waiting for Next Player" />
          </div>
        )}

        {/* Sold message toast */}
        {soldToast && (
          <SoldMessageToast
            player={soldToast.player}
            team={soldToast.team}
            finalPrice={soldToast.price}
            exiting={toastExiting}
            position={effectiveSettings.soldMessagePosition ?? 'bottom-right'}
          />
        )}
      </div>
    </div>
  );
}
