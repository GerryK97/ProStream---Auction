'use client';

import React, { useEffect, useRef, useState } from 'react';
import WheelSpinOverlay from '../WheelSpinOverlay';
import SoldPlayersSummaryT2 from './SoldPlayersSummaryT2';
import TeamSummaryT2 from './TeamSummaryT2';
import Top10SummaryT2 from './Top10SummaryT2';
import TeamWiseSummaryT2 from './TeamWiseSummaryT2';
import TeamWiseImageT2 from './TeamWiseImageT2';
import RestingTimeT2 from './RestingTimeT2';
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

// ─── Secondary image panel ─────────────────────────────────────────────────────

function SecondaryImagePanel({ currentPlayer, tournament, auctionState }: {
  currentPlayer: Player | undefined;
  tournament: Tournament | null;
  auctionState: AuctionState;
}) {
  const hasPlayer = !!currentPlayer;
  const isBidding = auctionState.currentAuctionStatus === 'Bidding';
  const basePrice = hasPlayer ? getClassBasePrice(tournament, currentPlayer!) : 0;
  const currentBid = auctionState.currentBid > 0 ? auctionState.currentBid : isBidding && hasPlayer ? basePrice : 0;
  const imageSrc = currentPlayer?.secondaryImageURL || currentPlayer?.photoURL || null;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
      {/* Secondary image — fills left */}
      <div style={{
        width: 1280, flexShrink: 0, position: 'relative',
        backgroundColor: '#f3f4f6',
        overflow: 'hidden',
      }}>
        {imageSrc ? (
          <img src={imageSrc} alt={currentPlayer?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'rgba(0,0,0,0.35)', fontSize: 16, letterSpacing: 4, textTransform: 'uppercase' }}>Waiting for player…</span>
          </div>
        )}
      </div>

      {/* Right info strip */}
      <div style={{
        flex: 1, padding: '48px 40px',
        display: 'flex', flexDirection: 'column', gap: 20,
        fontFamily: "'Varela Round', sans-serif",
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)' }}>
          {tournament?.name ?? 'Auction'}
        </div>
        <div style={{
          fontSize: 48, fontWeight: 700, color: '#111', lineHeight: 1,
          textTransform: 'uppercase',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {hasPlayer ? currentPlayer!.name : '—'}
        </div>
        <div style={{ height: 1, background: 'rgba(0,0,0,0.08)' }} />
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', marginBottom: 6 }}>Current Bid</div>
          <div style={{ fontSize: 52, fontWeight: 700, color: '#22c55e', lineHeight: 1 }}>
            {hasPlayer ? currentBid.toLocaleString('en-IN') : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', marginBottom: 6 }}>Base Price</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'rgba(0,0,0,0.45)', lineHeight: 1 }}>
            {hasPlayer ? basePrice.toLocaleString('en-IN') : '—'}
          </div>
        </div>
        {isBidding && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 't2LiveDot2 1.2s ease-in-out infinite' }} />
            <span style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)' }}>Live</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

const FullScreen2T2Content: React.FC<ContentProps> = ({
  soldPlayers, teams, players, currentPlayer, tournament,
  auctionState, overlaySettings, wheelSpinData,
}) => {
  const [scale, setScale] = useState(1);
  const settings: OverlaySettings = { ...overlaySettings, size: 'large' };

  const [activeMode, setActiveMode] = useState(settings.displayMode);
  const [fadingOut, setFadingOut] = useState(false);
  const prevModeRef = useRef(settings.displayMode);

  const [soldToast, setSoldToast] = useState<{ player: Player; team: Team; price: number } | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const incoming = settings.displayMode;
    const prev = prevModeRef.current;
    prevModeRef.current = incoming;
    if (prev === incoming) return;
    if (incoming === 'wheel-spin') { setActiveMode('wheel-spin'); return; }
    setFadingOut(true);
    const t = setTimeout(() => { setActiveMode(incoming); setFadingOut(false); }, 400);
    return () => clearTimeout(t);
  }, [settings.displayMode]);

  useEffect(() => {
    const up = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    up(); window.addEventListener('resize', up); return () => window.removeEventListener('resize', up);
  }, []);

  useEffect(() => {
    const status = auctionState.currentAuctionStatus;
    if (status === 'Sold' && prevStatusRef.current !== 'Sold') {
      const winTeam = teams.find(t => t._id === currentPlayer?.winningTeamId);
      const price = currentPlayer?.finalPrice ?? auctionState.currentBid;
      if (currentPlayer && winTeam) { setSoldToast({ player: currentPlayer, team: winTeam, price }); setToastExiting(false); }
    }
    prevStatusRef.current = status;
  }, [auctionState.currentAuctionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!soldToast) return;
    if (currentPlayer && currentPlayer._id !== soldToast.player._id) {
      setToastExiting(true);
      setTimeout(() => { setSoldToast(null); setToastExiting(false); }, 600);
    }
  }, [currentPlayer?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const SUMMARY = { position: 'absolute' as const, left: 100, top: 60, right: 100, bottom: 68, overflow: 'hidden' };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'transparent' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');
        @keyframes t2LiveDot2 {
          0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
        }
      `}</style>

      <div style={{
        width: 1920, height: 1080, position: 'absolute', top: 0, left: 0,
        transformOrigin: 'top left', transform: `scale(${scale})`,
        background: 'transparent',
      }}>
        {activeMode === 'wheel-spin' && wheelSpinData && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}><WheelSpinOverlay data={wheelSpinData} /></div>
        )}
        {activeMode === 'resting' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, opacity: fadingOut ? 0 : 1, transition: 'opacity 0.4s' }}>
            <RestingTimeT2 tournament={tournament} />
          </div>
        )}
        {activeMode === 'sold-summary' && (
          <div style={{ ...SUMMARY, opacity: fadingOut ? 0 : 1, transition: 'opacity 0.4s' }}>
            <SoldPlayersSummaryT2 players={players} teams={teams} tournament={tournament} isExiting={fadingOut} />
          </div>
        )}
        {activeMode === 'team-summary' && (
          <div style={{ ...SUMMARY, opacity: fadingOut ? 0 : 1, transition: 'opacity 0.4s' }}>
            <TeamSummaryT2 teams={teams} tournament={tournament} isExiting={fadingOut} />
          </div>
        )}
        {activeMode === 'top10-summary' && (
          <div style={{ ...SUMMARY, opacity: fadingOut ? 0 : 1, transition: 'opacity 0.4s' }}>
            <Top10SummaryT2 players={players} teams={teams} tournament={tournament} isExiting={fadingOut} />
          </div>
        )}
        {activeMode === 'team-wise-summary' && (
          <div style={{ ...SUMMARY, opacity: fadingOut ? 0 : 1, transition: 'opacity 0.4s' }}>
            <TeamWiseSummaryT2 players={players} teams={teams} tournament={tournament} filterTeamId={overlaySettings.teamWiseTeamId} isExiting={fadingOut} />
          </div>
        )}
        {activeMode === 'team-wise-image' && (
          <div style={{ ...SUMMARY, opacity: fadingOut ? 0 : 1, transition: 'opacity 0.4s' }}>
            <TeamWiseImageT2 players={players} teams={teams} tournament={tournament} filterTeamId={overlaySettings.teamWiseTeamId} isExiting={fadingOut} />
          </div>
        )}

        {(activeMode === 'standard' || activeMode === 'custom-ticker') && (
          <div key={currentPlayer?._id ?? 'none'} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 74, opacity: fadingOut ? 0 : 1, transition: 'opacity 0.4s' }}>
            <SecondaryImagePanel currentPlayer={currentPlayer} tournament={tournament} auctionState={auctionState} />
          </div>
        )}

        {!settings.hideTickerFullscreen && (
          <TickerT2Shared
            soldPlayers={soldPlayers} players={players} teams={teams} tournament={tournament}
            mode={settings.tickerMode}
            customMode={activeMode === 'custom-ticker'}
            customLine1={settings.customTickerLine1}
            customLine2={settings.customTickerLine2}
          />
        )}
      </div>
    </div>
  );
};

export default FullScreen2T2Content;
