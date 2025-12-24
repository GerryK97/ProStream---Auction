'use client';

import EditorClient from '@/components/EditorClient';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function EditorPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament', 'MasterManager', 'Team', 'Player']}>
      <EditorClient />
    </ProtectedRoute>
  );
}
