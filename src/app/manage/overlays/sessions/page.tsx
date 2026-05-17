'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getAuthHeaders } from '@/lib/api-client';
import { useTournamentContext } from '@/contexts/TournamentContext';
import { useAuth } from '@/contexts/AuthContext';
import { OVERLAY_PALETTES } from '@/config/overlayPalettes';
import {
  AUCTION_OVERLAY_TYPES,
  AUCTION_OVERLAY_TYPE_KEYS,
  AuctionOverlayType,
  buildAuctionOverlayUrl,
  getAuctionOverlayConfig,
} from '@/lib/overlays/auctionOverlayTypes';

interface OverlaySession {
  _id: string;
  tournamentId: string;
  label: string;
  overlayType?: AuctionOverlayType;
  paymentStatus?: 'free' | 'paid' | 'refunded' | 'payment_failed';
  priceCharged?: number;
  walletTransactionId?: number | null;
  isActive: boolean;
  createdAt: string;
  revokedAt?: string;
}

type OverlayPrices = Record<AuctionOverlayType, number>;
type OverlayThemeId = keyof typeof OVERLAY_PALETTES;

const DEFAULT_PRICES: OverlayPrices = {
  custom: 500,
  fullscreen: 1000,
  fullscreen2: 1000,
  team_owners: 300,
};

const THEME_OPTIONS: Array<{ id: OverlayThemeId; label: string; description: string; available: boolean }> = [
  { id: 'standard', label: 'Theme 1 Classic', description: 'Broadcast-safe classic auction layout.', available: true },
  { id: 'theme2', label: 'Theme 2 Palette System', description: 'Palette-driven overlay design with stronger visual identity.', available: true },
  { id: 'premium', label: 'Premium', description: 'Coming soon.', available: false },
  { id: 'neon', label: 'Neon', description: 'Coming soon.', available: false },
];

