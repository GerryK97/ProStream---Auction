'use client';

import Navigation from '@/components/Navigation';
import UserManagementDashboard from '@/components/UserManagementDashboard';

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
      <Navigation />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">User Management</h1>
          <p className="text-neutral-400">
            Manage user roles and tournament assignments
          </p>
        </div>
        <UserManagementDashboard />
      </div>
    </div>
  );
}
