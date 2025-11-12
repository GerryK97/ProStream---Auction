'use client';

import React from 'react';

interface ParameterSelectProps {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    description?: string;
}

/**
 * Reusable select dropdown for overlay parameters
 * Used for enum-based parameters like size, position, effect, etc.
 */
const ParameterSelect: React.FC<ParameterSelectProps> = ({
    label,
    value,
    options,
    onChange,
    description
}) => {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-300">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-neutral-700 border border-neutral-600 text-neutral-100 text-sm rounded-md px-3 py-1.5 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1).replace(/-/g, ' ')}
                    </option>
                ))}
            </select>
            {description && (
                <p className="text-xs text-neutral-500">{description}</p>
            )}
        </div>
    );
};

export default ParameterSelect;
