# ProStream Authentication & User Management Setup Guide

## Overview
This document provides a complete guide to the newly implemented authentication and user management system for ProStream Auction Management System.

## What Was Implemented

### 1. **User Model & Database**
- **File**: `src/models/User.ts`
- Complete user schema with username, email, password hash, role, and status
- Support for role-based access control (RBAC)
- Indices for fast lookups on username, email, role, and status

### 2. **Authentication System**
- **Password Hashing**: bcrypt (10 salt rounds)
- **Session Tokens**: JWT with 7-day expiration
- **Password Requirements**:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (!@#$%^&*)

### 3. **API Endpoints**

#### Authentication Routes
- `POST /api/auth/signup` - Register new user
  - Auto-approves: Tournament, MasterManager, Team, Player
  - Requires approval: Audience

- `POST /api/auth/login` - Login with credentials
  - Returns JWT token
  - Updates last login timestamp

- `GET /api/auth/session` - Verify current session
- `POST /api/auth/session` - Validate JWT token
- `POST /api/auth/logout` - Logout (client-side token removal)

#### User Management Routes (Admin Only)
- `GET /api/users` - List all users with pagination/filtering
- `POST /api/users` - Create new user (admin)
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user
- `GET /api/users/approve` - Get pending approvals
- `POST /api/users/approve` - Approve/reject pending users

### 4. **User Roles & Permissions**

#### Roles
1. **Admin** - Full system access
   - Manage all users, tournaments, teams, players
   - Approve/reject user registrations
   - Access to all pages

2. **Tournament** - Tournament-level management
   - Create/edit tournaments
   - Manage teams and players within assigned tournaments
   - Access to /auction, /manage pages

3. **MasterManager** - Data management
   - Manage master players/teams registry
   - Bulk imports/exports
   - Read-only access to tournaments/teams/players

4. **Team** - Team-specific access
   - View assigned team(s)
   - View tournament information (read-only)
   - Access to /overlays

5. **Player** - Player profile access
   - View own player profile
   - View tournament information (read-only)
   - Access to /overlays

6. **Audience** - Viewer access
   - View overlays only
   - Requires admin approval to activate

### 5. **Frontend Components**

#### Pages
- `src/app/auth/login/page.tsx` - Login form
- `src/app/auth/signup/page.tsx` - User registration with role selection
- `src/app/auth/unauthorized/page.tsx` - 403 error page
- `src/app/users/page.tsx` - User management dashboard (admin only)

#### Components
- `src/contexts/AuthContext.tsx` - Global auth context with hooks
- Updated `src/components/Navigation.tsx` - Dynamic nav based on auth state
- Updated `src/components/landing/Hero.tsx` - Login/signup CTAs for unauthenticated users

#### Utilities
- `src/lib/auth.ts` - Password hashing, JWT generation/verification
- `src/lib/permissions.ts` - RBAC logic and route permissions
- `src/lib/auth-middleware.ts` - API route authentication helpers

### 6. **Route Protection**

#### Public Routes (No auth required)
- `/` - Landing page
- `/auth/login` - Login page
- `/auth/signup` - Signup page

#### Protected Routes
All other routes require authentication via `middleware.ts`
Route access based on user role via permission system

### 7. **Configuration**

Environment variables already configured in `.env.local`:
- `NEXTAUTH_SECRET` - Used for JWT signing (change if needed)
- `MONGODB_URI` - Database connection string

## Getting Started

### 1. Seed Initial Admin User

```bash
# Option 1: Using ts-node
npx ts-node src/scripts/seed-admin.ts

# Option 2: Manual database insertion
# Create a User document with:
# - username: admin
# - email: admin@example.com
# - passwordHash: [bcrypt hash of "Admin@123"]
# - role: Admin
# - status: Active
```

**Initial Credentials:**
- Username: `admin`
- Password: `Admin@123`

⚠️ **IMPORTANT**: Change admin password after first login!

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 3. Test Authentication Flow

1. Navigate to `http://localhost:3000`
2. Click "Login" button on hero section
3. Enter credentials:
   - Username: `admin`
   - Password: `Admin@123`
4. You should be redirected to dashboard
5. Navigate to `/users` to access user management (admin only)

## Adding Authentication to Existing API Routes

### Quick Reference

To add authentication to any API route:

```typescript
import { requireAuth, requireRole, requirePermission } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  // Option 1: Just require authentication
  const { authorized, response, user } = await requireAuth(request);
  if (!authorized) return response;

  // Option 2: Require specific role
  const auth = await requireRole(request, ['Admin', 'Tournament']);
  if (!auth.authorized) return auth.response;

  // Option 3: Require specific permission
  const perm = await requirePermission(request, 'read', 'tournament');
  if (!perm.authorized) return perm.response;

  // Your route logic here
  return NextResponse.json({ data: 'success' });
}
```

### Example: Adding Auth to Tournament Routes

```typescript
// src/app/api/tournaments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-middleware';
import { tournamentDB } from '@/lib/db-mongodb';

export async function GET(request: NextRequest) {
  // Require Auth - anyone logged in can read
  const { authorized, response, user } = await requireAuth(request);
  if (!authorized) return response;

  try {
    const tournaments = await tournamentDB.getAll();
    return NextResponse.json(tournaments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Require specific role - only Admin and Tournament managers can create
  const { authorized, response, user } = await requireRole(
    request,
    ['Admin', 'Tournament']
  );
  if (!authorized) return response;

  // Rest of your POST logic...
}
```

## Migrating Existing API Routes

Since there are 42 existing API routes, here's a pattern to follow:

1. **Identify the route's purpose** - What does it do?
2. **Determine required role** - Who should access it?
3. **Add appropriate auth check** at the beginning of each handler
4. **Test thoroughly** - Ensure auth doesn't break existing functionality

### Categories by Route Type

| Category | Routes | Min Role | Method |
|----------|--------|----------|--------|
| Tournament Management | tournaments/* | Admin, Tournament | POST/PUT/DELETE |
| Team Management | teams/* | Admin, Tournament | POST/PUT/DELETE |
| Player Management | players/* | Admin, Tournament, MasterManager | POST/PUT/DELETE |
| Master Data | master-players/*, master-teams/* | Admin, MasterManager | POST/PUT/DELETE |
| Auction Control | auction/* | Admin, Tournament | POST |
| Database Utils | database/*, migrate/* | Admin | POST |
| Upload | upload/* | Admin, Tournament | POST |

## Frontend Implementation Guide

### Using the useAuth Hook

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, token, login, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <p>Logged in as: {user?.username}</p>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making Authenticated API Calls

```typescript
const { token } = useAuth();

const response = await fetch('/api/tournaments', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

## Security Notes

1. **Password Storage**: All passwords are hashed with bcrypt (never stored as plaintext)
2. **Token Security**: JWT tokens are valid for 7 days
3. **HTTP-Only Storage**: Tokens are stored in localStorage (can be enhanced with httpOnly cookies)
4. **CORS Protection**: Consider adding CORS policies for production
5. **Rate Limiting**: Consider adding rate limiting to login/signup endpoints
6. **HTTPS**: Always use HTTPS in production
7. **Admin Credentials**: Change default admin password immediately
8. **Secret Key**: Use a strong, unique NEXTAUTH_SECRET in production

## Testing Scenarios

### Test Case 1: Login Flow
1. Go to `/auth/login`
2. Enter: admin / Admin@123
3. Should redirect to `/`
4. Navigation should show "admin" user

### Test Case 2: Signup - Auto-Approved Role
1. Go to `/auth/signup`
2. Select "Tournament Manager" role
3. Complete signup
4. Should be auto-logged in
5. Can access protected pages

### Test Case 3: Signup - Pending Approval
1. Go to `/auth/signup`
2. Select "Audience" role
3. Complete signup
4. Should see "pending approval" message
5. Cannot login until admin approves

### Test Case 4: User Management
1. Login as admin
2. Go to `/users`
3. See Active Users, Pending Approvals tabs
4. Create new user via "+ Create User" button
5. Approve/reject pending users

### Test Case 5: Route Protection
1. Try accessing `/manage/tournaments` without login
2. Should redirect to `/auth/login`
3. After login, should be able to access (if role permits)

## Troubleshooting

### Issue: "Cannot find module @/models/User"
**Solution**: Ensure TypeScript path aliases are configured in `tsconfig.json`

### Issue: Password validation fails
**Solution**: Password must meet all 5 requirements:
- 8+ characters
- 1 uppercase
- 1 lowercase
- 1 number
- 1 special character

### Issue: Token expired after 7 days
**Solution**: User needs to login again. Consider implementing refresh tokens for better UX.

### Issue: Middleware isn't protecting routes
**Solution**: Ensure middleware.ts is in the project root (not src/)

## Next Steps / Recommended Improvements

1. **Add email verification** during signup
2. **Implement password reset flow** for forgotten passwords
3. **Add refresh token mechanism** for better security
4. **Implement audit logging** for user actions
5. **Add two-factor authentication** (2FA)
6. **Complete auth migration** of all 42 existing API routes
7. **Add rate limiting** to auth endpoints
8. **Implement session blacklisting** for logout
9. **Add user profile editing** functionality
10. **Implement role-specific dashboards**

## Database Schema Reference

### User Collection

```javascript
{
  _id: String,                    // unique user ID (u-timestamp-random)
  username: String,               // unique, 3-50 chars, alphanumeric + -_
  email: String,                  // unique, valid email
  passwordHash: String,           // bcrypt hash
  role: String,                   // Admin|Tournament|MasterManager|Team|Player|Audience
  status: String,                 // Active|PendingApproval|Suspended
  assignedTournaments: [String],  // tournament IDs
  assignedTeams: [String],        // team IDs
  assignedPlayer: String,         // player ID
  lastLogin: Date,                // last login timestamp
  lastIPAddress: String,          // last login IP
  createdAt: Date,                // creation timestamp
  updatedAt: Date,                // last update timestamp
}
```

## Support

For issues or questions about the authentication system, refer to:
- API routes: `src/app/api/auth/`, `src/app/api/users/`
- Frontend components: `src/app/auth/`, `src/contexts/AuthContext.tsx`
- Utilities: `src/lib/auth.ts`, `src/lib/auth-middleware.ts`, `src/lib/permissions.ts`
