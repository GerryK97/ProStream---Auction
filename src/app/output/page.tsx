'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const { selectedTournamentId, selectedTournament, setTournaments, tournaments, setSelectedTournamentId, refreshTournaments } = useTournamentContext();
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);

  // OBS setup instructions toggle
  const [showSetup, setShowSetup] = useState(false);

  const currentTheme = selectedTournament?.overlayTheme ?? 'standard';
  const currentPalette = selectedTournament?.overlayPalette ?? 'default';
  const availablePalettes = OVERLAY_PALETTES[currentTheme] || [];

  async function selectTheme(themeId: string) {
    if (!selectedTournamentId || themeId === currentTheme) return;

    // Optimistic UI update
    setTournaments(prev => prev.map(t =>
      t._id === selectedTournamentId ? { ...t, overlayTheme: themeId as 'standard' | 'premium' | 'neon', overlayPalette: 'default' } : t
    ));

    setSaving(true);
    try {
      await fetch(`/api/tournaments/${selectedTournamentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ overlayTheme: themeId, overlayPalette: 'default' }),
      });

      await refreshTournaments();
    } finally {
      setSaving(false);
    }
  }

  async function selectPalette(paletteId: string) {
    if (!selectedTournamentId || paletteId === currentPalette) return;

    // Optimistic UI update
    setTournaments(prev => prev.map(t =>
      t._id === selectedTournamentId ? { ...t, overlayPalette: paletteId } : t
    ));

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

      await refreshTournaments();
    } finally {
      setSaving(false);
    }
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

      {/* OBS Sessions callout */}
      <div
        className="rounded-xl border p-5 mb-8 flex items-start gap-4"
        style={{ backgroundColor: 'rgba(79,70,229,0.06)', borderColor: 'var(--brand-primary)' }}
      >
        <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(79,70,229,0.15)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{ color: 'var(--brand-primary)' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Ready to go live?</p>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Use <strong>OBS Sessions</strong> to generate overlay URLs. Each session gets a unique token you can revoke at any time — without affecting other active overlays.
          </p>
          <Link
            href="/manage/overlays/sessions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
          >
            Go to OBS Sessions
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
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
                <span>Go to <strong>Manage → OBS Sessions</strong>, create a session, and copy the overlay URL into OBS.</span>
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
