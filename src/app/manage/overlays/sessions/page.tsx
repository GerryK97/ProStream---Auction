'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getAuthHeaders } from '@/lib/api-client';
import { useTournamentContext } from '@/contexts/TournamentContext';

interface OverlaySession {
  _id: string;          // the token
  tournamentId: string;
  label: string;
  isActive: boolean;
  createdAt: string;
  revokedAt?: string;
}

const OVERLAY_TYPES = [
  { label: 'Full Screen', copyLabel: 'Full Screen', path: '' },
  { label: 'Custom', copyLabel: 'OBS', path: '/custom' },
  { label: 'Full Screen 2', copyLabel: 'Full Screen 2', path: '/fullscreen2' },
  { label: 'Team Owner', copyLabel: 'Team Owner Link', path: '/team-owner' },
] as const;

function buildOverlayUrl(tournamentId: string, overlayPath: string, token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/overlays/${tournamentId}${overlayPath}?token=${token}`;
}

function SessionsPage() {
  const { tournaments, loading: tournamentsLoading } = useTournamentContext();

  const [sessions, setSessions] = useState<OverlaySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form — tournament selector + button
  const [createTournamentId, setCreateTournamentId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Newly created session (show URL copy prompt)
  const [justCreated, setJustCreated] = useState<OverlaySession | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Revoke state
  const [confirmingRevoke, setConfirmingRevoke] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  // Show/hide revoked history
  const [showRevoked, setShowRevoked] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/overlay/sessions', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreate = async () => {
    if (!createTournamentId) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/overlay/sessions', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: createTournamentId }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Failed to create session'); return; }
      setJustCreated(data.session);
      await fetchSessions();
    } catch {
      setCreateError('An error occurred');
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
      // ignore
    }
  };

  const [copiedAll, setCopiedAll] = useState<string | null>(null);

  const copyAllUrls = async (session: OverlaySession) => {
    const urls = OVERLAY_TYPES.map(type =>
      `${type.copyLabel} : ${buildOverlayUrl(session.tournamentId, type.path, session._id)}`
    ).join('\n');
    const text = `🎙️ ProStream Overlay URLs — ${session.label}
${'─'.repeat(60)}
${urls}

${'─'.repeat(60)}
📺 OBS SETUP INSTRUCTIONS

1. Open OBS Studio and click + in the Sources panel.
2. Select "Browser" as the source type.
3. Paste one of the URLs above into the URL field.
4. Set Width: 1920 and Height: 1080.
5. Tick "Shutdown source when not visible".
6. Tick "Refresh browser when scene becomes active".
7. Click OK. The overlay will go live once the tournament
   is set to Live status.

💡 Tips:
• Use the Full Screen or Full Screen 2 URL for a standalone
  full-screen overlay scene.
• Use the Custom (OBS) URL as a transparent browser source
  layered over your game or video capture at 1920×1080.
• Use the Team Owner Link to share with team owners —
  it's mobile-friendly and works in any browser.
• Append &debug=true to any URL to show a live connection
  status panel in the top-right corner.
${'─'.repeat(60)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(session._id);
      setTimeout(() => setCopiedAll(null), 2000);
    } catch {
      // ignore
    }
  };

  const activeSessions = sessions.filter(s => s.isActive);
  const revokedSessions = sessions.filter(s => !s.isActive);
  const formatDate = (iso: string) => new Date(iso).toLocaleString();

  // Group active sessions by tournament
  const tournamentMap = Object.fromEntries(tournaments.map(t => [t._id, t]));
  const grouped = tournaments
    .map(t => ({
      tournament: t,
      sessions: activeSessions.filter(s => s.tournamentId === t._id),
    }))
    .filter(g => g.sessions.length > 0);

  // Sessions whose tournament isn't in the loaded list (edge case)
  const unknownSessions = activeSessions.filter(s => !tournamentMap[s.tournamentId]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>OBS Sessions</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          All active overlay sessions across every tournament. Revoke any session to instantly disconnect that OBS browser source.
        </p>
      </div>

      {/* Create session */}
      <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Create New Session</h2>
        <div className="flex gap-3 items-center">
          {tournamentsLoading ? (
            <div className="flex-1 h-10 rounded-md animate-pulse" style={{ backgroundColor: 'var(--surface-elevated)' }} />
          ) : (
            <select
              value={createTournamentId}
              onChange={e => setCreateTournamentId(e.target.value)}
              className="flex-1 rounded-md p-2 text-sm"
              style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            >
              <option value="">— Select tournament —</option>
              {tournaments.map(t => (
                <option key={t._id} value={t._id}>{t.name} ({t.year})</option>
              ))}
            </select>
          )}
          <button
            onClick={handleCreate}
            disabled={creating || !createTournamentId}
            className="shrink-0 px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
          >
            {creating ? 'Creating…' : '+ Create Session'}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
          Sessions are labelled automatically with the tournament name and creation time.
        </p>
        {createError && <p className="text-red-400 text-sm mt-2">{createError}</p>}

        {/* URL copy prompt after creation */}
        {justCreated && (
          <div className="mt-4 rounded-lg p-4 space-y-3" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--brand-primary)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>
              Session &quot;{justCreated.label}&quot; created — copy your overlay URLs:
            </p>
            {OVERLAY_TYPES.map(type => {
              const url = buildOverlayUrl(justCreated.tournamentId, type.path, justCreated._id);
              const copied = copiedUrl === url;
              return (
                <div key={type.path} className="flex items-center gap-2">
                  <span className="text-xs w-28 shrink-0" style={{ color: 'var(--text-tertiary)' }}>{type.label}</span>
                  <code className="flex-1 text-xs truncate rounded px-2 py-1 font-mono" style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>
                    {url}
                  </code>
                  <button
                    onClick={() => copyToClipboard(url)}
                    className="shrink-0 px-3 py-1 rounded text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: copied ? '#16a34a' : 'var(--surface-card)',
                      color: copied ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-primary)',
                    }}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              );
            })}
            <button onClick={() => setJustCreated(null)} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Active sessions */}
      <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Active Sessions</h2>
          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#16a34a22', color: '#4ade80' }}>
            {activeSessions.length} active
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--brand-primary)' }} />
          </div>
        ) : error ? (
          <p className="p-4 text-red-400 text-sm">{error}</p>
        ) : activeSessions.length === 0 ? (
          <p className="p-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No active sessions across any tournament.
          </p>
        ) : (
          <div>
            {grouped.map(({ tournament, sessions: tSessions }) => (
              <div key={tournament._id}>
                {/* Tournament header */}
                <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: 'var(--surface-elevated)', borderBottom: '1px solid var(--border-primary)' }}>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                    {tournament.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>({tournament.year})</span>
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#16a34a22', color: '#4ade80' }}>
                    {tSessions.length}
                  </span>
                </div>
                <ul className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                  {tSessions.map(session => (
                    <li key={session._id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{session.label}</p>
                          <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                            Token: {session._id.slice(0, 8)}…
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex gap-1 flex-wrap justify-end">
                            <button
                              onClick={() => copyAllUrls(session)}
                              title="Copy all overlay URLs"
                              className="px-2 py-1 rounded text-xs font-medium transition-colors"
                              style={{
                                backgroundColor: copiedAll === session._id ? '#16a34a' : 'rgba(79,70,229,0.12)',
                                color: copiedAll === session._id ? '#fff' : 'var(--brand-primary)',
                                border: '1px solid var(--brand-primary)',
                              }}
                            >
                              {copiedAll === session._id ? '✓ Copied All' : '⧉ Copy All'}
                            </button>
                            {OVERLAY_TYPES.map(type => {
                              const url = buildOverlayUrl(session.tournamentId, type.path, session._id);
                              const copied = copiedUrl === url;
                              return (
                                <button
                                  key={type.path}
                                  onClick={() => copyToClipboard(url)}
                                  title={`Copy ${type.label} URL`}
                                  className="px-2 py-1 rounded text-xs transition-colors"
                                  style={{
                                    backgroundColor: copied ? '#16a34a' : 'var(--surface-elevated)',
                                    color: copied ? '#fff' : 'var(--text-secondary)',
                                    border: '1px solid var(--border-primary)',
                                  }}
                                >
                                  {copied ? '✓' : '⧉'} {type.label}
                                </button>
                              );
                            })}
                          </div>
                          {confirmingRevoke === session._id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleRevoke(session._id)}
                                disabled={revoking === session._id}
                                className="px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50"
                                style={{ backgroundColor: '#991b1b', color: '#fca5a5', border: '1px solid #b91c1c' }}
                              >
                                {revoking === session._id ? 'Revoking…' : 'Yes, Revoke'}
                              </button>
                              <button
                                onClick={() => setConfirmingRevoke(null)}
                                className="px-2 py-1.5 rounded text-xs"
                                style={{ color: 'var(--text-tertiary)', border: '1px solid var(--border-primary)' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingRevoke(session._id)}
                              disabled={revoking === session._id}
                              className="px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50"
                              style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b' }}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Sessions with unknown tournament */}
            {unknownSessions.length > 0 && (
              <div>
                <div className="px-4 py-2" style={{ backgroundColor: 'var(--surface-elevated)', borderBottom: '1px solid var(--border-primary)' }}>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Unknown Tournament</span>
                </div>
                <ul className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                  {unknownSessions.map(session => (
                    <li key={session._id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{session.label}</p>
                          <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                            Token: {session._id.slice(0, 8)}…
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex gap-1 flex-wrap justify-end">
                            <button
                              onClick={() => copyAllUrls(session)}
                              title="Copy all overlay URLs"
                              className="px-2 py-1 rounded text-xs font-medium transition-colors"
                              style={{
                                backgroundColor: copiedAll === session._id ? '#16a34a' : 'rgba(79,70,229,0.12)',
                                color: copiedAll === session._id ? '#fff' : 'var(--brand-primary)',
                                border: '1px solid var(--brand-primary)',
                              }}
                            >
                              {copiedAll === session._id ? '✓ Copied All' : '⧉ Copy All'}
                            </button>
                            {OVERLAY_TYPES.map(type => {
                              const url = buildOverlayUrl(session.tournamentId, type.path, session._id);
                              const copied = copiedUrl === url;
                              return (
                                <button
                                  key={type.path}
                                  onClick={() => copyToClipboard(url)}
                                  title={`Copy ${type.label} URL`}
                                  className="px-2 py-1 rounded text-xs transition-colors"
                                  style={{
                                    backgroundColor: copied ? '#16a34a' : 'var(--surface-elevated)',
                                    color: copied ? '#fff' : 'var(--text-secondary)',
                                    border: '1px solid var(--border-primary)',
                                  }}
                                >
                                  {copied ? '✓' : '⧉'} {type.label}
                                </button>
                              );
                            })}
                          </div>
                          {confirmingRevoke === session._id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleRevoke(session._id)}
                                disabled={revoking === session._id}
                                className="px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50"
                                style={{ backgroundColor: '#991b1b', color: '#fca5a5', border: '1px solid #b91c1c' }}
                              >
                                {revoking === session._id ? 'Revoking…' : 'Yes, Revoke'}
                              </button>
                              <button
                                onClick={() => setConfirmingRevoke(null)}
                                className="px-2 py-1.5 rounded text-xs"
                                style={{ color: 'var(--text-tertiary)', border: '1px solid var(--border-primary)' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingRevoke(session._id)}
                              disabled={revoking === session._id}
                              className="px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50"
                              style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b' }}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {revokeError && (
          <p className="px-4 pb-3 text-red-400 text-sm">{revokeError}</p>
        )}
      </div>

      {/* Revoked history */}
      {revokedSessions.length > 0 && (
        <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
          <button
            onClick={() => setShowRevoked(v => !v)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Revoked Sessions ({revokedSessions.length})
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{showRevoked ? '▲ Hide' : '▼ Show'}</span>
          </button>

          {showRevoked && (
            <ul className="divide-y" style={{ borderColor: 'var(--border-primary)', borderTop: '1px solid var(--border-primary)' }}>
              {revokedSessions.map(session => (
                <li key={session._id} className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm line-through" style={{ color: 'var(--text-tertiary)' }}>{session.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      Created {formatDate(session.createdAt)}
                      {session.revokedAt && ` · Revoked ${formatDate(session.revokedAt)}`}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: '#7f1d1d22', color: '#f87171' }}>Revoked</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function OverlaySessionsPageWrapper() {
  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <SessionsPage />
    </ProtectedRoute>
  );
}
