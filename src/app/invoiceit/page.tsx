'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function InvoiceItPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament', 'MasterManager']}>
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--brand-primary)' }}>Invoice</span>
              <span style={{ color: 'var(--brand-secondary)' }}>It</span>
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Professional invoicing and quotation management system
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Link
              href="/invoiceit/invoices/create"
              className="group rounded-2xl p-6 border transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--brand-primary)' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Create Invoice
                </h3>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Generate a new invoice with automatic calculations and PDF export
              </p>
            </Link>

            <Link
              href="/invoiceit/quotations/create"
              className="group rounded-2xl p-6 border transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--brand-secondary)' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Create Quotation
                </h3>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Draft a quotation that can be converted to an invoice when accepted
              </p>
            </Link>

            <Link
              href="/invoiceit/reports"
              className="group rounded-2xl p-6 border transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--accent-color)' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  View Reports
                </h3>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Track invoices, payments, and generate financial reports
              </p>
            </Link>
          </div>

          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <p className="text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Total Invoices
              </p>
              <p className="text-3xl font-bold mb-1" style={{ color: 'var(--brand-primary)' }}>
                0
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                No invoices yet
              </p>
            </div>

            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <p className="text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Outstanding
              </p>
              <p className="text-3xl font-bold mb-1" style={{ color: 'var(--status-warning)' }}>
                LKR 0
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Awaiting payment
              </p>
            </div>

            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <p className="text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Paid
              </p>
              <p className="text-3xl font-bold mb-1" style={{ color: 'var(--brand-secondary)' }}>
                LKR 0
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Total received
              </p>
            </div>

            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <p className="text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Quotations
              </p>
              <p className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-color)' }}>
                0
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Pending acceptance
              </p>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Recent Invoices
                </h2>
                <Link
                  href="/invoiceit/invoices"
                  className="text-sm font-medium hover:underline"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  View All
                </Link>
              </div>
              <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                No invoices created yet. Create your first invoice to get started.
              </p>
            </div>

            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Recent Quotations
                </h2>
                <Link
                  href="/invoiceit/quotations"
                  className="text-sm font-medium hover:underline"
                  style={{ color: 'var(--brand-secondary)' }}
                >
                  View All
                </Link>
              </div>
              <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                No quotations created yet. Create your first quotation to get started.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
