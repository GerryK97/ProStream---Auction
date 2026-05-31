'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getAuthHeaders } from '@/lib/api-client';

type OverlayPriceRow = {
  type: string;
  key: string;
  label: string;
  shortLabel: string;
  useCase: string;
  defaultValue: number;
  value: number;
};

function formatAmount(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function OverlayPriceSettingsContent() {
  const [rows, setRows] = useState<OverlayPriceRow[]>([]);
  const [values, setValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/overlay-prices', { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load overlay prices');
      const priceRows: OverlayPriceRow[] = data.prices ?? [];
      setRows(priceRows);
      setValues(Object.fromEntries(priceRows.map(row => [row.key, row.value])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overlay prices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPrices();
  }, [loadPrices]);

  const savePrices = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/overlay-prices', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save overlay prices');
      const priceRows: OverlayPriceRow[] = data.prices ?? [];
      setRows(priceRows);
      setValues(Object.fromEntries(priceRows.map(row => [row.key, row.value])));
      setMessage('Overlay prices saved. New overlay generations will use these wallet charges.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save overlay prices');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setValues(Object.fromEntries(rows.map(row => [row.key, row.defaultValue])));
    setMessage(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Overlay Price Settings</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Admin-controlled wallet deduction amount for each auction overlay output.
          </p>
        </div>
        <Link href="/manage/overlays/sessions" className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
          Back to OBS Sessions
        </Link>
      </div>

      {error && <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: '#7f1d1d22', color: '#fca5a5', border: '1px solid #7f1d1d' }}>{error}</div>}
      {message && <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: '#14532d22', color: '#86efac', border: '1px solid #14532d' }}>{message}</div>}

      <form onSubmit={savePrices} className="rounded-2xl p-5" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map(item => <div key={item} className="h-20 animate-pulse rounded-xl" style={{ backgroundColor: 'var(--surface-elevated)' }} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(row => (
              <div key={row.key} className="grid gap-3 rounded-xl p-4 md:grid-cols-[1fr_180px] md:items-center" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{row.label}</p>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-tertiary)' }}>
                      Default {formatAmount(row.defaultValue)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{row.useCase}</p>
                  <p className="mt-2 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{row.key}</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Wallet charge</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={values[row.key] ?? 0}
                    onChange={event => setValues(prev => ({ ...prev, [row.key]: parseInt(event.target.value, 10) || 0 }))}
                    className="w-full rounded-lg px-3 py-2 text-sm font-semibold"
                    style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                  />
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>Set 0 to make this overlay free.</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:justify-end" style={{ borderColor: 'var(--border-primary)' }}>
          <button
            type="button"
            onClick={resetToDefaults}
            disabled={loading || saving}
            className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
            style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
          >
            Reset to Defaults
          </button>
          <button
            type="submit"
            disabled={loading || saving}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            {saving ? 'Saving...' : 'Save Overlay Prices'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function OverlayPriceSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <OverlayPriceSettingsContent />
    </ProtectedRoute>
  );
}
