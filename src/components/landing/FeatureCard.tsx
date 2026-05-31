'use client';

import React from 'react';
import Link from 'next/link';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: 'primary' | 'secondary' | 'purple';
}

/**
 * Feature card component for landing page
 * Uses a Link for better accessibility on mobile
 */
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, href, color }) => {
  const colorVariables = {
    primary: 'var(--brand-primary)',
    secondary: 'var(--brand-secondary)',
    purple: 'var(--accent-color)',
  };

  const cardColor = colorVariables[color];

  return (
    <Link
      href={href}
      className="group relative flex h-full min-h-[240px] flex-col justify-between rounded-2xl p-6 text-left shadow-lg transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 sm:p-8"
      style={{
        borderColor: 'var(--border-primary)',
        border: `1px solid var(--border-primary)`,
        background: `linear-gradient(to bottom right, color-mix(in oklab, ${cardColor} 15%, var(--surface-elevated)), color-mix(in oklab, ${cardColor} 5%, var(--surface-elevated)))`
      }}
    >
      <div>
        <div
          className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl sm:h-16 sm:w-16 [&>svg]:h-2/3 [&>svg]:w-2/3"
          aria-hidden="true"
          style={{
            backgroundColor: 'color-mix(in oklab, var(--surface-elevated) 95%, var(--text-primary) 5%)',
            color: cardColor
          }}
        >
          {icon}
        </div>

        <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="mt-3 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>

      <div className="mt-6 flex items-center text-sm font-semibold transition" style={{ color: 'var(--text-secondary)' }}>
        <span>Learn more</span>
        <svg
          className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path d="M9 5l7 7-7 7"></path>
        </svg>
      </div>

      <span
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
        style={{
          background: `linear-gradient(to bottom right, color-mix(in oklab, var(--text-primary) 10%, transparent), transparent)`
        }}
      />
    </Link>
  );
};

export default FeatureCard;
