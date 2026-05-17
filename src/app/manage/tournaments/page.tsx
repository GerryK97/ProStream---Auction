'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Tournament, BidIncrementRange, StatFieldDef } from '@/types';
import { getAuthHeaders } from '@/lib/api-client';
import DeleteButton from '@/components/shared/DeleteButton';
import ImageUpload from '@/components/ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useTournamentContext } from '@/contexts/TournamentContext';

type ClassRow = { name: string; color: string; basePrice: number; code?: string };
type TournamentWithCreator = Tournament & { createdByUsername?: string };

const DEFAULT_CLASS_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#E5E4E2', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa'];

const sortTournamentsByStatus = (items: TournamentWithCreator[]) => {
  const statusPriority: Record<string, number> = {
    Live: 0,
    Stopped: 1,
    Draft: 2,
    Completed: 3,
  };

  return [...items].sort((a, b) => {
    const priorityA = statusPriority[a.status] ?? 2;
    const priorityB = statusPriority[b.status] ?? 2;
    if (priorityA !== priorityB) return priorityA - priorityB;

    // Keep ordering stable and predictable within the same status group
    return b.year - a.year || a.name.localeCompare(b.name);
  });
};

const DEFAULT_BID_INCREMENTS: BidIncrementRange[] = [
  { upTo: 50000, increment: 5000 },
  { upTo: 100000, increment: 10000 },
  { upTo: 200000, increment: 25000 },
];

const EMPTY_FORM = {
  name: '',
  year: new Date().getFullYear(),
  budgetPerTeam: 1000000,
  squadSize: 11,
  basePricePerPlayer: 50000,
  logoURL: '',
  wheelCenterImageURL: '',
  basePriceStrategy: 'tournament-level' as 'tournament-level' | 'player-class-based',
  playerClasses: [] as ClassRow[],
  biddingMode: 'direct' as 'direct' | 'team',
  bidIncrements: [] as BidIncrementRange[],
  playerProfileFields: { showAge: false, showBattingStyle: false, showBowlingStyle: false, statFields: [] as StatFieldDef[] },
};

