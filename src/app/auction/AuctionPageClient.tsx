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
  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
      <AuctionControlPanel initialData={initialData || undefined} />
    </ProtectedRoute>
  );
}
