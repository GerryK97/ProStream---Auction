'use client';

import React, { type CSSProperties, type ReactNode } from 'react';

interface Theme3PlaceholderProps {
  name: string;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

/** Blank Theme 3 shell — replace with your implementation. */
export function Theme3Placeholder({ name, children, style, className }: Theme3PlaceholderProps) {
  return (
    <div
      data-theme3={name}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        padding: '0.75rem 1rem',
        border: '2px dashed var(--t3-border-subtle, rgba(255,255,255,0.15))',
        borderRadius: 8,
        background: 'var(--t3-bg-card, rgba(0,0,0,0.2))',
        color: 'var(--t3-text-muted, #888)',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 11,
        letterSpacing: '0.04em',
        ...style,
      }}
    >
      {children ?? `Theme 3 · ${name}`}
    </div>
  );
}
