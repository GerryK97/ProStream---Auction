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

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
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

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setDownloadingId(invoiceId);
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF');
    } finally {
      setDownloadingId(null);
    }
  };

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

          {loading ? (
            <div
              className="rounded-2xl p-12 border text-center"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                Loading invoices...
              </p>
            </div>
          ) : error ? (
            <div
              className="rounded-2xl p-12 border text-center"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <p className="text-lg mb-4" style={{ color: 'var(--status-error)' }}>
                Error: {error}
              </p>
              <button
                onClick={fetchInvoices}
                className="px-6 py-2 rounded-xl font-medium text-white"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                Try Again
              </button>
            </div>
          ) : invoices.length === 0 ? (
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
          ) : (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-secondary)' }}>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Invoice #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Issue Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Total
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Balance
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice, index) => (
                    <tr
                      key={invoice._id}
                      style={{
                        borderTop: index > 0 ? '1px solid var(--border-primary)' : 'none'
                      }}
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/invoiceit/invoices/${invoice._id}`}
                          className="font-medium hover:underline"
                          style={{ color: 'var(--brand-primary)' }}
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4" style={{ color: 'var(--text-primary)' }}>
                        {invoice.customerName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(invoice.issueDate)}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={invoice.status} type="invoice" />
                      </td>
                      <td className="px-6 py-4 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold" style={{
                        color: invoice.balance > 0 ? 'var(--status-warning)' : 'var(--brand-secondary)'
                      }}>
                        {formatCurrency(invoice.balance)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/invoiceit/invoices/${invoice._id}`}
                            className="px-3 py-1 text-sm rounded-lg transition hover:scale-105"
                            style={{
                              backgroundColor: 'var(--surface-secondary)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDownloadPDF(invoice._id, invoice.invoiceNumber)}
                            disabled={downloadingId === invoice._id}
                            className="px-3 py-1 text-sm rounded-lg transition hover:scale-105 disabled:opacity-50"
                            style={{
                              backgroundColor: 'var(--brand-primary)',
                              color: 'white'
                            }}
                          >
                            {downloadingId === invoice._id ? '...' : 'PDF'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
