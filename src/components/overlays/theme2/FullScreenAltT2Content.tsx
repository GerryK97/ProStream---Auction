'use client';

import React, { useEffect, useRef, useState } from 'react';
import WheelSpinOverlay from '../shared/WheelSpinOverlay';
import SoldPlayersSummaryT2 from './SoldPlayersSummaryT2';
import TeamSummaryT2 from './TeamSummaryT2';
import Top10SummaryT2 from './Top10SummaryT2';
import TeamWiseSummaryT2 from './TeamWiseSummaryT2';
import TeamWiseImageT2 from './TeamWiseImageT2';
import RestingTimeT2 from './RestingTimeT2';
import SoldMessageToast from '../shared/SoldMessageToast';
import ResilientImage from '../shared/ResilientImage';
import TickerT2Shared from './TickerT2Shared';
import { AuctionState, Player, Team, Tournament } from '@/types';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import type { OverlaySettings } from '../OverlayWrapper';
import type { WheelSpinEvent } from '@/types/pusher-events';

interface ContentProps {
  soldPlayers: Player[];
  teams: Team[];
  players: Player[];
  currentPlayer: Player | undefined;
  tournament: Tournament | null;
  auctionState: AuctionState;
  overlaySettings: OverlaySettings;
  wheelSpinData: WheelSpinEvent | null;
}

// ─── Full-screen background image panel ───────────────────────────────────────

function ImagePanel({ currentPlayer, tournament }: {
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
        alignItems: 'center', justifyContent: 'center', gap: 24,
      }}>
        <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="var(--t2-text-disabled)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
        <span style={{ color: 'var(--t2-text-disabled)', fontSize: 22, fontFamily: "'Varela Round', sans-serif", letterSpacing: 3, textTransform: 'uppercase' }}>
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
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 140,
          background: 'linear-gradient(to bottom, transparent 0%, var(--t2-bg-canvas) 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
      background: 'var(--overlay-bg-photo-fallback)',
    }}>
      {tournament?.logoURL ? (
        <ResilientImage src={tournament.logoURL} alt={tournament.name} style={{ width: 320, height: 320, objectFit: 'contain', opacity: 0.85 }} />
      ) : (
        <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="var(--t2-text-disabled)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
      )}
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

