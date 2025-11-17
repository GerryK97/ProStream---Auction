'use client';

import AuctionControlPanel from '@/components/AuctionControlPanel';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AuctionPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
      <AuctionControlPanel />
    </ProtectedRoute>
  );
}
