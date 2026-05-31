'use client';

import React from 'react';

interface ParameterTextProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    description?: string;
    placeholder?: string;
}

/**
 * Text input parameter control
 * Allows users to enter custom text values
 */
const ParameterText: React.FC<ParameterTextProps> = ({
    label,
    value,
    onChange,
    description,
    placeholder
}) => {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-300">
                {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-primary"
            />
            {description && (
                <p className="text-xs text-neutral-500">{description}</p>
            )}
        </div>
    );
};

export default ParameterText;
