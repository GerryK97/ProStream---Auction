'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament', 'MasterManager']}>
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Reports & Analytics
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Track your invoicing performance and financial insights
            </p>
          </div>

          <div
            className="rounded-2xl p-12 border text-center"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>
              Reports module coming soon
            </p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              This section will display financial analytics, payment tracking, and invoice statistics
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
