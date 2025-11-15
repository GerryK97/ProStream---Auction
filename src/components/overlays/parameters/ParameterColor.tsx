'use client';

import React from 'react';

interface ParameterColorProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    description?: string;
}

/**
 * Color picker parameter control with hex input
 * Allows users to select colors via color picker or manual hex input
 */
const ParameterColor: React.FC<ParameterColorProps> = ({
    label,
    value,
    onChange,
    description
}) => {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-300">
                {label}
            </label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-10 w-20 rounded cursor-pointer border border-neutral-600 bg-neutral-700"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary"
                />
            </div>
            {description && (
                <p className="text-xs text-neutral-500">{description}</p>
            )}
        </div>
    );
};

export default ParameterColor;
