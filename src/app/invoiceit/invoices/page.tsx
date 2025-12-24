'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function InvoicesListPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament', 'MasterManager']}>
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Invoices
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Manage and track all your invoices
              </p>
            </div>
            <Link
              href="/invoiceit/invoices/create"
              className="px-6 py-3 rounded-xl font-semibold text-white transition hover:scale-105"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              + Create Invoice
            </Link>
          </div>

          <div
            className="rounded-2xl p-12 border text-center"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>
              No invoices found
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
              Get started by creating your first invoice
            </p>
            <Link
              href="/invoiceit/invoices/create"
              className="inline-block px-6 py-2 rounded-xl font-medium text-white"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              Create Invoice
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
