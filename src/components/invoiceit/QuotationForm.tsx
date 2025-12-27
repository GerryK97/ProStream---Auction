'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerSelector from './CustomerSelector';
import LineItemsTable, { LineItem } from './LineItemsTable';
import { Customer } from '@/types/invoicing';

interface QuotationFormProps {
  initialData?: any;
  quotationId?: string;
  mode: 'create' | 'edit';
}

export default function QuotationForm({ initialData, quotationId, mode }: QuotationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    customerId: initialData?.customerId || '',
    issueDate: initialData?.issueDate
      ? new Date(initialData.issueDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    validUntil: initialData?.validUntil
      ? new Date(initialData.validUntil).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: initialData?.status || 'draft',
    taxRate: initialData?.taxRate || 0,
    discount: initialData?.discount || 0,
    notes: initialData?.notes || '',
    terms: initialData?.terms || 'This quotation is valid for 30 days from the issue date.',
  });

  const [items, setItems] = useState<LineItem[]>(
    initialData?.items || [{ description: '', quantity: 1, unitPrice: 0, total: 0 }]
  );

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * (formData.taxRate / 100);
  const total = subtotal + tax - formData.discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const url = mode === 'create' ? '/api/quotations' : `/api/quotations/${quotationId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          items,
          taxRate: parseFloat(formData.taxRate.toString()),
          discount: parseFloat(formData.discount.toString()),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Quotation ${mode === 'create' ? 'created' : 'updated'} successfully!`);
        router.push('/invoiceit/quotations');
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${mode} quotation`);
      }
    } catch (error) {
      console.error(`Failed to ${mode} quotation:`, error);
      alert(`Failed to ${mode} quotation`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    const originalStatus = formData.status;
    setFormData({ ...formData, status: 'draft' });
    await handleSubmit(new Event('submit') as any);
    setFormData({ ...formData, status: originalStatus });
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
              '--tw-ring-color': 'var(--brand-secondary)',
            } as React.CSSProperties}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Valid Until *
          </label>
          <input
            type="date"
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--brand-secondary)',
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
              '--tw-ring-color': 'var(--brand-secondary)',
            } as React.CSSProperties}
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
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
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
              min="0"
              max="100"
              step="0.01"
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--brand-secondary)',
              } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Discount (LKR)
            </label>
            <input
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--brand-secondary)',
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
            <span className="text-2xl font-bold" style={{ color: 'var(--brand-secondary)' }}>
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
              '--tw-ring-color': 'var(--brand-secondary)',
            } as React.CSSProperties}
            placeholder="Additional notes for the customer..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Terms & Conditions
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
              '--tw-ring-color': 'var(--brand-secondary)',
            } as React.CSSProperties}
            placeholder="Terms and conditions..."
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
          style={{ backgroundColor: 'var(--brand-secondary)' }}
          disabled={loading}
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Quotation' : 'Update Quotation'}
        </button>
      </div>
    </form>
  );
}
