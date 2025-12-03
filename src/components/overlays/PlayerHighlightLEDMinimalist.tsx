'use client';

import React, { useEffect, useState } from 'react';
import type { AuctionState, Player, Team, Tournament } from '@/types';
import PlayerShowcase from '@/components/overlays/auction-overview/PlayerShowcase';
import { imageOptimizers } from '@/lib/imageOptimization';
import { getFormattedBasePrice } from '@/lib/playerClassUtils';
import TeamsOverviewFlip from '@/components/overlays/auction-overview/TeamsOverviewFlip';
import SoldPlayersFlip from '@/components/overlays/auction-overview/SoldPlayersFlip';

interface PlayerHighlightLEDMinimalistProps {
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
  // Minimalist customization props
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  accentColor?: string;
}

const PlayerHighlightLEDMinimalist: React.FC<PlayerHighlightLEDMinimalistProps> = ({
  tournament,
  auctionState,
  currentPlayer,
  teams,
  soldPlayers,
  showBackground = false,
  spotlightDuration = 4500,
  showTeams = true,
  showSoldFlip = true,
  soldItemsPerPage = 5,
  soldFlipDuration = 8000,
  backgroundColor = 'rgba(255, 255, 255, 0.03)',
  borderColor = 'rgba(255, 255, 255, 0.1)',
  textColor = '#ffffff',
  accentColor = '#6366f1',
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
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: '#000000' }}>
      {/* Base layout with clean spacing */}
      <div className="relative z-10 flex h-full flex-col gap-4 p-8">
        <header className="rounded-xl border backdrop-blur-lg p-6" style={{
          borderColor: borderColor,
          backgroundColor: backgroundColor
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest font-medium" style={{ color: accentColor }}>
                Live Auction
              </p>
              <h1 className="mt-1 text-3xl font-bold" style={{ color: textColor }}>
                {tournament?.name || 'Player Highlight LED Minimalist'}
              </h1>
              <p className="text-xs mt-1" style={{ color: `${textColor}80` }}>Powered by ProStream</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest" style={{ color: `${textColor}60` }}>Status</p>
              <div className="mt-2 px-5 py-2 rounded-lg border font-semibold text-xl" style={{
                borderColor: status === 'Bidding'
                  ? '#10b981'
                  : status === 'Sold'
                  ? '#ef4444'
                  : '#f59e0b',
                color: status === 'Bidding'
                  ? '#10b981'
                  : status === 'Sold'
                  ? '#ef4444'
                  : '#f59e0b',
                backgroundColor: `${status === 'Bidding' ? '#10b981' : status === 'Sold' ? '#ef4444' : '#f59e0b'}15`
              }}>
                {status}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border backdrop-blur-lg overflow-hidden" style={{
            borderColor: borderColor,
            backgroundColor: backgroundColor
          }}>
            <PlayerShowcase player={currentPlayer} tournament={tournament} size="large" />
          </div>
          <MinimalistLargeBidPanel
            auctionState={auctionState}
            tournament={tournament}
            player={currentPlayer}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
            textColor={textColor}
            accentColor={accentColor}
          />
        </div>

        <div className="grid flex-1 grid-cols-2 gap-4">
          {showTeams ? (
            <div className="rounded-xl border backdrop-blur-lg overflow-hidden" style={{
              borderColor: borderColor,
              backgroundColor: backgroundColor
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
            <div className="rounded-xl border" style={{
              borderColor: borderColor,
              backgroundColor: backgroundColor
            }} />
          )}

          {showSoldFlip ? (
            <div className="rounded-xl border backdrop-blur-lg overflow-hidden" style={{
              borderColor: borderColor,
              backgroundColor: backgroundColor
            }}>
              <SoldPlayersFlip
                soldPlayers={soldPlayers}
                teams={teams}
                itemsPerPage={soldItemsPerPage}
                flipInterval={soldFlipDuration}
              />
            </div>
          ) : (
            <div className="rounded-xl border" style={{
              borderColor: borderColor,
              backgroundColor: backgroundColor
            }} />
          )}
        </div>
      </div>

      {showSpotlight && currentPlayer && (
        <MinimalistSpotlightOverlay
          player={currentPlayer}
          tournament={tournament}
          backgroundColor={backgroundColor}
          borderColor={borderColor}
          textColor={textColor}
          accentColor={accentColor}
        />
      )}
    </div>
  );
};

