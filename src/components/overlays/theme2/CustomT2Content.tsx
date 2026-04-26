'use client';

import React, { useEffect, useRef, useState } from 'react';
import WheelSpinOverlay from '../WheelSpinOverlay';
import PlayerCardT2 from './PlayerCardT2';
import CurrentBidT2 from './CurrentBidT2';
import SoldPlayersSummaryT2 from './SoldPlayersSummaryT2';
import TeamSummaryT2 from './TeamSummaryT2';
import Top10SummaryT2 from './Top10SummaryT2';
import TeamWiseSummaryT2 from './TeamWiseSummaryT2';
import TeamWiseImageT2 from './TeamWiseImageT2';
import RestingTimeT2 from './RestingTimeT2';
import SoldMessageToast from '../SoldMessageToast';
import TickerT2Shared from './TickerT2Shared';
import { AuctionState, Player, Team, Tournament } from '@/types';
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

// ─── Size config for TeamCardT2 ───────────────────────────────────────────────

const T2_CARD_SIZES = {
  small: {
    panelWidth:       210,
    logoSize:         38,
    logoRadius:       6,
    strip:            3,
    padding:          '8px 10px' as const,
    headerGap:        8,
    headerMb:         6,
    nameFontSize:     11,
    codeFontSize:     9,
    dividerMb:        6,
    labelFontSize:    7,
    valueFontSize:    15,
    metricMb:         6,
    vertDivMargin:    '0 9px' as const,
    squadDividerMb:   5,
    squadGap:         4,
    squadValueFs:     11,
    squadMutedFs:     9,
    squadLabelFs:     7,
    pageGap:          6,
  },
  medium: {
    panelWidth:       255,
    logoSize:         46,
    logoRadius:       7,
    strip:            4,
    padding:          '9px 11px' as const,
    headerGap:        9,
    headerMb:         7,
    nameFontSize:     12,
    codeFontSize:     10,
    dividerMb:        6,
    labelFontSize:    7,
    valueFontSize:    17,
    metricMb:         6,
    vertDivMargin:    '0 11px' as const,
    squadDividerMb:   5,
    squadGap:         4,
    squadValueFs:     12,
    squadMutedFs:     10,
    squadLabelFs:     7,
    pageGap:          7,
  },
  large: {
    panelWidth:       300,
    logoSize:         54,
    logoRadius:       8,
    strip:            4,
    padding:          '10px 12px' as const,
    headerGap:        10,
    headerMb:         8,
    nameFontSize:     13,
    codeFontSize:     11,
    dividerMb:        7,
    labelFontSize:    11,
    valueFontSize:    23,
    metricMb:         7,
    vertDivMargin:    '0 12px' as const,
    squadDividerMb:   6,
    squadGap:         5,
    squadValueFs:     17,
    squadMutedFs:     14,
    squadLabelFs:     11,
    pageGap:          8,
  },
} as const;

type T2CardSize = keyof typeof T2_CARD_SIZES;

// ─── Redesigned team cards — White & Gold (PlayerCardT2 aesthetic) ────────────

