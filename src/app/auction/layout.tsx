'use client';

import Navigation from '@/components/Navigation';
import PageHero from '@/components/layout/PageHero';
import PageTabs from '@/components/layout/PageTabs';
import { usePathname } from 'next/navigation';

const sections = [
  {
    label: 'Auction Control',
    href: '/auction',
    match: '/auction',
    title: 'Auction Control Centre',
    description: 'Monitor bids, trigger overlays, and keep every stakeholder aligned in real-time.',
    actions: [
      { label: 'Open LED Overview', href: '/overlays/auction-overview', variant: 'secondary' as const },
      { label: 'Player Highlight', href: '/overlays/player-highlight-led', variant: 'ghost' as const },
    ],
  },
  {
    label: 'Auction Setup',
    href: '/auction/setup',
    match: '/auction/setup',
    title: 'Auction Setup Workspace',
    description: 'Upload squads, configure budgets, and rehearse flows before going live.',
    actions: [
      { label: 'Manage Rosters', href: '/manage/players', variant: 'secondary' as const },
      { label: 'View Docs', href: '/docs', variant: 'ghost' as const },
    ],
  },
];

export default function AuctionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeSection = sections.reduce((current, section) => {
    if (pathname.startsWith(section.match)) {
      if (!current || section.match.length > current.match.length) {
        return section;
      }
    }
    return current;
  }, sections[0]);
  const tabs = sections.map((section) => ({
    label: section.label,
    href: section.href,
    active: pathname.startsWith(section.match),
  }));

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'var(--surface-primary)' }}>
      <Navigation />
      <div className="pt-24">
        <div className="backdrop-blur" style={{
          borderColor: 'var(--border-primary)',
          borderBottom: `1px solid var(--border-primary)`,
          backgroundColor: 'var(--surface-secondary)'
        }}>
          <div className="mx-auto max-w-7xl px-6 py-8">
            <PageHero
              title={activeSection.title}
              description={activeSection.description}
              actions={activeSection.actions}
            />
          </div>
          <div className="mx-auto max-w-7xl px-6 pb-4">
            <PageTabs tabs={tabs} />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