interface MinimalistLargeBidPanelProps {
  auctionState: AuctionState;
  tournament: Tournament | null;
  player?: Player;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
}

const MinimalistLargeBidPanel: React.FC<MinimalistLargeBidPanelProps> = ({
  auctionState,
  tournament,
  player,
  backgroundColor,
  borderColor,
  textColor,
  accentColor
}) => {
  const basePrice = tournament ? getFormattedBasePrice(tournament, player || null) : '-';

  return (
    <div className="flex flex-col justify-between rounded-xl border p-6 text-center backdrop-blur-lg" style={{
      borderColor: borderColor,
      backgroundColor: backgroundColor
    }}>
      <div>
        <p className="text-sm uppercase tracking-widest font-medium" style={{ color: accentColor }}>
          Current Bid
        </p>
        <p className="mt-4 text-[clamp(4rem,9vw,12rem)] font-bold leading-none" style={{ color: textColor }}>
          {auctionState.currentBid > 0 ? auctionState.currentBid.toLocaleString() : '--'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-6 text-left text-sm">
        <div className="rounded-lg border p-3 backdrop-blur-lg" style={{
          borderColor: borderColor,
          backgroundColor: `${backgroundColor}cc`
        }}>
          <p className="text-xs uppercase tracking-wider" style={{ color: `${textColor}80` }}>Base Price</p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: accentColor }}>{basePrice}</p>
        </div>
        <div className="rounded-lg border p-3 backdrop-blur-lg" style={{
          borderColor: borderColor,
          backgroundColor: `${backgroundColor}cc`
        }}>
          <p className="text-xs uppercase tracking-wider" style={{ color: `${textColor}80` }}>Status</p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: textColor }}>{auctionState.currentAuctionStatus}</p>
        </div>
      </div>
    </div>
  );
};

const MinimalistSpotlightOverlay: React.FC<{
  player: Player;
  tournament: Tournament | null;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
}> = ({ player, tournament, backgroundColor, borderColor, textColor, accentColor }) => (
  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center backdrop-blur-xl" style={{
    backgroundColor: 'rgba(0, 0, 0, 0.9)'
  }}>
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
      <div className="relative">
        <img
          src={imageOptimizers.playerCard(player.photoURL)}
          alt={player.name}
          className="relative z-10 h-64 w-64 rounded-full object-cover"
          style={{
            border: `4px solid ${accentColor}`
          }}
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest font-medium" style={{ color: accentColor }}>
          New Player
        </p>
        <h2 className="mt-2 text-5xl font-bold" style={{ color: textColor }}>
          {player.name}
        </h2>
        {player.position && (
          <p className="text-lg mt-1" style={{ color: `${textColor}cc` }}>{player.position}</p>
        )}
      </div>

      <div className="grid w-full grid-cols-3 gap-4">
        {[
          { label: 'Matches', value: player.stats.matchesPlayed },
          { label: 'Runs', value: player.stats.totalScore },
          { label: 'Wickets', value: player.stats.totalWickets },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4 backdrop-blur-lg" style={{
            borderColor: borderColor,
            backgroundColor: backgroundColor
          }}>
            <p className="text-xs uppercase tracking-wider" style={{ color: `${textColor}80` }}>
              {stat.label}
            </p>
            <p className="mt-2 text-4xl font-semibold" style={{ color: accentColor }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default PlayerHighlightLEDMinimalist;
