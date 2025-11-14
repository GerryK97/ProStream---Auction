'use client';

import React from 'react';
import ParameterSelect from './ParameterSelect';
import ParameterToggle from './ParameterToggle';
import ParameterNumber from './ParameterNumber';
import ParameterColor from './ParameterColor';
import ParameterText from './ParameterText';

export interface ParameterConfig {
    type: 'select' | 'toggle' | 'number' | 'color' | 'text';
    label: string;
    description?: string;
    options?: string[]; // for select
    min?: number; // for number
    max?: number; // for number
    step?: number; // for number
    placeholder?: string; // for text
}

interface ParameterEditorProps {
    parameterSchema: { [key: string]: ParameterConfig };
    values: { [key: string]: string };
    onChange: (key: string, value: string) => void;
    onReset: () => void;
}

/**
 * Container component that renders appropriate parameter controls
 * based on the provided schema
 */
const ParameterEditor: React.FC<ParameterEditorProps> = ({
    parameterSchema,
    values,
    onChange,
    onReset
}) => {
    const renderParameter = (key: string, config: ParameterConfig) => {
        const value = values[key];

        switch (config.type) {
            case 'select':
                return (
                    <ParameterSelect
                        key={key}
                        label={config.label}
                        value={value}
                        options={config.options || []}
                        onChange={(newValue) => onChange(key, newValue)}
                        description={config.description}
                    />
                );

            case 'toggle':
                return (
                    <ParameterToggle
                        key={key}
                        label={config.label}
                        value={value === 'true'}
                        onChange={(newValue) => onChange(key, newValue.toString())}
                        description={config.description}
                    />
                );

            case 'number':
                return (
                    <ParameterNumber
                        key={key}
                        label={config.label}
                        value={Number(value)}
                        onChange={(newValue) => onChange(key, newValue.toString())}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        description={config.description}
                    />
                );

            case 'color':
                return (
                    <ParameterColor
                        key={key}
                        label={config.label}
                        value={value}
                        onChange={(newValue) => onChange(key, newValue)}
                        description={config.description}
                    />
                );

            case 'text':
                return (
                    <ParameterText
                        key={key}
                        label={config.label}
                        value={value}
                        onChange={(newValue) => onChange(key, newValue)}
                        description={config.description}
                        placeholder={config.placeholder}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="p-4 bg-neutral-900/50 border-t border-neutral-700 space-y-3 animate-slide-in-top">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-neutral-200">Customize Overlay</h4>
                <button
                    onClick={onReset}
                    className="text-xs text-neutral-400 hover:text-brand-primary transition-colors"
                >
                    Reset to Defaults
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(parameterSchema).map(([key, config]) =>
                    renderParameter(key, config)
                )}
            </div>

            <div className="pt-2 border-t border-neutral-700">
                <p className="text-xs text-neutral-500">
                    Changes will be reflected in the URL below. Copy or open the overlay with your custom settings.
                </p>
            </div>
        </div>
    );
};

export default ParameterEditor;
