'use client';

import React from 'react';

type ClearSize = 'sm' | 'md';

interface ClearAllButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel?: string;
  label?: string;
  size?: ClearSize;
}

const ClearAllButton: React.FC<ClearAllButtonProps> = ({
  ariaLabel = 'Clear All',
  label = 'Clear All',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const classes = [
    'clear-button',
    size === 'sm' ? 'clear-button--sm' : 'clear-button--md',
    disabled ? 'clear-button--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" aria-label={ariaLabel} className={classes} disabled={disabled} {...props}>
      <span className="clear-button__text">{label}</span>
      <span className="clear-button__icon" aria-hidden="true">
        <svg className="clear-button__svg" viewBox="0 0 512 512" width="512" height="512">
          <title>Clear All</title>
          <path d="M112,112l20,320c.95,18.49,14.4,32,32,32H348c17.67,0,30.87-13.51,32-32l20-320" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
          <line x1="80" y1="112" x2="432" y2="112" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" />
          <path d="M192,112V72h0a23.93,23.93,0,0,1,24-24h80a23.93,23.93,0,0,1,24,24h0v40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
          <line x1="256" y1="176" x2="256" y2="400" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
          <line x1="184" y1="176" x2="192" y2="400" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
          <line x1="328" y1="176" x2="320" y2="400" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
        </svg>
      </span>
    </button>
  );
};

export default ClearAllButton;

