'use client';

import React, { useEffect, useState } from 'react';
import OverlayWrapper from './OverlayWrapper';
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
        {hasItems ? (
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
  const currentBid = auctionState.currentBid > 0 ? auctionState.currentBid : (hasPlayer ? basePrice : 0);
  const isSold = auctionState.currentAuctionStatus === 'Sold';
  const isBidding = auctionState.currentAuctionStatus === 'Bidding';

  const classConfig = tournament?.playerClasses?.find(c => c.name === currentPlayer?.playerClass);
  const classColor = classConfig?.color ?? '#6B7280';

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    fontSize: 26,
    color: 'rgba(255,255,255,0.38)',
    fontFamily: '"Graduate", cursive',
    letterSpacing: 6,
    textTransform: 'uppercase',
    lineHeight: 1,
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: '"Inconsolata", monospace',
    fontSize: 50,
    color: '#e2e8f0',
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
          background: '#1a1f2e',
        }}
      >
        {hasPlayer && currentPlayer!.photoURL ? (
          <img
            src={currentPlayer!.photoURL}
            alt={currentPlayer!.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          />
        ) : (
          /* No-player placeholder */
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

        {/* SOLD stamp */}
        {isSold && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
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
                fontSize: 120,
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

      {/* ── Gold vertical accent bar ── */}
      <div style={{
        position: 'absolute',
        left: 855,
        top: 73,
        width: 5,
        height: 929,
        background: 'linear-gradient(180deg, #FFC919 0%, rgba(255,201,25,0.08) 100%)',
        borderRadius: 3,
      }} />

      {/* ── Right info panel ── */}

      {/* CURRENT BID label */}
      <div style={{ ...labelStyle, left: 880, top: 98, color: '#FFC919', fontSize: 22, letterSpacing: 8 }}>
        Current Bid
      </div>

      {/* Bid amount */}
      <div
        className={isBidding ? 'fs-bid-active' : ''}
        style={{
          position: 'absolute',
          left: 880,
          top: 132,
          fontFamily: '"Inconsolata", monospace',
          fontSize: 88,
          color: '#ffffff',
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: 4,
        }}
      >
        {hasPlayer ? currentBid.toLocaleString('en-IN') : '—'}
      </div>

      {/* Gold separator */}
      <div style={{
        position: 'absolute',
        left: 880,
        top: 238,
        width: 960,
        height: 3,
        background: 'linear-gradient(90deg, #FFC919 0%, rgba(255,201,25,0.08) 100%)',
        borderRadius: 2,
      }} />

      {/* Player Name */}
      <div style={{
        position: 'absolute',
        left: 880,
        top: 258,
        width: 960,
        fontFamily: '"Inconsolata", monospace',
        fontSize: 64,
        color: '#ffffff',
        fontWeight: 700,
        lineHeight: '80px',
        letterSpacing: 4,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {hasPlayer ? currentPlayer!.name : '—'}
      </div>

      {/* AGE row */}
      <div style={{ ...labelStyle, left: 880, top: 362 }}>Age</div>
      <div style={{ position: 'absolute', left: 880, top: 396, ...valueStyle }}>
        {hasPlayer ? (currentPlayer!.age ?? '—') : '—'}
      </div>

      {/* Thin divider */}
      <div style={{ position: 'absolute', left: 880, top: 476, width: 960, height: 1, background: 'rgba(255,255,255,0.07)' }} />

      {/* POSITION row */}
      <div style={{ ...labelStyle, left: 880, top: 498 }}>Position</div>
      <div style={{ position: 'absolute', left: 880, top: 532, ...valueStyle }}>
        {hasPlayer ? (currentPlayer!.position || '—') : '—'}
      </div>

      {/* Thin divider */}
      <div style={{ position: 'absolute', left: 880, top: 622, width: 960, height: 1, background: 'rgba(255,255,255,0.07)' }} />

      {/* CLASS row */}
      <div style={{ ...labelStyle, left: 880, top: 644 }}>Class</div>
      {hasPlayer && currentPlayer!.playerClass ? (
        <div style={{
          position: 'absolute',
          left: 880,
          top: 678,
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
        <div style={{ position: 'absolute', left: 880, top: 678, ...valueStyle }}>—</div>
      )}

      {/* Thin divider */}
      <div style={{ position: 'absolute', left: 880, top: 778, width: 960, height: 1, background: 'rgba(255,255,255,0.07)' }} />

      {/* BASE PRICE row */}
      <div style={{ ...labelStyle, left: 880, top: 840 }}>Base Price</div>
      <div style={{ position: 'absolute', left: 880, top: 874, ...valueStyle, color: '#FFC919' }}>
        {hasPlayer ? basePrice.toLocaleString('en-IN') : '—'}
      </div>

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

  // Always large — size control in AuctionControlPanel has no effect here
  const effectiveSettings: OverlaySettings = { ...overlaySettings, size: 'large' };

  useEffect(() => {
    const updateScale = () => {
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'linear-gradient(160deg, #0a0a14 0%, #111827 60%, #0d1117 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Concert+One&family=Coda+Caption:wght@800&family=Graduate&family=Inconsolata:wght@400;700&display=swap');
        @keyframes fullscreenTickerScroll {
          0%   { transform: translateY(-50%) translateX(0); }
          100% { transform: translateY(-50%) translateX(-50%); }
        }
        @keyframes bidActivePulse {
          0%, 100% { text-shadow: 0 0 0px #FFC919; }
          50%      { text-shadow: 0 0 40px #FFC919, 0 0 80px rgba(255,201,25,0.5), 0 0 120px rgba(255,201,25,0.2); }
        }
        .fs-bid-active { animation: bidActivePulse 1.5s ease-in-out infinite; }
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
          background: 'linear-gradient(160deg, #0a0a14 0%, #111827 60%, #0d1117 100%)',
        }}
      >
        {/* ── Resting Time mode ── */}
        {effectiveSettings.displayMode === 'resting' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <RestingTimeOverlay tournament={tournament} />
          </div>
        )}

        {/* ── Sold Player Summary mode ── */}
        {effectiveSettings.displayMode === 'sold-summary' && (
          <div style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <SoldPlayersSummaryOverlay
              players={players}
              teams={teams}
              tournament={tournament}
            />
          </div>
        )}

        {/* ── Team Summary mode ── */}
        {effectiveSettings.displayMode === 'team-summary' && (
          <div style={{ position: 'absolute', left: 160, top: 40, width: 1600, height: 940 }}>
            <TeamSummaryOverlay
              teams={teams}
              tournament={tournament}
            />
          </div>
        )}

        {/* ── New Player Auction Panel ── (standard mode) */}
        {effectiveSettings.displayMode === 'standard' && (
          <PlayerAuctionPanel
            currentPlayer={currentPlayer}
            tournament={tournament}
            auctionState={auctionState}
          />
        )}

        {/* ── Ticker strip ── (always shown) */}
        <TickerStrip
          soldPlayers={soldPlayers}
          players={players}
          teams={teams}
          tournament={tournament}
          mode={effectiveSettings.tickerMode}
        />
      </div>
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export default function FullScreenOverlay({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: 'linear-gradient(160deg, #0a0a14 0%, #111827 60%, #0d1117 100%)' }}>
      <OverlayWrapper tournamentId={tournamentId}>
        {({ soldPlayers, teams, players, currentPlayer, tournament, auctionState, overlaySettings }) => (
          <FullScreenOverlayContent
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
