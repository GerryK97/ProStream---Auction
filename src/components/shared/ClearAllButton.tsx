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
  const baseClasses = 'relative inline-flex items-center justify-start overflow-hidden rounded-xl font-bold transition-all duration-200 group border shadow-lg';
  const sizeClasses = size === 'sm' ? 'w-[132px] h-9' : 'w-[150px] h-10';
  const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer active:scale-95';

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`${baseClasses} ${sizeClasses} ${disabledClasses} ${className}`}
      disabled={disabled}
      style={{
        backgroundColor: 'var(--status-danger)',
        borderColor: 'var(--status-danger)',
        color: '#ffffff',
        boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.2)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#dc2626';
        e.currentTarget.style.borderColor = '#dc2626';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--status-danger)';
        e.currentTarget.style.borderColor = 'var(--status-danger)';
      }}
      {...props}
    >
      <span className="absolute left-4 transition-all duration-200 group-hover:opacity-0">{label}</span>
      <span className="absolute right-0 top-0 h-full w-10 flex items-center justify-center bg-black/20 transition-all duration-200 group-hover:w-full">
        <svg className="w-5 h-5" viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32">
          <path d="M112,112l20,320c.95,18.49,14.4,32,32,32H348c17.67,0,30.87-13.51,32-32l20-320" />
          <line x1="80" y1="112" x2="432" y2="112" strokeMiterlimit="10" />
          <path d="M192,112V72h0a23.93,23.93,0,0,1,24-24h80a23.93,23.93,0,0,1,24-24h0v40" />
          <line x1="256" y1="176" x2="256" y2="400" />
          <line x1="184" y1="176" x2="192" y2="400" />
          <line x1="328" y1="176" x2="320" y2="400" />
        </svg>
      </span>
    </button>
  );
};

export default ClearAllButton;

