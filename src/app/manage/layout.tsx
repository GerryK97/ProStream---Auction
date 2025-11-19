'use client';

import Navigation from '@/components/Navigation';
import PageHero from '@/components/layout/PageHero';
import PageTabs from '@/components/layout/PageTabs';
import { usePathname } from 'next/navigation';

const manageSections = [
  {
    label: 'Tournaments',
    href: '/manage/tournaments',
    match: '/manage/tournaments',
    title: 'Tournament Operations',
    description: 'Spin up new events, duplicate templates, and archive historical data.',
  },
  {
    label: 'Teams',
    href: '/manage/teams',
    match: '/manage/teams',
    title: 'Team Management',
    description: 'Maintain ownership info, budgets, and branding for each franchise.',
  },
  {
    label: 'Players',
    href: '/manage/players',
    match: '/manage/players',
    title: 'Player Pool',
    description: 'Curate rosters, assign classes, and prep data for the auction floor.',
  },
];

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeSection = manageSections.reduce((current, section) => {
    if (pathname.startsWith(section.match)) {
      if (!current || section.match.length > current.match.length) {
        return section;
      }
    }
    return current;
  }, manageSections[0]);

  const tabs = manageSections.map((section) => ({
    label: section.label,
    href: section.href,
    active: pathname.startsWith(section.match),
  }));

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navigation />
      <div className="pt-24">
        <div className="border-b border-white/10 bg-neutral-900/70 backdrop-blur">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <PageHero
              title={activeSection.title}
              description={activeSection.description}
              breadcrumbs={[{ label: 'Manage' }, { label: activeSection.label }]}
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