function TeamCardT2({ team, tournament, currentBid, players, size = 'large' }: {
  team: Team;
  tournament: Tournament | null;
  currentBid: number;
  players: Player[];
  size?: T2CardSize;
}) {
  const cfg = T2_CARD_SIZES[size];
  const balance = team.currentBalance ?? team.initialBudget ?? 0;
  const playerCount = players.filter(p => p.isSold && p.winningTeamId === team._id).length;
  const squadSize = tournament?.squadSize ?? 0;
  const basePPP = tournament?.basePricePerPlayer ?? 0;
  const remaining = squadSize - playerCount;
  const maxBid = remaining <= 1
    ? balance
    : Math.max(0, balance - (remaining - 1) * basePPP);
  const isExceeded = currentBid > 0 && currentBid > maxBid;

  const fmt = (n: number) =>
    n >= 100000 ? `${(n / 100000).toFixed(1)}L`
    : n >= 1000  ? `${(n / 1000).toFixed(0)}K`
    : `${n}`;

  const GOLD  = '#E7C403';
  const GREEN = '#22c55e';
  const RED   = '#ef4444';
  const MUTED = 'rgba(0,0,0,0.4)';
  const METRIC_LABEL = 'rgba(0,0,0,0.8)';

  return (
    <div style={{
      width: '100%',
      background: '#ffffff',
      borderRadius: 8,
      border: isExceeded ? `1.5px solid ${RED}` : '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      fontFamily: "'Varela Round', sans-serif",
      overflow: 'hidden',
      display: 'flex',
      transition: 'border 0.3s',
    }}>
      {/* Gold left accent strip */}
      <div style={{ width: cfg.strip, background: GOLD, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: cfg.padding }}>
        {/* Header: logo block left, name + shortcode stacked right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: cfg.headerGap, marginBottom: cfg.headerMb }}>
          {/* Logo block */}
          <div style={{
            width: cfg.logoSize, height: cfg.logoSize,
            borderRadius: cfg.logoRadius,
            border: '1px solid rgba(231,196,3,0.3)',
            background: 'rgba(231,196,3,0.05)',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {team.logoURL ? (
              <img src={team.logoURL} alt={team.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: cfg.codeFontSize + 1, fontWeight: 700, color: GOLD }}>
                {team.shortCode?.slice(0, 2)}
              </span>
            )}
          </div>
          {/* Name + shortcode stacked */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: cfg.nameFontSize, fontWeight: 700, color: '#111',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {team.name}
            </div>
            <div style={{ fontSize: cfg.codeFontSize + 2, color: 'rgba(0,0,0,0.8)', marginTop: 2 }}>
              {team.shortCode}
            </div>
          </div>
        </div>

        {/* Gold divider */}
        <div style={{ height: 1, background: 'rgba(231,196,3,0.28)', marginBottom: cfg.dividerMb }} />

        {/* Metrics row: Balance | MaxBid */}
        <div style={{ display: 'flex', marginBottom: cfg.metricMb }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: cfg.labelFontSize, color: METRIC_LABEL, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
              Balance
            </div>
            <div style={{ fontSize: cfg.valueFontSize, fontWeight: 700, color: GREEN, lineHeight: 1 }}>
              {fmt(balance)}
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(0,0,0,0.07)', margin: cfg.vertDivMargin }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: cfg.labelFontSize, color: METRIC_LABEL, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
              Max Bid
            </div>
            <div style={{ fontSize: cfg.valueFontSize, fontWeight: 700, color: isExceeded ? RED : GOLD, lineHeight: 1 }}>
              {fmt(maxBid)}
            </div>
          </div>
        </div>

        {/* Subtle gold divider */}
        <div style={{ height: 1, background: 'rgba(231,196,3,0.18)', marginBottom: cfg.squadDividerMb }} />

        {/* Squad row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: cfg.squadGap }}>
          <span style={{ fontSize: cfg.squadLabelFs, color: '#000', textTransform: 'uppercase', letterSpacing: 1, textShadow: 'none' }}>Squad</span>
          <span style={{ fontSize: cfg.squadValueFs, fontWeight: 700, color: '#000', textShadow: 'none' }}>{playerCount}</span>
          <span style={{ fontSize: cfg.squadMutedFs, color: '#000', textShadow: 'none' }}>/ {squadSize}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Paginated team cards panel ───────────────────────────────────────────────

const PAGE_SIZE = 4;

function TeamCardsPanelT2({ teams, tournament, currentBid, players, size = 'large' }: {
  teams: Team[];
  tournament: Tournament | null;
  currentBid: number;
  players: Player[];
  size?: T2CardSize;
}) {
  const cfg = T2_CARD_SIZES[size];
  const pages = Math.ceil(teams.length / PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(0);
  const [animState, setAnimState] = useState<'idle' | 'exit' | 'enter'>('idle');
  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (teams.length <= PAGE_SIZE) return;
    const interval = setInterval(() => {
      setAnimState('exit');
      t1.current = setTimeout(() => {
        setPageIndex(p => (p + 1) % pages);
        setAnimState('enter');
        t2.current = setTimeout(() => setAnimState('idle'), 320);
      }, 220);
    }, 5000);
    return () => {
      clearInterval(interval);
      if (t1.current) clearTimeout(t1.current);
      if (t2.current) clearTimeout(t2.current);
    };
  }, [teams.length, pages]);

  const page = teams.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);

  const animStyle: React.CSSProperties =
    animState === 'exit'  ? { animation: 't2CardsExit  0.22s ease-in  forwards' } :
    animState === 'enter' ? { animation: 't2CardsEnter 0.32s ease-out forwards' } :
    {};

  return (
    <div style={{ width: cfg.panelWidth, display: 'flex', flexDirection: 'column', gap: cfg.pageGap, overflow: 'hidden' }}>
      <style>{`
        @keyframes t2CardsExit  { from { opacity:1; transform:translateY(0);     } to { opacity:0; transform:translateY(-18px); } }
        @keyframes t2CardsEnter { from { opacity:0; transform:translateY(18px);  } to { opacity:1; transform:translateY(0);     } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: cfg.pageGap, ...animStyle }}>
        {page.map(team => (
          <TeamCardT2
            key={team._id}
            team={team}
            tournament={tournament}
            currentBid={currentBid}
            players={players}
            size={size}
          />
        ))}
      </div>

      {/* Page indicator dots */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingTop: 2 }}>
          {Array.from({ length: pages }).map((_, i) => (
            <div key={i} style={{
              width: i === pageIndex ? 14 : 5,
              height: 5,
              borderRadius: 3,
              background: i === pageIndex ? '#E7C403' : 'rgba(0,0,0,0.18)',
              transition: 'width 0.3s ease, background 0.3s ease',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

const CustomT2Content: React.FC<ContentProps> = ({
  soldPlayers, teams, players, currentPlayer, tournament,
  auctionState, overlaySettings, wheelSpinData,
}) => {
  const [scale, setScale] = useState(1);

  const [visibleMode, setVisibleMode] = useState(overlaySettings.displayMode);
  const prevModeRef = useRef(overlaySettings.displayMode);

  const [soldToast, setSoldToast] = useState<{ player: Player; team: Team; price: number } | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const prevStatusRef = useRef<string | null>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const prevPlayerIdRef = useRef<string | null>(null);

  useEffect(() => {
    const incoming = overlaySettings.displayMode;
    if (incoming !== prevModeRef.current) { prevModeRef.current = incoming; setVisibleMode(incoming); }
  }, [overlaySettings.displayMode]);

  useEffect(() => {
    if (currentPlayer?._id && currentPlayer._id !== prevPlayerIdRef.current) {
      setPlayerKey(k => k + 1);
      prevPlayerIdRef.current = currentPlayer._id;
    }
  }, [currentPlayer?._id]);

  useEffect(() => {
    const up = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    up(); window.addEventListener('resize', up); return () => window.removeEventListener('resize', up);
  }, []);

  useEffect(() => {
    const status = auctionState.currentAuctionStatus;
    if (status === 'Sold' && prevStatusRef.current !== 'Sold') {
      const winTeam = teams.find(t => t._id === currentPlayer?.winningTeamId);
      const price = currentPlayer?.finalPrice ?? auctionState.currentBid;
      if (currentPlayer && winTeam) {
        setSoldToast({ player: currentPlayer, team: winTeam, price });
        setToastExiting(false);
        const exit = setTimeout(() => setToastExiting(true), 4400);
        const clear = setTimeout(() => { setSoldToast(null); setToastExiting(false); }, 5000);
        return () => { clearTimeout(exit); clearTimeout(clear); };
      }
    }
    prevStatusRef.current = status;
  }, [auctionState.currentAuctionStatus, auctionState.currentBid, currentPlayer, teams]);

  const SUMMARY = { position: 'absolute' as const, left: 160, top: 40, width: 1600, height: 940 };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'transparent' }}>
      <style>{`
        @keyframes t2cLiveDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      <div style={{
        width: 1920, height: 1080, position: 'absolute', top: 0, left: 0,
        transformOrigin: 'top left', transform: `scale(${scale})`,
      }}>
        {/* Summary modes */}
        {visibleMode === 'resting' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <RestingTimeT2 tournament={tournament} />
          </div>
        )}
        {visibleMode === 'sold-summary' && (
          <div style={SUMMARY}><SoldPlayersSummaryT2 players={players} teams={teams} tournament={tournament} /></div>
        )}
        {visibleMode === 'team-summary' && (
          <div style={SUMMARY}><TeamSummaryT2 teams={teams} tournament={tournament} /></div>
        )}
        {visibleMode === 'top10-summary' && (
          <div style={SUMMARY}><Top10SummaryT2 players={players} teams={teams} tournament={tournament} /></div>
        )}
        {visibleMode === 'team-wise-summary' && (
          <div style={SUMMARY}>
            <TeamWiseSummaryT2 players={players} teams={teams} tournament={tournament} filterTeamId={overlaySettings.teamWiseTeamId} />
          </div>
        )}
        {visibleMode === 'team-wise-image' && (
          <div style={SUMMARY}>
            <TeamWiseImageT2 players={players} teams={teams} tournament={tournament} filterTeamId={overlaySettings.teamWiseTeamId} />
          </div>
        )}
        {visibleMode === 'wheel-spin' && wheelSpinData && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <WheelSpinOverlay data={wheelSpinData} />
          </div>
        )}

        {/* Standard / custom-ticker mode */}
        {(visibleMode === 'standard' || visibleMode === 'custom-ticker') && (
          <>
            {/* Player card + Current Bid card */}
            {(() => {
              const isSmall = overlaySettings.size === 'small';
              const cardSize = isSmall ? 'small' : 'medium';
              const containerWidth = isSmall ? 444 : 600;
              const cardHeight = isSmall ? 210 : 284;
              const halfWidth = containerWidth / 2;
              const GAP = 16;
              const bidPos = overlaySettings.bidCardPosition ?? 'top';
              const showPlayerArea = !overlaySettings.hidePremiumCard;

              if (!showPlayerArea) return null;

              if (bidPos === 'top') {
                return (
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bottom: 84,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <CurrentBidT2
                      auctionState={auctionState}
                      teams={teams}
                      tournament={tournament}
                      currentPlayer={currentPlayer}
                      size={cardSize}
                      orientation="horizontal"
                    />
                    <div style={{ width: containerWidth, height: cardHeight }}>
                      <PlayerCardT2
                        currentPlayer={currentPlayer}
                        tournament={tournament}
                        auctionState={auctionState}
                        size={cardSize}
                        position="center"
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bottom: 84,
                  display: 'flex',
                  flexDirection: bidPos === 'left' ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: GAP,
                }}>
                  <div style={{ width: containerWidth, height: cardHeight, flexShrink: 0 }}>
                    <PlayerCardT2
                      currentPlayer={currentPlayer}
                      tournament={tournament}
                      auctionState={auctionState}
                      size={cardSize}
                      position="center"
                    />
                  </div>
                  <CurrentBidT2
                    auctionState={auctionState}
                    teams={teams}
                    tournament={tournament}
                    currentPlayer={currentPlayer}
                    size={cardSize}
                    orientation="vertical"
                  />
                </div>
              );
            })()}

            {/* Team cards — right-side positioning, intrinsic size */}
            {!overlaySettings.hideTeamCards && (
              <div style={{
                position: 'absolute',
                right: 60,
                ...(overlaySettings.teamCardPosition === 'bottom-right' ? { bottom: 84 } : { top: 60 }),
              }}>
                <TeamCardsPanelT2
                  teams={teams}
                  tournament={tournament}
                  currentBid={auctionState.currentBid}
                  players={players}
                  size={overlaySettings.teamCardSize ?? 'large'}
                />
              </div>
            )}
          </>
        )}

        {/* Ticker */}
        {!overlaySettings.hideTickerCustom && (
          <TickerT2Shared
            soldPlayers={soldPlayers} players={players} teams={teams} tournament={tournament}
            mode={overlaySettings.tickerMode}
            customMode={visibleMode === 'custom-ticker'}
            customLine1={overlaySettings.customTickerLine1}
            customLine2={overlaySettings.customTickerLine2}
          />
        )}

        {/* Sold message toast */}
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
};

export default CustomT2Content;
