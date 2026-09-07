'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getAuthHeaders } from '@/lib/api-client';

type PackagePriceField = {
  key: string;
  label: string;
  description: string;
  defaultValue: number;
  value: number;
};

type PackagePriceExample = { players: number; price: number };

function formatCredits(amount: number) {
  return `${amount.toLocaleString()} credits`;
}

function OverlayPriceSettingsContent() {
  const [fields, setFields] = useState<PackagePriceField[]>([]);
  const [examples, setExamples] = useState<PackagePriceExample[]>([]);
  const [values, setValues] = useState<Record<string, number>>({});
  const [includedPlayers, setIncludedPlayers] = useState(150);
  const [playerBlockSize, setPlayerBlockSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const applyResponse = useCallback((data: any) => {
    const priceFields: PackagePriceField[] = data.fields ?? [];
    setFields(priceFields);
    setValues(Object.fromEntries(priceFields.map(field => [field.key, field.value])));
    setExamples(data.examples ?? []);
    setIncludedPlayers(data.includedPlayers ?? 150);
    setPlayerBlockSize(data.playerBlockSize ?? 50);
  }, []);

  const loadPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/overlay-prices', { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load package prices');
      applyResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load package prices');
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

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
      if (!res.ok) throw new Error(data.error || 'Failed to save package prices');
      applyResponse(data);
      setMessage('Package prices saved. New auction packages will use these charges.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save package prices');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setValues(Object.fromEntries(fields.map(field => [field.key, field.defaultValue])));
    setMessage(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Auction Package Price</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            One charge per tournament unlocks all overlay outputs. Amounts are wallet credits.
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
            {[0, 1].map(item => <div key={item} className="h-24 animate-pulse rounded-xl" style={{ backgroundColor: 'var(--surface-elevated)' }} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map(field => (
              <div key={field.key} className="grid gap-3 rounded-xl p-4 md:grid-cols-[1fr_180px] md:items-center" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{field.label}</p>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-tertiary)' }}>
                      Default {formatCredits(field.defaultValue)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{field.description}</p>
                  <p className="mt-2 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{field.key}</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Wallet credits</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={values[field.key] ?? 0}
                    onChange={event => setValues(prev => ({ ...prev, [field.key]: parseInt(event.target.value, 10) || 0 }))}
                    className="w-full rounded-lg px-3 py-2 text-sm font-semibold"
                    style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                  />
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>Set 0 to make this free.</p>
                </div>
              </div>
            ))}

            {examples.length > 0 && (
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>What operators will pay</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Based on the currently saved prices. First {includedPlayers} players included, then each block of {playerBlockSize}.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {examples.map(example => (
                    <div key={example.players} className="rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{example.players} players</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatCredits(example.price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            {saving ? 'Saving...' : 'Save Package Prices'}
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
