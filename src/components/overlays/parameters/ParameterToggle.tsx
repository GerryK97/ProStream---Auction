'use client';

import React from 'react';

interface ParameterToggleProps {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    description?: string;
}

/**
 * Reusable toggle switch for overlay boolean parameters
 * Used for parameters like autoplay, border, etc.
 */
const ParameterToggle: React.FC<ParameterToggleProps> = ({
    label,
    value,
    onChange,
    description
}) => {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-neutral-300">
                    {label}
                </label>
                <button
                    type="button"
                    onClick={() => onChange(!value)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-neutral-800 ${
                        value ? 'bg-brand-primary' : 'bg-neutral-600'
                    }`}
                >
                    <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                    />
                </button>
            </div>
            {description && (
                <p className="text-xs text-neutral-500">{description}</p>
            )}
        </div>
    );
};

export default ParameterToggle;
