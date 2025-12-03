'use client';

import React, { useEffect, useState } from 'react';
import type { AuctionState, Player, Team, Tournament } from '@/types';
import PlayerShowcase from '@/components/overlays/auction-overview/PlayerShowcase';
import { imageOptimizers } from '@/lib/imageOptimization';
import { getFormattedBasePrice } from '@/lib/playerClassUtils';
import BackgroundEffects from '@/components/overlays/auction-overview/BackgroundEffects';
import TeamsOverviewFlip from '@/components/overlays/auction-overview/TeamsOverviewFlip';
import SoldPlayersFlip from '@/components/overlays/auction-overview/SoldPlayersFlip';

interface PlayerHighlightLEDPremiumProps {
  tournament: Tournament | null;
  auctionState: AuctionState;
  currentPlayer: Player | undefined;
  teams: Team[];
  soldPlayers: Player[];
  showBackground?: boolean;
  spotlightDuration?: number;
  showTeams?: boolean;
  showSoldFlip?: boolean;
  soldItemsPerPage?: number;
  soldFlipDuration?: number;
  // Premium customization props
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  bidColor?: string;
}

const PlayerHighlightLEDPremium: React.FC<PlayerHighlightLEDPremiumProps> = ({
  tournament,
  auctionState,
  currentPlayer,
  teams,
  soldPlayers,
  showBackground = true,
  spotlightDuration = 4500,
  showTeams = true,
  showSoldFlip = true,
  soldItemsPerPage = 5,
  soldFlipDuration = 8000,
  accentColor = '#f59e0b',
  backgroundColor = 'rgba(15, 23, 42, 0.95)',
  textColor = '#f1f5f9',
  bidColor = '#fbbf24',
}) => {
  const [lastPlayerId, setLastPlayerId] = useState<string | null>(null);
  const [showSpotlight, setShowSpotlight] = useState(false);

  useEffect(() => {
    if (currentPlayer?._id && currentPlayer._id !== lastPlayerId) {
      setLastPlayerId(currentPlayer._id);
      setShowSpotlight(true);
    }
  }, [currentPlayer?._id, lastPlayerId]);

  useEffect(() => {
    if (!showSpotlight) return;
    const timer = setTimeout(() => setShowSpotlight(false), spotlightDuration);
    return () => clearTimeout(timer);
  }, [showSpotlight, spotlightDuration]);

  const status = auctionState.currentAuctionStatus;

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: 'rgb(10, 10, 15)' }}>
      {showBackground && <BackgroundEffects theme="premium" showBackground />}

      {/* Premium decorative corners */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 opacity-30 z-0" style={{ borderColor: accentColor }} />
      <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 opacity-30 z-0" style={{ borderColor: accentColor }} />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 opacity-30 z-0" style={{ borderColor: accentColor }} />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 opacity-30 z-0" style={{ borderColor: accentColor }} />

      {/* Base layout */}
      <div className="relative z-10 flex h-full flex-col gap-6 p-6">
        <header className="rounded-3xl border shadow-2xl p-6 backdrop-blur-lg" style={{
          borderColor: `${accentColor}40`,
          background: `linear-gradient(135deg, ${backgroundColor}, rgba(0, 0, 0, 0.8))`
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] font-semibold" style={{ color: accentColor }}>
                Live Auction
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-wide" style={{
                color: textColor,
                textShadow: `0 0 30px ${accentColor}50`
              }}>
                {tournament?.name || 'Player Highlight LED Premium'}
              </h1>
              <p className="text-sm mt-1" style={{ color: `${textColor}cc` }}>Powered by ProStream</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.5em]" style={{ color: `${textColor}99` }}>Status</p>
              <div className="mt-2 px-6 py-3 rounded-2xl font-bold text-2xl shadow-lg" style={{
                background: status === 'Bidding'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : status === 'Sold'
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                boxShadow: status === 'Bidding'
                  ? '0 10px 40px rgba(16, 185, 129, 0.4)'
                  : status === 'Sold'
                  ? '0 10px 40px rgba(239, 68, 68, 0.4)'
                  : '0 10px 40px rgba(245, 158, 11, 0.4)'
              }}>
                {status}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-3xl border overflow-hidden" style={{
            borderColor: `${accentColor}40`,
            background: backgroundColor
          }}>
            <PlayerShowcase player={currentPlayer} tournament={tournament} size="large" />
          </div>
          <PremiumLargeBidPanel
            auctionState={auctionState}
            tournament={tournament}
            player={currentPlayer}
            accentColor={accentColor}
            backgroundColor={backgroundColor}
            textColor={textColor}
            bidColor={bidColor}
          />
        </div>

        <div className="grid flex-1 grid-cols-2 gap-6">
          {showTeams ? (
            <div className="rounded-3xl border overflow-hidden backdrop-blur-lg" style={{
              borderColor: `${accentColor}30`,
              background: backgroundColor
            }}>
              <TeamsOverviewFlip
                teams={teams}
                tournament={tournament}
                auctionState={auctionState}
                teamsPerPage={10}
                flipDuration={10000}
              />
            </div>
          ) : (
            <div className="rounded-3xl border" style={{
              borderColor: `${accentColor}20`,
              background: backgroundColor
            }} />
          )}

          {showSoldFlip ? (
            <div className="rounded-3xl border overflow-hidden backdrop-blur-lg" style={{
              borderColor: `${accentColor}30`,
              background: backgroundColor
            }}>
              <SoldPlayersFlip
                soldPlayers={soldPlayers}
                teams={teams}
                itemsPerPage={soldItemsPerPage}
                flipInterval={soldFlipDuration}
              />
            </div>
          ) : (
            <div className="rounded-3xl border" style={{
              borderColor: `${accentColor}20`,
              background: backgroundColor
            }} />
          )}
        </div>
      </div>

      {showSpotlight && currentPlayer && (
        <PremiumSpotlightOverlay
          player={currentPlayer}
          tournament={tournament}
          accentColor={accentColor}
          textColor={textColor}
        />
      )}
    </div>
  );
};

