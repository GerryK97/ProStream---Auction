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
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            tab.active
              ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
              : 'border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'
          }`}
        >
          <span>{tab.label}</span>
          {tab.badge && (
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
              {tab.badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
};

export default PageTabs;
