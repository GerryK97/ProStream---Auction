'use client';

import React, { useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePusherAuction } from '@/hooks/usePusherAuction';
import { Tournament, AuctionState, Player, Team } from '@/types';
import { getPusherClient } from '@/lib/pusher-client';
import {
    WHEEL_DATA_CLEANUP_BUFFER_MS,
    WHEEL_SPIN_DURATION_MS,
    WHEEL_WINNER_HOLD_MS,
} from '@/lib/wheelSpinTiming';
import { OVERLAY_PALETTES } from '@/config/overlayPalettes';
import type { OverlaySettingsEvent, PlayerSelectedEvent, WheelSpinEvent } from '@/types/pusher-events';
import type { AuctionOverlayType } from '@/lib/overlays/auctionOverlayTypes';
import {
  overlaySettingsFromControlSettings,
} from '@/lib/overlays/overlayControlSettings';
import '../../styles/animations.css';

export interface OverlaySettings {
    size: 'large' | 'small';
    tickerMode: 'all' | 'sold' | 'available';
    displayMode: 'standard' | 'sold-summary' | 'team-summary' | 'team-wise-summary' | 'team-wise-image' | 'resting' | 'top10-summary' | 'custom-ticker' | 'wheel-spin';
    hidePremiumCard: boolean;
    customTickerLine1: string;
    customTickerLine2: string;
    soldMessagePosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    hideTickerCustom: boolean;
    hideTickerFullscreen: boolean;
    teamWiseTeamId: string | null;
    bidCardTop: number;
    bidCardLeft: number;
    hideTeamCards: boolean;
    teamCardSize: 'small' | 'medium' | 'large';
    teamCardPosition: 'top-right' | 'bottom-right';
    bidCardPosition: 'top' | 'right' | 'left';
}

const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
    size: 'large',
    tickerMode: 'all',
    displayMode: 'standard',
    hidePremiumCard: false,
    customTickerLine1: '',
    customTickerLine2: '',
    soldMessagePosition: 'bottom-right',
    hideTickerCustom: false,
    hideTickerFullscreen: false,
    teamWiseTeamId: null,
    bidCardTop: 160,
    bidCardLeft: 1576,
    hideTeamCards: false,
    teamCardSize: 'large',
    teamCardPosition: 'top-right',
    bidCardPosition: 'top',
};

interface OverlayWrapperProps {
    tournamentId?: string;
    overlayType: AuctionOverlayType;
    children: (data: {
        tournament: Tournament | null;
        auctionState: AuctionState;
        players: Player[];
        teams: Team[];
        isConnected: boolean;
        lastEvent: string | null;
        currentPlayer: Player | undefined;
        soldPlayers: Player[];
        overlaySettings: OverlaySettings;
        wheelSpinData: WheelSpinEvent | null;
    }) => ReactNode;
}