function generateCodes(classes: ClassRow[]): string[] {
  const used = new Set(classes.filter(c => c.code).map(c => c.code!));
  return classes.map(cls => {
    if (cls.code) return cls.code;
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
  const { user: currentUser } = useAuth();
  const { refreshTournaments: refreshTournamentContext } = useTournamentContext();
  const [tournaments, setTournaments] = useState<TournamentWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create/Edit modal state
  const [showCreate, setShowCreate] = useState(false);
  const [editingTournament, setEditingTournament] = useState<TournamentWithCreator | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [pendingAccessNotice, setPendingAccessNotice] = useState(false);
  const [auctionPriceSettings, setAuctionPriceSettings] = useState({
    basePricePerPlayer: EMPTY_FORM.basePricePerPlayer,
    bidIncrements: DEFAULT_BID_INCREMENTS,
  });

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
      await refreshTournamentContext();
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
      setTournaments(sortTournamentsByStatus(data));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchAuctionPriceSettings = async () => {
      try {
        const res = await fetch('/api/admin/auction-price-settings', { headers: getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        setAuctionPriceSettings({
          basePricePerPlayer: data.basePricePerPlayer ?? EMPTY_FORM.basePricePerPlayer,
          bidIncrements: data.bidIncrements?.length ? data.bidIncrements : DEFAULT_BID_INCREMENTS,
        });
      } catch {
        // Keep built-in defaults if settings are unavailable.
      }
    };
    fetchAuctionPriceSettings();
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const openEdit = (t: TournamentWithCreator) => {
    setEditingTournament(t);
    setCreateError(null);
    setForm({
      name: t.name,
      year: t.year,
      budgetPerTeam: t.budgetPerTeam,
      squadSize: t.squadSize,
      basePricePerPlayer: t.basePricePerPlayer,
      logoURL: t.logoURL ?? '',
      wheelCenterImageURL: t.wheelCenterImageURL ?? '',
      basePriceStrategy: t.basePriceStrategy ?? 'tournament-level',
      playerClasses: (t.playerClasses ?? []).map(cls => ({
        name: cls.name,
        color: cls.color,
        basePrice: cls.basePrice ?? 0,
        code: cls.code,
      })),
      biddingMode: t.biddingMode ?? 'direct',
      bidIncrements: t.bidIncrements ?? [],
      playerProfileFields: t.playerProfileFields ?? { showAge: false, showBattingStyle: false, showBowlingStyle: false, statFields: [] },
    });
    setShowCreate(true);
  };

  const closeModal = () => {
    setShowCreate(false);
    setEditingTournament(null);
    setForm({
      ...EMPTY_FORM,
      basePricePerPlayer: auctionPriceSettings.basePricePerPlayer,
      bidIncrements: auctionPriceSettings.bidIncrements,
      wheelCenterImageURL: currentUser?.logoURL || '',
    });
    setCreateError(null);
  };

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

  const validateForm = (): string | null => {
    if (form.basePriceStrategy === 'player-class-based') {
      if (form.playerClasses.length === 0) return 'Add at least one player class for class-wise pricing.';
      const invalid = form.playerClasses.find(cls => !cls.name.trim() || cls.basePrice <= 0);
      if (invalid) return 'Each class must have a name and a base price greater than 0.';
    }
    return null;
  };

  const buildPayload = () => {
    const useClasses = form.basePriceStrategy === 'player-class-based' && form.playerClasses.length > 0;
    const codes = useClasses ? generateCodes(form.playerClasses) : [];
    // Sort bid increments by upTo ascending for clean storage
    const sortedIncrements = [...form.bidIncrements].sort((a, b) => a.upTo - b.upTo);
    return {
      name: form.name,
      year: form.year,
      budgetPerTeam: form.budgetPerTeam,
      squadSize: form.squadSize,
      basePricePerPlayer: form.basePricePerPlayer,
      logoURL: form.logoURL.trim() || undefined,
      wheelCenterImageURL: form.wheelCenterImageURL.trim() || undefined,
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
      biddingMode: form.biddingMode,
      bidIncrements: form.biddingMode === 'team' ? sortedIncrements : [],
      playerProfileFields: {
        showAge: form.playerProfileFields.showAge,
        showBattingStyle: form.playerProfileFields.showBattingStyle,
        showBowlingStyle: form.playerProfileFields.showBowlingStyle,
        statFields: form.playerProfileFields.statFields
          .filter(sf => sf.label.trim())
          .map(sf => ({
            label: sf.label.trim(),
            key: sf.label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
          })),
      },
    };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { setCreateError(validationError); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Failed to create tournament'); return; }
      setTournaments(prev => sortTournamentsByStatus([data, ...prev]));
      await refreshTournamentContext();
      closeModal();
      if (currentUser?.role !== 'Admin') setPendingAccessNotice(true);
    } catch {
      setCreateError('An error occurred while creating the tournament');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament) return;
    const validationError = validateForm();
    if (validationError) { setCreateError(validationError); return; }
    setCreating(true);
    try {
      const res = await fetch(`/api/tournaments/${editingTournament._id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Failed to update tournament'); return; }
      setTournaments(prev => sortTournamentsByStatus(prev.map(t => t._id === data._id ? data : t)));
      await refreshTournamentContext();
      closeModal();
    } catch {
      setCreateError('An error occurred while updating the tournament');
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
  const isEditing = !!editingTournament;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Tournaments</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your leagues and series</p>
          </div>
          <div className="flex items-center gap-3">
            {currentUser?.role === 'Admin' && (
              <button
                onClick={() => router.push('/manage/auction-price-settings')}
                className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded font-medium"
              >
                Price Settings
              </button>
            )}
            <button
              onClick={() => {
                setShowCreate(true);
                setCreateError(null);
                setEditingTournament(null);
                setForm({
                  ...EMPTY_FORM,
                  basePricePerPlayer: auctionPriceSettings.basePricePerPlayer,
                  bidIncrements: auctionPriceSettings.bidIncrements,
                  wheelCenterImageURL: currentUser?.logoURL || '',
                });
              }}
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

        {pendingAccessNotice && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 flex items-start justify-between gap-3 mb-2">
            <p className="text-yellow-200 text-sm">
              <strong>Tournament created.</strong> It will be visible to you once an Admin grants you access.
            </p>
            <button onClick={() => setPendingAccessNotice(false)} className="text-yellow-400 hover:text-white shrink-0 text-lg leading-none">&times;</button>
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
                    {t.createdByUsername && (
                      <p className="text-gray-500 text-xs mt-1">Created by: {t.createdByUsername}</p>
                    )}
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
                  {currentUser?.role === 'Admin' && (
                    <button
                      onClick={() => router.push(`/manage/tournaments/${t._id}/access`)}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                      title="Manage user access"
                    >
                      Access
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(t)}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                  >
                    Edit
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

      {/* Create / Edit Tournament Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-700 shrink-0">
              <h2 className="text-lg font-semibold text-white">{isEditing ? 'Edit Tournament' : 'Create Tournament'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={isEditing ? handleUpdate : handleCreate} className="overflow-y-auto">
              <div className="p-5 space-y-5">
                {createError && (
                  <div className="bg-red-900/30 border border-red-700 rounded p-3 text-red-300 text-sm">{createError}</div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                <div className="space-y-5">

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
                  <div className="col-span-2">
                    <ImageUpload
                      value={form.wheelCenterImageURL}
                      onChange={url => setForm(f => ({ ...f, wheelCenterImageURL: url }))}
                      folder="tournaments"
                      label="Auctioner/Streamer Logo (optional)"
                      placeholder="Auctioner/Streamer logo URL"
                      previewClassName="w-16 h-16"
                      previewShape="circle"
                      id="tournament-wheel-center-create"
                      profileImageUrl={currentUser?.logoURL}
                      onUseProfileImage={() => setForm(f => ({ ...f, wheelCenterImageURL: currentUser?.logoURL || '' }))}
                      profileButtonText="Add from profile"
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
                <div className="space-y-5">

                {/* Bidding Mode */}
                <div className="border border-gray-700 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-white">Bidding Mode</p>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="biddingMode"
                        value="direct"
                        checked={form.biddingMode === 'direct'}
                        onChange={() => setForm(f => ({ ...f, biddingMode: 'direct' }))}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm text-white font-medium">Direct Bidding</p>
                        <p className="text-xs text-gray-400">Auctioneer types or picks any bid amount manually</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="biddingMode"
                        value="team"
                        checked={form.biddingMode === 'team'}
                        onChange={() => setForm(f => ({
                          ...f,
                          biddingMode: 'team',
                          // Set default brackets if none yet
                          bidIncrements: f.bidIncrements.length > 0 ? f.bidIncrements : auctionPriceSettings.bidIncrements,
                        }))}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm text-white font-medium">Team Bidding</p>
                        <p className="text-xs text-gray-400">Each team gets a bid button; increments auto-increase by preset bracket</p>
                      </div>
                    </label>
                  </div>

                  {/* Bracket Builder — only shown in team mode */}
                  {form.biddingMode === 'team' && (
                    <div className="space-y-3 pt-2 border-t border-gray-700">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-orange-300">Bid Increment Brackets</p>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({
                            ...f,
                            bidIncrements: [...f.bidIncrements, { upTo: 0, increment: 0 }],
                          }))}
                          className="px-3 py-1 bg-orange-700 hover:bg-orange-600 text-white rounded text-xs font-medium"
                        >
                          + Add Range
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">Each row defines: when bid is below "Up To", the increment used. Last row acts as the catch-all.</p>
                      <div className="grid grid-cols-3 gap-1 text-xs text-gray-400 px-1">
                        <span>Up To (₹)</span>
                        <span>Increment (₹)</span>
                        <span></span>
                      </div>
                      {form.bidIncrements.length === 0 && (
                        <p className="text-xs text-gray-500 italic">No brackets yet. Click "+ Add Range" to add one.</p>
                      )}
                      <div className="space-y-2">
                        {form.bidIncrements.map((br, i) => (
                          <div key={i} className="grid grid-cols-3 gap-2 items-center bg-gray-700/50 rounded-lg p-2">
                            <input
                              type="number"
                              value={br.upTo || ''}
                              min={0}
                              onChange={e => setForm(f => {
                                const updated = f.bidIncrements.map((b, j) => j === i ? { ...b, upTo: parseInt(e.target.value) || 0 } : b);
                                return { ...f, bidIncrements: updated };
                              })}
                              placeholder="e.g. 50000"
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500"
                            />
                            <input
                              type="number"
                              value={br.increment || ''}
                              min={1}
                              onChange={e => setForm(f => {
                                const updated = f.bidIncrements.map((b, j) => j === i ? { ...b, increment: parseInt(e.target.value) || 0 } : b);
                                return { ...f, bidIncrements: updated };
                              })}
                              placeholder="e.g. 5000"
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500"
                            />
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, bidIncrements: f.bidIncrements.filter((_, j) => j !== i) }))}
                              className="text-gray-400 hover:text-red-400 text-lg leading-none px-1 justify-self-end"
                              title="Remove bracket"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Player Profile Fields */}
                <div className="border border-gray-700 rounded-lg p-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-white">Player Profile Fields</p>
                    <p className="text-xs text-gray-400 mt-1">Select which optional fields appear in the player form and on the Screen 1 overlay.</p>
                  </div>

                  {/* Age toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.playerProfileFields.showAge}
                      onChange={e => setForm(f => ({ ...f, playerProfileFields: { ...f.playerProfileFields, showAge: e.target.checked } }))}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <div>
                      <p className="text-sm text-white font-medium">Show Age field</p>
                      <p className="text-xs text-gray-400">Adds Age input to player form and overlay card</p>
                    </div>
                  </label>

                  {/* Batting Style toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.playerProfileFields.showBattingStyle}
                      onChange={e => setForm(f => ({ ...f, playerProfileFields: { ...f.playerProfileFields, showBattingStyle: e.target.checked } }))}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <div>
                      <p className="text-sm text-white font-medium">Show Batting Style field</p>
                      <p className="text-xs text-gray-400">Adds Batting Style dropdown to player form and overlay card</p>
                    </div>
                  </label>

                  {/* Bowling Style toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.playerProfileFields.showBowlingStyle}
                      onChange={e => setForm(f => ({ ...f, playerProfileFields: { ...f.playerProfileFields, showBowlingStyle: e.target.checked } }))}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <div>
                      <p className="text-sm text-white font-medium">Show Bowling Style field</p>
                      <p className="text-xs text-gray-400">Adds Bowling Style dropdown to player form and overlay card</p>
                    </div>
                  </label>

                  {/* Stat fields */}
                  <div className="space-y-2 pt-3 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-cyan-300">
                        Stat Fields ({form.playerProfileFields.statFields.length}/4)
                      </p>
                      <button
                        type="button"
                        disabled={form.playerProfileFields.statFields.length >= 4}
                        onClick={() => setForm(f => ({ ...f, playerProfileFields: { ...f.playerProfileFields, statFields: [...f.playerProfileFields.statFields, { label: '', key: '' }] } }))}
                        className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white rounded text-xs font-medium"
                      >
                        + Add Stat
                      </button>
                    </div>
                    {form.playerProfileFields.statFields.length === 0 && (
                      <p className="text-xs text-gray-500 italic">No stat fields. Click &quot;+ Add Stat&quot; to add custom stats (e.g. Matches, Runs, Wickets).</p>
                    )}
                    <div className="space-y-2">
                      {form.playerProfileFields.statFields.map((sf, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-2">
                          <input
                            type="text"
                            value={sf.label}
                            onChange={e => setForm(f => {
                              const updated = f.playerProfileFields.statFields.map((s, j) => j === i ? { ...s, label: e.target.value } : s);
                              return { ...f, playerProfileFields: { ...f.playerProfileFields, statFields: updated } };
                            })}
                            placeholder="e.g. Matches, Runs, Goals"
                            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, playerProfileFields: { ...f.playerProfileFields, statFields: f.playerProfileFields.statFields.filter((_, j) => j !== i) } }))}
                            className="shrink-0 text-gray-400 hover:text-red-400 text-lg leading-none px-1"
                            title="Remove stat"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-5 border-t border-gray-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded text-sm font-medium"
                >
                  {creating
                    ? (isEditing ? 'Saving...' : 'Creating...')
                    : (isEditing ? 'Save Changes' : 'Create Tournament')}
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
