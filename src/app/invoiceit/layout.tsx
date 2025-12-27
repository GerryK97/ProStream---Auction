'use client';

import React from 'react';
import Navigation from '@/components/Navigation';

export default function InvoiceItLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-24" style={{ backgroundColor: 'var(--surface-primary)' }}>
        {children}
      </div>
    </>
  );
}
