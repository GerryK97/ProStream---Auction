'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getAuthHeaders } from '@/lib/api-client';
import { useTournamentContext } from '@/contexts/TournamentContext';
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

const DEFAULT_PRICES: OverlayPrices = {
  custom: 500,
  fullscreen: 1000,
  fullscreen2: 1000,
  team_owners: 300,
};

function formatAmount(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function getOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

function sessionOverlayType(session: OverlaySession): AuctionOverlayType {
  return session.overlayType && session.overlayType in AUCTION_OVERLAY_TYPES ? session.overlayType : 'fullscreen';
}

function buildSessionUrl(session: OverlaySession) {
  return buildAuctionOverlayUrl(getOrigin(), session.tournamentId, sessionOverlayType(session), session._id);
}

function SessionsPage() {
  const { tournaments, loading: tournamentsLoading } = useTournamentContext();

  const [sessions, setSessions] = useState<OverlaySession[]>([]);
  const [prices, setPrices] = useState<OverlayPrices>(DEFAULT_PRICES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createTournamentId, setCreateTournamentId] = useState('');
  const [creatingType, setCreatingType] = useState<AuctionOverlayType | null>(null);
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

  const handleCreate = async (overlayType: AuctionOverlayType) => {
    if (!createTournamentId) return;
    setCreatingType(overlayType);
    setCreateError(null);
    setJustCreated(null);
    try {
      const res = await fetch('/api/overlay/sessions', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: createTournamentId, overlayType }),
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
      await fetchSessions();
    } catch {
      setCreateError('An error occurred while creating the overlay. If wallet was deducted, the server will attempt an automatic refund.');
    } finally {
      setCreatingType(null);
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
            Tournaments and auction control remain free. Wallet is charged only when an overlay output is generated.
          </p>
        </div>
        <Link href="/wallet" className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
          View Wallet
        </Link>
      </div>

      <section className="rounded-2xl p-5" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Generate Paid Overlay</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Choose a tournament, then generate exactly one paid overlay output. Each generated URL has its own price and wallet transaction.
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
              {tournaments.map(t => (
                <option key={t._id} value={t._id}>{t.name} ({t.year})</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {AUCTION_OVERLAY_TYPE_KEYS.map((type) => {
            const config = getAuctionOverlayConfig(type);
            const creating = creatingType === type;
            return (
              <div key={type} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{config.label}</p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{config.useCase}</p>
                  </div>
                  <span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: `${config.accent}22`, color: config.accent }}>
                    {formatAmount(prices[type] ?? 0)}
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{config.pricingKey}</p>
                <button
                  onClick={() => handleCreate(type)}
                  disabled={!!creatingType || !createTournamentId}
                  className="mt-4 w-full rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50"
                  style={{ backgroundColor: config.accent, color: '#fff' }}
                >
                  {creating ? 'Generating…' : `Generate ${config.shortLabel}`}
                </button>
              </div>
            );
          })}
        </div>
        {createError && (
          <div className="mt-4 rounded-lg p-3 text-sm" style={{ backgroundColor: '#7f1d1d22', color: '#fca5a5', border: '1px solid #7f1d1d' }}>
            {createError} <Link href="/wallet" className="font-semibold underline">Open wallet</Link>
          </div>
        )}

        {justCreated && (
          <div className="mt-4 rounded-lg p-4 space-y-3" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--brand-primary)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>
              {getAuctionOverlayConfig(sessionOverlayType(justCreated)).label} generated for &quot;{justCreated.label}&quot;
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs truncate rounded px-2 py-1 font-mono" style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>
                {buildSessionUrl(justCreated)}
              </code>
              <button
                onClick={() => copyToClipboard(buildSessionUrl(justCreated))}
                className="shrink-0 px-3 py-1 rounded text-xs font-medium transition-colors"
                style={{ backgroundColor: copiedUrl === buildSessionUrl(justCreated) ? '#16a34a' : 'var(--surface-card)', color: copiedUrl === buildSessionUrl(justCreated) ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
              >
                {copiedUrl === buildSessionUrl(justCreated) ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Charged: {formatAmount(justCreated.priceCharged ?? 0)} · Payment: {justCreated.paymentStatus ?? 'free'}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Active Overlay Outputs</h2>
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
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {tournament ? `${tournament.name} (${tournament.year})` : 'Unknown tournament'} · Created {formatDate(session.createdAt)} · Charged {formatAmount(session.priceCharged ?? 0)}
                      </p>
                      <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>Token: {session._id.slice(0, 8)}…</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <button
                        onClick={() => copyToClipboard(url)}
                        className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                        style={{ backgroundColor: copied ? '#16a34a' : 'rgba(79,70,229,0.12)', color: copied ? '#fff' : 'var(--brand-primary)', border: '1px solid var(--brand-primary)' }}
                      >
                        {copied ? '✓ Copied URL' : '⧉ Copy URL'}
                      </button>
                      {confirmingRevoke === session._id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleRevoke(session._id)} disabled={revoking === session._id} className="px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50" style={{ backgroundColor: '#991b1b', color: '#fca5a5', border: '1px solid #b91c1c' }}>
                            {revoking === session._id ? 'Revoking…' : 'Yes, Revoke'}
                          </button>
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
              {revokedSessions.map(session => (
                <li key={session._id} className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm line-through" style={{ color: 'var(--text-tertiary)' }}>{session.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Created {formatDate(session.createdAt)}{session.revokedAt && ` · Revoked ${formatDate(session.revokedAt)}`}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: '#7f1d1d22', color: '#f87171' }}>Revoked</span>
                </li>
              ))}
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
