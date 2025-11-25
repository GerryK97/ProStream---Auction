'use client';

import Navigation from '@/components/Navigation';
import OverlayDashboard from '@/components/OverlayDashboard';
import StepsProgress from '@/components/shared/StepsProgress';

export default function OverlaysPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
      <Navigation />
      <div className="pt-24">
        <div className="mx-auto max-w-7xl px-6">
          <StepsProgress currentStep={5} />
        </div>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <OverlayDashboard />
        </div>
      </div>
    </div>
  );
}