const FullScreenAltT2Content: React.FC<ContentProps> = ({
  soldPlayers, teams, players, currentPlayer, tournament,
  auctionState, overlaySettings, wheelSpinData,
}) => {
  const [scale, setScale] = useState(1);
  const settings: OverlaySettings = { ...overlaySettings, size: 'large' };

  // ── Mode transitions ──
  const [activeMode, setActiveMode] = useState(settings.displayMode);
  const [panelExiting, setPanelExiting] = useState(false);
  const [summaryExiting, setSummaryExiting] = useState(false);
  const prevModeRef = useRef(settings.displayMode);

  // ── Sold toast ──
  const [soldToast, setSoldToast] = useState<{ player: Player; team: Team; price: number } | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const prevStatusRef = useRef<string | null>(null);
  const toastTimersRef = useRef<{ exit: ReturnType<typeof setTimeout> | null; clear: ReturnType<typeof setTimeout> | null }>({ exit: null, clear: null });

  // ── Waiting-for-next-player ──
  const [waitingForNextPlayer, setWaitingForNextPlayer] = useState(false);
  const [waitingExiting, setWaitingExiting] = useState(false);
  const soldPlayerIdRef = useRef<string | undefined>(undefined);
  const waitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Bid pop animation ──
  const [bidPopping, setBidPopping] = useState(false);
  const prevBidRef = useRef(auctionState.currentBid);

  // Bid computation
  const isBidding = auctionState.currentAuctionStatus === 'Bidding';
  const hasPlayer = !!currentPlayer;
  const basePrice = hasPlayer ? getClassBasePrice(tournament, currentPlayer!) : 0;
  const currentBid = auctionState.currentBid > 0
    ? auctionState.currentBid
    : (isBidding && hasPlayer ? basePrice : 0);

  // ── Effects ──

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
    const incoming = settings.displayMode;
    const prev = prevModeRef.current;
    prevModeRef.current = incoming;
    if (prev === incoming) return;

    if (prev === 'standard' || prev === 'custom-ticker') {
      if (incoming === 'standard' || incoming === 'custom-ticker') { setActiveMode(incoming); return; }
      if (incoming === 'wheel-spin') { setActiveMode('wheel-spin'); return; }
      setPanelExiting(true);
      const t = setTimeout(() => { setActiveMode(incoming); setPanelExiting(false); }, 1500);
      return () => clearTimeout(t);
    } else if (prev === 'wheel-spin') {
      setSummaryExiting(true);
      const t = setTimeout(() => { setActiveMode(incoming); setSummaryExiting(false); }, 500);
      return () => clearTimeout(t);
    } else if (prev === 'sold-summary' || prev === 'team-summary' || prev === 'team-wise-summary' || prev === 'top10-summary' || prev === 'resting') {
      setSummaryExiting(true);
      const t = setTimeout(() => { setActiveMode(incoming); setSummaryExiting(false); }, 1800);
      return () => clearTimeout(t);
    } else {
      setActiveMode(incoming); setPanelExiting(false);
    }
  }, [settings.displayMode]);

  useEffect(() => {
    const up = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    up(); window.addEventListener('resize', up); return () => window.removeEventListener('resize', up);
  }, []);

  useEffect(() => {
    const status = auctionState.currentAuctionStatus;
    if (status === 'Sold' && prevStatusRef.current !== 'Sold') {
      const winningTeam = teams.find(t => t._id === currentPlayer?.winningTeamId);
      const price = currentPlayer?.finalPrice ?? (auctionState.currentBid || 0);
      if (currentPlayer && winningTeam) {
        if (toastTimersRef.current.exit) clearTimeout(toastTimersRef.current.exit);
        if (toastTimersRef.current.clear) clearTimeout(toastTimersRef.current.clear);
        if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
        soldPlayerIdRef.current = currentPlayer._id;
        setSoldToast({ player: currentPlayer, team: winningTeam, price });
        setToastExiting(false);
        setWaitingForNextPlayer(false);
        setWaitingExiting(false);
        toastTimersRef.current.exit  = setTimeout(() => setToastExiting(true), 4400);
        toastTimersRef.current.clear = setTimeout(() => { setSoldToast(null); setToastExiting(false); }, 5000);
        waitingTimerRef.current      = setTimeout(() => { setWaitingForNextPlayer(true); setWaitingExiting(false); }, 5000);
      }
    }
    prevStatusRef.current = status;
  }, [auctionState.currentAuctionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!soldToast && !waitingForNextPlayer) return;
    if (currentPlayer && currentPlayer._id !== soldPlayerIdRef.current) {
      if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
      if (waitingForNextPlayer) {
        setWaitingExiting(true);
        setTimeout(() => { setWaitingForNextPlayer(false); setWaitingExiting(false); }, 600);
      }
      if (soldToast) {
        if (toastTimersRef.current.exit)  clearTimeout(toastTimersRef.current.exit);
        if (toastTimersRef.current.clear) clearTimeout(toastTimersRef.current.clear);
        setSoldToast(null); setToastExiting(false);
      }
    }
  }, [currentPlayer?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (settings.displayMode === 'wheel-spin') {
      if (toastTimersRef.current.exit)  clearTimeout(toastTimersRef.current.exit);
      if (toastTimersRef.current.clear) clearTimeout(toastTimersRef.current.clear);
      setSoldToast(null); setToastExiting(false);
    }
  }, [settings.displayMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const SUMMARY_AREA = { position: 'absolute' as const, left: 100, top: 60, right: 100, bottom: 68, overflow: 'hidden' as const };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'transparent' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');

        @keyframes t2fs2PanelEnter {
          0%   { transform: scaleX(0)   scaleY(0.004); }
          28%  { transform: scaleX(1)   scaleY(0.004); }
          100% { transform: scaleX(1)   scaleY(1);     }
        }
        @keyframes t2fs2PanelExit {
          0%   { transform: scaleX(1)   scaleY(1);     }
          65%  { transform: scaleX(1)   scaleY(0.004); }
          100% { transform: scaleX(0)   scaleY(0.004); }
        }
        .t2fs2-panel-enter { animation: t2fs2PanelEnter 1.5s cubic-bezier(0.22,1,0.36,1) forwards; transform-origin: center center; }
        .t2fs2-panel-exit  { animation: t2fs2PanelExit  1.5s ease-in forwards;                      transform-origin: center center; }

        @keyframes t2fs2SummaryFadeOut {
          from { opacity: 1; transform: scale(1);    }
          to   { opacity: 0; transform: scale(0.97); }
        }
        .t2fs2-summary-exit { animation: t2fs2SummaryFadeOut 0.5s ease-in forwards; }

        @keyframes t2fs2BidPop {
          0%   { transform: scale(1);    }
          40%  { transform: scale(1.08); }
          100% { transform: scale(1);    }
        }
        .t2fs2-bid-pop { animation: t2fs2BidPop 0.3s ease-out forwards; }

        @keyframes t2fs2LiveDot {
          0%, 100% { opacity: 1;    transform: scale(1);    }
          50%      { opacity: 0.35; transform: scale(0.65); }
        }
        .t2fs2-live-dot { animation: t2fs2LiveDot 1.2s ease-in-out infinite; }

        @keyframes t2fs2BidCardPulse {
          0%, 100% { box-shadow: 0 8px 32px var(--t2-shadow-color); }
          50%      { box-shadow: 0 8px 32px var(--t2-shadow-color), 0 0 28px var(--t2-border-accent); }
        }
        .t2fs2-bid-active { animation: t2fs2BidCardPulse 1.5s ease-in-out infinite; }
      `}</style>

      {/* 1920×1080 canvas */}
      <div style={{
        width: 1920, height: 1080,
        position: 'absolute', top: 0, left: 0,
        transformOrigin: 'top left',
        transform: `scale(${scale})`,
        background: 'transparent',
      }}>

        {/* Resting */}
        {activeMode === 'resting' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <RestingTimeT2 tournament={tournament} />
          </div>
        )}

        {/* Sold summary */}
        {activeMode === 'sold-summary' && (
          <div className={summaryExiting ? 't2fs2-summary-exit' : ''} style={SUMMARY_AREA}>
            <SoldPlayersSummaryT2 players={players} teams={teams} tournament={tournament} isExiting={summaryExiting} />
          </div>
        )}

        {/* Team summary */}
        {activeMode === 'team-summary' && (
          <div className={summaryExiting ? 't2fs2-summary-exit' : ''} style={SUMMARY_AREA}>
            <TeamSummaryT2 teams={teams} tournament={tournament} isExiting={summaryExiting} />
          </div>
        )}

        {/* Top 10 */}
        {activeMode === 'top10-summary' && (
          <div className={summaryExiting ? 't2fs2-summary-exit' : ''} style={SUMMARY_AREA}>
            <Top10SummaryT2 players={players} teams={teams} tournament={tournament} isExiting={summaryExiting} />
          </div>
        )}

        {/* Team-wise summary */}
        {activeMode === 'team-wise-summary' && (
          <div className={summaryExiting ? 't2fs2-summary-exit' : ''} style={SUMMARY_AREA}>
            <TeamWiseSummaryT2 players={players} teams={teams} tournament={tournament} filterTeamId={overlaySettings.teamWiseTeamId} isExiting={summaryExiting} />
          </div>
        )}

        {/* Team-wise image */}
        {activeMode === 'team-wise-image' && (
          <div className={summaryExiting ? 't2fs2-summary-exit' : ''} style={SUMMARY_AREA}>
            <TeamWiseImageT2 players={players} teams={teams} tournament={tournament} filterTeamId={overlaySettings.teamWiseTeamId} isExiting={summaryExiting} />
          </div>
        )}

        {/* Wheel spin */}
        {activeMode === 'wheel-spin' && wheelSpinData && (
          <div className={summaryExiting ? 't2fs2-summary-exit' : ''} style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <WheelSpinOverlay data={wheelSpinData} />
          </div>
        )}

        {/* Standard / custom-ticker — image + bid card */}
        {(activeMode === 'standard' || activeMode === 'custom-ticker') && (
          <div
            key={currentPlayer?._id ?? 'no-player'}
            className={panelExiting ? 't2fs2-panel-exit' : 't2fs2-panel-enter'}
            style={{ position: 'absolute', inset: 0, transformOrigin: 'center center' }}
          >
            {/* Full-screen background image */}
            {!waitingForNextPlayer && (
              <ImagePanel currentPlayer={currentPlayer} tournament={tournament} />
            )}

            {/* Current Bid card — T2 white/gold, positioned by overlay settings */}
            <div
              className={isBidding ? 't2fs2-bid-active' : ''}
              style={{
                position: 'absolute',
                left: settings.bidCardLeft ?? 1576,
                top: settings.bidCardTop ?? 160,
                width: 300,
                backgroundColor: 'var(--t2-bg-card)',
                borderRadius: 5,
                overflow: 'hidden',
                boxShadow: '0 8px 32px var(--t2-shadow-color)',
                display: waitingForNextPlayer ? 'none' : 'flex',
                flexDirection: 'row',
                fontFamily: "'Varela Round', sans-serif",
                zIndex: 5,
              }}
            >
              {/* Accent left strip */}
              <div style={{ width: 5, flexShrink: 0, backgroundColor: 'var(--t2-accent)' }} />

              {/* Content */}
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '20px 16px', gap: 8,
              }}>
                <span style={{
                  fontSize: 13, letterSpacing: 2, textTransform: 'uppercase',
                  color: 'var(--t2-text-muted)',
                }}>
                  Current Bid
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    className={bidPopping ? 't2fs2-bid-pop' : ''}
                    style={{ fontSize: 56, fontWeight: 700, color: isBidding ? 'var(--t2-accent)' : 'var(--t2-text-primary)', lineHeight: 1 }}
                  >
                    {hasPlayer ? currentBid.toLocaleString('en-IN') : '—'}
                  </span>
                  {isBidding && (
                    <div className="t2fs2-live-dot" style={{
                      width: 10, height: 10, borderRadius: '50%',
                      backgroundColor: 'var(--t2-success)', flexShrink: 0,
                    }} />
                  )}
                </div>

                <div style={{ width: '60%', height: 1, backgroundColor: 'var(--t2-accent)', opacity: 0.5 }} />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{
                    fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
                    color: 'var(--t2-text-muted)',
                  }}>
                    Base
                  </span>
                  <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--t2-accent)', lineHeight: 1 }}>
                    {hasPlayer ? basePrice.toLocaleString('en-IN') : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ticker */}
        {!settings.hideTickerFullscreen && (
          <TickerT2Shared
            soldPlayers={soldPlayers} players={players} teams={teams} tournament={tournament}
            mode={settings.tickerMode}
            customMode={activeMode === 'custom-ticker'}
            customLine1={settings.customTickerLine1}
            customLine2={settings.customTickerLine2}
          />
        )}

        {/* Waiting for next player */}
        {waitingForNextPlayer && (activeMode === 'standard' || activeMode === 'custom-ticker') && (
          <div
            className={waitingExiting ? 't2fs2-summary-exit' : 'animate-fade-in'}
            style={{ position: 'absolute', inset: 0, zIndex: 6 }}
          >
            <RestingTimeT2 tournament={tournament} />
          </div>
        )}

        {/* Sold toast */}
        {soldToast && (
          <SoldMessageToast
            player={soldToast.player}
            team={soldToast.team}
            finalPrice={soldToast.price}
            exiting={toastExiting}
            position={settings.soldMessagePosition ?? 'bottom-right'}
          />
        )}
      </div>
    </div>
  );
};

export default FullScreenAltT2Content;
