'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function UnauthorizedPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 border border-red-500/50 rounded-full">
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

        <h1 className="text-4xl font-bold text-white mb-2">403</h1>
        <h2 className="text-2xl font-semibold text-slate-200 mb-4">Access Denied</h2>

        <p className="text-slate-400 mb-8">
          You do not have permission to access this page. Please contact an administrator if you
          believe this is a mistake.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
          >
            Go to Dashboard
          </Link>

          <div className="mt-4">
            <button
              onClick={logout}
              className="text-slate-400 hover:text-slate-200 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