function formatAmount(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function getOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

function sessionOverlayType(session: OverlaySession): AuctionOverlayType {
  return session.overlayType && session.overlayType in AUCTION_OVERLAY_TYPES ? session.overlayType : 'fullscreen';
}

function SessionsPage() {
  const { tournaments, loading: tournamentsLoading } = useTournamentContext();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<OverlaySession[]>([]);
  const [prices, setPrices] = useState<OverlayPrices>(DEFAULT_PRICES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createTournamentId, setCreateTournamentId] = useState('');
  const [selectedType, setSelectedType] = useState<AuctionOverlayType>('fullscreen');
  const [selectedTheme, setSelectedTheme] = useState<OverlayThemeId>('standard');
  const [selectedPalette, setSelectedPalette] = useState('default');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [justCreated, setJustCreated] = useState<OverlaySession | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const [confirmingRevoke, setConfirmingRevoke] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [showRevoked, setShowRevoked] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/overlay/sessions', { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch sessions');
      setSessions(data.sessions ?? []);
      setPrices({ ...DEFAULT_PRICES, ...(data.prices ?? {}) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const availablePalettes = OVERLAY_PALETTES[selectedTheme] || [];
  const selectedPaletteConfig = availablePalettes.find(p => p.id === selectedPalette) || availablePalettes[0];
  const selectedTypeConfig = getAuctionOverlayConfig(selectedType);
  const previewUrl = createTournamentId
    ? buildAuctionOverlayUrl(getOrigin(), createTournamentId, selectedType, undefined, {
        theme: selectedTheme,
        palette: selectedPaletteConfig?.id || selectedPalette,
        debug: true,
      })
    : '';

  useEffect(() => {
    const palettes = OVERLAY_PALETTES[selectedTheme] || [];
    if (!palettes.some(p => p.id === selectedPalette)) {
      setSelectedPalette(palettes[0]?.id || 'default');
    }
  }, [selectedTheme, selectedPalette]);

  const buildSessionUrl = (session: OverlaySession) => buildAuctionOverlayUrl(
    getOrigin(),
    session.tournamentId,
    sessionOverlayType(session),
    session._id,
    { theme: selectedTheme, palette: selectedPaletteConfig?.id || selectedPalette }
  );

  const handleCreate = async () => {
    if (!createTournamentId) return;
    setCreating(true);
    setCreateError(null);
    setJustCreated(null);
    try {
      const res = await fetch('/api/overlay/sessions', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: createTournamentId, overlayType: selectedType }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'insufficient_balance') {
          setCreateError(`Insufficient wallet balance. Required ${formatAmount(data.requiredAmount ?? 0)}, available ${formatAmount(data.currentBalance ?? 0)}.`);
        } else {
          setCreateError(data.message || data.error || 'Failed to create overlay');
        }
        return;
      }
      setJustCreated(data.session);
      const url = buildAuctionOverlayUrl(getOrigin(), data.session.tournamentId, sessionOverlayType(data.session), data.session._id, {
        theme: selectedTheme,
        palette: selectedPaletteConfig?.id || selectedPalette,
      });
      await copyToClipboard(url);
      await fetchSessions();
    } catch {
      setCreateError('An error occurred while creating the overlay. If wallet was deducted, the server will attempt an automatic refund.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (token: string) => {
    setConfirmingRevoke(null);
    setRevoking(token);
    setRevokeError(null);
    try {
      const res = await fetch(`/api/overlay/sessions/${token}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) { setRevokeError(data.error || 'Failed to revoke'); return; }
      if (justCreated?._id === token) setJustCreated(null);
      await fetchSessions();
    } catch {
      setRevokeError('An error occurred');
    } finally {
      setRevoking(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const activeSessions = sessions.filter(s => s.isActive);
  const revokedSessions = sessions.filter(s => !s.isActive);
  const formatDate = (iso: string) => new Date(iso).toLocaleString();
  const tournamentMap = Object.fromEntries(tournaments.map(t => [t._id, t]));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>OBS Sessions</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Generate paid overlay links with a selected layout, theme, and color palette.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user?.role === 'Admin' && (
            <Link href="/manage/overlay-prices" className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}>Manage Prices</Link>
          )}
          <Link href="/wallet" className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>View Wallet</Link>
        </div>
      </div>

      <section className="rounded-2xl p-5" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Generate Overlay Link</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Select the tournament, output layout, theme, and palette. Preview first, then generate and copy the OBS URL.
            </p>
          </div>
          {tournamentsLoading ? (
            <div className="h-10 w-full rounded-md animate-pulse lg:w-80" style={{ backgroundColor: 'var(--surface-elevated)' }} />
          ) : (
            <select
              value={createTournamentId}
              onChange={e => setCreateTournamentId(e.target.value)}
              className="w-full rounded-md p-2 text-sm lg:w-96"
              style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            >
              <option value="">— Select tournament —</option>
              {tournaments.map(t => <option key={t._id} value={t._id}>{t.name} ({t.year})</option>)}
            </select>
          )}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>1. Overlay layout</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {AUCTION_OVERLAY_TYPE_KEYS.map((type) => {
                  const config = getAuctionOverlayConfig(type);
                  const selected = selectedType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className="rounded-2xl p-4 text-left transition"
                      style={{ backgroundColor: selected ? `${config.accent}18` : 'var(--surface-elevated)', border: `1px solid ${selected ? config.accent : 'var(--border-primary)'}` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{config.label}</p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{config.useCase}</p>
                        </div>
                        <span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: `${config.accent}22`, color: config.accent }}>{formatAmount(prices[type] ?? 0)}</span>
                      </div>
                      <p className="mt-3 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>/overlays/:id{config.path || ''}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>2. Theme</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {THEME_OPTIONS.map(theme => {
                  const selected = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      disabled={!theme.available}
                      onClick={() => theme.available && setSelectedTheme(theme.id)}
                      className="rounded-2xl p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ backgroundColor: selected ? 'rgba(79,70,229,0.16)' : 'var(--surface-elevated)', border: `1px solid ${selected ? 'var(--brand-primary)' : 'var(--border-primary)'}` }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{theme.label}</p>
                        {!theme.available && <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Coming soon</span>}
                      </div>
                      <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{theme.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>3. Color palette</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {availablePalettes.length === 0 ? (
                  <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-tertiary)' }}>No palettes available for this theme yet.</div>
                ) : availablePalettes.map(palette => {
                  const selected = selectedPalette === palette.id;
                  const vars = palette.cssVars as Record<string, string>;
                  const swatches = ['--overlay-color-primary', '--overlay-bg-panel', '--overlay-text-bright', '--overlay-color-success']
                    .map(key => vars[key])
                    .filter(Boolean);
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => setSelectedPalette(palette.id)}
                      className="rounded-2xl p-4 text-left transition"
                      style={{ backgroundColor: selected ? 'rgba(79,70,229,0.16)' : 'var(--surface-elevated)', border: `1px solid ${selected ? 'var(--brand-primary)' : 'var(--border-primary)'}` }}
                    >
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{palette.name}</p>
                      <div className="mt-3 flex gap-1.5">
                        {swatches.slice(0, 4).map((color, index) => <span key={`${palette.id}-${index}`} className="h-6 w-8 rounded" style={{ background: color, border: '1px solid var(--border-primary)' }} />)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Live preview</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{selectedTypeConfig.label} · {selectedPaletteConfig?.name || selectedPalette}</p>
                </div>
                {previewUrl && <a href={previewUrl} target="_blank" className="text-xs font-semibold underline" style={{ color: 'var(--brand-primary)' }}>Open</a>}
              </div>
              <div className="aspect-video overflow-hidden rounded-xl" style={{ backgroundColor: '#020617', border: '1px solid var(--border-primary)' }}>
                {previewUrl ? (
                  <iframe title="Overlay preview" src={previewUrl} className="h-full w-full" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs" style={{ color: 'var(--text-tertiary)' }}>Select a tournament to preview</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Selected link settings</p>
              <dl className="mt-3 space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex justify-between gap-3"><dt>Layout</dt><dd>{selectedTypeConfig.label}</dd></div>
                <div className="flex justify-between gap-3"><dt>Theme</dt><dd>{THEME_OPTIONS.find(t => t.id === selectedTheme)?.label}</dd></div>
                <div className="flex justify-between gap-3"><dt>Palette</dt><dd>{selectedPaletteConfig?.name || selectedPalette}</dd></div>
                <div className="flex justify-between gap-3"><dt>Charge</dt><dd>{formatAmount(prices[selectedType] ?? 0)}</dd></div>
              </dl>
              <button
                onClick={handleCreate}
                disabled={creating || !createTournamentId || availablePalettes.length === 0}
                className="mt-4 w-full rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50"
                style={{ backgroundColor: selectedTypeConfig.accent, color: '#fff' }}
              >
                {creating ? 'Generating…' : 'Generate & Copy Link'}
              </button>
            </div>
          </aside>
        </div>

        {createError && <div className="mt-4 rounded-lg p-3 text-sm" style={{ backgroundColor: '#7f1d1d22', color: '#fca5a5', border: '1px solid #7f1d1d' }}>{createError} <Link href="/wallet" className="font-semibold underline">Open wallet</Link></div>}

        {justCreated && (
          <div className="mt-4 rounded-lg p-4 space-y-3" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--brand-primary)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>
              {getAuctionOverlayConfig(sessionOverlayType(justCreated)).label} generated for &quot;{justCreated.label}&quot;
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Theme: {selectedTheme} · Palette: {selectedPaletteConfig?.name || selectedPalette} · Charged: {formatAmount(justCreated.priceCharged ?? 0)} · Payment: {justCreated.paymentStatus ?? 'free'}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs truncate rounded px-2 py-1 font-mono" style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>{buildSessionUrl(justCreated)}</code>
              <button onClick={() => copyToClipboard(buildSessionUrl(justCreated))} className="shrink-0 px-3 py-1 rounded text-xs font-medium" style={{ backgroundColor: copiedUrl === buildSessionUrl(justCreated) ? '#16a34a' : 'var(--surface-card)', color: copiedUrl === buildSessionUrl(justCreated) ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>{copiedUrl === buildSessionUrl(justCreated) ? 'Copied!' : 'Copy URL'}</button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Active Overlay Outputs</h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>Copy actions use the currently selected theme and palette above.</p>
          </div>
          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#16a34a22', color: '#4ade80' }}>{activeSessions.length} active</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--brand-primary)' }} /></div>
        ) : error ? (
          <p className="p-4 text-red-400 text-sm">{error}</p>
        ) : activeSessions.length === 0 ? (
          <p className="p-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No active paid overlay outputs yet.</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
            {activeSessions.map(session => {
              const type = sessionOverlayType(session);
              const config = getAuctionOverlayConfig(type);
              const url = buildSessionUrl(session);
              const copied = copiedUrl === url;
              const tournament = tournamentMap[session.tournamentId];
              return (
                <li key={session._id} className="p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{session.label}</p>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${config.accent}22`, color: config.accent }}>{config.shortLabel}</span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: session.paymentStatus === 'paid' ? '#16a34a22' : 'var(--surface-elevated)', color: session.paymentStatus === 'paid' ? '#4ade80' : 'var(--text-muted)' }}>{session.paymentStatus ?? 'free'}</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{tournament ? `${tournament.name} (${tournament.year})` : 'Unknown tournament'} · Created {formatDate(session.createdAt)} · Charged {formatAmount(session.priceCharged ?? 0)}</p>
                      <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>Token: {session._id.slice(0, 8)}…</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <button onClick={() => copyToClipboard(url)} className="px-3 py-1.5 rounded text-xs font-medium transition-colors" style={{ backgroundColor: copied ? '#16a34a' : 'rgba(79,70,229,0.12)', color: copied ? '#fff' : 'var(--brand-primary)', border: '1px solid var(--brand-primary)' }}>{copied ? '✓ Copied URL' : '⧉ Copy current style URL'}</button>
                      {confirmingRevoke === session._id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleRevoke(session._id)} disabled={revoking === session._id} className="px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50" style={{ backgroundColor: '#991b1b', color: '#fca5a5', border: '1px solid #b91c1c' }}>{revoking === session._id ? 'Revoking…' : 'Yes, Revoke'}</button>
                          <button onClick={() => setConfirmingRevoke(null)} className="px-2 py-1.5 rounded text-xs" style={{ color: 'var(--text-tertiary)', border: '1px solid var(--border-primary)' }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmingRevoke(session._id)} disabled={revoking === session._id} className="px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50" style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b' }}>Revoke</button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {revokeError && <p className="px-4 pb-3 text-red-400 text-sm">{revokeError}</p>}
      </section>

      {revokedSessions.length > 0 && (
        <section className="rounded-2xl" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
          <button onClick={() => setShowRevoked(v => !v)} className="w-full flex items-center justify-between p-4 text-left">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Revoked Sessions ({revokedSessions.length})</span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{showRevoked ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showRevoked && (
            <ul className="divide-y" style={{ borderColor: 'var(--border-primary)', borderTop: '1px solid var(--border-primary)' }}>
              {revokedSessions.map(session => <li key={session._id} className="p-4 flex items-start justify-between gap-4"><div><p className="text-sm line-through" style={{ color: 'var(--text-tertiary)' }}>{session.label}</p><p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Created {formatDate(session.createdAt)}{session.revokedAt && ` · Revoked ${formatDate(session.revokedAt)}`}</p></div><span className="text-xs px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: '#7f1d1d22', color: '#f87171' }}>Revoked</span></li>)}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default function OverlaySessionsPageWrapper() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
      <SessionsPage />
    </ProtectedRoute>
  );
}
