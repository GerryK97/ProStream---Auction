'use client';

import React, { useEffect, useState } from 'react';
import type { AuctionState, Player, Team, Tournament } from '@/types';
import PlayerShowcase from '@/components/overlays/auction-overview/PlayerShowcase';
import { imageOptimizers } from '@/lib/imageOptimization';
import { getFormattedBasePrice } from '@/lib/playerClassUtils';
import BackgroundEffects from '@/components/overlays/auction-overview/BackgroundEffects';
import TeamsOverviewFlip from '@/components/overlays/auction-overview/TeamsOverviewFlip';
import SoldPlayersFlip from '@/components/overlays/auction-overview/SoldPlayersFlip';

interface PlayerHighlightLEDProps {
  tournament: Tournament | null;
  auctionState: AuctionState;
  currentPlayer: Player | undefined;
  teams: Team[];
  soldPlayers: Player[];
  showBackground?: boolean;
  spotlightDuration?: number; // milliseconds
  showTeams?: boolean;
  showSoldFlip?: boolean;
  soldItemsPerPage?: number;
  soldFlipDuration?: number;
}

const PlayerHighlightLED: React.FC<PlayerHighlightLEDProps> = ({
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
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 text-white">
      {showBackground && <BackgroundEffects theme="premium" showBackground />}

      {/* Base layout */}
      <div className="relative z-10 flex h-full flex-col gap-6 p-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-brand-secondary">Live Auction</p>
              <h1 className="mt-1 text-3xl font-black tracking-wide">{tournament?.name || 'Player Highlight LED'}</h1>
              <p className="text-sm text-neutral-300">Powered by ProStream</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.5em] text-neutral-400">Status</p>
              <p className={`text-2xl font-bold ${status === 'Bidding' ? 'text-green-400' : status === 'Sold' ? 'text-red-400' : 'text-yellow-400'}`}>
                {status}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-6">
          <PlayerShowcase player={currentPlayer} tournament={tournament} size="large" />
          <LargeBidPanel auctionState={auctionState} tournament={tournament} player={currentPlayer} />
        </div>

        <div className="grid flex-1 grid-cols-2 gap-6">
          {showTeams ? (
            <TeamsOverviewFlip
              teams={teams}
              tournament={tournament}
              auctionState={auctionState}
              teamsPerPage={10}
              flipDuration={10000}
            />
          ) : (
            <div className="rounded-3xl border border-neutral-700 bg-neutral-900/60" />
          )}

          {showSoldFlip ? (
            <SoldPlayersFlip
              soldPlayers={soldPlayers}
              teams={teams}
              itemsPerPage={soldItemsPerPage}
              flipInterval={soldFlipDuration}
            />
          ) : (
            <div className="rounded-3xl border border-neutral-700 bg-neutral-900/60" />
          )}
        </div>
      </div>

      {showSpotlight && currentPlayer && (
        <SpotlightOverlay player={currentPlayer} tournament={tournament} />
      )}
    </div>
  );
};

interface LargeBidPanelProps {
  auctionState: AuctionState;
  tournament: Tournament | null;
  player?: Player;
}

const LargeBidPanel: React.FC<LargeBidPanelProps> = ({ auctionState, tournament, player }) => {
  const basePrice = tournament ? getFormattedBasePrice(tournament, player || null) : '-';

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-green-500/40 bg-gradient-to-br from-green-500/20 via-neutral-900/60 to-neutral-900/80 p-6 text-center shadow-[0_30px_120px_rgba(34,197,94,0.35)]">
      <div>
        <p className="text-sm uppercase tracking-[0.6em] text-green-200">Current Bid</p>
        <p className="mt-4 text-[clamp(4rem,9vw,12rem)] font-black leading-none text-green-400 drop-shadow-[0_10px_40px_rgba(34,197,94,0.5)]">
          {auctionState.currentBid > 0 ? auctionState.currentBid.toLocaleString() : '--'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 text-left text-sm text-neutral-200">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">Base Price</p>
          <p className="mt-2 text-2xl font-bold text-cyan-300">{basePrice}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">Status</p>
          <p className="mt-2 text-2xl font-bold text-white">{auctionState.currentAuctionStatus}</p>
        </div>
      </div>
    </div>
  );
};

const SpotlightOverlay: React.FC<{ player: Player; tournament: Tournament | null }> = ({ player, tournament }) => (
  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur">
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary blur-3xl opacity-30" />
        <img
          src={imageOptimizers.playerCard(player.photoURL)}
          alt={player.name}
          className="relative z-10 h-64 w-64 rounded-full border-4 border-white/80 object-cover shadow-[0_30px_120px_rgba(0,0,0,0.75)]"
        />
      </div>
      <div>
        <p className="text-sm uppercase tracking-[0.6em] text-brand-secondary">New Player</p>
        <h2 className="mt-2 text-5xl font-black tracking-[0.1em]">{player.name}</h2>
        {player.position && <p className="text-lg text-neutral-300">{player.position}</p>}
      </div>
      <div className="grid w-full grid-cols-3 gap-4">
        {[
          { label: 'Matches', value: (player as any).stats?.matchesPlayed },
          { label: 'Runs', value: (player as any).stats?.totalScore },
          { label: 'Wickets', value: (player as any).stats?.totalWickets },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-sm uppercase tracking-[0.4em] text-neutral-300">{stat.label}</p>
            <p className="mt-2 text-4xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default PlayerHighlightLED;
