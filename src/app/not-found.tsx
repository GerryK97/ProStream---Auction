'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'var(--surface-primary)' }}>
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Page not found</h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <Link href="/" className="inline-block px-5 py-2 rounded text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
          Go home
        </Link>
      </div>
    </div>
  );
}
