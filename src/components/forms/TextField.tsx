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
        <label htmlFor={id} className="block text-sm font-medium text-slate-200">
          {label}
        </label>
        <div className="relative">
          <input
            id={id}
            ref={ref}
            type={type}
            aria-invalid={Boolean(errorText)}
            aria-describedby={describedBy}
            className={`w-full rounded-xl border bg-slate-800/70 px-4 py-3 text-white placeholder-slate-400 transition focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-60 ${
              errorText ? 'border-red-500/60' : 'border-slate-600'
            } ${trailing ? 'pr-12' : ''} ${className}`}
            {...rest}
          />
          {trailing && (
            <span className="absolute inset-y-0 right-3 flex items-center text-neutral-400">{trailing}</span>
          )}
        </div>
        {errorText ? (
          <p id={errorId} role="alert" className="text-sm text-red-400">
            {errorText}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-sm text-slate-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

TextField.displayName = 'TextField';

export default TextField;
