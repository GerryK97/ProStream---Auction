'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Tournament } from '@/types';
import { getAuthHeaders } from '@/lib/api-client';
import DeleteButton from '@/components/shared/DeleteButton';
import ImageUpload from '@/components/ImageUpload';

type ClassRow = { name: string; color: string; basePrice: number };

const DEFAULT_CLASS_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#E5E4E2', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa'];

const EMPTY_FORM = {
  name: '',
  year: new Date().getFullYear(),
  budgetPerTeam: 1000000,
  squadSize: 11,
  basePricePerPlayer: 50000,
  logoURL: '',
  basePriceStrategy: 'tournament-level' as 'tournament-level' | 'player-class-based',
  playerClasses: [] as ClassRow[],
};

function generateCodes(classes: ClassRow[]): string[] {
  const used = new Set<string>();
  return classes.map(cls => {
    const base = (cls.name.slice(0, 2).toUpperCase().replace(/[^A-Z]/g, 'X') || 'CL');
    let code = base;
    let n = 2;
    while (used.has(code)) { code = base + n++; }
    used.add(code);
    return code;
  });
}

function TournamentsManagePage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/tournaments/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete tournament');
        return;
      }
      setTournaments(prev => prev.filter(t => t._id !== id));
    } catch {
      setError('An error occurred while deleting the tournament');
    }
  };

  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tournaments', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch tournaments');
      const data = await res.json();
      setTournaments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const addClass = () => {
    if (form.playerClasses.length >= 20) return;
    const color = DEFAULT_CLASS_COLORS[form.playerClasses.length % DEFAULT_CLASS_COLORS.length];
    setForm(f => ({ ...f, playerClasses: [...f.playerClasses, { name: '', color, basePrice: f.basePricePerPlayer }] }));
  };

  const updateClass = (index: number, field: keyof ClassRow, value: string | number) => {
    setForm(f => {
      const updated = f.playerClasses.map((cls, i) => i === index ? { ...cls, [field]: value } : cls);
      return { ...f, playerClasses: updated };
    });
  };

  const removeClass = (index: number) => {
    setForm(f => ({ ...f, playerClasses: f.playerClasses.filter((_, i) => i !== index) }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (form.basePriceStrategy === 'player-class-based') {
      if (form.playerClasses.length === 0) {
        setCreateError('Add at least one player class for class-wise pricing.');
        return;
      }
      const invalid = form.playerClasses.find(cls => !cls.name.trim() || cls.basePrice <= 0);
      if (invalid) {
        setCreateError('Each class must have a name and a base price greater than 0.');
        return;
      }
    }

    setCreating(true);
    try {
      const useClasses = form.basePriceStrategy === 'player-class-based' && form.playerClasses.length > 0;
      const codes = useClasses ? generateCodes(form.playerClasses) : [];

      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          year: form.year,
          budgetPerTeam: form.budgetPerTeam,
          squadSize: form.squadSize,
          basePricePerPlayer: form.basePricePerPlayer,
          logoURL: form.logoURL.trim() || undefined,
          basePriceStrategy: form.basePriceStrategy,
          usePlayerClasses: useClasses,
          playerClasses: useClasses
            ? form.playerClasses.map((cls, i) => ({
                code: codes[i],
                name: cls.name.trim(),
                color: cls.color,
                basePrice: cls.basePrice,
                order: i + 1,
              }))
            : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create tournament');
        return;
      }
      setTournaments(prev => [data, ...prev]);
      setShowCreate(false);
      setForm(EMPTY_FORM);
    } catch {
      setCreateError('An error occurred while creating the tournament');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: Tournament['status']) => {
    const map: Record<string, string> = {
      Draft: 'bg-gray-600 text-gray-200',
      Setup: 'bg-blue-700 text-blue-100',
      Pending: 'bg-yellow-700 text-yellow-100',
      Live: 'bg-green-700 text-green-100',
      Paused: 'bg-orange-700 text-orange-100',
      Stopped: 'bg-red-800 text-red-100',
      Completed: 'bg-purple-700 text-purple-100',
      Archived: 'bg-gray-700 text-gray-400',
    };
    return map[status] || 'bg-gray-600 text-gray-200';
  };

  const isClassWise = form.basePriceStrategy === 'player-class-based';

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Tournaments</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your leagues and series</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowCreate(true); setCreateError(null); setForm(EMPTY_FORM); }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
            >
              + Create Tournament
            </button>
            <button
              onClick={() => router.push('/manage/teams')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center gap-2"
            >
              Continue to Teams →
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && tournaments.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No tournaments yet. Click &quot;Create Tournament&quot; to get started.</p>
          </div>
        )}

        {!loading && tournaments.length > 0 && (
          <div className="grid gap-4">
            {tournaments.map((t) => (
              <div
                key={t._id}
                className="bg-gray-800 rounded-lg p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {t.logoURL && (
                    <img src={t.logoURL} alt={t.name} className="w-12 h-12 rounded object-cover" />
                  )}
                  <div>
                    <h2 className="text-white font-semibold text-lg">{t.name}</h2>
                    <p className="text-gray-400 text-sm">{t.year}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>Budget: {t.budgetPerTeam?.toLocaleString()}</span>
                      <span>•</span>
                      <span>Squad: {t.squadSize}</span>
                      <span>•</span>
                      {t.usePlayerClasses && t.playerClasses?.length
                        ? <span className="text-purple-300">Class-wise pricing ({t.playerClasses.length} classes)</span>
                        : <span>Base: {t.basePricePerPlayer?.toLocaleString()}</span>
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(t.status)}`}>
                    {t.status}
                  </span>
                  <button
                    onClick={() => router.push(
                      ['Live', 'Stopped', 'Completed', 'Archived'].includes(t.status)
                        ? '/auction'
                        : '/manage/teams'
                    )}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                  >
                    {['Live', 'Stopped'].includes(t.status) ? 'Control Room' : 'Setup →'}
                  </button>
                  <DeleteButton
                    ariaLabel={`Delete ${t.name}`}
                    onClick={() => handleDelete(t._id, t.name)}
                    className="shrink-0"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Tournament Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-700 shrink-0">
              <h2 className="text-lg font-semibold text-white">Create Tournament</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleCreate} className="overflow-y-auto">
              <div className="p-5 space-y-5">
                {createError && (
                  <div className="bg-red-900/30 border border-red-700 rounded p-3 text-red-300 text-sm">{createError}</div>
                )}

                {/* Basic fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Tournament Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="e.g. Premier Cricket League"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Year *</label>
                    <input
                      type="number"
                      required
                      value={form.year}
                      onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Squad Size *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={form.squadSize}
                      onChange={e => setForm(f => ({ ...f, squadSize: parseInt(e.target.value) || 1 }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Budget per Team *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={form.budgetPerTeam}
                      onChange={e => setForm(f => ({ ...f, budgetPerTeam: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      {isClassWise ? 'Fallback Base Price *' : 'Base Price per Player *'}
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={form.basePricePerPlayer}
                      onChange={e => setForm(f => ({ ...f, basePricePerPlayer: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    {isClassWise && (
                      <p className="text-xs text-gray-500 mt-1">Used for players not assigned a class</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <ImageUpload
                      value={form.logoURL}
                      onChange={url => setForm(f => ({ ...f, logoURL: url }))}
                      folder="tournaments"
                      label="Tournament Logo (optional)"
                      placeholder="Logo URL"
                      previewClassName="w-16 h-16"
                      previewShape="square"
                      id="tournament-logo-create"
                    />
                  </div>
                </div>

                {/* Base Price Strategy */}
                <div className="border border-gray-700 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-white">Base Price Strategy</p>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="basePriceStrategy"
                        value="tournament-level"
                        checked={form.basePriceStrategy === 'tournament-level'}
                        onChange={() => setForm(f => ({ ...f, basePriceStrategy: 'tournament-level', playerClasses: [] }))}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm text-white font-medium">Tournament-wide</p>
                        <p className="text-xs text-gray-400">Single base price applies to all players</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="basePriceStrategy"
                        value="player-class-based"
                        checked={form.basePriceStrategy === 'player-class-based'}
                        onChange={() => setForm(f => ({ ...f, basePriceStrategy: 'player-class-based' }))}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm text-white font-medium">Class-wise</p>
                        <p className="text-xs text-gray-400">Each player class has its own base price</p>
                      </div>
                    </label>
                  </div>

                  {/* Player Classes Config */}
                  {isClassWise && (
                    <div className="space-y-3 pt-2 border-t border-gray-700">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-purple-300">
                          Player Classes ({form.playerClasses.length}/20)
                        </p>
                        <button
                          type="button"
                          onClick={addClass}
                          disabled={form.playerClasses.length >= 20}
                          className="px-3 py-1 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white rounded text-xs font-medium"
                        >
                          + Add Class
                        </button>
                      </div>

                      {form.playerClasses.length === 0 && (
                        <p className="text-xs text-gray-500 italic">No classes added yet. Click &quot;Add Class&quot; to create one.</p>
                      )}

                      <div className="space-y-2">
                        {form.playerClasses.map((cls, i) => (
                          <div key={i} className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-2">
                            {/* Color picker */}
                            <input
                              type="color"
                              value={cls.color}
                              onChange={e => updateClass(i, 'color', e.target.value)}
                              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                              title="Class color"
                            />
                            {/* Name */}
                            <input
                              type="text"
                              value={cls.name}
                              onChange={e => updateClass(i, 'name', e.target.value)}
                              placeholder="Class name"
                              required={isClassWise}
                              className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500 min-w-0"
                            />
                            {/* Base Price */}
                            <input
                              type="number"
                              value={cls.basePrice}
                              onChange={e => updateClass(i, 'basePrice', parseInt(e.target.value) || 0)}
                              min={0}
                              required={isClassWise}
                              className="w-32 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500 shrink-0"
                              placeholder="Base price"
                            />
                            {/* Remove */}
                            <button
                              type="button"
                              onClick={() => removeClass(i)}
                              className="shrink-0 text-gray-400 hover:text-red-400 text-lg leading-none px-1"
                              title="Remove class"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-5 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded text-sm font-medium"
                >
                  {creating ? 'Creating...' : 'Create Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TournamentsPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
      <TournamentsManagePage />
    </ProtectedRoute>
  );
}
