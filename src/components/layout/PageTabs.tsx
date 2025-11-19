'use client';

import Link from 'next/link';

interface PageTab {
  label: string;
  href: string;
  active: boolean;
  badge?: string;
}

interface PageTabsProps {
  tabs: PageTab[];
}

const PageTabs: React.FC<PageTabsProps> = ({ tabs }) => {
  if (tabs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          style={tab.active ? {
            borderColor: 'var(--brand-primary)',
            backgroundColor: 'var(--brand-primary)',
            color: 'white',
          } : {
            borderColor: 'var(--border-primary)',
            color: 'var(--text-tertiary)'
          }}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            tab.active
              ? ''
              : 'hover:border-opacity-50 hover:text-opacity-100'
          }`}
        >
          <span>{tab.label}</span>
          {tab.badge && (
            <span style={{ backgroundColor: 'var(--surface-card)' }} className="ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
              {tab.badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
};

export default PageTabs;
