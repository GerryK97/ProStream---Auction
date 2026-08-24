'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentContext } from '@/contexts/TournamentContext';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeaders } from '@/lib/api-client';
import StepsProgress from '@/components/shared/StepsProgress';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { OVERLAY_PALETTES } from '@/config/overlayPalettes';
import {
  AUCTION_OVERLAY_TYPES,
  AuctionOverlayType,
  buildAuctionOverlayUrl,
  getAuctionOverlayConfig,
} from '@/lib/overlays/auctionOverlayTypes';
import { DEFAULT_OVERLAY_PRICES } from '@/lib/overlays/overlayPricing';

// ── Types ────────────────────────────────────────────────────────────────────

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

type OverlayThemeId = keyof typeof OVERLAY_PALETTES;
type OverlayPrices = Record<AuctionOverlayType, number>;

function formatAmount(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function getOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

function sessionOverlayType(session: OverlaySession): AuctionOverlayType {
  return session.overlayType && session.overlayType in AUCTION_OVERLAY_TYPES ? session.overlayType : 'fullscreen';
}

// ── Theme definitions ────────────────────────────────────────────────────────

const THEMES = [
  {
    id: 'standard' as OverlayThemeId,
    label: 'Theme 1 Classic',
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
    id: 'theme2' as OverlayThemeId,
    label: 'Theme 2 Palette System',
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
    id: 'theme3' as OverlayThemeId,
    label: 'Theme 3 Broadcast',
    description: 'Teal-accent live player bar, ticker, team standings, and gold-trim summary panels for broadcast output.',
    preview: (
      <div
        className="w-full aspect-video rounded-lg overflow-hidden flex flex-col justify-between text-xs"
        style={{ background: 'linear-gradient(160deg,#080810 0%,#0C0C18 50%,#121220 100%)', border: '1px solid rgba(160,160,200,.25)' }}
      >
        <div className="flex flex-1 min-h-0 p-2 gap-2">
          <div className="flex-1 rounded overflow-hidden flex flex-col" style={{ background: '#202020', border: '1px solid rgba(255,255,255,.10)' }}>
            <div className="px-2 py-1 text-[8px] font-bold tracking-widest uppercase" style={{ background: '#fff', color: '#2a2f35' }}>Team Standings</div>
            {['Team Alpha', 'Team Beta', 'Team Gamma'].map((t, i) => (
              <div key={t} className="flex items-center gap-1.5 px-2 py-0.5 text-[8px]" style={{ color: '#F0F0F8', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                <span style={{ color: '#b9aa62' }}>#{i + 1}</span>
                <span className="flex-1 truncate">{t}</span>
                <span style={{ color: '#20c997' }}>₹{(80 - i * 12)}L</span>
              </div>
            ))}
          </div>
          <div className="w-[38%] rounded overflow-hidden flex flex-col justify-end" style={{ background: '#181824', border: '1px solid rgba(0,137,140,.35)' }}>
            <div className="h-[55%]" style={{ background: 'linear-gradient(180deg,#3a4048,#1e2228)' }} />
            <div className="px-1.5 py-1" style={{ background: '#00898c', color: '#0A0A10' }}>
              <div className="text-[8px] font-bold truncate">PLAYER NAME</div>
              <div className="flex justify-between text-[7px] font-semibold opacity-80">
                <span>BASE 20L</span><span>BID 45L</span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-2 py-1 text-[7px] tracking-widest flex items-center gap-1.5" style={{ background: '#0E0E18', color: '#787888', borderTop: '2px solid #00898c' }}>
          <span style={{ background: '#00898c', color: '#0A0A10', padding: '0 5px', borderRadius: 2, fontWeight: 700 }}>LIVE</span>
          <span>Alpha · Beta · Gamma · Delta</span>
        </div>
      </div>
    ),
    available: true,
  },
  {
    id: 'theme4' as OverlayThemeId,
    label: 'Theme 4 — Lightning Card',
    description: 'Frame 15 heraldic shield player card for custom OBS overlay (transparent).',
    preview: (
      <div
        className="w-full aspect-video rounded-lg overflow-hidden flex items-center justify-center text-xs relative"
        style={{ background: 'linear-gradient(160deg,#050810 0%,#0A1428 55%,#080C18 100%)', border: '1px solid rgba(228,208,23,.28)' }}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-[26%] overflow-hidden" style={{ transform: 'translateY(-20%)', clipPath: 'polygon(6% 0,100% 0,94% 100%,0 100%)' }}>
          <div className="text-[6px] font-bold text-center py-0.5" style={{ background: '#D0D4DA', color: '#000' }}>BASE PRICE</div>
          <div className="text-[7px] font-bold text-center py-1 tracking-widest" style={{ background: '#0C1424', color: '#fff' }}>250,000</div>
        </div>
        <div
          className="relative"
          style={{
            width: '22%',
            aspectRatio: '255/280',
            clipPath: 'polygon(18% 8%, 38% 4%, 50% 16%, 62% 4%, 82% 8%, 90% 28%, 90% 58%, 50% 96%, 10% 58%, 10% 28%)',
            background: 'linear-gradient(180deg,#3a4048,#1a1e28)',
            boxShadow: '0 0 0 2px #E4D017',
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-[26%] overflow-hidden" style={{ transform: 'translateY(-20%)', clipPath: 'polygon(0 0,94% 0,100% 100%,6% 100%)' }}>
          <div className="text-[6px] font-bold text-center py-0.5" style={{ background: '#D0D4DA', color: '#000' }}>CURRENT BID</div>
          <div className="text-[7px] font-bold text-center py-1 tracking-widest" style={{ background: '#0C1424', color: '#E4D017' }}>250,000</div>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[48%] text-center py-1 text-[8px] tracking-widest uppercase" style={{ background: 'linear-gradient(180deg,#2A5BB5,#0A1C48)', color: '#E4D017', clipPath: 'polygon(0 0,100% 0,92% 100%,8% 100%)' }}>
          Player Name
        </div>
      </div>
    ),
    available: true,
  },
];

const OUTPUT_LAYOUT_ORDER: AuctionOverlayType[] = ['custom', 'team_owners', 'fullscreen', 'fullscreen2'];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OutputPage() {
  const router = useRouter();
  const { selectedTournamentId, selectedTournament, setTournaments, tournaments, setSelectedTournamentId, refreshTournaments } = useTournamentContext();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [saving, setSaving] = useState(false);

  // OBS setup instructions toggle
  const [showSetup, setShowSetup] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<OverlaySession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<OverlaySession[]>([]);
  const [confirmingRevoke, setConfirmingRevoke] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<string | null>(null);
  const [showRevoked, setShowRevoked] = useState(false);
  const [selectedOverlayTypes, setSelectedOverlayTypes] = useState<AuctionOverlayType[]>([]);
  const [prices, setPrices] = useState<OverlayPrices>(DEFAULT_OVERLAY_PRICES);

  const currentTheme = (selectedTournament?.overlayTheme ?? 'standard') as OverlayThemeId;
  const currentPalette = selectedTournament?.overlayPalette ?? 'default';
  const availablePalettes = OVERLAY_PALETTES[currentTheme] || [];
  const selectedPaletteConfig = availablePalettes.find(p => p.id === currentPalette) || availablePalettes[0];
  const primarySelectedOverlayType = selectedOverlayTypes[0] ?? 'fullscreen';
  const primarySelectedOverlayConfig = getAuctionOverlayConfig(primarySelectedOverlayType);
  const selectedTotalCharge = selectedOverlayTypes.reduce((total, type) => total + (prices[type] ?? 0), 0);
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
    if (!authLoading && isAuthenticated) {
      fetchSessions();
      setJustCreated([]);
      setCreateError(null);
    } else if (!authLoading && !isAuthenticated) {
      setSessions([]);
    }
  }, [fetchSessions, authLoading, isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    async function fetchPrices() {
      try {
        const res = await fetch('/api/overlay/prices', { headers: getAuthHeaders() });
        const data = await res.json();
        if (!cancelled && res.ok) setPrices({ ...DEFAULT_OVERLAY_PRICES, ...(data.prices ?? {}) });
      } catch {
        // Keep default prices if the preview endpoint is unavailable.
      }
    }
    fetchPrices();
    return () => { cancelled = true; };
  }, []);

  // ── Session actions ─────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!selectedTournamentId || selectedOverlayTypes.length === 0) return;
    setCreating(true);
    setCreateError(null);
    setJustCreated([]);
    try {
      const createdSessions: OverlaySession[] = [];
      for (const overlayType of selectedOverlayTypes) {
        const res = await fetch('/api/overlay/sessions', {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ tournamentId: selectedTournamentId, overlayType }),
        });
        const data = await res.json();
        if (!res.ok) {
          setCreateError(data.message || data.error || 'Failed to create session');
          break;
        }
        createdSessions.push(data.session);
      }
      setJustCreated(createdSessions);
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
      if (justCreated.some(session => session._id === sessionToken)) setJustCreated(prev => prev.filter(session => session._id !== sessionToken));
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

  const buildSessionUrl = (session: OverlaySession) => buildAuctionOverlayUrl(
    getOrigin(),
    session.tournamentId,
    sessionOverlayType(session),
    session._id,
    { theme: currentTheme, palette: selectedPaletteConfig?.id || currentPalette }
  );

  const copyAllUrls = async (session: OverlaySession) => {
    const overlayType = sessionOverlayType(session);
    const config = getAuctionOverlayConfig(overlayType);
    const urls = `${config.copyLabel} : ${buildSessionUrl(session)}`;
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
• This session is locked to the selected layout: ${config.label}.
• Generate a separate session if you need another output layout.
• Append &debug=true to the URL to show a live connection
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

  // Preview iframe: use an active session token when available so bootstrap auth
  // works like OBS (JWT/localStorage alone can fail inside iframes after reload).
  const previewUrl = useMemo(() => {
    if (!selectedTournamentId) return '';
    const previewSession =
      activeSessions.find(s => sessionOverlayType(s) === primarySelectedOverlayType) ??
      activeSessions[0];
    return buildAuctionOverlayUrl(
      getOrigin(),
      selectedTournamentId,
      previewSession ? sessionOverlayType(previewSession) : primarySelectedOverlayType,
      previewSession?._id,
      {
        theme: currentTheme,
        palette: selectedPaletteConfig?.id || currentPalette,
        debug: true,
      }
    );
  }, [
    selectedTournamentId,
    activeSessions,
    primarySelectedOverlayType,
    currentTheme,
    selectedPaletteConfig,
    currentPalette,
  ]);

  const selectOverlayType = (type: AuctionOverlayType) => {
    setSelectedOverlayTypes(prev => {
      return prev.includes(type)
        ? prev.filter(selectedType => selectedType !== type)
        : [...prev, type];
    });
  };

  // ── Theme / palette actions ─────────────────────────────────────────────

  async function selectTheme(themeId: string) {
    if (!selectedTournamentId || themeId === currentTheme) return;
    setTournaments(prev => prev.map(t =>
      t._id === selectedTournamentId ? { ...t, overlayTheme: themeId as 'standard' | 'premium' | 'neon' | 'theme2' | 'theme3' | 'theme4', overlayPalette: 'default' } : t
    ));
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournamentId}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ overlayTheme: themeId, overlayPalette: 'default' }),
      });
      if (!res.ok) {
        console.error('Failed to update overlay theme');
        return;
      }
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
      const res = await fetch(`/api/tournaments/${selectedTournamentId}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ overlayPalette: paletteId }),
      });
      if (!res.ok) {
        console.error('Failed to update overlay palette');
        return;
      }
      await refreshTournaments();
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute allowedRoles={['Admin', 'Operator', 'Player', 'Audience']}>
    <div>
      {/* Steps Progress */}
      <div className="px-6 pt-6 pb-2">
        <StepsProgress currentStep={4} />
      </div>

      <div className="max-w-4xl mx-auto py-8 px-6">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Overlay Setup</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {isAdmin
            ? 'Choose a theme and manage OBS session URLs for your auction broadcast.'
            : 'Choose a theme and generate overlay links for your auction broadcast.'}
        </p>
      </div>

      {/* Tournament selector — only show if multiple non-archived tournaments */}
      {tournaments.filter(t => t.status !== 'Archived').length > 1 && (
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
            {tournaments.filter(t => t.status !== 'Archived').map(t => (
              <option key={t._id} value={t._id}>{t.name} ({t.year})</option>
            ))}
          </select>
        </div>
      )}

      {/* Overlay layout cards */}
      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Choose Layout
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Select any combination of layouts to generate overlay links.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: 'rgba(79,70,229,0.12)', color: 'var(--brand-primary)', border: '1px solid var(--brand-primary)' }}>
              Total: {formatAmount(selectedTotalCharge)}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{selectedOverlayTypes.length} selected</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {OUTPUT_LAYOUT_ORDER.map((type) => {
            const config = getAuctionOverlayConfig(type);
            const isSelected = selectedOverlayTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => selectOverlayType(type)}
                className="rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.01]"
                style={{
                  backgroundColor: isSelected ? `${config.accent}18` : 'var(--surface-elevated)',
                  border: `2px solid ${isSelected ? config.accent : 'var(--border-primary)'}`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{config.label}</p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{config.useCase}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: `${config.accent}22`, color: config.accent }}>{formatAmount(prices[type] ?? 0)}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: isSelected ? config.accent : 'var(--surface-card)',
                        color: isSelected ? '#fff' : 'var(--text-muted)',
                        border: `1px solid ${isSelected ? config.accent : 'var(--border-primary)'}`,
                      }}
                    >
                      {isSelected ? 'Selected' : 'Optional'}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>/overlays/:id{config.path || ''}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme cards */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
          Choose Theme
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Live overlay preview */}
      <div className="mb-8 rounded-xl border p-4" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-primary)' }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Live Preview
            </h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {primarySelectedOverlayConfig.label} preview · {selectedPaletteConfig?.name || currentPalette}
            </p>
          </div>
          {previewUrl && (
            <a href={previewUrl} target="_blank" className="text-xs font-semibold underline" style={{ color: 'var(--brand-primary)' }}>
              Open
            </a>
          )}
        </div>
        <div className="aspect-video overflow-hidden rounded-xl" style={{ backgroundColor: '#020617', border: '1px solid var(--border-primary)' }}>
          {previewUrl ? (
            <iframe title="Overlay preview" src={previewUrl} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs" style={{ color: 'var(--text-tertiary)' }}>Select a tournament to preview</div>
          )}
        </div>
      </div>

      {/* ── Overlay Link Generation ─────────────────────────────────────────── */}
      <div className="mb-8 rounded-xl border p-5" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-primary)' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Overlay Link Generation</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Generate paid overlay links for the selected tournament directly from this Output page. Active session URLs and revoke controls are shown below.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!selectedTournamentId || creating || selectedOverlayTypes.length === 0}
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
          >
            {creating
              ? 'Generating…'
              : `Generate ${selectedOverlayTypes.length} ${selectedOverlayTypes.length === 1 ? 'Overlay Link' : 'Overlay Links'}`}
          </button>
        </div>

        {!selectedTournamentId && (
          <p className="mt-4 text-sm text-center rounded-lg py-4" style={{ color: 'var(--text-muted)', border: '1px dashed var(--border-primary)' }}>
            Select a tournament above to generate an overlay link.
          </p>
        )}

        {selectedTournamentId && selectedOverlayTypes.length === 0 && (
          <p className="mt-4 text-sm text-center rounded-lg py-4" style={{ color: 'var(--text-muted)', border: '1px dashed var(--border-primary)' }}>
            Select at least one layout above to generate overlay links.
          </p>
        )}

        {createError && <p className="mt-4 text-red-400 text-sm">{createError}</p>}

        {justCreated.length > 0 && (
          <div className="mt-4 space-y-3 rounded-lg p-4" style={{ backgroundColor: 'rgba(79,70,229,0.08)', border: '1px solid var(--brand-primary)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>Overlay links generated — copy your URLs:</p>
            {justCreated.map(session => {
              const overlayType = sessionOverlayType(session);
              const config = getAuctionOverlayConfig(overlayType);
              const url = buildSessionUrl(session);
              const copied = copiedUrl === url;
              return (
                <div key={session._id} className="flex items-center gap-2">
                  <span className="text-xs w-28 shrink-0" style={{ color: 'var(--text-tertiary)' }}>{config.shortLabel}</span>
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
          </div>
        )}
      </div>

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
              type="button"
              onClick={handleCreate}
              disabled={creating || selectedOverlayTypes.length === 0}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
            >
              {creating ? 'Generating…' : 'Generate Selected'}
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
            {justCreated.length > 0 && (
              <div className="p-4 space-y-3" style={{ backgroundColor: 'rgba(79,70,229,0.08)', borderBottom: '1px solid var(--brand-primary)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>
                  Sessions created — copy your overlay URLs:
                </p>
                {justCreated.map(session => {
                  const overlayType = sessionOverlayType(session);
                  const config = getAuctionOverlayConfig(overlayType);
                  const url = buildSessionUrl(session);
                  const copied = copiedUrl === url;
                  return (
                    <div key={session._id} className="flex items-center gap-2">
                      <span className="text-xs w-28 shrink-0" style={{ color: 'var(--text-tertiary)' }}>{config.shortLabel}</span>
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
                <button onClick={() => setJustCreated([])} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
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
                No active sessions. Generate an overlay link for this tournament to create one.
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
                        {(() => {
                          const overlayType = sessionOverlayType(session);
                          const config = getAuctionOverlayConfig(overlayType);
                          const url = buildSessionUrl(session);
                          const copied = copiedUrl === url;
                          return (
                            <button
                              onClick={() => copyToClipboard(url)}
                              title={`Copy ${config.label} URL`}
                              className="px-2 py-1 rounded text-xs transition-colors"
                              style={{
                                backgroundColor: copied ? '#16a34a' : 'var(--surface-elevated)',
                                color: copied ? '#fff' : 'var(--text-secondary)',
                                border: '1px solid var(--border-primary)',
                              }}
                            >
                              {copied ? '✓' : '⧉'} {config.shortLabel}
                            </button>
                          );
                        })()}
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
                <span>Click <strong>{isAdmin ? 'Generate Paid Overlay' : 'Generate Overlay Link'}</strong>, then copy the overlay URL into OBS.</span>
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
    </div>
    </ProtectedRoute>
  );
}