interface PremiumLargeBidPanelProps {
  auctionState: AuctionState;
  tournament: Tournament | null;
  player?: Player;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  bidColor: string;
}

const PremiumLargeBidPanel: React.FC<PremiumLargeBidPanelProps> = ({
  auctionState,
  tournament,
  player,
  accentColor,
  backgroundColor,
  textColor,
  bidColor
}) => {
  const basePrice = tournament ? getFormattedBasePrice(tournament, player || null) : '-';

  return (
    <div className="relative flex flex-col justify-between rounded-3xl border p-8 text-center shadow-2xl overflow-hidden" style={{
      borderColor: `${bidColor}60`,
      background: `linear-gradient(135deg, ${bidColor}30, ${backgroundColor})`
    }}>
      {/* Animated shine effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10">
        <p className="text-sm uppercase tracking-[0.6em] font-bold" style={{ color: bidColor }}>
          Current Bid
        </p>
        <p className="mt-6 text-[clamp(4rem,9vw,12rem)] font-black leading-none drop-shadow-2xl" style={{
          color: bidColor,
          textShadow: `0 0 60px ${bidColor}80, 0 10px 40px ${bidColor}50`
        }}>
          {auctionState.currentBid > 0 ? auctionState.currentBid.toLocaleString() : '--'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 text-left text-sm relative z-10">
        <div className="rounded-2xl border p-4 backdrop-blur-lg shadow-lg" style={{
          borderColor: `${accentColor}40`,
          background: `${backgroundColor}dd`
        }}>
          <p className="text-xs uppercase tracking-[0.4em]" style={{ color: `${textColor}99` }}>Base Price</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: accentColor }}>{basePrice}</p>
        </div>
        <div className="rounded-2xl border p-4 backdrop-blur-lg shadow-lg" style={{
          borderColor: `${accentColor}40`,
          background: `${backgroundColor}dd`
        }}>
          <p className="text-xs uppercase tracking-[0.4em]" style={{ color: `${textColor}99` }}>Status</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: textColor }}>{auctionState.currentAuctionStatus}</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

const PremiumSpotlightOverlay: React.FC<{
  player: Player;
  tournament: Tournament | null;
  accentColor: string;
  textColor: string;
}> = ({ player, tournament, accentColor, textColor }) => (
  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/90 backdrop-blur-xl">
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
      <div className="relative">
        {/* Premium glow effect */}
        <div className="absolute inset-0 rounded-full blur-[100px] opacity-40 animate-pulse" style={{
          background: `radial-gradient(circle, ${accentColor}, transparent)`
        }} />
        <div className="absolute -inset-8 rounded-full blur-3xl opacity-30" style={{
          background: `linear-gradient(135deg, ${accentColor}, transparent)`
        }} />

        <img
          src={imageOptimizers.playerCard(player.photoURL)}
          alt={player.name}
          className="relative z-10 h-72 w-72 rounded-full object-cover shadow-2xl"
          style={{
            border: `6px solid ${accentColor}`,
            boxShadow: `0 0 80px ${accentColor}60, 0 30px 120px rgba(0, 0, 0, 0.9)`
          }}
        />
      </div>

      <div>
        <p className="text-sm uppercase tracking-[0.8em] font-bold" style={{ color: accentColor }}>
          New Player
        </p>
        <h2 className="mt-3 text-6xl font-black tracking-[0.1em]" style={{
          color: textColor,
          textShadow: `0 0 40px ${accentColor}50`
        }}>
          {player.name}
        </h2>
        {player.position && (
          <p className="text-xl mt-2" style={{ color: `${textColor}cc` }}>{player.position}</p>
        )}
      </div>

      <div className="grid w-full grid-cols-3 gap-6">
        {[
          { label: 'Matches', value: player.stats.matchesPlayed },
          { label: 'Runs', value: player.stats.totalScore },
          { label: 'Wickets', value: player.stats.totalWickets },
        ].map((stat, idx) => (
          <div key={stat.label} className="rounded-2xl border p-6 backdrop-blur-lg shadow-xl" style={{
            borderColor: `${accentColor}50`,
            background: `linear-gradient(135deg, ${accentColor}20, rgba(0, 0, 0, 0.6))`
          }}>
            <p className="text-sm uppercase tracking-[0.4em] font-semibold" style={{ color: `${textColor}99` }}>
              {stat.label}
            </p>
            <p className="mt-3 text-5xl font-black" style={{
              color: accentColor,
              textShadow: `0 0 20px ${accentColor}60`
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default PlayerHighlightLEDPremium;
