'use client';

import React, { useEffect, useRef, useState } from 'react';
import PlayerCardOverlay from './PlayerCardT1';
import SoldPlayersSummaryOverlay from './SoldPlayersSummaryT1';
import TeamSummaryOverlay from './TeamSummaryT1';
import TeamWiseSummaryOverlay from './TeamWiseSummaryT1';
import TeamWiseImageT1 from './TeamWiseImageT1';
import RestingTimeOverlay from './RestingTimeT1';
import Top10SummaryOverlay from './Top10SummaryT1';
import WheelSpinOverlay from '../shared/WheelSpinOverlay';
import SoldMessageToast from '../shared/SoldMessageToast';
import LeadingBidsOverlay from '../shared/LeadingBidsOverlay';
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

  const nameStyle:   React.CSSProperties = { color: 'var(--overlay-text-bright)' };
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
          backgroundColor: 'var(--overlay-bg-ticker)',
          borderTop: '1px solid var(--overlay-border-accent-subtle)',
        }}
      />

      {/* Scrolling text clip zone — starts after the pill */}
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
                  fontFamily: '"Concert One", cursive', fontSize: 26, color: 'var(--overlay-text-bright)',
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
              animation: `customTickerScroll ${duration}s linear infinite`,
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

// ─── Base Price & Current Bid panel ───────────────────────────────────────────

