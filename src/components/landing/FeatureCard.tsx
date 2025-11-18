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
  const colorClasses = {
    primary: 'from-brand-primary/15 to-brand-primary/5 hover:border-brand-primary',
    secondary: 'from-brand-secondary/15 to-brand-secondary/5 hover:border-brand-secondary',
    purple: 'from-status-purple/15 to-status-purple/5 hover:border-status-purple',
  };

  const iconColorClasses = {
    primary: 'text-brand-primary',
    secondary: 'text-brand-secondary',
    purple: 'text-status-purple',
  };

  return (
    <Link
      href={href}
      className={`group relative flex h-full min-h-[240px] flex-col justify-between rounded-2xl border border-neutral-800 bg-gradient-to-br ${colorClasses[color]} p-6 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-brand-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary sm:p-8`}
    >
      <div>
        <div
          className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-current sm:h-16 sm:w-16 ${iconColorClasses[color]} [&>svg]:h-2/3 [&>svg]:w-2/3`}
          aria-hidden="true"
        >
          {icon}
        </div>

        <h3 className="text-2xl font-bold text-neutral-100">{title}</h3>
        <p className="mt-3 text-sm text-neutral-300 sm:text-base">{description}</p>
      </div>

      <div className="mt-6 flex items-center text-sm font-semibold text-neutral-300 transition group-hover:text-white">
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
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />
    </Link>
  );
};

export default FeatureCard;
