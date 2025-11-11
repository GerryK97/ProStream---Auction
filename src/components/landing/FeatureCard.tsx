'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: 'primary' | 'secondary' | 'purple';
}

/**
 * Feature card component for landing page
 * Displays a feature with icon, title, description and link
 */
const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  href,
  color,
}) => {
  const router = useRouter();

  const colorClasses = {
    primary: 'from-brand-primary/20 to-brand-primary/5 hover:border-brand-primary',
    secondary: 'from-brand-secondary/20 to-brand-secondary/5 hover:border-brand-secondary',
    purple: 'from-status-purple/20 to-status-purple/5 hover:border-status-purple',
  };

  const iconColorClasses = {
    primary: 'text-brand-primary',
    secondary: 'text-brand-secondary',
    purple: 'text-status-purple',
  };

  return (
    <div
      onClick={() => router.push(href)}
      className={`
        group relative p-8 rounded-xl border-2 border-neutral-700 bg-gradient-to-br ${colorClasses[color]}
        cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl
        backdrop-blur-sm
      `}
    >
      {/* Icon */}
      <div className={`mb-6 ${iconColorClasses[color]} transform group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-neutral-100 mb-4 group-hover:text-white transition-colors">
        {title}
      </h3>

      {/* Description */}
      <p className="text-neutral-300 leading-relaxed mb-6">
        {description}
      </p>

      {/* Arrow indicator */}
      <div className="flex items-center text-neutral-400 group-hover:text-white transition-colors">
        <span className="text-sm font-semibold mr-2">Learn more</span>
        <svg
          className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M9 5l7 7-7 7"></path>
        </svg>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-white/5 to-transparent" />
    </div>
  );
};

export default FeatureCard;
