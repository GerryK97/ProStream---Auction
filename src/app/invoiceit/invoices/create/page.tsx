'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function CreateInvoicePage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament', 'MasterManager']}>
      <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--surface-primary)' }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <Link
              href="/invoiceit/invoices"
              className="inline-flex items-center gap-2 text-sm font-medium mb-4 hover:underline"
              style={{ color: 'var(--brand-primary)' }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Invoices
            </Link>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Create New Invoice
            </h1>
          </div>

          <div
            className="rounded-2xl p-8 border"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <p className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
              Invoice creation form will be implemented in Phase 4
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