const OverlayWrapper: React.FC<OverlayWrapperProps> = ({
    tournamentId,
    overlayType,
    children
}) => {
    const searchParams = useSearchParams();
    const [liveTournamentId, setLiveTournamentId] = useState<string | null>(tournamentId || null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(!tournamentId);

    // Get debug mode, token, and optional preview style overrides from URL
    const isDebugMode = searchParams.get('debug') === 'true';
    const urlToken = searchParams.get('token');
    const requestedTheme = searchParams.get('theme');
    const requestedPalette = searchParams.get('palette');

    // Fetch active tournament if no tournamentId provided
    useEffect(() => {
        if (!tournamentId) {
            const loadActiveTournament = async () => {
                try {
                    setIsLoading(true);
                    setError(null);

                    // Check for token in URL first (for OBS), then fall back to localStorage
                    const localToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                    const token = urlToken || localToken;

                    // Build URL with token if available
                    const apiUrl = token
                        ? `/api/tournaments/active?token=${encodeURIComponent(token)}`
                        : '/api/tournaments/active';

                    const headers: Record<string, string> = {};
                    if (!urlToken && localToken) {
                        // Only use Authorization header if using localStorage token
                        headers['Authorization'] = `Bearer ${localToken}`;
                    }

                    const response = await fetch(apiUrl, { headers });

                    if (response.ok) {
                        const tournament = await response.json();
                        setLiveTournamentId(tournament._id);
                        setError(null);
                    } else {
                        const errorData = await response.json().catch(() => ({ error: response.statusText }));
                        setError(`Failed to load tournament: ${errorData.error || response.statusText} (${response.status})`);
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    setError(`Failed to fetch active tournament: ${errorMessage}`);
                    console.error('Failed to fetch active tournament:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            loadActiveTournament();
        }
    }, [tournamentId, urlToken]);

    // Use Pusher hook for real-time updates
    const {
        tournament,
        auctionState,
        players,
        teams,
        playerCardSizeHint,
        isConnected,
        isRevoked,
        lastEvent,
    } = usePusherAuction(liveTournamentId, undefined, urlToken ?? undefined, overlayType);

    const currentPlayer = useMemo(
        () => players.find(p => p._id === auctionState.currentPlayerId),
        [players, auctionState.currentPlayerId]
    );
    const soldPlayers = useMemo(() => players.filter(p => p.isSold), [players]);

    // Overlay settings — updated via overlay:settings Pusher event
    const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>(DEFAULT_OVERLAY_SETTINGS);
    const hydratedSettingsTournamentRef = useRef<string | null>(null);
    /** Drop stale size patches (e.g. in-flight Small from the previous auto-switch timer). */
    const lastSizeRevRef = useRef(0);

    // Wheel spin data — updated via overlay:wheel-spin Pusher event
    const [wheelSpinData, setWheelSpinData] = useState<WheelSpinEvent | null>(null);
    const wheelResetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const wheelModeResetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Do NOT exit wheel-spin when currentPlayerId arrives. Control panels select
    // the winner mid-spin so the profile is ready when the animation ends; mode
    // reset is owned by the timer started in onWheelSpin below.

    useEffect(() => {
        if (!tournament?._id) return;
        if (hydratedSettingsTournamentRef.current === tournament._id) return;
        if (!tournament.overlayControlSettings) return;
        hydratedSettingsTournamentRef.current = tournament._id;
        setOverlaySettings(prev => ({
            ...prev,
            ...overlaySettingsFromControlSettings(tournament.overlayControlSettings),
        }));
    }, [tournament?._id, tournament?.overlayControlSettings]);

    // Persist the player-selected size hint into settings state (and sizeRev)
    // after the first paint that already used settingsForRender.
    useEffect(() => {
        if (!playerCardSizeHint) return;
        if (playerCardSizeHint.playerId !== auctionState.currentPlayerId) return;
        const hintRev = playerCardSizeHint.rev;
        if (hintRev !== undefined && hintRev < lastSizeRevRef.current) return;
        if (hintRev !== undefined) lastSizeRevRef.current = hintRev;
        setOverlaySettings(prev => (
            prev.size === playerCardSizeHint.size
                ? prev
                : { ...prev, size: playerCardSizeHint.size }
        ));
    }, [playerCardSizeHint, auctionState.currentPlayerId]);

    useEffect(() => {
        if (!liveTournamentId) return;
        // Bind overlay:settings and overlay:wheel-spin on the tournament channel.
        // We subscribe here (same as usePusherAuction) — Pusher returns the same
        // channel object if already subscribed, so this is safe and adds no extra
        // connection. We explicitly NOT unsubscribe in cleanup because
        // usePusherAuction owns the subscription lifecycle.
        const pusher = getPusherClient();
        const channel = pusher.subscribe(`tournament-${liveTournamentId}`);

        const onOverlaySettings = (data: OverlaySettingsEvent) => {
            const incomingRev = typeof data.sizeRev === 'number' ? data.sizeRev : undefined;
            const sizeIsStale =
                incomingRev !== undefined && incomingRev < lastSizeRevRef.current;
            if (incomingRev !== undefined && !sizeIsStale) {
                lastSizeRevRef.current = incomingRev;
            }
            setOverlaySettings(prev => ({
                size: sizeIsStale ? prev.size : data.size,
                tickerMode: data.tickerMode ?? 'sold',
                displayMode: data.displayMode ?? 'standard',
                hidePremiumCard: data.hidePremiumCard ?? false,
                customTickerLine1: data.customTickerLine1 ?? '',
                customTickerLine2: data.customTickerLine2 ?? '',
                soldMessagePosition: data.soldMessagePosition ?? 'bottom-right',
                hideTickerCustom: data.hideTickerCustom ?? false,
                hideTickerFullscreen: data.hideTickerFullscreen ?? false,
                teamWiseTeamId: data.teamWiseTeamId ?? null,
                bidCardTop: data.bidCardTop ?? 160,
                bidCardLeft: data.bidCardLeft ?? 1576,
                hideTeamCards: data.hideTeamCards ?? false,
                teamCardSize: data.teamCardSize ?? 'large',
                teamCardPosition: data.teamCardPosition ?? 'top-right',
                bidCardPosition: data.bidCardPosition ?? 'top',
            }));
        };
        channel.bind('overlay:settings', onOverlaySettings);

        // Apply intro card size in the same Pusher turn as the new player so the
        // overlay never mounts the Small bar first when auto-switch requests Large.
        // Named handler so cleanup does not unbind usePusherAuction's listener.
        const onPlayerSelectedSize = (data: PlayerSelectedEvent) => {
            if (data.overlaySize !== 'large' && data.overlaySize !== 'small') return;
            const incomingRev = typeof data.sizeRev === 'number' ? data.sizeRev : undefined;
            if (incomingRev !== undefined && incomingRev < lastSizeRevRef.current) return;
            if (incomingRev !== undefined) lastSizeRevRef.current = incomingRev;
            setOverlaySettings(prev => (
                prev.size === data.overlaySize ? prev : { ...prev, size: data.overlaySize! }
            ));
        };
        channel.bind('auction:player-selected', onPlayerSelectedSize);

        const onWheelSpin = (data: WheelSpinEvent) => {
            // The wheel event itself must activate wheel mode. This keeps spins
            // triggered from the compact/mobile panel working even when that
            // client does not separately publish overlay settings.
            setOverlaySettings(prev => ({ ...prev, displayMode: 'wheel-spin' }));
            setWheelSpinData(data);
            if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current);
            if (wheelModeResetTimerRef.current) clearTimeout(wheelModeResetTimerRef.current);
            wheelModeResetTimerRef.current = setTimeout(() => {
                setOverlaySettings(prev => (
                    prev.displayMode === 'wheel-spin'
                        ? { ...prev, displayMode: 'standard' }
                        : prev
                ));
                wheelModeResetTimerRef.current = null;
            }, WHEEL_SPIN_DURATION_MS + WHEEL_WINNER_HOLD_MS);
            wheelResetTimerRef.current = setTimeout(() => {
                setWheelSpinData(null);
                wheelResetTimerRef.current = null;
            }, WHEEL_SPIN_DURATION_MS + WHEEL_DATA_CLEANUP_BUFFER_MS);
        };
        channel.bind('overlay:wheel-spin', onWheelSpin);

        return () => {
            channel.unbind('overlay:settings', onOverlaySettings);
            channel.unbind('auction:player-selected', onPlayerSelectedSize);
            channel.unbind('overlay:wheel-spin', onWheelSpin);
            if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current);
            if (wheelModeResetTimerRef.current) clearTimeout(wheelModeResetTimerRef.current);
            // Don't unsubscribe the channel here — usePusherAuction owns it
        };
    }, [liveTournamentId]); // dep: liveTournamentId only — don't re-bind on every status change

    // Revoked state — shown when admin revokes this session
    if (isRevoked) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-black">
                <div className="text-center">
                    <p className="text-gray-500 text-lg font-medium">Access Revoked</p>
                    <p className="text-gray-700 text-sm mt-1">Contact your administrator</p>
                </div>
            </div>
        );
    }

    // Error state - visible on transparent background
    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-red-900/90">
                <div className="text-white text-center p-8 bg-red-800/90 rounded-lg max-w-2xl mx-4 border-2 border-red-600">
                    <h2 className="text-3xl font-bold mb-4">⚠️ Overlay Error</h2>
                    <p className="text-lg mb-4">{error}</p>
                    <div className="text-sm text-red-200 space-y-2 text-left bg-red-950/50 p-4 rounded">
                        <p><strong>Troubleshooting:</strong></p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>For OBS: Add <code className="bg-red-900 px-1 rounded">?token=YOUR_SECRET</code> to the URL</li>
                            <li>Check if OVERLAY_SECRET_TOKEN is set in environment variables</li>
                            <li>Verify a tournament is set to "Live" status</li>
                            <li>Open browser DevTools (F12) for more details</li>
                        </ul>
                    </div>
                    {isDebugMode && (
                        <div className="mt-4 text-xs text-left bg-black/50 p-3 rounded font-mono">
                            <div>URL Token: {urlToken ? '✓ Present' : '✗ Missing'}</div>
                            <div>Tournament ID: {liveTournamentId || 'None'}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Loading state - visible on transparent background
    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-blue-900/90">
                <div className="text-white text-center p-8 bg-blue-800/90 rounded-lg border-2 border-blue-600">
                    <div className="text-5xl mb-4 animate-pulse">⏳</div>
                    <h2 className="text-2xl font-bold">Loading Overlay...</h2>
                    <p className="text-sm mt-2 text-blue-200">Connecting to tournament data</p>
                </div>
            </div>
        );
    }

    // Determine active palette CSS variables. Query params are used for safe preview/link overrides.
    const theme = requestedTheme && requestedTheme in OVERLAY_PALETTES
        ? requestedTheme as keyof typeof OVERLAY_PALETTES
        : tournament?.overlayTheme || 'standard';
    const paletteId = requestedPalette || tournament?.overlayPalette || 'default';
    const activePalette = OVERLAY_PALETTES[theme]?.find(p => p.id === paletteId)
        || OVERLAY_PALETTES[theme]?.[0]
        || { cssVars: {} };
    const effectiveTournament = tournament
        ? { ...tournament, overlayTheme: theme as Tournament['overlayTheme'], overlayPalette: activePalette.id }
        : tournament;

    // Same-render intro size: when player-selected carries overlaySize, apply it
    // here so the first paint of the new player is already Large (not Small→Large).
    let settingsForRender = overlaySettings;
    if (
        playerCardSizeHint &&
        playerCardSizeHint.playerId === auctionState.currentPlayerId
    ) {
        const hintRev = playerCardSizeHint.rev;
        const hintIsFresh = hintRev === undefined || hintRev >= lastSizeRevRef.current;
        if (hintIsFresh && overlaySettings.size !== playerCardSizeHint.size) {
            settingsForRender = { ...overlaySettings, size: playerCardSizeHint.size };
        }
    }

    return (
        <div 
            className="w-full h-full bg-transparent text-white font-sans relative overflow-hidden"
            style={{ ...activePalette.cssVars }}
        >
            {/* Debug overlay - shows connection status */}
            {isDebugMode && (
                <div className="fixed top-2 right-2 bg-black/90 text-white p-3 text-xs font-mono rounded border border-green-500 z-50 max-w-xs">
                    <div className="font-bold mb-2 text-green-400">🔍 Debug Mode</div>
                    <div className="space-y-1">
                        <div>Tournament: {effectiveTournament?._id ? `✓ ${effectiveTournament.name}` : '✗ None'}</div>
                        <div>Theme: {theme} / {activePalette.id ?? paletteId}</div>
                        <div>Connected: {isConnected ? '✓ Yes' : '✗ No'}</div>
                        <div>Last Event: {lastEvent || 'None yet'}</div>
                        <div>Current Player: {currentPlayer?.name || 'None'}</div>
                        <div>URL Token: {urlToken ? '✓ Present' : '✗ Missing'}</div>
                        <div>Teams: {teams.length}</div>
                        <div>Players: {players.length}</div>
                        <div>Sold: {soldPlayers.length}</div>
                    </div>
                </div>
            )}

            {/* Render children with data */}
            {children({
                tournament: effectiveTournament,
                auctionState,
                players,
                teams,
                isConnected,
                lastEvent,
                currentPlayer,
                soldPlayers,
                overlaySettings: settingsForRender,
                wheelSpinData,
            })}
        </div>
    );
};

export default OverlayWrapper;
