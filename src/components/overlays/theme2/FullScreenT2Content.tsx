'use client';

import React, { useEffect, useRef, useState } from 'react';
import WheelSpinOverlay from '../WheelSpinOverlay';
import SoldPlayersSummaryT2 from './SoldPlayersSummaryT2';
import TeamSummaryT2 from './TeamSummaryT2';
import Top10SummaryT2 from './Top10SummaryT2';
import TeamWiseSummaryT2 from './TeamWiseSummaryT2';
import RestingTimeT2 from './RestingTimeT2';
import SoldMessageFullScreen from '../SoldMessageFullScreen';
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

// ─── Player panel ─────────────────────────────────────────────────────────────

function PlayerPanelT2({
  currentPlayer, tournament, auctionState,
}: {
  currentPlayer: Player | undefined;
  tournament: Tournament | null;
  auctionState: AuctionState;
}) {
  const hasPlayer = !!currentPlayer;
  const basePrice = hasPlayer ? getClassBasePrice(tournament, currentPlayer!) : 0;
  const isBidding = auctionState.currentAuctionStatus === 'Bidding';
  const isSold = auctionState.currentAuctionStatus === 'Sold';
  const currentBid = auctionState.currentBid > 0
    ? auctionState.currentBid
    : (isBidding && hasPlayer ? basePrice : 0);

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
  const classColor = classConfig?.color ?? '#E7C403';

  const photoUrl = hasPlayer ? (currentPlayer!.photoURL || tournament?.logoURL || '') : '';
  const dorsalText = hasPlayer && currentPlayer!.playerNo ? `#${currentPlayer!.playerNo}` : '';

  const ppf = tournament?.playerProfileFields;
  const fields: Array<{ label: string; value: string | number }> = [];
  if (ppf?.showAge) fields.push({ label: 'Age', value: hasPlayer ? (currentPlayer!.age ?? '—') : '—' });
  fields.push({ label: 'Position', value: hasPlayer ? (currentPlayer!.position || '—') : '—' });
  if (ppf?.showBattingStyle) fields.push({ label: 'Batting', value: hasPlayer ? (currentPlayer!.battingStyle || '—') : '—' });
  if (ppf?.showBowlingStyle) fields.push({ label: 'Bowling', value: hasPlayer ? (currentPlayer!.bowlingStyle || '—') : '—' });
  (ppf?.statFields ?? []).forEach(sf =>
    fields.push({ label: sf.label, value: hasPlayer ? ((currentPlayer!.stats as any)?.[sf.key] ?? '—') : '—' })
  );

  const nameLen = hasPlayer ? currentPlayer!.name.length : 0;
  const nameFontSize = nameLen > 20 ? 52 : nameLen > 14 ? 64 : 80;
  const valueFontSize = fields.length > 5 ? 22 : fields.length > 3 ? 26 : 30;

  // Card geometry — enclosed football card filling most of canvas
  const CARD_LEFT = 80, CARD_TOP = 60, CARD_W = 1762, CARD_H = 930;
  const PHOTO_W = 800; // left photo section

  return (
    <div style={{
      position: 'absolute',
      left: CARD_LEFT, top: CARD_TOP,
      width: CARD_W, height: CARD_H,
      borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.65), 0 8px 32px rgba(0,0,0,0.4)',
    }}>

      {/* ── Photo section ── */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, width: PHOTO_W, height: CARD_H,
        backgroundColor: '#111827',
      }}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={hasPlayer ? currentPlayer!.name : ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 22, fontFamily: "'Varela Round', sans-serif", letterSpacing: 3, textTransform: 'uppercase' }}>
              Waiting for player…
            </span>
          </div>
        )}

        {/* Bottom gradient for depth */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 300,
          background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Class badge — bottom left on photo */}
        {hasPlayer && currentPlayer!.playerClass && (
          <div style={{
            position: 'absolute', bottom: 32, left: 28,
            backgroundColor: classColor, color: '#fff',
            fontSize: 14, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
            padding: '9px 20px', borderRadius: 5,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}>
            {currentPlayer!.playerClass}
          </div>
        )}
      </div>

      {/* ── White right panel ── */}
      <div style={{
        position: 'absolute',
        left: PHOTO_W, top: 0, right: 0, bottom: 0,
        backgroundColor: 'white',
        zIndex: 1, overflow: 'hidden',
      }}>

        {/* Ghost jersey # watermark */}
        {dorsalText && (
          <div style={{
            position: 'absolute', top: -40, right: -10,
            color: '#E7C403', fontSize: 380, fontWeight: 700,
            lineHeight: 1, opacity: 0.07,
            userSelect: 'none', pointerEvents: 'none',
            fontFamily: "'Varela Round', sans-serif",
          }}>
            {dorsalText}
          </div>
        )}

        {/* Gold left accent bar */}
        <div style={{
          position: 'absolute', left: 0, top: 64, bottom: 64,
          width: 5, backgroundColor: '#E7C403', borderRadius: '0 3px 3px 0',
        }} />

        {/* Content — flex column layout */}
        <div style={{
          position: 'absolute',
          left: 80, right: 48, top: 44, bottom: 44,
          display: 'flex', flexDirection: 'column',
          fontFamily: "'Varela Round', sans-serif",
        }}>

          {/* Row 1: Jersey # (left) + LIVE pill (right) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            {dorsalText ? (
              <div style={{
                color: '#E7C403', fontSize: 42, fontWeight: 700,
                lineHeight: 1, letterSpacing: -1,
              }}>
                {dorsalText}
              </div>
            ) : <div />}
            {isBidding && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                backgroundColor: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 20, padding: '8px 18px',
              }}>
                <div className="t2fs-live-dot" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                <span style={{ fontSize: 11, letterSpacing: 3, color: '#22c55e', textTransform: 'uppercase', fontWeight: 700 }}>LIVE</span>
              </div>
            )}
          </div>

          {/* Player name */}
          <div style={{
            fontSize: nameFontSize, fontWeight: 700, color: '#111',
            textTransform: 'uppercase', lineHeight: 1.05,
            wordBreak: 'break-word', marginBottom: 18,
          }}>
            {hasPlayer ? currentPlayer!.name : '—'}
          </div>

          {/* Gold divider */}
          <div style={{ height: 3, backgroundColor: '#E7C403', borderRadius: 2, marginBottom: 22 }} />

          {/* Bid boxes — PlayerCardT2 style, scaled up */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 26 }}>

            {/* Base Price */}
            <div style={{
              flex: 1, padding: '16px 22px',
              backgroundColor: 'rgba(231,196,3,0.05)',
              border: '1px solid rgba(231,196,3,0.25)',
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 15, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>
                Base Price
              </div>
              <div style={{ fontSize: 38, fontWeight: 700, color: '#E7C403', lineHeight: 1 }}>
                {hasPlayer ? basePrice.toLocaleString('en-IN') : '—'}
              </div>
            </div>

            {/* Current Bid */}
            <div style={{
              flex: 2, padding: '16px 22px',
              backgroundColor: isBidding ? 'rgba(34,197,94,0.05)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${isBidding ? 'rgba(34,197,94,0.3)' : 'rgba(0,0,0,0.08)'}`,
              borderRadius: 10,
              transition: 'background-color 0.3s, border-color 0.3s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 15, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)' }}>Current Bid</span>
                {isBidding && <div className="t2fs-live-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e' }} />}
              </div>
              <div
                className={`${isBidding ? 't2fs-bid-active' : ''} ${bidPopping ? 't2fs-bid-pop' : ''}`}
                style={{
                  fontSize: 72, fontWeight: 700,
                  color: isBidding ? '#22c55e' : '#111',
                  lineHeight: 1,
                }}
              >
                {hasPlayer ? currentBid.toLocaleString('en-IN') : '—'}
              </div>
            </div>
          </div>

          {/* Stats grid — 2 columns, flex: 1 fills remaining space */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              {fields.map(f => (
                <div key={f.label} style={{ padding: '13px 0', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                  <div style={{ fontSize: 15, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 5 }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: valueFontSize, fontWeight: 700, color: '#111' }}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SOLD stamp — centered on white panel */}
        {isSold && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}>
            <div className="animate-stamp-seal" style={{
              border: '8px solid #ef4444', borderRadius: 16,
              padding: '14px 48px', background: 'rgba(239,68,68,0.06)',
            }}>
              <span style={{
                fontFamily: "'Varela Round', sans-serif",
                fontSize: 110, fontWeight: 700, color: '#ef4444',
                letterSpacing: 18, lineHeight: 1, display: 'block',
              }}>
                SOLD
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

const FullScreenT2Content: React.FC<ContentProps> = ({
  soldPlayers, teams, players, currentPlayer, tournament,
  auctionState, overlaySettings, wheelSpinData,
}) => {
  const [scale, setScale] = useState(1);
  const effectiveSettings: OverlaySettings = { ...overlaySettings, size: 'large' };

  const [activeMode, setActiveMode] = useState(effectiveSettings.displayMode);
  const [panelExiting, setPanelExiting] = useState(false);
  const [summaryExiting, setSummaryExiting] = useState(false);
  const prevModeRef = useRef(effectiveSettings.displayMode);

  const [soldToast, setSoldToast] = useState<{ player: Player; team: Team; price: number } | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const prevStatusRef = useRef<string | null>(null);
  const toastTimers = useRef<{ exit: ReturnType<typeof setTimeout> | null; clear: ReturnType<typeof setTimeout> | null }>({ exit: null, clear: null });

  useEffect(() => {
    const incoming = effectiveSettings.displayMode;
    const prev = prevModeRef.current;
    prevModeRef.current = incoming;
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
      const t = setTimeout(() => { setActiveMode(incoming); setPanelExiting(false); }, 1500);
      return () => clearTimeout(t);
    } else if (prev === 'sold-summary' || prev === 'team-summary' || prev === 'team-wise-summary' || prev === 'top10-summary' || prev === 'wheel-spin' || prev === 'resting') {
      setSummaryExiting(true);
      const t = setTimeout(() => { setActiveMode(incoming); setSummaryExiting(false); }, 1800);
      return () => clearTimeout(t);
    } else {
      setActiveMode(incoming);
      setPanelExiting(false);
    }
  }, [effectiveSettings.displayMode]);

  useEffect(() => {
    const updateScale = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const status = auctionState.currentAuctionStatus;
    if (status === 'Sold' && prevStatusRef.current !== 'Sold') {
      const winningTeam = teams.find(t => t._id === currentPlayer?.winningTeamId);
      const price = currentPlayer?.finalPrice ?? (auctionState.currentBid || 0);
      if (currentPlayer && winningTeam) {
        if (toastTimers.current.exit) clearTimeout(toastTimers.current.exit);
        if (toastTimers.current.clear) clearTimeout(toastTimers.current.clear);
        setSoldToast({ player: currentPlayer, team: winningTeam, price });
        setToastExiting(false);
      }
    }
    prevStatusRef.current = status;
  }, [auctionState.currentAuctionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!soldToast) return;
    if (currentPlayer && currentPlayer._id !== soldToast.player._id) {
      if (toastTimers.current.exit) clearTimeout(toastTimers.current.exit);
      if (toastTimers.current.clear) clearTimeout(toastTimers.current.clear);
      setToastExiting(true);
      toastTimers.current.clear = setTimeout(() => { setSoldToast(null); setToastExiting(false); }, 600);
    }
  }, [currentPlayer?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (effectiveSettings.displayMode === 'wheel-spin') {
      if (toastTimers.current.exit) clearTimeout(toastTimers.current.exit);
      if (toastTimers.current.clear) clearTimeout(toastTimers.current.clear);
      setSoldToast(null);
      setToastExiting(false);
    }
  }, [effectiveSettings.displayMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const SUMMARY_AREA = { position: 'absolute' as const, left: 100, top: 60, right: 100, bottom: 68, overflow: 'hidden' as const };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'linear-gradient(160deg, #0a0a14 0%, #111827 60%, #0d1117 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Concert+One&family=Coda+Caption:wght@800&family=Graduate&family=Inconsolata:wght@400;700&family=Rajdhani:wght@500;600;700&family=Varela+Round&display=swap');
        @keyframes t2fsBidActivePulse {
          0%, 100% { text-shadow: 0 0 0px #22c55e; }
          50%      { text-shadow: 0 0 40px #22c55e, 0 0 80px rgba(34,197,94,0.5), 0 0 120px rgba(34,197,94,0.2); }
        }
        .t2fs-bid-active { animation: t2fsBidActivePulse 1.5s ease-in-out infinite; }
        @keyframes t2fsLiveDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.35; transform: scale(0.65); }
        }
        .t2fs-live-dot { animation: t2fsLiveDotPulse 1.2s ease-in-out infinite; }
        @keyframes t2fsPlayerPanelEnter {
          0%   { transform: scaleX(0)   scaleY(0.004); }
          28%  { transform: scaleX(1)   scaleY(0.004); }
          100% { transform: scaleX(1)   scaleY(1);     }
        }
        @keyframes t2fsPlayerPanelExit {
          0%   { transform: scaleX(1)   scaleY(1);     }
          65%  { transform: scaleX(1)   scaleY(0.004); }
          100% { transform: scaleX(0)   scaleY(0.004); }
        }
        .t2fs-panel-enter {
          animation: t2fsPlayerPanelEnter 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: center center;
        }
        .t2fs-panel-exit {
          animation: t2fsPlayerPanelExit 1.5s ease-in forwards;
          transform-origin: center center;
        }
        @keyframes t2fsBidValuePop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .t2fs-bid-pop { animation: t2fsBidValuePop 0.3s ease-out forwards; }
        @keyframes t2fsSummaryFadeOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.97); }
        }
        .t2fs-summary-exit { animation: t2fsSummaryFadeOut 0.5s ease-in forwards; }
      `}</style>

      {/* 1920×1080 canvas */}
      <div style={{
        width: 1920, height: 1080,
        position: 'absolute', top: 0, left: 0,
        transformOrigin: 'top left',
        transform: `scale(${scale})`,
        background: 'var(--overlay-bg-fullscreen)',
      }}>
        {/* Resting */}
        {activeMode === 'resting' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <RestingTimeT2 tournament={tournament} />
          </div>
        )}

        {/* Sold summary */}
        {activeMode === 'sold-summary' && (
          <div className={summaryExiting ? 't2fs-summary-exit' : ''} style={SUMMARY_AREA}>
            <SoldPlayersSummaryT2 players={players} teams={teams} tournament={tournament} isExiting={summaryExiting} />
          </div>
        )}

        {/* Team summary */}
        {activeMode === 'team-summary' && (
          <div className={summaryExiting ? 't2fs-summary-exit' : ''} style={SUMMARY_AREA}>
            <TeamSummaryT2 teams={teams} tournament={tournament} isExiting={summaryExiting} />
          </div>
        )}

        {/* Top 10 summary */}
        {activeMode === 'top10-summary' && (
          <div className={summaryExiting ? 't2fs-summary-exit' : ''} style={SUMMARY_AREA}>
            <Top10SummaryT2 players={players} teams={teams} tournament={tournament} isExiting={summaryExiting} />
          </div>
        )}

        {/* Team-wise summary */}
        {activeMode === 'team-wise-summary' && (
          <div className={summaryExiting ? 't2fs-summary-exit' : ''} style={SUMMARY_AREA}>
            <TeamWiseSummaryT2
              players={players} teams={teams} tournament={tournament}
              filterTeamId={overlaySettings.teamWiseTeamId}
              isExiting={summaryExiting}
            />
          </div>
        )}

        {/* Wheel spin */}
        {activeMode === 'wheel-spin' && wheelSpinData && (
          <div className={summaryExiting ? 't2fs-summary-exit' : ''} style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <WheelSpinOverlay data={wheelSpinData} />
          </div>
        )}

        {/* Player auction panel */}
        {(activeMode === 'standard' || activeMode === 'custom-ticker') && (
          <div
            key={currentPlayer?._id ?? 'no-player'}
            className={panelExiting ? 't2fs-panel-exit' : 't2fs-panel-enter'}
            style={{ position: 'absolute', inset: 0, transformOrigin: 'center center' }}
          >
            <PlayerPanelT2
              currentPlayer={currentPlayer}
              tournament={tournament}
              auctionState={auctionState}
            />
          </div>
        )}

        {/* Ticker */}
        {!effectiveSettings.hideTickerFullscreen && (
          <TickerT2Shared
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

        {/* Full-screen sold message */}
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
};

export default FullScreenT2Content;
