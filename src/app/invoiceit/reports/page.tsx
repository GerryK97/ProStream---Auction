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

interface ReportStats {
  totalInvoices: number;
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
  statusBreakdown: {
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };
  recentInvoices: Invoice[];
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'all' | '30days' | '90days' | '1year'>('all');

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      const invoices: Invoice[] = data.invoices || [];

      // Filter by date range
      let filteredInvoices = invoices;
      if (dateRange !== 'all') {
        const now = new Date();
        const cutoffDate = new Date();
        if (dateRange === '30days') cutoffDate.setDate(now.getDate() - 30);
        if (dateRange === '90days') cutoffDate.setDate(now.getDate() - 90);
        if (dateRange === '1year') cutoffDate.setFullYear(now.getFullYear() - 1);

        filteredInvoices = invoices.filter(
          inv => new Date(inv.issueDate) >= cutoffDate
        );
      }

      // Calculate statistics
      const totalInvoices = filteredInvoices.length;
      const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalPaid = filteredInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      const totalOutstanding = filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0);

      const statusBreakdown = {
        draft: filteredInvoices.filter(inv => inv.status === 'draft').length,
        sent: filteredInvoices.filter(inv => inv.status === 'sent').length,
        paid: filteredInvoices.filter(inv => inv.status === 'paid').length,
        overdue: filteredInvoices.filter(inv => inv.status === 'overdue').length,
        cancelled: filteredInvoices.filter(inv => inv.status === 'cancelled').length,
      };

      // Get recent invoices (last 5)
      const recentInvoices = [...filteredInvoices]
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
        .slice(0, 5);

      setStats({
        totalInvoices,
        totalRevenue,
        totalPaid,
        totalOutstanding,
        statusBreakdown,
        recentInvoices,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
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

  const getStatusCount = (status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') => {
    return stats?.statusBreakdown[status] || 0;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl p-12 border text-center" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Loading reports...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !stats) {
    return (
      <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl p-12 border text-center" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-lg mb-4" style={{ color: 'var(--status-error)' }}>{error || 'Failed to load reports'}</p>
              <button onClick={fetchReports} className="px-6 py-2 rounded-xl font-medium text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Reports & Analytics
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Track your invoicing performance and financial insights
              </p>
            </div>

            {/* Date Range Filter */}
            <div className="flex gap-2">
              {(['all', '30days', '90days', '1year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition"
                  style={{
                    backgroundColor: dateRange === range ? 'var(--brand-primary)' : 'var(--surface-secondary)',
                    color: dateRange === range ? 'white' : 'var(--text-primary)',
                  }}
                >
                  {range === 'all' ? 'All Time' : range === '30days' ? '30 Days' : range === '90days' ? '90 Days' : '1 Year'}
                </button>
              ))}
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Total Revenue</p>
              <p className="text-3xl font-bold mb-1" style={{ color: 'var(--brand-primary)' }}>{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stats.totalInvoices} invoices</p>
            </div>

            <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Total Paid</p>
              <p className="text-3xl font-bold mb-1" style={{ color: 'var(--brand-secondary)' }}>{formatCurrency(stats.totalPaid)}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {stats.totalRevenue > 0 ? ((stats.totalPaid / stats.totalRevenue) * 100).toFixed(1) : 0}% collected
              </p>
            </div>

            <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Outstanding</p>
              <p className="text-3xl font-bold mb-1" style={{ color: 'var(--status-warning)' }}>{formatCurrency(stats.totalOutstanding)}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Awaiting payment</p>
            </div>

            <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Overdue</p>
              <p className="text-3xl font-bold mb-1" style={{ color: 'var(--status-error)' }}>{getStatusCount('overdue')}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Require attention</p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Invoice Status Breakdown</h2>
              <div className="space-y-3">
                {Object.entries(stats.statusBreakdown).map(([status, count]) => {
                  const percentage = stats.totalInvoices > 0 ? (count / stats.totalInvoices) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={status as any} type="invoice" />
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{count} invoices</span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: status === 'paid' ? 'var(--brand-secondary)' : status === 'overdue' ? 'var(--status-error)' : 'var(--brand-primary)'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Recent Invoices</h2>
                <Link href="/invoiceit/invoices" className="text-sm font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>
                  View All
                </Link>
              </div>
              {stats.recentInvoices.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No invoices found</p>
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
                          {invoice.customerName || 'Unknown'} â€¢ {formatDate(invoice.issueDate)}
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
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link
                href="/invoiceit/invoices/create"
                className="p-4 rounded-xl border transition hover:scale-105 text-center"
                style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-primary)' }}
              >
                <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Create Invoice</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Generate a new invoice</p>
              </Link>
              <Link
                href="/invoiceit/quotations/create"
                className="p-4 rounded-xl border transition hover:scale-105 text-center"
                style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-primary)' }}
              >
                <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Create Quotation</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Draft a new quotation</p>
              </Link>
              <Link
                href="/invoiceit/invoices"
                className="p-4 rounded-xl border transition hover:scale-105 text-center"
                style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-primary)' }}
              >
                <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>View All Invoices</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Browse invoice list</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
