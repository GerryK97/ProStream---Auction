'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerSelector from './CustomerSelector';
import LineItemsTable, { LineItem } from './LineItemsTable';
import { Customer } from '@/types/invoicing';

interface InvoiceFormProps {
  initialData?: any;
  invoiceId?: string;
  mode: 'create' | 'edit';
}

export default function InvoiceForm({ initialData, invoiceId, mode }: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    customerId: initialData?.customerId || '',
    issueDate: initialData?.issueDate
      ? new Date(initialData.issueDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: initialData?.status || 'draft',
    taxRate: initialData?.taxRate || 0,
    discount: initialData?.discount || 0,
    notes: initialData?.notes || '',
    terms: initialData?.terms || 'Payment is due within 30 days',
  });

  const [items, setItems] = useState<LineItem[]>(
    initialData?.items || [{ description: '', quantity: 1, unitPrice: 0, total: 0 }]
  );

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * (formData.taxRate / 100);
  const total = subtotal + tax - formData.discount;

  const handleSubmit = async (e?: React.FormEvent, overrideStatus?: string) => {
    if (e) e.preventDefault();

    if (!formData.customerId) {
      alert('Please select a customer');
      return;
    }

    if (items.length === 0 || items.every((item) => !item.description)) {
      alert('Please add at least one line item');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const url = mode === 'create' ? '/api/invoices' : `/api/invoices/${invoiceId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          status: overrideStatus || formData.status,
          items,
          taxRate: parseFloat(formData.taxRate.toString()) || 0,
          discount: parseFloat(formData.discount.toString()) || 0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Invoice ${mode === 'create' ? 'created' : 'updated'} successfully!`);
        router.push('/invoiceit/invoices');
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${mode} invoice`);
      }
    } catch (error) {
      console.error(`Failed to ${mode} invoice:`, error);
      alert(`Failed to ${mode} invoice`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    await handleSubmit(undefined, 'draft');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection */}
      <CustomerSelector
        value={formData.customerId}
        onChange={(customerId) => setFormData({ ...formData, customerId })}
        onCustomerSelect={setSelectedCustomer}
      />

      {/* Selected Customer Details */}
      {selectedCustomer && (
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {selectedCustomer.name}
          </h3>
          {selectedCustomer.companyName && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {selectedCustomer.companyName}
            </p>
          )}
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {selectedCustomer.email}
          </p>
          {selectedCustomer.phone && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {selectedCustomer.phone}
            </p>
          )}
        </div>
      )}

      {/* Dates and Status */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Issue Date *
          </label>
          <input
            type="date"
            value={formData.issueDate}
            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--brand-primary)',
            } as React.CSSProperties}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Due Date *
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--brand-primary)',
            } as React.CSSProperties}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--brand-primary)',
            } as React.CSSProperties}
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Line Items
        </h3>
        <LineItemsTable items={items} onChange={setItems} />
      </div>

      {/* Tax, Discount, Totals */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Tax Rate (%)
            </label>
            <input
              type="number"
              value={formData.taxRate === 0 ? '' : formData.taxRate}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, taxRate: val === '' ? 0 : parseFloat(val) });
              }}
              min="0"
              max="100"
              step="0.01"
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--brand-primary)',
              } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Discount (LKR)
            </label>
            <input
              type="number"
              value={formData.discount === 0 ? '' : formData.discount}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, discount: val === '' ? 0 : parseFloat(val) });
              }}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--brand-primary)',
              } as React.CSSProperties}
            />
          </div>
        </div>

        <div
          className="p-6 rounded-lg border space-y-3"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              LKR {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Tax ({formData.taxRate}%):</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              LKR {tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {formData.discount > 0 && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Discount:</span>
              <span className="font-semibold" style={{ color: 'var(--status-error)' }}>
                - LKR {formData.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Total:
            </span>
            <span className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>
              LKR {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--brand-primary)',
            } as React.CSSProperties}
            placeholder="Additional notes for the customer..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Payment Terms
          </label>
          <textarea
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--brand-primary)',
            } as React.CSSProperties}
            placeholder="Payment terms and conditions..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-lg border font-medium transition hover:bg-surface-hover"
          style={{
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)',
          }}
          disabled={loading}
        >
          Cancel
        </button>

        {mode === 'create' && (
          <button
            type="button"
            onClick={handleSaveAsDraft}
            className="px-6 py-2 rounded-lg font-medium transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border-primary)',
              border: '1px solid',
              color: 'var(--text-primary)',
            }}
            disabled={loading}
          >
            Save as Draft
          </button>
        )}

        <button
          type="submit"
          className="px-6 py-2 rounded-lg font-medium text-white transition hover:opacity-90"
          style={{ backgroundColor: 'var(--brand-primary)' }}
          disabled={loading}
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Invoice' : 'Update Invoice'}
        </button>
      </div>
    </form>
  );
}
