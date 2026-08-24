'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import StatusBadge from '@/components/invoiceit/StatusBadge';
import { getAuthHeaders } from '@/lib/api-client';

interface Quotation {
  _id: string;
  quotationNumber: string;
  customerId: string;
  customerName?: string;
  issueDate: string;
  validUntil: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  total: number;
  convertedToInvoiceId?: string;
}

export default function QuotationsListPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quotations', { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch quotations');
      const data = await response.json();
      setQuotations(data.quotations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleDownloadPDF = async (quotationId: string, quotationNumber: string) => {
    try {
      setDownloadingId(quotationId);
      const response = await fetch(`/api/quotations/${quotationId}/pdf`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quotationNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
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
    <ProtectedRoute allowedRoles={['Admin', 'Operator']}>
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Quotations
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Manage and track all your quotations
              </p>
            </div>
            <Link
              href="/invoiceit/quotations/create"
              className="px-6 py-3 rounded-xl font-semibold text-white transition hover:scale-105"
              style={{ backgroundColor: 'var(--brand-secondary)' }}
            >
              + Create Quotation
            </Link>
          </div>

          {loading ? (
            <div className="rounded-2xl p-12 border text-center" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Loading quotations...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl p-12 border text-center" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-lg" style={{ color: 'var(--status-error)' }}>{error}</p>
            </div>
          ) : quotations.length === 0 ? (
            <div className="rounded-2xl p-12 border text-center" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>No quotations found</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
                Get started by creating your first quotation
              </p>
              <Link
                href="/invoiceit/quotations/create"
                className="inline-block px-6 py-2 rounded-xl font-medium text-white"
                style={{ backgroundColor: 'var(--brand-secondary)' }}
              >
                Create Quotation
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--surface-secondary)' }}>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Number</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Customer</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Issue Date</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Valid Until</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Status</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Total</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((quotation) => (
                    <tr
                      key={quotation._id}
                      className="border-b transition"
                      style={{ borderColor: 'var(--border-primary)' }}
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/invoiceit/quotations/${quotation._id}`}
                          className="font-medium hover:underline"
                          style={{ color: 'var(--brand-secondary)' }}
                        >
                          {quotation.quotationNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {quotation.customerName || quotation.customerId}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(quotation.issueDate)}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(quotation.validUntil)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={quotation.status} type="quotation" />
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(quotation.total)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/invoiceit/quotations/${quotation._id}`}
                            className="text-sm font-medium hover:underline"
                            style={{ color: 'var(--brand-secondary)' }}
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDownloadPDF(quotation._id, quotation.quotationNumber)}
                            disabled={downloadingId === quotation._id}
                            className="text-sm font-medium hover:underline disabled:opacity-50"
                            style={{ color: 'var(--brand-primary)' }}
                          >
                            PDF
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
