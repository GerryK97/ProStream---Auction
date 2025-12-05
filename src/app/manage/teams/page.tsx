'use client';

import ManagementDashboard from '@/components/ManagementDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function TeamsPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament', 'MasterManager']}>
      <ManagementDashboard view="teams" />
    </ProtectedRoute>
  );
}
