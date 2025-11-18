'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CopyIcon, ExternalLinkIcon } from './icons';
import ParameterEditor, { ParameterConfig } from './overlays/parameters/ParameterEditor';

interface OverlayType {
    id: string;
    name: string;
    description: string;
    route: string;
    tags: string[];
    defaultParams: { [key: string]: string };
    parameterSchema?: { [key: string]: ParameterConfig };
    imageURL: string;
    dimensions: { width: number; height: number };
}

const overlayTypes: OverlayType[] = [
    {
        id: 'player-card',
        name: 'Player Card',
        description: 'Display current player being auctioned with stats and bid information',
        route: '/overlays/player-card',
        tags: ['Player', 'Auction', 'Main'],
        defaultParams: { size: 'medium', position: 'top' },
        parameterSchema: {
            size: { type: 'select', label: 'Size', options: ['small', 'medium', 'large'] },
            position: { type: 'select', label: 'Position', options: ['top', 'center', 'bottom'] }
        },
        imageURL: 'https://placehold.co/400x200/1e293b/06b6d4?text=Player+Card',
        dimensions: { width: 800, height: 300 }
    },
    {
        id: 'premium-player-card',
        name: 'Premium Player Card',
        description: 'Stylish premium player card with gradient background, jersey number, and stats - fully customizable',
        route: '/overlays/premium-player-card',
        tags: ['Player', 'Auction', 'Premium', 'Customizable'],
        defaultParams: {
            // Position
            position: 'center',
            // Visibility
            showPlayerImage: 'true',
            showBackgroundText: 'true',
            showJerseyNumber: 'true',
            showDecorativeBadges: 'true',
            showPlayerName: 'true',
            showRoleLabel: 'true',
            showStatsSection: 'true',
            showMatches: 'true',
            showScore: 'true',
            showWickets: 'true',
            // Colors
            gradientStart: '#ff5411',
            gradientEnd: '#ffcc00',
            cardBackground: '#ffffff',
            playerNameColor: '#1e293b',
            statValueColor: '#1e293b',
            statLabelColor: '#9ca3af',
            jerseyBadgeGradientStart: '#ff5411',
            jerseyBadgeGradientEnd: '#ffcc00',
            decorativeBadgeColor: '#ffffff',
            watermarkColor: '#ffffff',
            // Layout
            cardSize: 'medium',
            borderRadius: 'large',
            opacity: '100',
            // Content
            roleLabel: 'Player',
            usePlayerNameAsWatermark: 'true',
            backgroundTextLine1: '',
            backgroundTextLine2: ''
        },
        parameterSchema: {
            // === POSITION ===
            position: {
                type: 'select',
                label: 'Position',
                options: ['center', 'left', 'right'],
                description: 'Overlay position on screen'
            },

            // === VISIBILITY CONTROLS ===
            showPlayerImage: {
                type: 'toggle',
                label: 'Show Player Image',
                description: 'Display player photo'
            },
            showBackgroundText: {
                type: 'toggle',
                label: 'Show Background Text',
                description: 'Player name watermark behind image'
            },
            showJerseyNumber: {
                type: 'toggle',
                label: 'Show Jersey Number',
                description: 'Display player number badge'
            },
            showDecorativeBadges: {
                type: 'toggle',
                label: 'Show Corner Badges',
                description: 'White decorative circles at corners'
            },
            showPlayerName: {
                type: 'toggle',
                label: 'Show Player Name',
                description: 'Display player name below image'
            },
            showRoleLabel: {
                type: 'toggle',
                label: 'Show Role Label',
                description: 'Display role text (e.g., "Player")'
            },
            showStatsSection: {
                type: 'toggle',
                label: 'Show Stats Section',
                description: 'Display entire statistics section'
            },
            showMatches: {
                type: 'toggle',
                label: 'Show Matches Stat',
                description: 'Display matches played'
            },
            showScore: {
                type: 'toggle',
                label: 'Show Score Stat',
                description: 'Display total score'
            },
            showWickets: {
                type: 'toggle',
                label: 'Show Wickets Stat',
                description: 'Display total wickets'
            },

            // === BACKGROUND TEXT CUSTOMIZATION ===
            usePlayerNameAsWatermark: {
                type: 'toggle',
                label: 'Use Player Name as Watermark',
                description: 'Use player name or custom text for background'
            },
            backgroundTextLine1: {
                type: 'text',
                label: 'Background Text Line 1',
                description: 'Custom watermark text (first line) - only if player name disabled',
                placeholder: 'e.g., AUCTION'
            },
            backgroundTextLine2: {
                type: 'text',
                label: 'Background Text Line 2',
                description: 'Custom watermark text (second line) - only if player name disabled',
                placeholder: 'e.g., 2025'
            },

            // === COLOR CONTROLS ===
            gradientStart: {
                type: 'color',
                label: 'Gradient Start Color',
                description: 'Top gradient color for image background'
            },
            gradientEnd: {
                type: 'color',
                label: 'Gradient End Color',
                description: 'Bottom gradient color for image background'
            },
            cardBackground: {
                type: 'color',
                label: 'Card Background',
                description: 'Main card background color'
            },
            playerNameColor: {
                type: 'color',
                label: 'Player Name Color',
                description: 'Color of player name text'
            },
            statValueColor: {
                type: 'color',
                label: 'Stat Values Color',
                description: 'Color of statistics numbers'
            },
            statLabelColor: {
                type: 'color',
                label: 'Stat Labels Color',
                description: 'Color of statistics labels'
            },
            jerseyBadgeGradientStart: {
                type: 'color',
                label: 'Jersey Badge Top Color',
                description: 'Top gradient color for jersey number badge'
            },
            jerseyBadgeGradientEnd: {
                type: 'color',
                label: 'Jersey Badge Bottom Color',
                description: 'Bottom gradient color for jersey number badge'
            },
            decorativeBadgeColor: {
                type: 'color',
                label: 'Corner Badges Color',
                description: 'Color of decorative corner circles'
            },
            watermarkColor: {
                type: 'color',
                label: 'Watermark Text Color',
                description: 'Color of background watermark text'
            },

            // === LAYOUT CONTROLS ===
            cardSize: {
                type: 'select',
                label: 'Card Size',
                options: ['small', 'medium', 'large'],
                description: 'Overall card dimensions'
            },
            borderRadius: {
                type: 'select',
                label: 'Border Radius',
                options: ['none', 'small', 'medium', 'large'],
                description: 'Corner rounding style'
            },
            opacity: {
                type: 'number',
                label: 'Opacity (%)',
                min: 0,
                max: 100,
                step: 5,
                description: 'Card transparency (0=invisible, 100=solid)'
            },

            // === CONTENT CONTROLS ===
            roleLabel: {
                type: 'text',
                label: 'Role Label Text',
                description: 'Custom text for role label',
                placeholder: 'e.g., Player, Star, Legend'
            }
        },
        imageURL: 'https://placehold.co/400x450/ff5411/ffcc00?text=Premium+Card',
        dimensions: { width: 380, height: 650 }
    },
    {
        id: 'teams',
        name: 'Team Cards',
        description: 'Show all teams with balances, max bids, and players purchased - fully customizable backgrounds and colors',
        route: '/overlays/teams',
        tags: ['Teams', 'Auction', 'Customizable'],
        defaultParams: {
            layout: 'horizontal',
            position: 'bottom',
            useGradient: 'false',
            cardBackground: '#000000',
            gradientStart: '#0891b2',
            gradientEnd: '#06b6d4',
            borderColor: '#06b6d4',
            borderRadius: '8',
            backgroundOpacity: '80',
            teamNameColor: '#ffffff',
            balanceColor: '#4ade80',
            statsColor: '#d4d4d8',
            maxBidColor: '#22d3ee',
            winningBorderColor: '#ef4444'
        },
        parameterSchema: {
            // Layout & Position
            layout: {
                type: 'select',
                label: 'Layout',
                options: ['horizontal', 'vertical', 'grid'],
                description: 'Card arrangement style'
            },
            position: {
                type: 'select',
                label: 'Position',
                options: ['top', 'bottom', 'left', 'right'],
                description: 'Overlay position on screen'
            },

            // Background Style
            useGradient: {
                type: 'toggle',
                label: 'Use Gradient Background',
                description: 'Enable gradient instead of solid color'
            },
            cardBackground: {
                type: 'color',
                label: 'Card Background',
                description: 'Solid background color (when gradient is off)'
            },
            gradientStart: {
                type: 'color',
                label: 'Gradient Start Color',
                description: 'Starting color for gradient background'
            },
            gradientEnd: {
                type: 'color',
                label: 'Gradient End Color',
                description: 'Ending color for gradient background'
            },
            backgroundOpacity: {
                type: 'number',
                label: 'Background Opacity (%)',
                min: 0,
                max: 100,
                description: 'Transparency level (0=transparent, 100=opaque)'
            },

            // Border & Shape
            borderColor: {
                type: 'color',
                label: 'Border Color',
                description: 'Color of card border (default state)'
            },
            winningBorderColor: {
                type: 'color',
                label: 'Winning Team Border',
                description: 'Border color when team is winning bid'
            },
            borderRadius: {
                type: 'number',
                label: 'Border Radius (px)',
                min: 0,
                max: 32,
                description: 'Corner roundness (0=square, 32=very rounded)'
            },

            // Text Colors
            teamNameColor: {
                type: 'color',
                label: 'Team Name Color',
                description: 'Color of team name text'
            },
            balanceColor: {
                type: 'color',
                label: 'Balance Color',
                description: 'Color of current balance amount'
            },
            statsColor: {
                type: 'color',
                label: 'Stats Color',
                description: 'Color of player count text'
            },
            maxBidColor: {
                type: 'color',
                label: 'Max Bid Color',
                description: 'Color of maximum bid amount'
            }
        },
        imageURL: 'https://placehold.co/400x200/1e293b/22c55e?text=Team+Cards',
        dimensions: { width: 1200, height: 200 }
    },
    {
        id: 'ticker',
        name: 'Sold Players Ticker',
        description: 'Continuous scrolling ticker showing all sold players',
        route: '/overlays/ticker',
        tags: ['Players', 'Info'],
        defaultParams: { speed: 'medium', position: 'bottom' },
        parameterSchema: {
            speed: { type: 'select', label: 'Speed', options: ['slow', 'medium', 'fast'], description: 'Scroll speed (slow: 60s, medium: 30s, fast: 15s)' },
            position: { type: 'select', label: 'Position', options: ['top', 'bottom'] }
        },
        imageURL: 'https://placehold.co/400x200/1e293b/eab308?text=Ticker',
        dimensions: { width: 1920, height: 60 }
    },
    {
        id: 'premium-ticker',
        name: 'Premium Breaking News Ticker',
        description: 'Single player display with slide transitions - breaking news style ticker with auto-play',
        route: '/overlays/premium-ticker',
        tags: ['Players', 'Premium', 'Sold'],
        defaultParams: { size: 'default', effect: 'slide-h', color: 'blue', autoplay: 'true', timer: '5000', border: 'true', position: 'bottom' },
        parameterSchema: {
            size: { type: 'select', label: 'Size', options: ['small', 'default', 'large'] },
            effect: { type: 'select', label: 'Animation Effect', options: ['slide-h', 'slide-v', 'fade'], description: 'Transition effect between players' },
            color: { type: 'select', label: 'Color Theme', options: ['blue', 'green', 'purple', 'orange', 'yellow'] },
            autoplay: { type: 'toggle', label: 'Auto-play' },
            timer: { type: 'number', label: 'Timer (ms)', min: 1000, max: 30000, step: 1000, description: 'Time to show each player' },
            border: { type: 'toggle', label: 'Show Border' },
            position: { type: 'select', label: 'Position', options: ['top', 'bottom'] }
        },
        imageURL: 'https://placehold.co/400x200/0F84D0/78CA2A?text=Premium+Ticker',
        dimensions: { width: 1920, height: 40 }
    },
    {
        id: 'current-bid',
        name: 'Current Bid',
        description: 'Large display showing only the current bid amount',
        route: '/overlays/current-bid',
        tags: ['Auction', 'Minimal'],
        defaultParams: { size: 'medium', position: 'top-right' },
        parameterSchema: {
            size: { type: 'select', label: 'Size', options: ['small', 'medium', 'large'] },
            position: { type: 'select', label: 'Position', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'] }
        },
        imageURL: 'https://placehold.co/400x200/1e293b/10b981?text=Current+Bid',
        dimensions: { width: 400, height: 200 }
    },
    {
        id: 'status',
        name: 'Status Overlay',
        description: 'Show auction status messages when no active player',
        route: '/overlays/status',
        tags: ['Info', 'Status'],
        defaultParams: {},
        imageURL: 'https://placehold.co/400x200/1e293b/8b5cf6?text=Status',
        dimensions: { width: 600, height: 200 }
    },
    {
        id: 'leaderboard',
        name: 'Team Leaderboard',
        description: 'Rankings showing team standings by players or balance',
        route: '/overlays/leaderboard',
        tags: ['Teams', 'Stats'],
        defaultParams: { sortBy: 'players', position: 'top-right' },
        parameterSchema: {
            sortBy: { type: 'select', label: 'Sort By', options: ['players', 'balance', 'spent'], description: 'Sort teams by players count, remaining balance, or money spent' },
            position: { type: 'select', label: 'Position', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'] }
        },
        imageURL: 'https://placehold.co/400x200/1e293b/f59e0b?text=Leaderboard',
        dimensions: { width: 320, height: 400 }
    },
    {
        id: 'sale-banner',
        name: 'Sale Banner',
        description: 'Popup notification when a player is sold',
        route: '/overlays/sale-banner',
        tags: ['Auction', 'Alert'],
        defaultParams: {},
        imageURL: 'https://placehold.co/400x200/1e293b/ef4444?text=Sale+Banner',
        dimensions: { width: 450, height: 150 }
    },
    {
        id: 'sold-summary',
        name: 'Sold Players Summary',
        description: 'Complete auction summary sorted by highest price - shows when all players sold',
        route: '/overlays/sold-summary',
        tags: ['Summary', 'Stats', 'Final'],
        defaultParams: { position: 'center' },
        parameterSchema: {
            position: { type: 'select', label: 'Position', options: ['center', 'top', 'bottom'] }
        },
        imageURL: 'https://placehold.co/400x200/1e293b/10b981?text=Final+Summary',
        dimensions: { width: 1200, height: 800 }
    },
    {
        id: 'auction-overview',
        name: 'Auction Overview LED',
        description: 'Full-screen comprehensive auction display with auto-flipping team pages and complex animations - perfect for LED screens (1920x1080)',
        route: '/overlays/auction-overview',
        tags: ['Full Screen', 'LED', 'Premium', 'Comprehensive'],
        defaultParams: {
            size: 'default',
            showBackground: 'true',
            theme: 'premium',
            animationSpeed: 'normal',
            teamFlipDuration: '8',
            showStats: 'true',
            showRecentSold: 'true',
            maxRecentSold: '5',
            teamsPerPage: '10'
        },
        parameterSchema: {
            size: {
                type: 'select',
                label: 'Size',
                options: ['default', 'large'],
                description: 'default: 1920x1080, large: 3840x2160'
            },
            showBackground: {
                type: 'toggle',
                label: 'Show Animated Background'
            },
            theme: {
                type: 'select',
                label: 'Color Theme',
                options: ['dark', 'premium', 'vibrant']
            },
            animationSpeed: {
                type: 'select',
                label: 'Animation Speed',
                options: ['slow', 'normal', 'fast']
            },
            teamFlipDuration: {
                type: 'number',
                label: 'Team Page Duration (sec)',
                min: 5,
                max: 20,
                step: 1,
                description: 'Time before flipping to next team page'
            },
            showStats: {
                type: 'toggle',
                label: 'Show Auction Statistics'
            },
            showRecentSold: {
                type: 'toggle',
                label: 'Show Recent Sold Players'
            },
            maxRecentSold: {
                type: 'number',
                label: 'Recent Sold Count',
                min: 3,
                max: 10,
                description: 'Number of recent sales to display'
            },
            teamsPerPage: {
                type: 'select',
                label: 'Teams Per Page',
                options: ['10', '15', '20'],
                description: 'More teams = smaller cards'
            }
        },
        imageURL: 'https://placehold.co/1920x1080/0F84D0/FFFFFF?text=Auction+Overview+LED',
        dimensions: { width: 1920, height: 1080 }
    },
    {
        id: 'player-highlight-led',
        name: 'Player Highlight LED',
        description: 'Fullscreen player spotlight that auto-expands for new selections with oversized bidding visuals.',
        route: '/overlays/player-highlight-led',
        tags: ['LED', 'Player', 'Spotlight'],
        defaultParams: {
            showBackground: 'true',
            spotlightSeconds: '5',
            showTeams: 'true',
            showSold: 'true',
            soldItems: '5',
            soldFlipSeconds: '8'
        },
        parameterSchema: {
            showBackground: {
                type: 'toggle',
                label: 'Background Effects',
                description: 'Enable animated gradient background'
            },
            spotlightSeconds: {
                type: 'number',
                label: 'Spotlight Seconds',
                description: 'Duration for the fullscreen player takeover',
                min: 2,
                max: 12
            },
            showTeams: {
                type: 'toggle',
                label: 'Show Team Grid'
            },
            showSold: {
                type: 'toggle',
                label: 'Show Sold Players Flip'
            },
            soldItems: {
                type: 'number',
                label: 'Sold Items Per Page',
                min: 3,
                max: 8
            },
            soldFlipSeconds: {
                type: 'number',
                label: 'Sold Flip Seconds',
                min: 4,
                max: 15
            }
        },
        imageURL: 'https://placehold.co/1920x1080/111827/34d399?text=Player+Highlight+LED',
        dimensions: { width: 1920, height: 1080 }
    },
];

const OverlayDashboard: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
    const [customParams, setCustomParams] = useState<{ [overlayId: string]: { [key: string]: string } }>({});
    const [expandedEditor, setExpandedEditor] = useState<string | null>(null);

    // Fetch active tournament on mount
    useEffect(() => {
        const fetchActiveTournament = async () => {
            try {
                const response = await fetch('/api/tournaments/active');
                if (response.ok) {
                    const tournament = await response.json();
                    setActiveTournamentId(tournament._id);
                }
            } catch (error) {
                console.error('Failed to fetch active tournament:', error);
            }
        };
        fetchActiveTournament();
    }, []);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        overlayTypes.forEach(t => t.tags.forEach(tag => tags.add(tag)));
        return ['All', ...Array.from(tags).sort()];
    }, []);

    const filteredOverlays = useMemo(() => {
        return overlayTypes.filter(overlay => {
            const matchesSearch = overlay.name.toLowerCase().includes(searchTerm.toLowerCase()) || overlay.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTag = selectedTag === 'All' || overlay.tags.includes(selectedTag);
            return matchesSearch && matchesTag;
        });
    }, [searchTerm, selectedTag]);

    const generateOverlayUrl = (overlay: OverlayType) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        // Use custom params if set, otherwise use defaults
        const paramsToUse = customParams[overlay.id] || overlay.defaultParams;
        const params = new URLSearchParams(paramsToUse);
        if (activeTournamentId) {
            params.set('tournament', activeTournamentId);
        }
        return `${baseUrl}${overlay.route}?${params.toString()}`;
    };

    const handleParameterChange = (overlayId: string, key: string, value: string) => {
        setCustomParams(prev => ({
            ...prev,
            [overlayId]: {
                ...(prev[overlayId] || overlayTypes.find(o => o.id === overlayId)?.defaultParams || {}),
                [key]: value
            }
        }));
    };

    const handleResetParameters = (overlayId: string) => {
        setCustomParams(prev => {
            const newParams = { ...prev };
            delete newParams[overlayId];
            return newParams;
        });
    };

    const toggleEditor = (overlayId: string) => {
        setExpandedEditor(prev => prev === overlayId ? null : overlayId);
    };

    const handleCopy = (url: string) => {
        if (typeof window !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(url);
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 2000);
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-white">Overlay Library</h2>
                <p className="text-md text-neutral-400">Modular overlay components - each can be positioned independently in OBS</p>
                {activeTournamentId && (
                    <p className="text-sm text-green-400 mt-2">✓ Active Tournament: {activeTournamentId}</p>
                )}
            </div>

            <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                 <div>
                    <label htmlFor="search" className="block text-sm font-medium text-neutral-300 mb-1">Search Overlays</label>
                    <input type="text" id="search" placeholder="Search by name or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"/>
                </div>
                <div>
                    <label htmlFor="filter-tag" className="block text-sm font-medium text-neutral-300 mb-1">Filter by Tag</label>
                    <select id="filter-tag" value={selectedTag} onChange={e => setSelectedTag(e.target.value)} className="w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                        {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOverlays.map(overlay => {
                    const overlayUrl = generateOverlayUrl(overlay);
                    return (
                        <div key={overlay.id} className="bg-neutral-800 rounded-lg border border-neutral-700 flex flex-col overflow-hidden group hover:border-cyan-500 transition-colors">
                            <div className="relative">
                                <img src={overlay.imageURL} alt={overlay.name} className="w-full h-40 object-cover" />
                                <div className="absolute top-2 right-2 bg-neutral-900/80 backdrop-blur-sm text-xs px-2 py-1 rounded text-neutral-300">
                                    {overlay.dimensions.width}x{overlay.dimensions.height}
                                </div>
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-lg font-bold text-white">{overlay.name}</h3>
                                <p className="text-sm text-neutral-400 mt-1 flex-grow">{overlay.description}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {overlay.tags.map(tag => (
                                        <span key={tag} className="inline-block bg-neutral-700 text-neutral-300 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-neutral-900/50 border-t border-neutral-700 space-y-2">
                                <div className="flex gap-2">
                                    {overlay.parameterSchema && (
                                        <button
                                            onClick={() => toggleEditor(overlay.id)}
                                            className={`flex-1 flex items-center justify-center gap-2 font-bold py-2 px-4 rounded-md transition-colors text-sm ${
                                                expandedEditor === overlay.id
                                                    ? 'bg-brand-primary hover:bg-brand-primary/80 text-white'
                                                    : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                            </svg>
                                            {expandedEditor === overlay.id ? 'Hide' : 'Customize'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleCopy(overlayUrl)}
                                        className={`flex-1 flex items-center justify-center gap-2 bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm ${
                                            !overlay.parameterSchema ? 'flex-[2]' : ''
                                        }`}
                                    >
                                        <CopyIcon className="h-4 w-4" />
                                        {copiedUrl === overlayUrl ? 'Copied!' : 'Copy URL'}
                                    </button>
                                    <a
                                        href={overlayUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                                    >
                                        <ExternalLinkIcon className="h-4 w-4" />
                                        Open
                                    </a>
                                </div>
                                <details className="text-xs text-neutral-400">
                                    <summary className="cursor-pointer hover:text-neutral-300">Show URL</summary>
                                    <p className="mt-2 font-mono bg-neutral-800 p-2 rounded break-all">{overlayUrl}</p>
                                </details>
                            </div>

                            {/* Parameter Editor */}
                            {overlay.parameterSchema && expandedEditor === overlay.id && (
                                <ParameterEditor
                                    parameterSchema={overlay.parameterSchema}
                                    values={customParams[overlay.id] || overlay.defaultParams}
                                    onChange={(key, value) => handleParameterChange(overlay.id, key, value)}
                                    onReset={() => handleResetParameters(overlay.id)}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {!activeTournamentId && (
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm">
                        ⚠️ No active tournament found. Overlay URLs will be generated without tournament ID. Start an auction in Auction Setup to auto-include tournament ID.
                    </p>
                </div>
            )}
        </div>
    );
};

export default OverlayDashboard;
