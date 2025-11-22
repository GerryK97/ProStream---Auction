'use client';

import Navigation from '@/components/Navigation';
import StepsProgress from '@/components/shared/StepsProgress';
import { usePathname } from 'next/navigation';

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'var(--surface-primary)' }}>
      <Navigation />
      <div className="pt-24">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <StepsProgress currentStep={pathname.startsWith('/manage/tournaments') ? 1 : pathname.startsWith('/manage/teams') ? 2 : 3} />
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
