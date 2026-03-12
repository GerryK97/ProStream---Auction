'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import StatusBadge from '@/components/invoiceit/StatusBadge';
import { getAuthHeaders } from '@/lib/api-client';

interface Quotation {
  _id: string;
  quotationNumber: string;
  customerId: string;
  issueDate: Date;
  validUntil: Date;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  total: number;
  notes?: string;
  terms?: string;
  convertedToInvoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [converting, setConverting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchQuotation();
    }
  }, [params.id]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quotations/${params.id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quotation');
      }

      const data = await response.json();
      setQuotation(data.quotation);

      if (data.quotation.customerId) {
        const customerResponse = await fetch(`/api/customers/${data.quotation.customerId}`, {
          headers: getAuthHeaders(),
        });
        if (customerResponse.ok) {
          const customerData = await customerResponse.json();
          setCustomer(customerData.customer);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: Quotation['status']) => {
    if (!quotation) return;
    try {
      setUpdating(true);
      const response = await fetch(`/api/quotations/${params.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const data = await response.json();
      setQuotation(data.quotation);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const convertToInvoice = async () => {
    if (!quotation) return;
    try {
      setConverting(true);
      const response = await fetch(`/api/quotations/${params.id}/convert`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to convert to invoice');
      }

      const data = await response.json();
      router.push(`/invoiceit/invoices/${data.invoice._id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to convert to invoice');
    } finally {
      setConverting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!quotation) return;
    try {
      setDownloading(true);
      const response = await fetch(`/api/quotations/${quotation._id}/pdf`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to download PDF';
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch (e) {
          // ignore
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quotation.quotationNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['Admin', 'Tournament', 'MasterManager']}>
        <div className="p-6">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl p-12 border text-center" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Loading quotation...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !quotation) {
    return (
      <ProtectedRoute allowedRoles={['Admin', 'Tournament', 'MasterManager']}>
        <div className="p-6">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl p-12 border text-center" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-lg mb-4" style={{ color: 'var(--status-error)' }}>
                {error || 'Quotation not found'}
              </p>
              <Link href="/invoiceit/quotations" className="px-6 py-2 rounded-xl font-medium text-white" style={{ backgroundColor: 'var(--brand-secondary)' }}>
                Back to Quotations
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament', 'MasterManager']}>
      <div className="p-6">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/invoiceit/quotations"
              className="inline-flex items-center gap-2 text-sm font-medium mb-4 hover:underline"
              style={{ color: 'var(--brand-secondary)' }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Quotations
            </Link>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Quotation {quotation.quotationNumber}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={quotation.status} type="quotation" />
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="px-4 py-2 rounded-xl font-medium text-white transition hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-secondary)' }}
                >
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </button>
                {quotation.status === 'accepted' && !quotation.convertedToInvoiceId && (
                  <button
                    onClick={convertToInvoice}
                    disabled={converting}
                    className="px-4 py-2 rounded-xl font-medium text-white transition hover:scale-105 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  >
                    {converting ? 'Converting…' : 'Convert to Invoice'}
                  </button>
                )}
                {quotation.convertedToInvoiceId && (
                  <Link
                    href={`/invoiceit/invoices/${quotation.convertedToInvoiceId}`}
                    className="px-4 py-2 rounded-xl font-medium text-white transition hover:scale-105"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  >
                    View Invoice
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Quotation Details Card */}
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    Quote To
                  </h3>
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {customer?.name || 'Unknown Customer'}
                  </p>
                  {customer?.companyName && (
                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{customer.companyName}</p>
                  )}
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{customer?.email}</p>
                  {customer?.phone && (
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{customer.phone}</p>
                  )}
                </div>

                {/* Quotation Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    Quotation Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Issue Date:</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(quotation.issueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Valid Until:</span>
                      <span className="text-sm font-medium" style={{ color: new Date(quotation.validUntil) < new Date() && quotation.status === 'sent' ? 'var(--status-error)' : 'var(--text-primary)' }}>
                        {formatDate(quotation.validUntil)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t pt-6" style={{ borderColor: 'var(--border-primary)' }}>
                <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  Items
                </h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                      <th className="text-left py-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Description</th>
                      <th className="text-right py-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Qty</th>
                      <th className="text-right py-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Unit Price</th>
                      <th className="text-right py-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item, index) => (
                      <tr key={index} className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                        <td className="py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{item.description}</td>
                        <td className="py-3 text-right text-sm" style={{ color: 'var(--text-secondary)' }}>{item.quantity}</td>
                        <td className="py-3 text-right text-sm" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 text-right text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="mt-6 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(quotation.subtotal)}</span>
                    </div>
                    {quotation.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tax ({quotation.taxRate}%):</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(quotation.tax)}</span>
                      </div>
                    )}
                    {quotation.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Discount:</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--status-error)' }}>-{formatCurrency(quotation.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total:</span>
                      <span className="font-bold text-lg" style={{ color: 'var(--brand-secondary)' }}>{formatCurrency(quotation.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes and Terms */}
              {(quotation.notes || quotation.terms) && (
                <div className="border-t pt-6 mt-6 space-y-4" style={{ borderColor: 'var(--border-primary)' }}>
                  {quotation.notes && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Notes</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{quotation.notes}</p>
                    </div>
                  )}
                  {quotation.terms && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Terms & Conditions</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{quotation.terms}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Update Card */}
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Update Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(['draft', 'sent', 'accepted', 'rejected', 'expired'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={updating || quotation.status === status}
                    className="px-4 py-3 rounded-xl font-medium text-sm transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: quotation.status === status ? 'var(--brand-secondary)' : 'var(--surface-secondary)',
                      color: quotation.status === status ? 'white' : 'var(--text-primary)',
                    }}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
