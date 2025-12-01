'use client';

import React from 'react';

type EditButtonSize = 'sm' | 'md';
type EditButtonVariant = 'neutral' | 'primary';

interface EditButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel?: string;
  size?: EditButtonSize;
  variant?: EditButtonVariant;
  label?: string;
}

const EditButton: React.FC<EditButtonProps> = ({
  ariaLabel = 'Edit',
  size = 'md',
  variant = 'neutral',
  label = 'Edit',
  className = '',
  disabled,
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const baseClasses = 'relative inline-flex items-center justify-start gap-2 rounded-xl font-bold transition-all duration-200 overflow-hidden group border shadow-sm';

  const sizeClasses = size === 'sm' ? 'h-9 px-3 text-xs w-[88px]' : 'h-10 px-4 text-sm w-[100px]';

  const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer active:scale-95';

  const getStyle = () => {
    if (variant === 'primary') {
      return {
        backgroundColor: isHovered ? 'rgba(79, 70, 229, 0.9)' : 'var(--brand-primary)',
        borderColor: 'rgba(79, 70, 229, 0.5)',
        color: '#ffffff',
        boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)'
      };
    } else {
      return {
        backgroundColor: 'var(--surface-hover)',
        borderColor: isHovered ? 'rgba(79, 70, 229, 0.5)' : 'var(--border-primary)',
        color: isHovered ? 'var(--brand-primary)' : 'var(--text-primary)'
      };
    }
  };

  return (
    <button
      aria-label={ariaLabel}
      className={`${baseClasses} ${sizeClasses} ${disabledClasses} ${className}`}
      disabled={disabled}
      style={getStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <span className="relative z-10 transition-opacity duration-200 group-hover:opacity-0">{label}</span>
      <span className="absolute right-4 transition-all duration-200 group-hover:right-1/2 group-hover:translate-x-1/2">
        <svg viewBox="0 0 512 512" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
          <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
        </svg>
      </span>
    </button>
  );
};

export default EditButton;

