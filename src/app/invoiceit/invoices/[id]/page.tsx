'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  amountPaid: number;
  balance: number;
  notes?: string;
  terms?: string;
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

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${params.id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }

      const data = await response.json();
      setInvoice(data.invoice);

      // Fetch customer details
      if (data.invoice.customerId) {
        const customerResponse = await fetch(`/api/customers/${data.invoice.customerId}`, {
          headers: getAuthHeaders(),
        });
        if (customerResponse.ok) {
          const customerData = await customerResponse.json();
          setCustomer(customerData.customer);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: Invoice['status']) => {
    if (!invoice) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const data = await response.json();
      setInvoice(data.invoice);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      setDownloading(true);
      const response = await fetch(`/api/invoices/${invoice._id}/pdf`, {
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
      a.download = `${invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
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

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['Admin', 'Tournament', 'MasterManager']}>
        <div className="p-6">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl p-12 border text-center" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Loading invoice...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !invoice) {
    return (
      <ProtectedRoute allowedRoles={['Admin', 'Tournament', 'MasterManager']}>
        <div className="p-6">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl p-12 border text-center" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-lg mb-4" style={{ color: 'var(--status-error)' }}>
                {error || 'Invoice not found'}
              </p>
              <Link href="/invoiceit/invoices" className="px-6 py-2 rounded-xl font-medium text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
                Back to Invoices
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
              href="/invoiceit/invoices"
              className="inline-flex items-center gap-2 text-sm font-medium mb-4 hover:underline"
              style={{ color: 'var(--brand-primary)' }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Invoices
            </Link>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Invoice {invoice.invoiceNumber}
              </h1>
              <div className="flex items-center gap-3">
                <StatusBadge status={invoice.status} type="invoice" />
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="px-4 py-2 rounded-xl font-medium text-white transition hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-6">
            {/* Invoice Details Card */}
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    Bill To
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

                {/* Invoice Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    Invoice Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Issue Date:</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(invoice.issueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Due Date:</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(invoice.dueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Amount Paid:</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--brand-secondary)' }}>{formatCurrency(invoice.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Balance Due:</span>
                      <span className="text-sm font-bold" style={{ color: invoice.balance > 0 ? 'var(--status-warning)' : 'var(--brand-secondary)' }}>
                        {formatCurrency(invoice.balance)}
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
                    {invoice.items.map((item, index) => (
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
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    {invoice.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tax ({invoice.taxRate}%):</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(invoice.tax)}</span>
                      </div>
                    )}
                    {invoice.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Discount:</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--status-error)' }}>-{formatCurrency(invoice.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total:</span>
                      <span className="font-bold text-lg" style={{ color: 'var(--brand-primary)' }}>{formatCurrency(invoice.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes and Terms */}
              {(invoice.notes || invoice.terms) && (
                <div className="border-t pt-6 mt-6 space-y-4" style={{ borderColor: 'var(--border-primary)' }}>
                  {invoice.notes && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Notes</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Terms & Conditions</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{invoice.terms}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Update Card */}
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-primary)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Update Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={updating || invoice.status === status}
                    className="px-4 py-3 rounded-xl font-medium text-sm transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: invoice.status === status ? 'var(--brand-primary)' : 'var(--surface-secondary)',
                      color: invoice.status === status ? 'white' : 'var(--text-primary)',
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
