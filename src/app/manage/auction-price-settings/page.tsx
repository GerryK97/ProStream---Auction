'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { BidIncrementRange } from '@/types';
import { getAuthHeaders } from '@/lib/api-client';

interface AuctionPriceSettings {
  basePricePerPlayer: number;
  bidIncrements: BidIncrementRange[];
}

const DEFAULT_SETTINGS: AuctionPriceSettings = {
  basePricePerPlayer: 50000,
  bidIncrements: [
    { upTo: 50000, increment: 5000 },
    { upTo: 100000, increment: 10000 },
    { upTo: 200000, increment: 25000 },
  ],
};

function PriceSettingsPageContent() {
  const [settings, setSettings] = useState<AuctionPriceSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/auction-price-settings', { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to load price settings');
        const data = await res.json();
        setSettings({
          basePricePerPlayer: data.basePricePerPlayer ?? DEFAULT_SETTINGS.basePricePerPlayer,
          bidIncrements: data.bidIncrements?.length ? data.bidIncrements : DEFAULT_SETTINGS.bidIncrements,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load price settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateBracket = (index: number, field: keyof BidIncrementRange, value: number) => {
    setSettings(prev => ({
      ...prev,
      bidIncrements: prev.bidIncrements.map((row, i) => i === index ? { ...row, [field]: value } : row),
    }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/auction-price-settings', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save price settings');
      setSettings({
        basePricePerPlayer: data.basePricePerPlayer,
        bidIncrements: data.bidIncrements,
      });
      setMessage('Auction price settings saved. New tournaments will use these presets.');
    } catch (err: any) {
      setError(err.message || 'Failed to save price settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 p-6 text-gray-300">Loading price settings...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Auction Price Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Admin-managed default base price and team-bidding increment presets.</p>
        </div>

        {error && <div className="mb-4 rounded border border-red-700 bg-red-900/30 p-3 text-red-300 text-sm">{error}</div>}
        {message && <div className="mb-4 rounded border border-green-700 bg-green-900/30 p-3 text-green-300 text-sm">{message}</div>}

        <form onSubmit={save} className="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Default Base Price per Player</label>
            <input
              type="number"
              min={0}
              required
              value={settings.basePricePerPlayer}
              onChange={e => setSettings(prev => ({ ...prev, basePricePerPlayer: parseInt(e.target.value) || 0 }))}
              className="w-full max-w-xs bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Used as the default base price when an admin creates a new auction tournament.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Default Bid Increment Brackets</p>
                <p className="text-xs text-gray-500 mt-1">Used when Team Bidding is enabled for a tournament.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, bidIncrements: [...prev.bidIncrements, { upTo: 0, increment: 1000 }] }))}
                className="px-3 py-1.5 bg-orange-700 hover:bg-orange-600 text-white rounded text-xs font-medium"
              >
                + Add Range
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 px-1">
              <span>Up To</span>
              <span>Increment</span>
              <span />
            </div>

            {settings.bidIncrements.map((row, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 items-center bg-gray-700/50 rounded-lg p-2">
                <input
                  type="number"
                  min={0}
                  required
                  value={row.upTo || ''}
                  onChange={e => updateBracket(index, 'upTo', parseInt(e.target.value) || 0)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500"
                  placeholder="50000"
                />
                <input
                  type="number"
                  min={1}
                  required
                  value={row.increment || ''}
                  onChange={e => updateBracket(index, 'increment', parseInt(e.target.value) || 0)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500"
                  placeholder="5000"
                />
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, bidIncrements: prev.bidIncrements.filter((_, i) => i !== index) }))}
                  className="justify-self-end text-gray-400 hover:text-red-400 text-lg leading-none px-2"
                  title="Remove bracket"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-700 pt-5">
            <button
              type="button"
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
            >
              Reset to Built-in Preset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded text-sm font-medium"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AuctionPriceSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <PriceSettingsPageContent />
    </ProtectedRoute>
  );
}
