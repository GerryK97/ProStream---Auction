'use client';

import React, { useEffect, useRef, useState } from 'react';
import OverlayWrapper from './OverlayWrapper';
import PremiumPlayerCardOverlay from './PremiumPlayerCardOverlay';
import SoldPlayersSummaryOverlay from './SoldPlayersSummaryOverlay';
import TeamSummaryOverlay from './TeamSummaryOverlay';
import RestingTimeOverlay from './RestingTimeOverlay';
import { AuctionState, Player, Team, Tournament } from '@/types';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import type { OverlaySettings } from './OverlayWrapper';

// ─── Ticker strip ─────────────────────────────────────────────────────────────

function TickerStrip({
  soldPlayers,
  players,
  teams,
  tournament,
  mode,
}: {
  soldPlayers: Player[];
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  mode: 'all' | 'sold' | 'available';
}) {
  const heading   = mode === 'sold'      ? 'SOLD PLAYERS'
                  : mode === 'available' ? 'AVAILABLE'
                  : 'ALL PLAYERS';
  const emptyText = mode === 'sold'      ? 'Waiting for players to be sold…'
                  : mode === 'available' ? 'No players available…'
                  : 'No players in tournament yet…';

  const nameStyle:   React.CSSProperties = { color: '#0d0d0d' };
  const detailStyle: React.CSSProperties = { color: 'rgba(0,0,0,0.48)' };
  const sepStyle:    React.CSSProperties = { color: '#222' };

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
      {/* Grey ticker bar */}
      <div
        style={{
          position: 'absolute',
          left: 230,
          top: 1006,
          width: 1690,
          height: 57,
          backgroundColor: '#D9D9D9',
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
        {hasItems ? (
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
              color: 'rgba(0,0,0,0.4)',
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
          background: 'linear-gradient(270deg, #6B72FF 0%, #222899 74%)',
          borderRadius: 28,
          border: '1.5px solid black',
        }}
      />

      {/* Heading text inside pill */}
      <div
        style={{
          position: 'absolute',
          left: 59,
          top: 1004.5,
          height: 61,
          lineHeight: '61px',
          color: '#FFC919',
          fontSize: 24,
          fontFamily: '"Coda Caption", cursive',
          fontWeight: 800,
          whiteSpace: 'nowrap',
        }}
      >
        {heading}
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
  if (!currentPlayer || tournament?.status !== 'Live') return null;

  const basePrice = getClassBasePrice(tournament, currentPlayer);
  const currentBid = auctionState.currentBid > 0 ? auctionState.currentBid : basePrice;

  const pillStyle: React.CSSProperties = {
    position: 'absolute',
    width:        smallMode ? 266 : 444,
    height:       smallMode ? 71  : 119,
    top:          smallMode ? 919 : 864,
    borderRadius: smallMode ? 10  : 16,
    gap:          smallMode ? 1   : 2,
    background: 'linear-gradient(135deg, #0f0c29, #302b63)',
    border: '1.5px solid rgba(255,255,255,0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const labelStyle: React.CSSProperties = {
    color: '#FFC919',
    fontSize: smallMode ? 11 : 18,
    fontFamily: '"Graduate", cursive',
    letterSpacing: 5,
    textTransform: 'uppercase',
    lineHeight: 1,
  };

  const valueStyle: React.CSSProperties = {
    color: '#ffffff',
    fontSize:      smallMode ? 37 : 62,
    fontFamily: '"Inconsolata", monospace',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: smallMode ? 2 : 4,
  };

  return (
    <>
      {/* Base Price */}
      <div style={{ ...pillStyle, left: smallMode ? 653 : 448 }}>
        <div style={labelStyle}>BASE PRICE</div>
        <div style={valueStyle}>{basePrice.toLocaleString('en-IN')}</div>
      </div>

      {/* Current Bid */}
      <div style={{ ...pillStyle, left: smallMode ? 1025 : 1068 }}>
        <div style={labelStyle}>CURRENT BID</div>
        <div style={valueStyle}>{currentBid.toLocaleString('en-IN')}</div>
      </div>
    </>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard({ team, tournament }: { team: Team; tournament: Tournament | null }) {
  const spent = (team.initialBudget ?? 0) - (team.currentBalance ?? 0);
  const balance = team.currentBalance ?? 0;
  const initial = team.initialBudget ?? 1;
  const barPct = Math.min(100, Math.max(0, (spent / initial) * 100));
  const playersBought = team.playersPurchased?.length ?? 0;
  const squadSize = tournament?.squadSize ?? '—';
  const initials = (team.shortCode || team.name).slice(0, 2).toUpperCase();

  return (
    <div style={{
      position: 'relative',
      width: 362,
      height: 136,
      background: 'linear-gradient(135deg, #0f0c29, #302b63)',
      borderRadius: 20,
      border: '1.5px solid rgba(255,255,255,0.15)',
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
          <span style={{ color: '#FFC919', fontSize: 36, fontFamily: '"Graduate", cursive', fontWeight: 700 }}>
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
        color: '#FFC919',
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
          background: barPct > 80 ? '#ff4444' : '#00C54C',
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
        color: '#ffffff',
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
        color: '#ffffff',
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
        color: '#ffffff',
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

function TeamCardsPanel({ teams, tournament }: { teams: Team[]; tournament: Tournament | null }) {
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
        position: 'absolute',
        left: 1490,
        top: 280,
        width: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'center',
      }}
    >
      {currentPage.map(team => (
        <TeamCard key={team._id} team={team} tournament={tournament} />
      ))}
    </div>
  );
}

// ─── Canvas content (1920×1080) ───────────────────────────────────────────────

function CustomOverlayContent({
  soldPlayers,
  teams,
  players,
  currentPlayer,
  tournament,
  auctionState,
  overlaySettings,
}: {
  soldPlayers: Player[];
  teams: Team[];
  players: Player[];
  currentPlayer: Player | undefined;
  tournament: Tournament | null;
  auctionState: AuctionState;
  overlaySettings: OverlaySettings;
}) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'transparent' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Concert+One&family=Coda+Caption:wght@800&family=Graduate&family=Inconsolata:wght@400;700&display=swap');
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
        {overlaySettings.displayMode === 'resting' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <RestingTimeOverlay tournament={tournament} />
          </div>
        )}

        {/* ── Sold Player Summary mode ── */}
        {overlaySettings.displayMode === 'sold-summary' && (
          <div style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <SoldPlayersSummaryOverlay
              players={players}
              teams={teams}
              tournament={tournament}
            />
          </div>
        )}

        {/* ── Team Summary mode ── */}
        {overlaySettings.displayMode === 'team-summary' && (
          <div style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <TeamSummaryOverlay
              teams={teams}
              tournament={tournament}
            />
          </div>
        )}

        {/* ── Premium Player Card ── (standard mode only) */}
        {/* Small: 45% scale, centered at x=960, just above bid panel */}
        {/* Large: original Figma slot left=713, top=237 */}
        {overlaySettings.displayMode === 'standard' && (
          <div style={{
            position: 'absolute',
            left:            overlaySettings.size === 'small' ? 849 : 713,
            top:             overlaySettings.size === 'small' ? 637 : 237,
            width: 494,
            height: 605,
            transform:       overlaySettings.size === 'small' ? 'scale(0.45)' : undefined,
            transformOrigin: overlaySettings.size === 'small' ? 'top left'    : undefined,
          }}>
            <PremiumPlayerCardOverlay
              currentPlayer={currentPlayer}
              tournament={tournament}
              teams={teams}
              cardSize="large"
              showStatsSection={false}
            />

            {/* ── SOLD stamp — sits on top of card, no layout changes ── */}
            {auctionState.currentAuctionStatus === 'Sold' && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div
                  className="animate-stamp-seal"
                  style={{
                    border: '7px solid #DC2626',
                    borderRadius: 14,
                    padding: '10px 30px',
                    background: 'rgba(220, 38, 38, 0.08)',
                    boxShadow: '0 0 0 3px rgba(220,38,38,0.25), inset 0 0 24px rgba(220,38,38,0.1)',
                  }}
                >
                  <span style={{
                    fontFamily: "'Bebas Neue', cursive",
                    fontSize: 100,
                    color: '#DC2626',
                    letterSpacing: 14,
                    lineHeight: 1,
                    display: 'block',
                    textShadow: '0 0 30px rgba(220,38,38,0.6)',
                  }}>
                    SOLD
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Bid Info Panel ── (standard mode only) */}
        {/* Small: 60% scale, pills repositioned just above ticker */}
        {overlaySettings.displayMode === 'standard' && (
          <BidInfoPanel
            tournament={tournament}
            currentPlayer={currentPlayer}
            auctionState={auctionState}
            smallMode={overlaySettings.size === 'small'}
          />
        )}

        {/* ── Team Cards Panel ── (standard mode only) */}
        {overlaySettings.displayMode === 'standard' && (
          <TeamCardsPanel teams={teams} tournament={tournament} />
        )}

        {/* ── Ticker component ── (always shown) */}
        <TickerStrip
          soldPlayers={soldPlayers}
          players={players}
          teams={teams}
          tournament={tournament}
          mode={overlaySettings.tickerMode}
        />
      </div>
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export default function CustomOverlay({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent">
      <OverlayWrapper tournamentId={tournamentId}>
        {({ soldPlayers, teams, players, currentPlayer, tournament, auctionState, overlaySettings }) => (
          <CustomOverlayContent
            soldPlayers={soldPlayers}
            teams={teams}
            players={players}
            currentPlayer={currentPlayer}
            tournament={tournament}
            auctionState={auctionState}
            overlaySettings={overlaySettings}
          />
        )}
      </OverlayWrapper>
    </div>
  );
}
