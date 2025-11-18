'use client';

import ManagementDashboard from '@/components/ManagementDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function TournamentsPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
      <ManagementDashboard view="tournaments" />
    </ProtectedRoute>
  );
}
