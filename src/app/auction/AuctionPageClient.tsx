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
      <div className="pt-2 pb-2 min-w-0">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Auction</h1>
      </div>
      <AuctionControlPanel initialData={initialData || undefined} stats={{ totalTeams, totalPlayers, soldPlayers }} />
    </ProtectedRoute>
  );
}
