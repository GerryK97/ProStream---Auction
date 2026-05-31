'use client';

import React, { forwardRef } from 'react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  helperText?: string;
  errorText?: string;
  trailing?: React.ReactNode;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ id, label, helperText, errorText, trailing, className = '', type = 'text', ...rest }, ref) => {
    const helperId = helperText ? `${id}-helper` : undefined;
    const errorId = errorText ? `${id}-error` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="space-y-2">
        <label htmlFor={id} className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
        <div className="relative">
          <input
            id={id}
            ref={ref}
            type={type}
            aria-invalid={Boolean(errorText)}
            aria-describedby={describedBy}
            className={`w-full rounded-xl border px-4 py-3 transition focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-60 ${trailing ? 'pr-12' : ''} ${className}`}
            style={{
              backgroundColor: 'var(--surface-elevated)',
              color: 'var(--text-primary)',
              borderColor: errorText ? 'color-mix(in oklab, var(--status-danger) 60%, transparent)' : 'var(--border-primary)'
            }}
            {...rest}
          />
          {trailing && (
            <span className="absolute inset-y-0 right-3 flex items-center" style={{ color: 'var(--text-tertiary)' }}>{trailing}</span>
          )}
        </div>
        {errorText ? (
          <p id={errorId} role="alert" className="text-sm" style={{ color: 'var(--status-danger)' }}>
            {errorText}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

TextField.displayName = 'TextField';

export default TextField;
