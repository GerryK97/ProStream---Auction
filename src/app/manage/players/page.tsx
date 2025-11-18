'use client';

import ManagementDashboard from '@/components/ManagementDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function PlayersPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'MasterManager']}>
      <ManagementDashboard view="players" />
    </ProtectedRoute>
  );
}
