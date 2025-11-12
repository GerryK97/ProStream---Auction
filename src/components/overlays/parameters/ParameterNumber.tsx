'use client';

import React from 'react';

interface ParameterNumberProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    description?: string;
}

/**
 * Reusable number input for overlay parameters
 * Used for parameters like timer (milliseconds), duration, etc.
 */
const ParameterNumber: React.FC<ParameterNumberProps> = ({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    description
}) => {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-300">
                {label}
            </label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-full bg-neutral-700 border border-neutral-600 text-neutral-100 text-sm rounded-md px-3 py-1.5 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
            />
            {description && (
                <p className="text-xs text-neutral-500">{description}</p>
            )}
        </div>
    );
};

export default ParameterNumber;
