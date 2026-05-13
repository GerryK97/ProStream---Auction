'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentContext } from '@/contexts/TournamentContext';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeaders } from '@/lib/api-client';
import StepsProgress from '@/components/shared/StepsProgress';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { OVERLAY_PALETTES } from '@/config/overlayPalettes';

// ── Types ────────────────────────────────────────────────────────────────────

interface OverlaySession {
  _id: string;
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

// ── Theme definitions ────────────────────────────────────────────────────────

const THEMES = [
  {
    id: 'standard' as const,
    label: 'Theme 1',
    description: 'Clean dark gradient with team leaderboard, live bidding view, and sold banner.',
    preview: (
      <div
        className="w-full aspect-video rounded-lg overflow-hidden flex flex-col items-center justify-center text-white text-xs"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
      >
        <div className="w-3/4 space-y-1 px-2">
          {['Team Alpha', 'Team Beta', 'Team Gamma'].map((t, i) => (
            <div key={t} className="flex items-center gap-2 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <span className="opacity-40">#{i + 1}</span>
              <span className="flex-1 font-medium">{t}</span>
              <span className="opacity-60">₹{(80 - i * 15)}L</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] opacity-30 tracking-widest uppercase">Idle — Leaderboard</p>
      </div>
    ),
    available: true,
  },
  {
    id: 'theme2' as const,
    label: 'Theme 2',
    description: 'Palette-driven design — distinct color worlds, sharp typography, and smooth animations.',
    preview: (
      <div
        className="w-full aspect-video rounded-lg overflow-hidden flex flex-col justify-between text-xs"
        style={{ background: 'linear-gradient(160deg,#05070B 0%,#0B1018 48%,#121A24 100%)', border: '1px solid rgba(196,167,111,.42)' }}
      >
        <div className="flex flex-1 min-h-0 gap-2 p-2">
          {/* Player card */}
          <div className="flex rounded overflow-hidden flex-shrink-0" style={{ background: '#121A24', width: '44%', border: '1px solid rgba(178,190,204,.13)' }}>
            <div style={{ width: 4, background: '#C8A15F', flexShrink: 0 }} />
            <div className="flex-1 p-1.5 space-y-1">
              <div className="font-bold text-[11px]" style={{ color: '#EEF3F7' }}>PLAYER NAME</div>
              <div className="h-px" style={{ background: 'rgba(196,167,111,.42)' }} />
              <div className="flex justify-between text-[8px]" style={{ color: '#7F8B99' }}>
                <span>BASE</span><span>CURRENT BID</span>
              </div>
              <div className="flex justify-between font-semibold text-[10px]" style={{ color: '#C8A15F' }}>
                <span>20L</span><span>45L</span>
              </div>
            </div>
          </div>
          {/* Team cards */}
          <div className="flex flex-col gap-1 flex-1">
            {['Team Alpha', 'Team Beta', 'Team Gamma'].map((t, i) => (
              <div key={t} className="flex items-center rounded overflow-hidden" style={{ background: '#121A24', border: '1px solid rgba(178,190,204,.13)', flex: 1 }}>
                <div style={{ width: 3, background: '#C8A15F', alignSelf: 'stretch' }} />
                <span className="px-1.5 text-[8px] font-medium flex-1 truncate" style={{ color: '#EEF3F7' }}>{t}</span>
                <span className="px-1.5 text-[8px]" style={{ color: '#7F8B99' }}>₹{80 - i * 15}L</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-2 py-1 text-[8px] tracking-widest flex items-center gap-1.5" style={{ background: '#0B1017', color: '#7F8B99', borderTop: '3px solid #C8A15F' }}>
          <span style={{ background: '#C8A15F', color: '#11100C', padding: '0 6px', borderRadius: 2, fontWeight: 700 }}>PLAYERS</span>
          <span>Alpha · Beta · Gamma · Delta</span>
        </div>
      </div>
    ),
    available: true,
  },
  {
    id: 'neon',
    label: 'Neon',
    description: 'Coming soon — cyberpunk-style glowing neon overlays.',
    preview: (
      <div
        className="w-full aspect-video rounded-lg flex items-center justify-center text-white"
        style={{ background: 'linear-gradient(135deg, #000 0%, #0a1a0a 100%)' }}
      >
        <span className="opacity-30 tracking-widest uppercase text-[10px]">Coming Soon</span>
      </div>
    ),
    available: false,
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OutputPage() {
  const router = useRouter();
  const { selectedTournamentId, selectedTournament, setTournaments, tournaments, setSelectedTournamentId, refreshTournaments } = useTournamentContext();
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);

  // OBS setup instructions toggle
  const [showSetup, setShowSetup] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<OverlaySession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<OverlaySession | null>(null);
  const [confirmingRevoke, setConfirmingRevoke] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<string | null>(null);
  const [showRevoked, setShowRevoked] = useState(false);

  const currentTheme = selectedTournament?.overlayTheme ?? 'standard';
  const currentPalette = selectedTournament?.overlayPalette ?? 'default';
  const availablePalettes = OVERLAY_PALETTES[currentTheme] || [];

  // ── Sessions data fetching ──────────────────────────────────────────────

  const fetchSessions = useCallback(async () => {
    if (!selectedTournamentId) { setSessions([]); return; }
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const res = await fetch(`/api/overlay/sessions?tournamentId=${selectedTournamentId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch (err: any) {
      setSessionsError(err.message);
    } finally {
      setLoadingSessions(false);
    }
  }, [selectedTournamentId]);

  useEffect(() => {
    fetchSessions();
    setJustCreated(null);
    setCreateError(null);
  }, [fetchSessions]);

  // ── Session actions ─────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!selectedTournamentId) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/overlay/sessions', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: selectedTournamentId }),
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

  const handleRevoke = async (sessionToken: string) => {
    setConfirmingRevoke(null);
    setRevoking(sessionToken);
    setRevokeError(null);
    try {
      const res = await fetch(`/api/overlay/sessions/${sessionToken}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) { setRevokeError(data.error || 'Failed to revoke'); return; }
      if (justCreated?._id === sessionToken) setJustCreated(null);
      await fetchSessions();
    } catch {
      setRevokeError('An error occurred');
    } finally {
      setRevoking(null);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      // ignore
    }
  };

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

  // ── Theme / palette actions ─────────────────────────────────────────────

  async function selectTheme(themeId: string) {
    if (!selectedTournamentId || themeId === currentTheme) return;
    setTournaments(prev => prev.map(t =>
      t._id === selectedTournamentId ? { ...t, overlayTheme: themeId as 'standard' | 'premium' | 'neon' | 'theme2', overlayPalette: 'default' } : t
    ));
    setSaving(true);
    try {
      await fetch(`/api/tournaments/${selectedTournamentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ overlayTheme: themeId, overlayPalette: 'default' }),
      });
      await refreshTournaments();
    } finally {
      setSaving(false);
    }
  }

  async function selectPalette(paletteId: string) {
    if (!selectedTournamentId || paletteId === currentPalette) return;
    setTournaments(prev => prev.map(t =>
      t._id === selectedTournamentId ? { ...t, overlayPalette: paletteId } : t
    ));
    setSaving(true);
    try {
      await fetch(`/api/tournaments/${selectedTournamentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ overlayPalette: paletteId }),
      });
      await refreshTournaments();
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute allowedRoles={['Admin']}>
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Steps Progress */}
      <div className="mb-8">
        <StepsProgress currentStep={4} />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Overlay Setup</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Choose a theme and manage OBS session URLs for your auction broadcast.
        </p>
      </div>

      {/* Tournament selector — only show if multiple tournaments */}
      {tournaments.length > 1 && (
        <div className="mb-8">
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Tournament</label>
          <select
            value={selectedTournamentId ?? ''}
            onChange={e => setSelectedTournamentId(e.target.value)}
            className="px-4 py-2 rounded-lg border text-sm"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Select tournament…</option>
            {tournaments.map(t => (
              <option key={t._id} value={t._id}>{t.name} ({t.year})</option>
            ))}
          </select>
        </div>
      )}

      {/* Theme cards */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
          Choose Theme
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEMES.map(t => {
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                disabled={!t.available || saving}
                onClick={() => t.available && selectTheme(t.id)}
                className={`text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                  !t.available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'
                }`}
                style={{
                  borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border-primary)',
                  backgroundColor: isSelected ? 'rgba(79,70,229,0.08)' : 'var(--surface-elevated)',
                }}
              >
                <div className="mb-3">{t.preview}</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t.label}</span>
                  {isSelected && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide"
                      style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Palette section */}
      {selectedTournamentId && availablePalettes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            Choose Color Palette
          </h2>
          <div className="flex flex-wrap gap-4">
            {availablePalettes.map(palette => {
              const isSelected = currentPalette === palette.id;
              const swatchBg = (palette.cssVars as any)['--overlay-color-primary'] || (palette.cssVars as any)['--overlay-bg-panel'];
              return (
                <button
                  key={palette.id}
                  disabled={saving}
                  onClick={() => selectPalette(palette.id)}
                  className="flex items-center gap-3 rounded-full border px-4 py-2 transition-all duration-200"
                  style={{
                    borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border-primary)',
                    backgroundColor: isSelected ? 'rgba(79,70,229,0.08)' : 'var(--surface-elevated)',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full border shadow-inner"
                    style={{ background: swatchBg, borderColor: 'rgba(255,255,255,0.2)' }}
                  />
                  <span className="text-sm font-medium" style={{ color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    {palette.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── OBS Sessions ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>OBS Sessions</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Each session generates a unique URL. Revoke any session to instantly disconnect that OBS source.
            </p>
          </div>
          {selectedTournamentId && (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
              style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
            >
              {creating ? 'Creating…' : '+ Create Session'}
            </button>
          )}
        </div>

        {!selectedTournamentId ? (
          <p className="text-sm py-4 text-center rounded-lg" style={{ color: 'var(--text-muted)', border: '1px dashed var(--border-primary)' }}>
            Select a tournament above to manage sessions.
          </p>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-primary)' }}>

            {/* Just-created URL prompt */}
            {justCreated && (
              <div className="p-4 space-y-3" style={{ backgroundColor: 'rgba(79,70,229,0.08)', borderBottom: '1px solid var(--brand-primary)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>
                  Session created — copy your overlay URLs:
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{justCreated.label}</p>
                {OVERLAY_TYPES.map(type => {
                  const url = buildOverlayUrl(selectedTournamentId, type.path, justCreated._id);
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

            {createError && (
              <p className="px-4 py-2 text-red-400 text-sm" style={{ borderBottom: '1px solid var(--border-primary)' }}>{createError}</p>
            )}

            {/* Active sessions list */}
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: 'var(--brand-primary)' }} />
              </div>
            ) : sessionsError ? (
              <p className="p-4 text-red-400 text-sm">{sessionsError}</p>
            ) : activeSessions.length === 0 ? (
              <p className="p-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No active sessions. Click "+ Create Session" to generate overlay URLs.
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                {activeSessions.map(session => (
                  <li key={session._id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{session.label}</p>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                          Token: {session._id.slice(0, 8)}…
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
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
                          const url = buildOverlayUrl(selectedTournamentId, type.path, session._id);
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
            )}

            {revokeError && (
              <p className="px-4 pb-3 text-red-400 text-sm">{revokeError}</p>
            )}

            {/* Revoked history */}
            {revokedSessions.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-primary)' }}>
                <button
                  onClick={() => setShowRevoked(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    Revoked Sessions ({revokedSessions.length})
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{showRevoked ? '▲ Hide' : '▼ Show'}</span>
                </button>
                {showRevoked && (
                  <ul className="divide-y" style={{ borderColor: 'var(--border-primary)', borderTop: '1px solid var(--border-primary)' }}>
                    {revokedSessions.map(session => (
                      <li key={session._id} className="px-4 py-3 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>{session.label}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {session.revokedAt && `Revoked ${formatDate(session.revokedAt)}`}
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
        )}
      </div>

      {/* OBS Setup Instructions (collapsible) */}
      <div
        className="rounded-xl border mb-8"
        style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-primary)' }}
      >
        <button
          onClick={() => setShowSetup(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span className="flex items-center gap-2">
            <span>📺</span>
            OBS Setup Instructions
          </span>
          <span style={{ color: 'var(--text-muted)' }}>{showSetup ? '▲' : '▼'}</span>
        </button>

        {showSetup && (
          <div className="px-5 pb-5 space-y-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <ol className="mt-4 space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>1</span>
                <span>In OBS, click <strong>+</strong> in the Sources panel and select <strong>Browser</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>2</span>
                <span>Click <strong>+ Create Session</strong> above, then copy the overlay URL into OBS.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>3</span>
                <span>Set width to <strong>1920</strong> and height to <strong>1080</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>4</span>
                <span>Check <strong>Shutdown source when not visible</strong> and enable <strong>Refresh browser when scene becomes active</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>5</span>
                <span>Click <strong>OK</strong>. The overlay will appear once a tournament is set to <strong>Live</strong> status.</span>
              </li>
            </ol>
            <p className="text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
              Tip: append <code className="bg-black/20 px-1 rounded">&amp;debug=true</code> to the URL temporarily to verify the overlay is connected (shows a debug panel in the top-right corner).
            </p>
          </div>
        )}
      </div>

      {/* Continue */}
      <div className="flex justify-end">
        <button
          onClick={() => router.push('/auction')}
          className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:-translate-y-0.5"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          Continue to Auction →
        </button>
      </div>
    </div>
    </ProtectedRoute>
  );
}