function BidInfoPanel({
  tournament,
  currentPlayer,
  auctionState,
  smallMode,
}: {
  tournament: Tournament | null;
  currentPlayer: Player | undefined;
  auctionState: AuctionState;
  smallMode?: boolean;
}) {
  const [bidPopping, setBidPopping] = useState(false);
  const prevBidRef = useRef(auctionState.currentBid);
  useEffect(() => {
    if (auctionState.currentAuctionStatus === 'Bidding' &&
        auctionState.currentBid !== prevBidRef.current) {
      setBidPopping(true);
      const t = setTimeout(() => setBidPopping(false), 300);
      prevBidRef.current = auctionState.currentBid;
      return () => clearTimeout(t);
    }
    prevBidRef.current = auctionState.currentBid;
  }, [auctionState.currentBid, auctionState.currentAuctionStatus]);

  if (!currentPlayer || tournament?.status !== 'Live' || auctionState.currentAuctionStatus === 'Sold') return null;

  const basePrice = getClassBasePrice(tournament, currentPlayer);
  const currentBid = auctionState.currentBid > 0
    ? auctionState.currentBid
    : (auctionState.currentAuctionStatus === 'Bidding' ? basePrice : 0);

  const pillStyle: React.CSSProperties = {
    position: 'absolute',
    width:        smallMode ? 266 : 444,
    height:       smallMode ? 71  : 119,
    top:          smallMode ? 925 : 877,
    borderRadius: smallMode ? 10  : 16,
    gap:          smallMode ? 1   : 2,
    background: 'var(--overlay-bg-panel)',
    border: '1.5px solid var(--overlay-border-light)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const labelStyle: React.CSSProperties = {
    color: 'var(--overlay-color-primary)',
    fontSize: smallMode ? 11 : 18,
    fontFamily: '"Graduate", cursive',
    letterSpacing: 5,
    textTransform: 'uppercase',
    lineHeight: 1,
  };

  const valueStyle: React.CSSProperties = {
    color: 'var(--overlay-text-bright)',
    fontSize:      smallMode ? 37 : 62,
    fontFamily: '"Inconsolata", monospace',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: smallMode ? 2 : 4,
  };

  return (
    <>
      {/* Base Price */}
      <div style={{ ...pillStyle, left: smallMode ? 353 : 27 }}>
        <div style={labelStyle}>BASE PRICE</div>
        <div style={valueStyle}>{basePrice.toLocaleString('en-IN')}</div>
      </div>

      {/* Current Bid */}
      <div style={{ ...pillStyle, left: smallMode ? 871 : 1019 }}>
        <div style={labelStyle}>CURRENT BID</div>
        <div className={bidPopping ? 'fs-bid-pop' : ''} style={valueStyle}>{currentBid.toLocaleString('en-IN')}</div>
      </div>
    </>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard({ team, tournament, currentBid, players }: { team: Team; tournament: Tournament | null; currentBid: number; players: Player[] }) {
  const spent = (team.initialBudget ?? 0) - (team.currentBalance ?? 0);
  const balance = team.currentBalance ?? 0;
  const initial = team.initialBudget ?? 1;
  const barPct = Math.min(100, Math.max(0, (spent / initial) * 100));
  const playersBought = players.filter(p => p.isSold && String(p.winningTeamId) === String(team._id)).length;
  const squadSize = tournament?.squadSize ?? '—';
  const initials = (team.shortCode || team.name).slice(0, 2).toUpperCase();

  // Max bid calculation — mirrors AuctionControlPanel logic
  const _playersPurchased = playersBought;
  const _squadSize = tournament?.squadSize ?? 0;
  const _basePrice = tournament?.basePricePerPlayer ?? 0;
  const _remainingPlayers = _squadSize - _playersPurchased;
  const maxBid = _remainingPlayers <= 1
    ? (team.currentBalance ?? 0)
    : Math.max(0, (team.currentBalance ?? 0) - (_remainingPlayers - 1) * _basePrice);
  const isExceeded = currentBid > 0 && currentBid > maxBid;

  return (
    <div style={{
      position: 'relative',
      width: 362,
      height: 136,
      background: isExceeded
        ? 'var(--overlay-bg-danger)'
        : 'var(--overlay-bg-panel)',
      borderRadius: 20,
      border: isExceeded ? '2px solid var(--overlay-color-danger)' : '1.5px solid var(--overlay-border-light)',
      boxShadow: isExceeded
        ? '0 0 18px rgba(var(--overlay-color-danger-rgb),0.55), 0 0 40px rgba(var(--overlay-color-danger-rgb),0.25), inset 0 0 20px rgba(var(--overlay-color-danger-rgb),0.08)'
        : 'none',
      transition: 'border 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
      flexShrink: 0,
    }}>
      {/* Logo circle */}
      <div style={{
        position: 'absolute',
        left: 16,
        top: 6,
        width: 124,
        height: 124,
        borderRadius: '50%',
        border: '1.5px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {team.logoURL ? (
          <img src={team.logoURL} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: 'var(--overlay-color-primary)', fontSize: 36, fontFamily: '"Graduate", cursive', fontWeight: 700 }}>
            {initials}
          </span>
        )}
      </div>

      {/* Team name */}
      <div style={{
        position: 'absolute',
        left: 152,
        top: 8,
        right: 8,
        color: 'var(--overlay-color-primary)',
        fontSize: 20,
        fontFamily: '"Graduate", cursive',
        letterSpacing: 2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {team.name}
      </div>

      {/* Budget bar track */}
      <div style={{
        position: 'absolute',
        left: 152,
        top: 38,
        width: 192,
        height: 9,
        background: 'rgba(255,255,255,0.12)',
        borderRadius: 4.5,
      }}>
        {/* Budget bar fill — shows % spent */}
        <div style={{
          width: `${barPct}%`,
          height: '100%',
          background: barPct > 80 ? 'var(--overlay-color-danger)' : 'var(--overlay-color-success)',
          borderRadius: 4.5,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Players label */}
      <div style={{
        position: 'absolute',
        left: 152,
        top: 54,
        color: 'rgba(255,255,255,0.45)',
        fontSize: 9,
        fontFamily: '"Inconsolata", monospace',
        letterSpacing: 1,
      }}>
        Players
      </div>

      {/* Players value */}
      <div style={{
        position: 'absolute',
        left: 152,
        top: 63,
        color: 'var(--overlay-text-bright)',
        fontSize: 16,
        fontFamily: '"Inconsolata", monospace',
        letterSpacing: 1.5,
      }}>
        {playersBought}/{squadSize}
      </div>

      {/* Total Spent label */}
      <div style={{
        position: 'absolute',
        left: 270,
        top: 54,
        color: 'rgba(255,255,255,0.45)',
        fontSize: 9,
        fontFamily: '"Inconsolata", monospace',
        letterSpacing: 1,
      }}>
        Spent
      </div>

      {/* Total Spent value */}
      <div style={{
        position: 'absolute',
        left: 255,
        top: 63,
        color: 'var(--overlay-text-bright)',
        fontSize: 14,
        fontFamily: '"Inconsolata", monospace',
        letterSpacing: 1,
      }}>
        {spent.toLocaleString('en-IN')}
      </div>

      {/* Budget Balance label */}
      <div style={{
        position: 'absolute',
        left: 152,
        top: 106,
        color: 'rgba(255,255,255,0.45)',
        fontSize: 9,
        fontFamily: '"Inconsolata", monospace',
        letterSpacing: 1,
      }}>
        Budget Balance
      </div>

      {/* Budget Balance value */}
      <div style={{
        position: 'absolute',
        left: 152,
        top: 82,
        color: 'var(--overlay-text-bright)',
        fontSize: 24,
        fontFamily: '"Inconsolata", monospace',
        fontWeight: 700,
        letterSpacing: 2,
      }}>
        {balance.toLocaleString('en-IN')}
      </div>
    </div>
  );
}

// ─── Team Cards Panel (with auto-rotation) ────────────────────────────────────

function TeamCardsPanel({ teams, tournament, currentBid, players }: { teams: Team[]; tournament: Tournament | null; currentBid: number; players: Player[] }) {
  const PAGE_SIZE = 4;
  const pages = Math.ceil(teams.length / PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(0);
  const [animClass, setAnimClass] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (teams.length <= PAGE_SIZE) return;

    const interval = setInterval(() => {
      // Flip out
      setAnimClass('team-flip-out');
      timerRef.current = setTimeout(() => {
        setPageIndex(p => (p + 1) % pages);
        setAnimClass('team-flip-in');
        timerRef.current = setTimeout(() => setAnimClass(''), 400);
      }, 400);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [teams.length, pages]);

  const currentPage = teams.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);

  return (
    <div
      className={animClass}
      style={{
        width: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'center',
      }}
    >
      {currentPage.map(team => (
        <TeamCard key={team._id} team={team} tournament={tournament} currentBid={currentBid} players={players} />
      ))}
    </div>
  );
}

// ─── Canvas content (1920×1080) ───────────────────────────────────────────────

export function CustomT1Content({
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

  // Mode transition state machine
  const [visibleMode, setVisibleMode] = useState(overlaySettings.displayMode);
  const [modeExiting, setModeExiting] = useState(false);
  const modeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (overlaySettings.displayMode === visibleMode) return;
    // wheel-spin is immediate — protect spin timer
    if (overlaySettings.displayMode === 'wheel-spin') {
      if (modeTimerRef.current) clearTimeout(modeTimerRef.current);
      setModeExiting(false);
      setVisibleMode('wheel-spin');
      return;
    }
    if (modeTimerRef.current) clearTimeout(modeTimerRef.current);
    setModeExiting(true);
    modeTimerRef.current = setTimeout(() => {
      setVisibleMode(overlaySettings.displayMode);
      setModeExiting(false);
    }, 300);
    return () => { if (modeTimerRef.current) clearTimeout(modeTimerRef.current); };
  }, [overlaySettings.displayMode, visibleMode]);

  // Player card cross-fade key
  const [playerKey, setPlayerKey] = useState(0);
  const prevPlayerIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentPlayer?._id && currentPlayer._id !== prevPlayerIdRef.current) {
      setPlayerKey(k => k + 1);
      prevPlayerIdRef.current = currentPlayer._id;
    }
  }, [currentPlayer?._id]);

  // Sold message toast state
  const [soldToast, setSoldToast] = useState<{ player: Player; team: Team; price: number } | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const prevAuctionStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const updateScale = () => {
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Sold message toast — show on Sold, auto-dismiss after 5s
  useEffect(() => {
    const status = auctionState.currentAuctionStatus;
    if (status === 'Sold' && prevAuctionStatusRef.current !== 'Sold') {
      const winningTeam = teams.find(t => t._id === currentPlayer?.winningTeamId);
      const price = currentPlayer?.finalPrice ?? (auctionState.currentBid || 0);
      if (currentPlayer && winningTeam) {
        setSoldToast({ player: currentPlayer, team: winningTeam, price });
        setToastExiting(false);
        // Begin exit animation at 4.4s, fully remove at 5s
        const exitTimer = setTimeout(() => setToastExiting(true), 4400);
        const removeTimer = setTimeout(() => { setSoldToast(null); setToastExiting(false); }, 5000);
        return () => { clearTimeout(exitTimer); clearTimeout(removeTimer); };
      }
    }
    prevAuctionStatusRef.current = status;
  }, [auctionState.currentAuctionStatus, auctionState.currentBid, currentPlayer, teams]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'transparent' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Concert+One&family=Coda+Caption:wght@800&family=Graduate&family=Inconsolata:wght@400;700&family=Rajdhani:wght@500;600;700&display=swap');
        @keyframes customTickerScroll {
          0%   { transform: translateY(-50%) translateX(0); }
          100% { transform: translateY(-50%) translateX(-50%); }
        }
        @keyframes teamFlipOut {
          0%   { transform: perspective(600px) rotateY(0deg); opacity: 1; }
          100% { transform: perspective(600px) rotateY(90deg); opacity: 0; }
        }
        @keyframes teamFlipIn {
          0%   { transform: perspective(600px) rotateY(-90deg); opacity: 0; }
          100% { transform: perspective(600px) rotateY(0deg); opacity: 1; }
        }
        .team-flip-out { animation: teamFlipOut 0.4s ease-in forwards; }
        .team-flip-in  { animation: teamFlipIn  0.4s ease-out forwards; }
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
        }}
      >
        {/* ── Resting Time mode ── */}
        {visibleMode === 'resting' && (
          <div className={modeExiting ? 'fs-summary-exit' : 'animate-fade-in'} style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <RestingTimeOverlay tournament={tournament} />
          </div>
        )}

        {/* ── Sold Player Summary mode ── */}
        {visibleMode === 'sold-summary' && (
          <div className={modeExiting ? 'fs-summary-exit' : 'animate-fade-in'} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <SoldPlayersSummaryOverlay
              players={players}
              teams={teams}
              tournament={tournament}
            />
          </div>
        )}

        {/* ── Team Summary mode ── */}
        {visibleMode === 'team-summary' && (
          <div className={modeExiting ? 'fs-summary-exit' : 'animate-fade-in'} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <TeamSummaryOverlay
              teams={teams}
              tournament={tournament}
            />
          </div>
        )}

        {/* ── Top 10 Sold Summary mode ── */}
        {visibleMode === 'top10-summary' && (
          <div className={modeExiting ? 'fs-summary-exit' : 'animate-fade-in'} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <Top10SummaryOverlay
              players={players}
              teams={teams}
              tournament={tournament}
            />
          </div>
        )}

        {/* ── Team Wise Summary mode ── */}
        {visibleMode === 'team-wise-summary' && (
          <div className={modeExiting ? 'fs-summary-exit' : 'animate-fade-in'} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <TeamWiseSummaryOverlay
              players={players}
              teams={teams}
              tournament={tournament}
              filterTeamId={overlaySettings.teamWiseTeamId}
            />
          </div>
        )}

        {/* ── Team Wise Image mode ── */}
        {visibleMode === 'team-wise-image' && (
          <div className={modeExiting ? 'fs-summary-exit' : 'animate-fade-in'} style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <TeamWiseImageT1
              players={players}
              teams={teams}
              tournament={tournament}
              filterTeamId={overlaySettings.teamWiseTeamId}
            />
          </div>
        )}

        {/* ── Wheel Spin mode ── */}
        {visibleMode === 'wheel-spin' && wheelSpinData && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <WheelSpinOverlay data={wheelSpinData} />
          </div>
        )}

        {/* ── Player Card (SportyBlocks trading card) ── (standard + custom-ticker modes) */}
        {/* Large: centred between Base Price right=471 and Current Bid left=1019 → card left=555  */}
        {/* Small: centred between Base Price right=619 and Current Bid left=871  → card left=660  */}
        {/* Bottom=84 keeps card bottom flush with panel bottoms (996px), 10px above ticker (1006). */}
        {(visibleMode === 'standard' || visibleMode === 'custom-ticker') && !overlaySettings.hidePremiumCard && (
          <div
            style={{
              position: 'absolute',
              left:            overlaySettings.size === 'small' ? 660 : 555,
              bottom:          84,
              transform:       overlaySettings.size === 'small' ? 'scale(0.45)' : undefined,
              transformOrigin: overlaySettings.size === 'small' ? 'bottom left' : undefined,
            }}
          >
            <div key={playerKey} className="fs-player-enter">
              <PlayerCardOverlay
                currentPlayer={currentPlayer}
                tournament={tournament}
                auctionState={auctionState}
                teams={teams}
              />
            </div>
          </div>
        )}

        {/* ── Bid Info Panel ── (standard + custom-ticker modes) */}
        {/* Small: 60% scale, pills repositioned just above ticker */}
        {(visibleMode === 'standard' || visibleMode === 'custom-ticker') && !overlaySettings.hidePremiumCard && (
          <BidInfoPanel
            tournament={tournament}
            currentPlayer={currentPlayer}
            auctionState={auctionState}
            smallMode={overlaySettings.size === 'small'}
          />
        )}

        {/* ── Team Cards Panel ── (standard + custom-ticker modes) */}
        {(visibleMode === 'standard' || visibleMode === 'custom-ticker') && !overlaySettings.hideTeamCards && (
          <div style={{
            position: 'absolute',
            left: 1490,
            ...(overlaySettings.teamCardPosition === 'bottom-right'
              ? { bottom: 160, transformOrigin: 'bottom right' }
              : { top: 160, transformOrigin: 'top right' }),
            transform: overlaySettings.teamCardSize === 'small'  ? 'scale(0.65)'
                     : overlaySettings.teamCardSize === 'medium' ? 'scale(0.8)'
                     : 'scale(1)',
          }}>
            <TeamCardsPanel teams={teams} tournament={tournament} currentBid={auctionState.currentBid ?? 0} players={players} />
          </div>
        )}

        {/* ── Ticker component ── */}
        {!overlaySettings.hideTickerCustom && <TickerStrip
          soldPlayers={soldPlayers}
          players={players}
          teams={teams}
          tournament={tournament}
          mode={overlaySettings.tickerMode}
          customMode={visibleMode === 'custom-ticker'}
          customLine1={overlaySettings.customTickerLine1}
          customLine2={overlaySettings.customTickerLine2}
        />}

        {/* Leading Team Overlay */}
        {(visibleMode === 'standard' || visibleMode === 'custom-ticker') && (
          <LeadingBidsOverlay
            auctionState={auctionState}
            teams={teams}
            position={overlaySettings.soldMessagePosition ?? 'bottom-right'}
            isVisible={tournament?.biddingMode === 'team' && auctionState.currentAuctionStatus === 'Bidding' && !soldToast}
          />
        )}

        {/* Sold Message Toast */}
        {soldToast && (
          <SoldMessageToast
            player={soldToast.player}
            team={soldToast.team}
            finalPrice={soldToast.price}
            exiting={toastExiting}
            position={overlaySettings.soldMessagePosition ?? 'bottom-right'}
          />
        )}
      </div>
    </div>
  );
}
