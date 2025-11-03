'use client';

import Navigation from '@/components/Navigation';
import OverlayDashboard from '@/components/OverlayDashboard';

export default function OverlaysPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
      <Navigation />
      <div className="container mx-auto px-6 py-4">
        <OverlayDashboard />
      </div>
    </div>
  );
}
