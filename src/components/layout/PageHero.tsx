'use client';

import Link from 'next/link';
import type React from 'react';

type ActionVariant = 'primary' | 'secondary' | 'ghost';

interface PageHeroAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: ActionVariant;
}

interface PageHeroMetric {
  label: string;
  value: string;
  helper?: string;
  tone?: 'default' | 'success' | 'warning';
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeroProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageHeroAction[];
  metrics?: PageHeroMetric[];
}

const variantClasses: Record<ActionVariant, string> = {
  primary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
  secondary: 'border border-white/20 text-white hover:bg-white/10',
  ghost: 'text-neutral-300 hover:text-white',
};

const toneClasses = {
  default: 'text-white',
  success: 'text-green-400',
  warning: 'text-yellow-300',
};

const PageHero: React.FC<PageHeroProps> = ({
  title,
  description,
  breadcrumbs = [],
  actions = [],
  metrics = [],
}) => {
  return (
    <div className="space-y-6">
      {breadcrumbs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {breadcrumbs.map((crumb, idx) => (
            <span key={`${crumb.label}-${idx}`} className="flex items-center gap-2">
              {crumb.href ? (
                <Link href={crumb.href} style={{ color: 'var(--text-tertiary)' }} className="hover:text-white">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
              {idx < breadcrumbs.length - 1 && <span style={{ color: 'var(--border-primary)' }}>/</span>}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          {description && <p className="mt-2 text-base" style={{ color: 'var(--text-secondary)' }}>{description}</p>}
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => {
              const className = `inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${variantClasses[action.variant || 'secondary']}`;
              if (action.href) {
                return (
                  <Link key={action.label} href={action.href} className={className}>
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </Link>
                );
              }

              return (
                <button key={action.label} type="button" onClick={action.onClick} className={className}>
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {metrics.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl px-4 py-3 backdrop-blur"
              style={{
                borderColor: 'var(--border-primary)',
                border: `1px solid var(--border-primary)`,
                backgroundColor: 'var(--surface-card)'
              }}
            >
              <p className="text-xs uppercase tracking-[0.4em]" style={{ color: 'var(--text-tertiary)' }}>{metric.label}</p>
              <p className={`mt-2 text-2xl font-bold ${toneClasses[metric.tone || 'default']}`}>{metric.value}</p>
              {metric.helper && <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{metric.helper}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageHero;
