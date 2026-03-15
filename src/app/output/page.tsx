'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentContext } from '@/contexts/TournamentContext';
import { useAuth } from '@/contexts/AuthContext';
import StepsProgress from '@/components/shared/StepsProgress';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { OVERLAY_PALETTES } from '@/config/overlayPalettes';

const THEMES = [
  {
    id: 'standard' as const,
    label: 'Standard',
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
    id: 'premium',
    label: 'Premium',
    description: 'Coming soon — rich glassmorphism design with animations.',
    preview: (
      <div
        className="w-full aspect-video rounded-lg flex items-center justify-center text-white"
        style={{ background: 'linear-gradient(135deg, #1a0533 0%, #3b0f6e 100%)' }}
      >
        <span className="opacity-30 tracking-widest uppercase text-[10px]">Coming Soon</span>
      </div>
    ),
    available: false,
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

export default function OutputPage() {
  const router = useRouter();
  const { selectedTournamentId, selectedTournament, tournaments, setSelectedTournamentId } = useTournamentContext();
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);

  // Overlay token state
  const [overlayToken, setOverlayToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Copy states
  const [copiedObs, setCopiedObs] = useState(false);
  const [copiedCustom, setCopiedCustom] = useState(false);

  // OBS setup instructions toggle
  const [showSetup, setShowSetup] = useState(false);

  // Fetch overlay secret token for authenticated users
  useEffect(() => {
    if (!token) return;
    fetch('/api/overlay/token', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setOverlayToken(data.token))
      .catch(() => setTokenError(true));
  }, [token]);

  const currentTheme = selectedTournament?.overlayTheme ?? 'standard';
  const currentPalette = selectedTournament?.overlayPalette ?? 'default';
  const availablePalettes = OVERLAY_PALETTES[currentTheme] || [];

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const obsBaseUrl = selectedTournamentId ? `${origin}/overlays/${selectedTournamentId}` : '';
  const customBaseUrl = selectedTournamentId ? `${origin}/overlays/${selectedTournamentId}/custom` : '';
  const obsUrlWithToken = overlayToken ? `${obsBaseUrl}?token=${encodeURIComponent(overlayToken)}` : obsBaseUrl;
  const customUrlWithToken = overlayToken ? `${customBaseUrl}?token=${encodeURIComponent(overlayToken)}` : customBaseUrl;

  // Masked display version (hides the actual token value)
  const maskedObsUrl = overlayToken ? `${obsBaseUrl}?token=••••••••` : obsBaseUrl;
  const maskedCustomUrl = overlayToken ? `${customBaseUrl}?token=••••••••` : customBaseUrl;
  const displayObsUrl = showToken ? obsUrlWithToken : maskedObsUrl;
  const displayCustomUrl = showToken ? customUrlWithToken : maskedCustomUrl;

  async function selectTheme(themeId: string) {
    if (!selectedTournamentId || themeId === currentTheme) return;
    setSaving(true);
    try {
      await fetch(`/api/tournaments/${selectedTournamentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ overlayTheme: themeId, overlayPalette: 'default' }), // reset palette when theme changes
      });
    } finally {
      setSaving(false);
    }
  }

  async function selectPalette(paletteId: string) {
    if (!selectedTournamentId || paletteId === currentPalette) return;
    setSaving(true);
    try {
      await fetch(`/api/tournaments/${selectedTournamentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ overlayPalette: paletteId }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function copyObsUrl() {
    if (!obsUrlWithToken) return;
    await navigator.clipboard.writeText(obsUrlWithToken);
    setCopiedObs(true);
    setTimeout(() => setCopiedObs(false), 2000);
  }

  async function copyCustomUrl() {
    if (!customUrlWithToken) return;
    await navigator.clipboard.writeText(customUrlWithToken);
    setCopiedCustom(true);
    setTimeout(() => setCopiedCustom(false), 2000);
  }

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
          Choose a theme for your OBS overlay. One URL covers your entire auction broadcast.
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
              // Extract primary color/gradient for the swatch
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

      {/* OBS URLs */}
      {selectedTournamentId ? (
        <div className="space-y-4 mb-8">

          {/* Token not configured warning */}
          {tokenError && (
            <div className="rounded-xl border border-yellow-500/40 p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(234,179,8,0.08)' }}>
              <span className="text-yellow-400 text-lg shrink-0">⚠</span>
              <div>
                <p className="text-sm font-semibold text-yellow-400">Overlay token not configured</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  OBS browser sources won&apos;t load without a secret token. Add this to your <code className="bg-black/30 px-1 rounded">.env.local</code>:
                </p>
                <code className="text-xs block mt-2 px-3 py-2 rounded" style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--brand-primary)' }}>
                  OVERLAY_SECRET_TOKEN=your-secret-here
                </code>
              </div>
            </div>
          )}

          {/* Custom overlay URL */}
          <div
            className="rounded-xl border p-5"
            style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-primary)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                OBS Overlay URL Transparent
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code
                className="flex-1 text-xs px-4 py-3 rounded-lg truncate font-mono"
                style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--brand-primary)' }}
                title={customUrlWithToken}
              >
                {displayCustomUrl || customBaseUrl}
              </code>
              <button
                onClick={copyCustomUrl}
                disabled={!overlayToken}
                className="shrink-0 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                style={{
                  backgroundColor: copiedCustom ? '#22c55e' : 'var(--brand-primary)',
                  color: '#fff',
                }}
              >
                {copiedCustom ? 'Copied!' : 'Copy'}
              </button>
              <a
                href={customUrlWithToken}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-4 py-3 rounded-lg text-sm font-semibold border transition-all duration-200 hover:opacity-80"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
              >
                Preview ↗
              </a>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Add as a separate OBS Browser Source at <strong>1920×1080</strong>. Enable <strong>transparent background</strong> in OBS browser source settings.
            </p>
          </div>

          {/* Main overlay URL */}
          <div
            className="rounded-xl border p-5"
            style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-primary)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Full Screen Overlay URL
              </p>
              {overlayToken && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Token Ready
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <code
                className="flex-1 text-xs px-4 py-3 rounded-lg truncate font-mono"
                style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--brand-primary)' }}
                title={obsUrlWithToken}
              >
                {displayObsUrl || obsBaseUrl}
              </code>

              {/* Eye toggle */}
              {overlayToken && (
                <button
                  onClick={() => setShowToken(v => !v)}
                  className="shrink-0 px-3 py-3 rounded-lg text-sm transition-all duration-200 border"
                  style={{ borderColor: 'var(--border-primary)', color: showToken ? 'var(--brand-primary)' : 'var(--text-muted)' }}
                  title={showToken ? 'Hide token' : 'Reveal token'}
                >
                  {showToken ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              )}

              <button
                onClick={copyObsUrl}
                disabled={!overlayToken}
                className="shrink-0 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                style={{
                  backgroundColor: copiedObs ? '#22c55e' : 'var(--brand-primary)',
                  color: '#fff',
                }}
              >
                {copiedObs ? 'Copied!' : 'Copy'}
              </button>
              <a
                href={obsUrlWithToken}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-4 py-3 rounded-lg text-sm font-semibold border transition-all duration-200 hover:opacity-80"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
              >
                Preview ↗
              </a>
            </div>

            <div className="mt-3 flex items-start gap-2">
              {overlayToken ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Token is pre-filled — paste directly into OBS as a Browser Source.
                  <button
                    onClick={() => setShowToken(v => !v)}
                    className="ml-1 underline hover:opacity-80"
                    style={{ color: 'var(--brand-primary)' }}
                  >
                    {showToken ? 'Hide token' : 'Show token'}
                  </button>
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Append <code className="bg-black/20 px-1 rounded">?token=YOUR_SECRET</code> to the URL for OBS authentication.
                </p>
              )}
            </div>
          </div>

          {/* OBS Setup Instructions (collapsible) */}
          <div
            className="rounded-xl border"
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
                    <span>Paste the <strong>OBS Browser Source URL</strong> above into the URL field.</span>
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
        </div>
      ) : (
        <p className="text-sm text-center py-6 mb-8" style={{ color: 'var(--text-muted)' }}>
          Select a tournament to see your overlay URLs.
        </p>
      )}

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
