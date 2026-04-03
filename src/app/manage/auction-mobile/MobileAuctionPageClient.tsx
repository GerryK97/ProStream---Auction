'use client';

import MobileAuctionControlPanel from '@/components/MobileAuctionControlPanel';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import type { AuctionState, Player, Team, Tournament } from '@/types';

interface MobileAuctionPageClientProps {
  initialData: {
    tournament: Tournament | null;
    auctionState: AuctionState;
    players: Player[];
    teams: Team[];
  } | null;
}

export default function MobileAuctionPageClient({ initialData }: MobileAuctionPageClientProps) {
  const tournament = initialData?.tournament;
  const totalTeams = initialData?.teams?.length ?? 0;
  const totalPlayers = initialData?.players?.length ?? 0;
  const soldPlayers = initialData?.players?.filter((player) => player.isSold).length ?? 0;

  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
      <MobileAuctionControlPanel initialData={initialData || undefined} stats={{ totalTeams, totalPlayers, soldPlayers }} />
    </ProtectedRoute>
  );
}
