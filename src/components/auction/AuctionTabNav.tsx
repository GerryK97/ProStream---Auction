'use client';

import React from 'react';
import type { AuctionWorkspaceTab } from './types';

const TABS: { key: AuctionWorkspaceTab; label: string; icon: React.ReactNode }[] = [
    {
        key: 'auction',
        label: 'Auction',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
        ),
    },
    {
        key: 'available',
        label: 'Players',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 10-16 0" />
            </svg>
        ),
    },
    {
        key: 'teams',
        label: 'Teams',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
        ),
    },
    {
        key: 'results',
        label: 'Results',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
        ),
    },
];

interface AuctionTabNavProps {
    activeTab: AuctionWorkspaceTab;
    onTabChange: (tab: AuctionWorkspaceTab) => void;
    variant?: 'horizontal' | 'bottom';
}

export default function AuctionTabNav({ activeTab, onTabChange, variant = 'horizontal' }: AuctionTabNavProps) {
    if (variant === 'bottom') {
        return (
            <div
                className="shrink-0 grid grid-cols-4 border-t"
                style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-primary)' }}
            >
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => onTabChange(tab.key)}
                        className="flex flex-col items-center gap-1 pt-3 pb-2.5 transition-colors"
                        style={{
                            color: activeTab === tab.key ? 'var(--brand-primary)' : 'var(--text-secondary)',
                            borderTop: activeTab === tab.key ? '2px solid var(--brand-primary)' : '2px solid transparent',
                        }}
                    >
                        {tab.icon}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div
            className="flex flex-wrap gap-1 p-1 rounded-lg border min-w-0"
            style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-primary)' }}
            role="tablist"
            aria-label="Auction workspace"
        >
            {TABS.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                    <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onTabChange(tab.key)}
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all min-w-0"
                        style={{
                            backgroundColor: isActive ? 'color-mix(in oklab, var(--brand-primary) 18%, transparent)' : 'transparent',
                            color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        }}
                    >
                        <span className="shrink-0">{tab.icon}</span>
                        <span className="truncate">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
