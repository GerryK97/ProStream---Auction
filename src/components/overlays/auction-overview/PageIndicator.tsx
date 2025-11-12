'use client';

import React from 'react';

interface PageIndicatorProps {
    currentPage: number;
    totalPages: number;
    progress: number; // 0-1, progress through current page
}

/**
 * Displays page indicator dots and progress bar for team pagination
 */
const PageIndicator: React.FC<PageIndicatorProps> = ({ currentPage, totalPages, progress }) => {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-neutral-900/80 backdrop-blur-sm px-4 py-2 rounded-full border border-neutral-700">
            {/* Page Dots */}
            <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                    <div
                        key={i}
                        className={`rounded-full transition-all duration-300 ${
                            i === currentPage
                                ? 'w-3 h-3 bg-cyan-400 animate-page-dot-pulse'
                                : 'w-2 h-2 bg-neutral-600'
                        }`}
                    />
                ))}
            </div>

            {/* Page Number */}
            <div className="text-sm text-neutral-400 font-semibold">
                <span className="text-cyan-400">{currentPage + 1}</span>
                <span className="mx-1">/</span>
                <span>{totalPages}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-16 h-1 bg-neutral-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-cyan-400 transition-all duration-100 ease-linear"
                    style={{ width: `${progress * 100}%` }}
                />
            </div>
        </div>
    );
};

export default PageIndicator;
