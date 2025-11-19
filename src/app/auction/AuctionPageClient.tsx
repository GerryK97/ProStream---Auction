'use client';

import AuctionControlPanel from '@/components/AuctionControlPanel';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import type { AuctionState, Player, Team, Tournament } from '@/types';

interface AuctionPageClientProps {
  initialData: {
    tournament: Tournament | null;
    auctionState: AuctionState;
    players: Player[];
    teams: Team[];
  } | null;
}

export default function AuctionPageClient({ initialData }: AuctionPageClientProps) {
  const tournament = initialData?.tournament;
  const totalTeams = initialData?.teams?.length ?? 0;
  const totalPlayers = initialData?.players?.length ?? 0;
  const soldPlayers = initialData?.players?.filter((player) => player.isSold).length ?? 0;
  const status = tournament?.status || 'Not Started';

  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
      <div className="space-y-6">
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">Tournament</p>
            <p className="mt-2 text-xl font-bold text-white">{tournament?.name || 'Unassigned'}</p>
            <p className="text-sm text-neutral-400">Status: <span className="text-brand-secondary">{status}</span></p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">Teams</p>
            <p className="mt-2 text-3xl font-bold text-white">{totalTeams}</p>
            <p className="text-sm text-neutral-400">Registered</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">Players</p>
            <p className="mt-2 text-3xl font-bold text-white">{totalPlayers}</p>
            <p className="text-sm text-neutral-400">In Pool</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">Sold</p>
            <p className="mt-2 text-3xl font-bold text-white">{soldPlayers}</p>
            <p className="text-sm text-neutral-400">Completed Bids</p>
          </div>
        </div>

        <AuctionControlPanel initialData={initialData || undefined} />
      </div>
    </ProtectedRoute>
  );
}
