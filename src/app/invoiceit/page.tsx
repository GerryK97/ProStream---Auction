'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import StatusBadge from '@/components/invoiceit/StatusBadge';
import { getAuthHeaders } from '@/lib/api-client';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  total: number;
  amountPaid: number;
  balance: number;
}

interface Quotation {
  _id: string;
  quotationNumber: string;
  customerId: string;
  customerName?: string;
  issueDate: Date;
  validUntil: Date;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  total: number;
}

interface DashboardStats {
  totalInvoices: number;
  totalPaid: number;
  totalOutstanding: number;
  totalQuotations: number;
  recentInvoices: Invoice[];
  recentQuotations: Quotation[];
}

export default function InvoiceItPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch invoices and quotations in parallel
      const [invoicesResponse, quotationsResponse] = await Promise.all([
        fetch('/api/invoices', { headers: getAuthHeaders() }),
        fetch('/api/quotations', { headers: getAuthHeaders() }).catch(() => null),
      ]);

      if (!invoicesResponse.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const invoicesData = await invoicesResponse.json();
      const invoices: Invoice[] = invoicesData.invoices || [];

      // Quotations might not be implemented yet, so handle gracefully
      let quotations: Quotation[] = [];
      if (quotationsResponse && quotationsResponse.ok) {
        const quotationsData = await quotationsResponse.json();
        quotations = quotationsData.quotations || [];
      }

      // Calculate statistics
      const totalInvoices = invoices.length;
      const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);
      const totalQuotations = quotations.length;

      // Get recent invoices (last 5)
      const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
        .slice(0, 5);

      // Get recent quotations (last 5)
      const recentQuotations = [...quotations]
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
        .slice(0, 5);

      setStats({
        totalInvoices,
        totalPaid,
        totalOutstanding,
        totalQuotations,
        recentInvoices,
        recentQuotations,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['Admin', 'Tournament', 'MasterManager']}>
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl p-12 border text-center" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !stats) {
    return (
      <ProtectedRoute allowedRoles={['Admin', 'Tournament', 'MasterManager']}>
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl p-12 border text-center" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-lg mb-4" style={{ color: 'var(--status-error)' }}>{error || 'Failed to load dashboard'}</p>
              <button onClick={fetchDashboardData} className="px-6 py-2 rounded-xl font-medium text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
                  style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
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
                Generate a new invoice for your customers with line items and taxes
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
                {stats.totalInvoices}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {stats.totalInvoices === 0 ? 'No invoices yet' : 'Invoices created'}
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
                {formatCurrency(stats.totalOutstanding)}
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
                {formatCurrency(stats.totalPaid)}
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
                {stats.totalQuotations}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {stats.totalQuotations === 0 ? 'No quotations yet' : 'Pending acceptance'}
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
              {stats.recentInvoices.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                  No invoices created yet. Create your first invoice to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recentInvoices.map((invoice) => (
                    <div
                      key={invoice._id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: 'var(--surface-secondary)' }}
                    >
                      <div>
                        <Link
                          href={`/invoiceit/invoices/${invoice._id}`}
                          className="font-medium hover:underline"
                          style={{ color: 'var(--brand-primary)' }}
                        >
                          {invoice.invoiceNumber}
                        </Link>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          {invoice.customerName || 'Unknown'} • {formatDate(invoice.issueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency(invoice.total)}
                        </p>
                        <StatusBadge status={invoice.status} type="invoice" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  style={{ color: 'var(--brand-primary)' }}
                >
                  View All
                </Link>
              </div>
              {stats.recentQuotations.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                  No quotations created yet. Create your first quotation to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recentQuotations.map((quotation) => (
                    <div
                      key={quotation._id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: 'var(--surface-secondary)' }}
                    >
                      <div>
                        <Link
                          href={`/invoiceit/quotations/${quotation._id}`}
                          className="font-medium hover:underline"
                          style={{ color: 'var(--brand-primary)' }}
                        >
                          {quotation.quotationNumber}
                        </Link>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          {quotation.customerName || 'Unknown'} • {formatDate(quotation.issueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency(quotation.total)}
                        </p>
                        <StatusBadge status={quotation.status} type="quotation" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
