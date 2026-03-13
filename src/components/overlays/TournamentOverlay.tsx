'use client';

import React, { useEffect, useRef, useState } from 'react';
import OverlayWrapper from './OverlayWrapper';
import { Team, Player, AuctionState, Tournament } from '@/types';

// ─── Sub-views ───────────────────────────────────────────────────────────────

function IdleView({ teams, tournament }: { teams: Team[]; tournament: Tournament | null }) {
  const sorted = [...teams].sort((a, b) => (b.currentBalance ?? 0) - (a.currentBalance ?? 0));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-12 py-10">
      <div className="mb-8 flex items-center gap-4">
        {tournament?.logoURL && (
          <img src={tournament.logoURL} alt="" className="h-12 w-12 object-contain rounded-full" />
        )}
        <div>
          <p className="text-sm font-bold tracking-widest uppercase opacity-60">{tournament?.year}</p>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--brand-primary, #4F46E5)' }}>
            {tournament?.name ?? 'Auction'}
          </h1>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-2">
        {sorted.map((team, i) => {
          const spent = (team.initialBudget ?? 0) - (team.currentBalance ?? 0);
          const pct = team.initialBudget
            ? Math.round(((team.currentBalance ?? 0) / team.initialBudget) * 100)
            : 0;
          return (
            <div
              key={team._id}
              className="flex items-center gap-4 px-5 py-3 rounded-xl"
              style={{
                backgroundColor: i === 0 ? 'rgba(79,70,229,0.18)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${i === 0 ? 'rgba(79,70,229,0.5)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <span className="w-7 text-center font-bold text-lg opacity-50">#{i + 1}</span>
              {team.logoURL && (
                <img src={team.logoURL} alt="" className="h-8 w-8 object-contain rounded-full bg-white/10" />
              )}
              <span className="flex-1 font-semibold text-white truncate">{team.name}</span>
              <span className="text-sm opacity-60 mr-2">spent ₹{(spent / 100000).toFixed(1)}L</span>
              <span className="font-bold text-white">₹{((team.currentBalance ?? 0) / 100000).toFixed(1)}L</span>
              <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct > 50 ? '#10B981' : pct > 25 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-center opacity-40 py-8">Waiting for auction to begin…</p>
        )}
      </div>
    </div>
  );
}

function BiddingView({
  player,
  auctionState,
  teams,
  tournament,
}: {
  player: Player;
  auctionState: AuctionState;
  teams: Team[];
  tournament: Tournament | null;
}) {
  const leadingTeam = teams.find(t => t._id === auctionState.winningTeamId);
  const basePrice = tournament?.basePricePerPlayer ?? 0;

  return (
    <div className="w-full h-full flex items-center justify-center gap-10 px-12 py-10">
      {/* Player card */}
      <div
        className="flex-shrink-0 flex flex-col items-center rounded-2xl p-6 w-56"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {player.photoURL ? (
          <img
            src={player.photoURL}
            alt={player.name}
            className="w-28 h-28 object-cover rounded-full mb-4"
            style={{ border: '3px solid #4F46E5' }}
          />
        ) : (
          <div
            className="w-28 h-28 rounded-full mb-4 flex items-center justify-center text-4xl font-bold"
            style={{ backgroundColor: 'rgba(79,70,229,0.25)', border: '3px solid #4F46E5' }}
          >
            {player.name.charAt(0)}
          </div>
        )}
        <h2 className="text-xl font-extrabold text-white text-center leading-tight">{player.name}</h2>
        {player.position && (
          <span className="mt-1 text-xs uppercase tracking-widest opacity-50">{player.position}</span>
        )}
        {player.currentClub && (
          <span className="mt-1 text-xs opacity-40">{player.currentClub}</span>
        )}
        <div
          className="mt-3 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: 'rgba(79,70,229,0.3)', color: '#818CF8' }}
        >
          Base ₹{(basePrice / 100000).toFixed(1)}L
        </div>
      </div>

      {/* Bid info */}
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest opacity-40 mb-1">Current Bid</p>
          <p
            className="text-7xl font-black text-white leading-none"
            style={{ textShadow: '0 0 40px rgba(79,70,229,0.8)' }}
          >
            ₹{((auctionState.currentBid || basePrice) / 100000).toFixed(1)}
            <span className="text-3xl font-bold opacity-60">L</span>
          </p>
        </div>

        {leadingTeam && (
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl"
            style={{ backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            {leadingTeam.logoURL && (
              <img src={leadingTeam.logoURL} alt="" className="h-10 w-10 object-contain rounded-full bg-white/10" />
            )}
            <div>
              <p className="text-xs uppercase tracking-widest opacity-50">Leading Bid</p>
              <p className="font-bold text-white">{leadingTeam.name}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm opacity-50">Live Bidding</span>
        </div>
      </div>
    </div>
  );
}

function SoldView({ player, team, finalPrice }: { player: Player; team?: Team; finalPrice: number }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-12 py-10 text-center">
      <div
        className="px-10 py-3 rounded-full text-4xl font-black tracking-widest mb-8 animate-bounce"
        style={{ backgroundColor: '#10B981', color: '#fff', boxShadow: '0 0 60px rgba(16,185,129,0.6)' }}
      >
        SOLD!
      </div>

      <div className="flex items-center gap-6 mb-6">
        {player.photoURL ? (
          <img
            src={player.photoURL}
            alt={player.name}
            className="w-20 h-20 object-cover rounded-full"
            style={{ border: '3px solid #10B981' }}
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
            style={{ backgroundColor: 'rgba(16,185,129,0.2)', border: '3px solid #10B981' }}
          >
            {player.name.charAt(0)}
          </div>
        )}
        <div className="text-left">
          <h2 className="text-3xl font-black text-white">{player.name}</h2>
          {player.position && <p className="text-sm opacity-50 uppercase tracking-widest">{player.position}</p>}
        </div>
      </div>

      <p
        className="text-6xl font-black text-white mb-4"
        style={{ textShadow: '0 0 40px rgba(16,185,129,0.8)' }}
      >
        ₹{(finalPrice / 100000).toFixed(1)}<span className="text-3xl opacity-60">L</span>
      </p>

      {team && (
        <div
          className="flex items-center gap-3 px-6 py-3 rounded-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          {team.logoURL && (
            <img src={team.logoURL} alt="" className="h-10 w-10 object-contain rounded-full bg-white/10" />
          )}
          <span className="font-bold text-white text-lg">{team.name}</span>
        </div>
      )}
    </div>
  );
}

// ─── Inner content (owns state, avoids side effects in render) ───────────────

interface ContentProps {
  tournament: Tournament | null;
  auctionState: AuctionState;
  players: Player[];
  teams: Team[];
  currentPlayer: Player | undefined;
}

function OverlayContent({ tournament, auctionState, teams, currentPlayer }: ContentProps) {
  const [showSold, setShowSold] = useState(false);
  const [soldSnapshot, setSoldSnapshot] = useState<{ player: Player; team?: Team; price: number } | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const status = auctionState.currentAuctionStatus;
    if (status === 'Sold' && prevStatusRef.current !== 'Sold' && currentPlayer) {
      const winTeam = teams.find(t => t._id === auctionState.winningTeamId);
      setSoldSnapshot({ player: currentPlayer, team: winTeam, price: auctionState.currentBid });
      setShowSold(true);
      const timer = setTimeout(() => setShowSold(false), 4000);
      prevStatusRef.current = status;
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = status;
  }, [auctionState.currentAuctionStatus, auctionState.currentBid, auctionState.winningTeamId, currentPlayer, teams]);

  const isBidding = auctionState.currentAuctionStatus === 'Bidding' && currentPlayer;

  return (
    <div
      className="w-full h-full relative"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {showSold && soldSnapshot ? (
        <SoldView player={soldSnapshot.player} team={soldSnapshot.team} finalPrice={soldSnapshot.price} />
      ) : isBidding ? (
        <BiddingView player={currentPlayer} auctionState={auctionState} teams={teams} tournament={tournament} />
      ) : (
        <IdleView teams={teams} tournament={tournament} />
      )}
    </div>
  );
}

// ─── Public export ───────────────────────────────────────────────────────────

export default function TournamentOverlay({
  tournamentId,
  theme = 'standard',
}: {
  tournamentId: string;
  theme?: 'standard';
}) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent">
      <OverlayWrapper tournamentId={tournamentId}>
        {(data) => <OverlayContent {...data} />}
      </OverlayWrapper>
    </div>
  );
}
