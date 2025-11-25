'use client';

import Navigation from '@/components/Navigation';
import { usePathname } from 'next/navigation';
import StepsProgress from '@/components/shared/StepsProgress';

export default function AuctionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStep = pathname.startsWith('/auction/setup') ? 4 : 6;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
      <Navigation />
      <div className="pt-24">
        <div className="mx-auto max-w-7xl px-6">
          <StepsProgress currentStep={currentStep} />
        </div>
        <div className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

