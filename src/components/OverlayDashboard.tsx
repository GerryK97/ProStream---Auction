'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CopyIcon, ExternalLinkIcon } from './icons';
import ParameterEditor, { ParameterConfig } from './overlays/parameters/ParameterEditor';
import { useAuth } from '@/contexts/AuthContext';
import OverlayEditModal from './OverlayEditModal';

interface OverlayType {
    id: string;
    name: string;
    description: string;
    route: string;
    tags: string[];
    category: string; // Added category
    defaultParams: { [key: string]: string };
    parameterSchema?: { [key: string]: ParameterConfig };
    imageURL: string;
    dimensions: { width: number; height: number };
}

const teamCardsDefaultParams = {
    layout: 'horizontal',
    position: 'bottom',
    variant: 'neon'
};

const teamCardsParameterSchema: { [key: string]: ParameterConfig } = {
    variant: {
        type: 'select',
        label: 'Design Variant',
        options: ['neon', 'ember', 'midnight'],
        description: 'Pick the built-in design preset'
    },
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
    }
};

const overlayTypes: OverlayType[] = [
    {
        id: 'player-card',
        name: 'Player Card',
        description: 'Display current player being auctioned with stats and bid information',
        route: '/overlays/player-card',
        tags: ['Player', 'Auction', 'Main'],
        category: 'Player Display',
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
        category: 'Player Display',
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
            statsSectionBackground: '#f1f5f9',
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
            backgroundTextLine1: {
                type: 'text',
                label: 'Background Text Line 1',
                description: 'Custom watermark text (first line)',
                placeholder: 'e.g., AUCTION'
            },
            backgroundTextLine2: {
                type: 'text',
                label: 'Background Text Line 2',
                description: 'Custom watermark text (second line)',
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
            statsSectionBackground: {
                type: 'color',
                label: 'Stats Section Background',
                description: 'Background color for the stats area'
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
                label: 'Role Label Text (Fallback)',
                description: 'Fallback text when player class is not available or disabled',
                placeholder: 'e.g., Player, Star, Legend'
            }
        },
        imageURL: 'https://placehold.co/400x450/ff5411/ffcc00?text=Premium+Card',
        dimensions: { width: 380, height: 650 }
    },
    {
        id: 'team-cards-neon',
        name: 'Team Cards · Neon Pulse',
        description: 'Glassmorphism preset with cyan/purple glow, particle grid, and neon balance highlights.',
        route: '/overlays/teams',
        tags: ['Teams', 'Auction', 'Preset', 'Neon'],
        category: 'Team Display',
        defaultParams: {
            layout: 'horizontal',
            position: 'bottom',
            variant: 'neon'
        },
        parameterSchema: teamCardsParameterSchema,
        imageURL: '/overlay-previews/team-cards-neon.png',
        dimensions: { width: 1280, height: 720 }
    },
    {
        id: 'team-cards-ember',
        name: 'Team Cards · Ember Pulse',
        description: 'Molten ember preset with warm gradients, badge heatwave animation, and Last Sold badge.',
        route: '/overlays/teams',
        tags: ['Teams', 'Auction', 'Preset', 'Ember'],
        category: 'Team Display',
        defaultParams: {
            layout: 'horizontal',
            position: 'bottom',
            variant: 'ember'
        },
        parameterSchema: teamCardsParameterSchema,
        imageURL: '/overlay-previews/team-cards-ember.png',
        dimensions: { width: 1280, height: 720 }
    },
    {
        id: 'team-cards-midnight',
        name: 'Team Cards · Midnight Slate',
        description: 'Executive-grade slate design with understated gradients, crisp typography, and unobtrusive motion.',
        route: '/overlays/teams',
        tags: ['Teams', 'Auction', 'Preset', 'Professional'],
        category: 'Team Display',
        defaultParams: {
            layout: 'horizontal',
            position: 'bottom',
            variant: 'midnight'
        },
        parameterSchema: teamCardsParameterSchema,
        imageURL: '/overlay-previews/team-cards-midnight.png',
        dimensions: { width: 1280, height: 720 }
    },
    {
        id: 'ticker',
        name: 'Sold Players Ticker',
        description: 'Continuous scrolling ticker showing all sold players',
        route: '/overlays/ticker',
        tags: ['Players', 'Info'],
        category: 'Ticker',
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
        category: 'Ticker',
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
        id: 'neon-ticker',
        name: 'Neon Cyberpunk Ticker',
        description: 'Futuristic gaming/esports ticker with glowing neon effects, hexagonal design, and scanline overlay',
        route: '/overlays/neon-ticker',
        tags: ['Players', 'Premium', 'Sold', 'Neon', 'Gaming'],
        category: 'Ticker',
        defaultParams: { size: 'default', color: 'cyan', autoplay: 'true', timer: '5000', border: 'true', position: 'bottom' },
        parameterSchema: {
            size: { type: 'select', label: 'Size', options: ['small', 'default', 'large'] },
            color: { type: 'select', label: 'Neon Color', options: ['cyan', 'magenta', 'lime', 'pink', 'gold'], description: 'Neon glow color theme' },
            autoplay: { type: 'toggle', label: 'Auto-play' },
            timer: { type: 'number', label: 'Timer (ms)', min: 1000, max: 30000, step: 1000, description: 'Scroll speed control' },
            border: { type: 'toggle', label: 'Show Border' },
            position: { type: 'select', label: 'Position', options: ['top', 'bottom'] }
        },
        imageURL: 'https://placehold.co/400x200/0a0e1a/00d9ff?text=Neon+Ticker',
        dimensions: { width: 1920, height: 45 }
    },
    {
        id: 'elegant-ticker',
        name: 'Elegant Minimalist Ticker',
        description: 'Sophisticated luxury ticker with frosted glass effect, refined typography, and subtle animations',
        route: '/overlays/elegant-ticker',
        tags: ['Players', 'Premium', 'Sold', 'Elegant', 'Minimal'],
        category: 'Ticker',
        defaultParams: { size: 'default', color: 'champagne', autoplay: 'true', timer: '5000', border: 'true', position: 'bottom', opacity: '100' },
        parameterSchema: {
            size: { type: 'select', label: 'Size', options: ['small', 'default', 'large'] },
            color: { type: 'select', label: 'Color Theme', options: ['champagne', 'platinum', 'rose', 'navy', 'charcoal'], description: 'Elegant color palette' },
            autoplay: { type: 'toggle', label: 'Auto-play' },
            timer: { type: 'number', label: 'Timer (ms)', min: 1000, max: 30000, step: 1000, description: 'Scroll speed control' },
            border: { type: 'toggle', label: 'Show Border' },
            position: { type: 'select', label: 'Position', options: ['top', 'bottom'] },
            opacity: { type: 'number', label: 'Opacity', min: 0, max: 100, step: 5, description: 'Overall transparency (0-100)' }
        },
        imageURL: 'https://placehold.co/400x200/f5f5f0/d4af37?text=Elegant+Ticker',
        dimensions: { width: 1920, height: 65 }
    },
    {
        id: 'current-bid',
        name: 'Current Bid',
        description: 'Large display showing only the current bid amount',
        route: '/overlays/current-bid',
        tags: ['Auction', 'Minimal'],
        category: 'Auction Info',
        defaultParams: { size: 'medium', position: 'top-right' },
        parameterSchema: {
            size: { type: 'select', label: 'Size', options: ['small', 'medium', 'large'] },
            position: { type: 'select', label: 'Position', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'] }
        },
        imageURL: 'https://placehold.co/400x200/1e293b/10b981?text=Current+Bid',
        dimensions: { width: 400, height: 200 }
    },
    {
        id: 'premium-current-bid',
        name: 'Premium Current Bid',
        description: 'Premium current bid display with modern design, glow effects, and full color customization',
        route: '/overlays/premium-current-bid',
        tags: ['Auction', 'Premium', 'Customizable'],
        category: 'Auction Info',
        defaultParams: {
            size: 'medium',
            position: 'top-right',
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            borderColor: '#3b82f6',
            labelColor: '#93c5fd',
            bidColor: '#60a5fa',
            accentColor: '#2563eb',
            shadowColor: 'rgba(37, 99, 235, 0.5)',
            showPlayerName: 'false',
            showGlow: 'true',
            borderRadius: 'large',
            opacity: '100'
        },
        parameterSchema: {
            size: { type: 'select', label: 'Size', options: ['small', 'medium', 'large'], description: 'Overlay size' },
            position: { type: 'select', label: 'Position', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'], description: 'Screen position' },
            backgroundColor: { type: 'color', label: 'Background Color', description: 'Main background color (supports rgba)' },
            borderColor: { type: 'color', label: 'Border Color', description: 'Border accent color' },
            labelColor: { type: 'color', label: 'Label Color', description: 'Text color for labels' },
            bidColor: { type: 'color', label: 'Bid Amount Color', description: 'Color for the bid amount' },
            accentColor: { type: 'color', label: 'Accent Color', description: 'Gradient and highlight color' },
            shadowColor: { type: 'color', label: 'Shadow/Glow Color', description: 'Glow effect color (supports rgba)' },
            showPlayerName: { type: 'toggle', label: 'Show Player Name', description: 'Display current player name' },
            showGlow: { type: 'toggle', label: 'Show Glow Effect', description: 'Enable glow/shadow effects' },
            borderRadius: { type: 'select', label: 'Border Radius', options: ['none', 'small', 'medium', 'large'], description: 'Corner roundness' },
            opacity: { type: 'number', label: 'Opacity', min: 0, max: 100, step: 5, description: 'Overall transparency (0-100)' }
        },
        imageURL: 'https://placehold.co/400x200/1e3a8a/60a5fa?text=Premium+Current+Bid',
        dimensions: { width: 500, height: 250 }
    },
    {
        id: 'status',
        name: 'Status Overlay',
        description: 'Show auction status messages when no active player',
        route: '/overlays/status',
        tags: ['Info', 'Status'],
        category: 'Auction Info',
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
        category: 'Statistics',
        defaultParams: {
            sortBy: 'players',
            position: 'top-right',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            opacity: '100'
        },
        parameterSchema: {
            sortBy: { type: 'select', label: 'Sort By', options: ['players', 'balance', 'spent'], description: 'Sort teams by players count, remaining balance, or money spent' },
            position: { type: 'select', label: 'Position', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'] },
            backgroundColor: { type: 'color', label: 'Background Color', description: 'Background color (supports rgba)' },
            opacity: { type: 'number', label: 'Opacity', min: 0, max: 100, step: 5, description: 'Overall transparency (0-100)' }
        },
        imageURL: 'https://placehold.co/400x200/1e293b/f59e0b?text=Leaderboard',
        dimensions: { width: 320, height: 400 }
    },
    {
        id: 'premium-leaderboard',
        name: 'Premium Leaderboard',
        description: 'Modern premium leaderboard with glassmorphism, custom colors, and smooth animations',
        route: '/overlays/premium-leaderboard',
        tags: ['Teams', 'Stats', 'Premium', 'Customizable'],
        category: 'Statistics',
        defaultParams: {
            sortBy: 'players',
            position: 'top-right',
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            accentColor: '#3b82f6',
            headerColor: '#60a5fa',
            textColor: '#f0f9ff',
            opacity: '100'
        },
        parameterSchema: {
            sortBy: { type: 'select', label: 'Sort By', options: ['players', 'balance', 'spent'], description: 'Sort teams by players count, remaining balance, or money spent' },
            position: { type: 'select', label: 'Position', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], description: 'Screen position' },
            backgroundColor: { type: 'color', label: 'Background Color', description: 'Main background color (supports rgba)' },
            accentColor: { type: 'color', label: 'Accent Color', description: 'Border and highlight color' },
            headerColor: { type: 'color', label: 'Header Color', description: 'Title and badge text color' },
            textColor: { type: 'color', label: 'Text Color', description: 'Team name and general text color' },
            opacity: { type: 'number', label: 'Opacity', min: 0, max: 100, step: 5, description: 'Overall transparency (0-100)' }
        },
        imageURL: 'https://placehold.co/400x200/1e3a8a/60a5fa?text=Premium+Leaderboard',
        dimensions: { width: 384, height: 500 }
    },
    {
        id: 'sale-banner',
        name: 'Sold Players Flipper',
        description: 'Auto-flipping display showing sold players one at a time with customizable duration',
        route: '/overlays/sale-banner',
        tags: ['Auction', 'Players', 'Sold', 'Animated'],
        category: 'Notifications',
        defaultParams: {
            position: 'top-right',
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            opacity: '100',
            displayDuration: '5000'
        },
        parameterSchema: {
            position: { type: 'select', label: 'Position', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], description: 'Screen position' },
            backgroundColor: { type: 'color', label: 'Background Color', description: 'Background color (supports rgba)' },
            opacity: { type: 'number', label: 'Opacity', min: 0, max: 100, step: 5, description: 'Overall transparency (0-100)' },
            displayDuration: { type: 'number', label: 'Display Duration (ms)', min: 1000, max: 30000, step: 1000, description: 'Time to show each player in milliseconds (1000ms = 1 second)' }
        },
        imageURL: 'https://placehold.co/400x200/1e293b/10b981?text=Sold+Players+Flipper',
        dimensions: { width: 384, height: 280 }
    },
    {
        id: 'sale-banner-premium',
        name: 'Sold Players Flipper · Premium',
        description: 'Premium auto-flipping display with golden accents, gradient frames, and full color customization',
        route: '/overlays/sale-banner-premium',
        tags: ['Auction', 'Players', 'Sold', 'Animated', 'Premium'],
        category: 'Notifications',
        defaultParams: {
            position: 'top-right',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            accentColor: '#f59e0b',
            textColor: '#f1f5f9',
            priceColor: '#fbbf24',
            opacity: '100',
            displayDuration: '5000'
        },
        parameterSchema: {
            position: { type: 'select', label: 'Position', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], description: 'Screen position' },
            backgroundColor: { type: 'color', label: 'Background Color', description: 'Main background color (supports rgba)' },
            accentColor: { type: 'color', label: 'Accent Color', description: 'Border, badge, and highlight color' },
            textColor: { type: 'color', label: 'Text Color', description: 'Player and team name color' },
            priceColor: { type: 'color', label: 'Price Color', description: 'Final price display color' },
            opacity: { type: 'number', label: 'Opacity', min: 0, max: 100, step: 5, description: 'Overall transparency (0-100)' },
            displayDuration: { type: 'number', label: 'Display Duration (ms)', min: 1000, max: 30000, step: 1000, description: 'Time to show each player in milliseconds (1000ms = 1 second)' }
        },
        imageURL: 'https://placehold.co/400x200/0f172a/f59e0b?text=Premium+Flipper',
        dimensions: { width: 420, height: 320 }
    },
    {
        id: 'sold-summary',
        name: 'Sold Players Summary',
        description: 'Auction summary showing all sold players sorted by price - updates in real-time',
        route: '/overlays/sold-summary',
        tags: ['Summary', 'Stats', 'Live'],
        category: 'Statistics',
        defaultParams: { position: 'center' },
        parameterSchema: {
            position: {
                type: 'select',
                label: 'Position',
                options: ['center', 'top', 'bottom'],
                description: 'Overlay screen position'
            }
        },
        imageURL: 'https://placehold.co/400x200/1e293b/06b6d4?text=Sold+Summary',
        dimensions: { width: 1200, height: 800 }
    },
    {
        id: 'sold-summary-premium',
        name: 'Sold Players Summary · Premium',
        description: 'Premium auction summary with luxury styling, golden accents, and full color customization',
        route: '/overlays/sold-summary-premium',
        tags: ['Summary', 'Stats', 'Live', 'Premium'],
        category: 'Statistics',
        defaultParams: {
            position: 'center',
            accentColor: '#f59e0b',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            textColor: '#f1f5f9',
            priceColor: '#fbbf24',
            itemsPerPage: '20'
        },
        parameterSchema: {
            position: {
                type: 'select',
                label: 'Position',
                options: ['center', 'top', 'bottom'],
                description: 'Overlay screen position'
            },
            accentColor: {
                type: 'color',
                label: 'Accent Color',
                description: 'Border and highlight color (gold/amber recommended)'
            },
            backgroundColor: {
                type: 'color',
                label: 'Background Color',
                description: 'Main background color (supports rgba)'
            },
            textColor: {
                type: 'color',
                label: 'Text Color',
                description: 'Player and team names color'
            },
            priceColor: {
                type: 'color',
                label: 'Price Color',
                description: 'Price display color'
            },
            itemsPerPage: {
                type: 'number',
                label: 'Players Per Page',
                min: 5,
                max: 50,
                step: 5,
                description: 'Number of players to show per page'
            }
        },
        imageURL: 'https://placehold.co/400x200/0f172a/f59e0b?text=Premium+Summary',
        dimensions: { width: 1200, height: 800 }
    },
    {
        id: 'sold-summary-minimalist',
        name: 'Sold Players Summary · Minimalist',
        description: 'Clean minimalist auction summary with simple design and customizable colors',
        route: '/overlays/sold-summary-minimalist',
        tags: ['Summary', 'Stats', 'Live', 'Minimalist'],
        category: 'Statistics',
        defaultParams: {
            position: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textColor: '#ffffff',
            accentColor: '#6366f1',
            itemsPerPage: '20'
        },
        parameterSchema: {
            position: {
                type: 'select',
                label: 'Position',
                options: ['center', 'top', 'bottom'],
                description: 'Overlay screen position'
            },
            backgroundColor: {
                type: 'color',
                label: 'Background Color',
                description: 'Main background color (supports rgba)'
            },
            borderColor: {
                type: 'color',
                label: 'Border Color',
                description: 'Border and divider lines color'
            },
            textColor: {
                type: 'color',
                label: 'Text Color',
                description: 'All text color'
            },
            accentColor: {
                type: 'color',
                label: 'Accent Color',
                description: 'Highlight color for top players'
            },
            itemsPerPage: {
                type: 'number',
                label: 'Players Per Page',
                min: 5,
                max: 50,
                step: 5,
                description: 'Number of players to show per page'
            }
        },
        imageURL: 'https://placehold.co/400x200/ffffff/6366f1?text=Minimalist+Summary',
        dimensions: { width: 1200, height: 800 }
    },
    {
        id: 'auction-overview',
        name: 'Auction Overview LED',
        description: 'Full-screen comprehensive auction display with auto-flipping team pages and complex animations - perfect for LED screens (1920x1080)',
        route: '/overlays/auction-overview',
        tags: ['Full Screen', 'LED', 'Premium', 'Comprehensive'],
        category: 'Full Screen',
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
        category: 'Full Screen',
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
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
    const [customParams, setCustomParams] = useState<{ [overlayId: string]: { [key: string]: string } }>({});
    const [expandedEditor, setExpandedEditor] = useState<string | null>(null);
    const [previewOverlay, setPreviewOverlay] = useState<{ url: string; name: string; imageURL?: string } | null>(null);
    const [editOverlay, setEditOverlay] = useState<OverlayType | null>(null);
    const [overlays, setOverlays] = useState<OverlayType[]>(overlayTypes); // Start with hardcoded, then fetch from API
    const [isLoadingOverlays, setIsLoadingOverlays] = useState(false);

    // Fetch overlays and active tournament on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get auth token from localStorage
                const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                const headers: Record<string, string> = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                // Fetch overlays from API
                setIsLoadingOverlays(true);
                const overlaysResponse = await fetch('/api/overlay-library', { headers });
                if (overlaysResponse.ok) {
                    const overlaysData = await overlaysResponse.json();

                    // If API returns data, use it; otherwise keep hardcoded fallback
                    if (overlaysData && overlaysData.length > 0) {
                        // Convert API data to OverlayType format
                        const formattedOverlays = overlaysData.map((overlay: any) => ({
                            id: overlay._id,
                            name: overlay.name,
                            description: overlay.description,
                            route: overlay.route,
                            tags: overlay.tags,
                            category: overlay.category,
                            defaultParams: overlay.defaultParams,
                            parameterSchema: overlay.parameterSchema,
                            imageURL: overlay.imageURL,
                            dimensions: overlay.dimensions
                        }));
                        setOverlays(formattedOverlays);
                    } else {
                        console.warn('API returned empty overlay list, using hardcoded fallback data');
                        // Keep the hardcoded overlayTypes that were set in initial state
                    }
                } else {
                    console.warn('Failed to fetch overlays from API, using fallback data');
                }
                setIsLoadingOverlays(false);

                // Fetch active tournament
                const tournamentResponse = await fetch('/api/tournaments/active', { headers });
                if (tournamentResponse.ok) {
                    const tournament = await tournamentResponse.json();
                    setActiveTournamentId(tournament._id);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
                setIsLoadingOverlays(false);
            }
        };
        fetchData();
    }, []);

    const allCategories = useMemo(() => {
        const categories = new Set<string>();
        overlays.forEach(t => categories.add(t.category));
        return ['All', ...Array.from(categories).sort()];
    }, [overlays]);

    const filteredOverlays = useMemo(() => {
        return overlays.filter(overlay => {
            const matchesSearch = overlay.name.toLowerCase().includes(searchTerm.toLowerCase()) || overlay.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedTag === 'All' || overlay.category === selectedTag;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedTag, overlays]);

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
                ...(prev[overlayId] || overlays.find(o => o.id === overlayId)?.defaultParams || {}),
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

    const handleSaveOverlay = async (updates: {
        name: string;
        description: string;
        category: string;
        imageURL: string;
        dimensions: { width: number; height: number };
    }) => {
        if (!editOverlay) return;

        try {
            // Get auth token from localStorage
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Persist to database
            const response = await fetch(`/api/overlay-library/${editOverlay.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const updatedOverlay = await response.json();

                // Update the overlay in local state
                setOverlays(prev => prev.map(o =>
                    o.id === editOverlay.id
                        ? {
                            ...o,
                            name: updatedOverlay.name,
                            description: updatedOverlay.description,
                            category: updatedOverlay.category,
                            imageURL: updatedOverlay.imageURL,
                            dimensions: updatedOverlay.dimensions
                        }
                        : o
                ));
            } else {
                console.error('Failed to save overlay');
                alert('Failed to save overlay changes');
            }
        } catch (error) {
            console.error('Error saving overlay:', error);
            alert('Error saving overlay changes');
        }

        setEditOverlay(null);
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Overlay Library</h2>
                <p className="text-md" style={{ color: 'var(--text-tertiary)' }}>Modular overlay components - each can be positioned independently in OBS</p>
                {activeTournamentId && (
                    <p className="text-sm text-green-400 mt-2">✓ Active Tournament: {activeTournamentId}</p>
                )}
            </div>

            <div className="p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 items-end" style={{
              borderColor: 'var(--border-primary)',
              border: `1px solid var(--border-primary)`,
              backgroundColor: 'var(--surface-secondary)'
            }}>
                 <div>
                    <label htmlFor="search" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Search Overlays</label>
                    <input type="text" id="search" placeholder="Search by name or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{
                      backgroundColor: 'var(--surface-elevated)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }} className="w-full border rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"/>
                </div>
                <div>
                    <label htmlFor="filter-category" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Filter by Category</label>
                    <select id="filter-category" value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={{
                      backgroundColor: 'var(--surface-elevated)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }} className="w-full border rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                        {allCategories.map(category => <option key={category} value={category}>{category}</option>)}
                    </select>
                </div>
            </div>

            {/* Table/List View */}
            <div className="rounded-lg overflow-hidden" style={{
                borderColor: 'var(--border-primary)',
                border: `1px solid var(--border-primary)`,
                backgroundColor: 'var(--surface-secondary)'
            }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ backgroundColor: 'var(--surface-elevated)' }}>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', width: '100px' }}>Preview</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', width: '200px' }}>Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Description</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', width: '150px' }}>Category</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', width: '120px' }}>Dimensions</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', width: '280px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody style={{ backgroundColor: 'var(--surface-secondary)' }}>
                            {filteredOverlays.map((overlay, index) => {
                                const overlayUrl = generateOverlayUrl(overlay);
                                return (
                                    <React.Fragment key={overlay.id}>
                                        <tr
                                            className="hover:bg-opacity-50 transition-colors"
                                            style={{
                                                borderTop: index !== 0 ? `1px solid var(--border-primary)` : 'none',
                                                backgroundColor: 'var(--surface-secondary)'
                                            }}
                                        >
                                            {/* Preview Thumbnail */}
                                            <td className="px-4 py-3">
                                                <img
                                                    src={overlay.imageURL}
                                                    alt={overlay.name}
                                                    className="w-20 h-14 object-cover rounded border"
                                                    style={{ borderColor: 'var(--border-primary)' }}
                                                />
                                            </td>

                                            {/* Name */}
                                            <td className="px-4 py-3">
                                                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    {overlay.name}
                                                </div>
                                            </td>

                                            {/* Description */}
                                            <td className="px-4 py-3">
                                                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                                    {overlay.description}
                                                </p>
                                            </td>

                                            {/* Category */}
                                            <td className="px-4 py-3">
                                                <span
                                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                                                    style={{
                                                        backgroundColor: 'var(--surface-hover)',
                                                        color: 'var(--text-secondary)'
                                                    }}
                                                >
                                                    {overlay.category}
                                                </span>
                                            </td>

                                            {/* Dimensions */}
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                                    {overlay.dimensions.width}×{overlay.dimensions.height}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1.5 justify-end">
                                                    {/* View Button */}
                                                    <button
                                                        onClick={() => setPreviewOverlay({ url: overlayUrl, name: overlay.name, imageURL: overlay.imageURL })}
                                                        className="px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
                                                        style={{
                                                            backgroundColor: 'var(--surface-elevated)',
                                                            color: 'var(--text-primary)',
                                                            border: `1px solid var(--border-primary)`
                                                        }}
                                                        title="Preview overlay"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>

                                                    {/* Customize Button */}
                                                    {overlay.parameterSchema && (
                                                        <button
                                                            onClick={() => toggleEditor(overlay.id)}
                                                            className="px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
                                                            style={{
                                                                backgroundColor: expandedEditor === overlay.id ? 'var(--brand-primary)' : 'var(--surface-elevated)',
                                                                color: expandedEditor === overlay.id ? 'white' : 'var(--text-primary)',
                                                                border: `1px solid ${expandedEditor === overlay.id ? 'var(--brand-primary)' : 'var(--border-primary)'}`
                                                            }}
                                                            title="Customize parameters"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                                            </svg>
                                                        </button>
                                                    )}

                                                    {/* Copy URL Button */}
                                                    <button
                                                        onClick={() => handleCopy(overlayUrl)}
                                                        className="px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
                                                        style={{
                                                            backgroundColor: 'var(--surface-elevated)',
                                                            color: 'var(--text-primary)',
                                                            border: `1px solid var(--border-primary)`
                                                        }}
                                                        title="Copy overlay URL"
                                                    >
                                                        {copiedUrl === overlayUrl ? (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        ) : (
                                                            <CopyIcon className="w-4 h-4" />
                                                        )}
                                                    </button>

                                                    {/* Edit Button (Admin Only) */}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => setEditOverlay(overlay)}
                                                            className="px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
                                                            style={{
                                                                backgroundColor: 'var(--surface-elevated)',
                                                                color: 'var(--text-primary)',
                                                                border: `1px solid var(--border-primary)`
                                                            }}
                                                            title="Edit overlay (Admin)"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Parameter Editor Row */}
                                        {overlay.parameterSchema && expandedEditor === overlay.id && (
                                            <tr style={{ backgroundColor: 'var(--surface-elevated)' }}>
                                                <td colSpan={6} className="px-4 py-4" style={{ borderTop: `1px solid var(--border-primary)` }}>
                                                    <ParameterEditor
                                                        parameterSchema={overlay.parameterSchema}
                                                        values={customParams[overlay.id] || overlay.defaultParams}
                                                        onChange={(key, value) => handleParameterChange(overlay.id, key, value)}
                                                        onReset={() => handleResetParameters(overlay.id)}
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {filteredOverlays.length === 0 && (
                    <div className="py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No overlays found matching your filters.</p>
                    </div>
                )}
            </div>

            {/* Preview Layer */}
            {previewOverlay && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
                    onClick={() => setPreviewOverlay(null)}
                >
                    <div className="relative w-full h-full max-w-7xl max-h-screen">
                        {/* Close Button */}
                        <button
                            onClick={() => setPreviewOverlay(null)}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full transition-colors"
                            style={{
                                backgroundColor: 'var(--surface-secondary)',
                                color: 'var(--text-primary)',
                                border: `2px solid var(--border-primary)`
                            }}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Overlay Name */}
                        <div
                            className="absolute top-4 left-4 z-10 px-4 py-2 rounded-lg"
                            style={{
                                backgroundColor: 'var(--surface-secondary)',
                                border: `1px solid var(--border-primary)`
                            }}
                        >
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {previewOverlay.name}
                            </p>
                        </div>

                        {/* Preview Image */}
                        <div className="w-full h-full flex items-center justify-center">
                            {previewOverlay.imageURL ? (
                                <img
                                    src={previewOverlay.imageURL}
                                    alt={`Preview: ${previewOverlay.name}`}
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                    style={{ border: `2px solid var(--border-primary)` }}
                                />
                            ) : (
                                <div
                                    className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg"
                                    style={{
                                        backgroundColor: 'var(--surface-secondary)',
                                        border: `2px dashed var(--border-primary)`,
                                        color: 'var(--text-tertiary)'
                                    }}
                                >
                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm">No preview image available</p>
                                    <p className="text-xs">Upload an image using the Edit button</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!activeTournamentId && (
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm">
                        ⚠️ No active tournament found. Overlay URLs will be generated without tournament ID. Start an auction in Auction Setup to auto-include tournament ID.
                    </p>
                </div>
            )}

            {/* Edit Modal */}
            {editOverlay && (
                <OverlayEditModal
                    overlay={editOverlay}
                    onClose={() => setEditOverlay(null)}
                    onSave={handleSaveOverlay}
                />
            )}
        </div>
    );
};

export default OverlayDashboard;
