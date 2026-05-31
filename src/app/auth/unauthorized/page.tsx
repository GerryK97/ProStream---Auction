'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function UnauthorizedPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--surface-primary)' }}>
      <div className="w-full max-w-md text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full" style={{ color: 'var(--status-danger)', border: '1px solid color-mix(in oklab, var(--status-danger) 40%, transparent)', background: 'color-mix(in oklab, var(--status-danger) 12%, transparent)' }}>
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0 4v2M6.343 4.343a8 8 0 0111.314 11.314m-1.414-1.414a6 6 0 10-8.486 8.486m1.414-1.414a8 8 0 11-11.314-11.314"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>403</h1>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Access Denied</h2>

        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          You do not have permission to access this page. Please contact an administrator if you
          believe this is a mistake.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-block px-6 py-2 text-white font-medium rounded transition-colors"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Go to Dashboard
          </Link>

          <div className="mt-4">
            <button
              onClick={logout}
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
