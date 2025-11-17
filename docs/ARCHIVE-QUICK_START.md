# ProStream Authentication - Quick Start Guide

## 🚀 30-Second Setup

### Step 1: Seed Admin User
```bash
npx ts-node src/scripts/seed-admin.ts
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Login
- Go to `http://localhost:3000`
- Click "Login"
- Use credentials:
  - **Username:** `admin`
  - **Password:** `Admin@123`

✅ **You're logged in!**

---

## 📝 Initial Admin Setup

After first login, **change the admin password:**

1. Go to `/users` (User Management)
2. Find the admin user
3. Click "Edit"
4. Change password to something secure

---

## 👥 Create More Users

### Via Admin Dashboard
1. Go to `/users`
2. Click "+ Create User"
3. Fill in form:
   - Username (3-50 chars, alphanumeric + - _)
   - Email
   - Password (8+ chars, uppercase, lowercase, number, special char)
   - Role (select from dropdown)
4. Click "Create"

### Via Registration
1. Go to `/auth/signup`
2. Select role:
   - **Tournament**, **Master Manager**, **Team**, **Player** → Auto-approved
   - **Audience** → Requires admin approval
3. Complete form and submit

---

## 🔐 User Roles & Access

| Role | Can Create | Can Edit | Can Delete | Can Approve |
|------|-----------|----------|-----------|------------|
| Admin | ✅ All | ✅ All | ✅ All | ✅ Users |
| Tournament | - | ✅ Tournament | ✅ Own | - |
| Master Manager | ✅ Data | ✅ Data | ✅ Data | - |
| Team | - | - | - | - |
| Player | - | - | - | - |
| Audience | - | - | - | - |

---

## 📄 Pages Overview

| Page | URL | Role | Purpose |
|------|-----|------|---------|
| Landing | `/` | All | Marketing page with login/signup CTA |
| Login | `/auth/login` | Unauthenticated | Login with username/password |
| Signup | `/auth/signup` | Unauthenticated | Create new account |
| Users | `/users` | Admin | Manage users, approve pending |
| Auction | `/auction` | Admin, Tournament | Run auctions |
| Manage | `/manage` | Admin, Tournament | Manage tournaments/teams/players |
| Overlays | `/overlays` | All authenticated | View streaming overlays |

---

## 🔒 Login/Logout

### Login
```
POST /api/auth/login
{
  "username": "admin",
  "password": "Admin@123"
}
```

### Logout
Click dropdown in top-right corner → **Logout**

---

## 📊 Pending User Approvals

When audience members signup:

1. Go to `/users`
2. Click "Pending Approval" tab
3. Review pending users
4. Click **Approve** or **Reject**

Once approved, users can login.

---

## 🔑 Password Requirements

Passwords must have:
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (!@#$%^&*)

**Example:** `SecurePass123!`

---

## 🚫 Common Issues

### "Cannot find module '@/models/User'"
- Ensure `tsconfig.json` has path aliases configured
- Run `npm install`

### "Unauthorized - authentication required"
- You're not logged in
- Go to `/auth/login`
- Or your session expired (login again)

### "Forbidden - insufficient permissions"
- Your role doesn't have access
- Contact admin to change your role

### "Invalid username or password"
- Username or password incorrect
- Check CAPS LOCK
- Use admin/Admin@123 if testing

---

## 📱 Frontend Usage

### Using Auth in Components

```typescript
import { useAuth } from '@/contexts/AuthContext';

export default function MyComponent() {
  const { user, token, login, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <p>Please login</p>;
  }

  return (
    <div>
      <p>Hello, {user?.username}!</p>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making API Calls

```typescript
const { token } = useAuth();

const response = await fetch('/api/tournaments', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

---

## 🛠️ API Routes Cheat Sheet

```
# Authentication
POST   /api/auth/signup        - Register
POST   /api/auth/login         - Login
GET    /api/auth/session       - Check session
POST   /api/auth/logout        - Logout

# User Management (Admin only)
GET    /api/users              - List users
POST   /api/users              - Create user
GET    /api/users/[id]         - Get user
PUT    /api/users/[id]         - Update user
DELETE /api/users/[id]         - Delete user
GET    /api/users/approve      - Pending users
POST   /api/users/approve      - Approve/reject
```

---

## 📚 Documentation Files

- **AUTH_SETUP.md** - Detailed setup and configuration guide
- **IMPLEMENTATION_SUMMARY.md** - Complete feature list and implementation details
- **QUICK_START.md** - This file

---

## ❓ Need Help?

1. Check `AUTH_SETUP.md` for detailed documentation
2. Review sample code in `src/contexts/AuthContext.tsx`
3. Look at API examples in `AUTH_SETUP.md` under "API Documentation"
4. Check troubleshooting section in `AUTH_SETUP.md`

---

## ✨ You're Ready!

Your ProStream authentication system is ready to use. Start by:

1. ✅ Seeding admin user
2. ✅ Starting dev server
3. ✅ Logging in with admin credentials
4. ✅ Creating additional users
5. ✅ Testing different roles

Enjoy! 🎉
