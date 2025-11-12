'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CopyIcon, ExternalLinkIcon } from './icons';

interface OverlayType {
    id: string;
    name: string;
    description: string;
    route: string;
    tags: string[];
    defaultParams: { [key: string]: string };
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
        imageURL: 'https://placehold.co/400x200/1e293b/06b6d4?text=Player+Card',
        dimensions: { width: 800, height: 300 }
    },
    {
        id: 'premium-player-card',
        name: 'Premium Player Card',
        description: 'Stylish premium player card with gradient background, jersey number, and stats',
        route: '/overlays/premium-player-card',
        tags: ['Player', 'Auction', 'Premium'],
        defaultParams: { position: 'center' },
        imageURL: 'https://placehold.co/400x450/ff5411/ffcc00?text=Premium+Card',
        dimensions: { width: 380, height: 650 }
    },
    {
        id: 'teams',
        name: 'Team Cards',
        description: 'Show all teams with balances, max bids, and players purchased',
        route: '/overlays/teams',
        tags: ['Teams', 'Auction'],
        defaultParams: { layout: 'horizontal', position: 'bottom' },
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
        imageURL: 'https://placehold.co/400x200/1e293b/10b981?text=Final+Summary',
        dimensions: { width: 1200, height: 800 }
    },
];

const OverlayDashboard: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);

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
        const params = new URLSearchParams(overlay.defaultParams);
        if (activeTournamentId) {
            params.set('tournament', activeTournamentId);
        }
        return `${baseUrl}${overlay.route}?${params.toString()}`;
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
                                    <button
                                        onClick={() => handleCopy(overlayUrl)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
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
