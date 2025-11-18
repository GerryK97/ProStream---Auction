'use client';

import AuctionSetupPanel from '@/components/AuctionSetupPanel';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AuctionSetupPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
      <AuctionSetupPanel />
    </ProtectedRoute>
  );
}
