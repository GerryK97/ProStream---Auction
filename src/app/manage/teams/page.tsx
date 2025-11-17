'use client';

import ManagementDashboard from '@/components/ManagementDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function TeamsPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'MasterManager']}>
      <ManagementDashboard view="teams" />
    </ProtectedRoute>
  );
}
