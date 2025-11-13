# Username/Password Authentication Guide

## Overview

ProStream Auction now supports **dual authentication** - users can sign in with either:
1. **Email & Password** (Credentials)
2. **Google OAuth**

Both authentication methods work seamlessly together, providing flexibility for different user preferences.

---

## Admin Credentials Created

An admin user has been created with the following credentials:

```
Email: admin@prostream.com
Password: Admin123!
Role: admin
```

**⚠️ IMPORTANT**: Change this password after first login in production!

---

## Features Implemented

### 1. Database Schema Updates

**User Model** ([src/models/User.ts](src/models/User.ts))
- Added `password` field (hashed, optional)
- Added `authMethod` field: `'google' | 'credentials' | 'both'`
- Password field is excluded from queries by default (security)

### 2. Password Security

**Password Utilities** ([src/lib/password.ts](src/lib/password.ts))
- `hashPassword()` - Bcrypt hashing with 12 salt rounds
- `comparePassword()` - Secure password verification
- `validatePassword()` - Enforces strong password requirements:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
- `validateEmail()` - Email format validation

### 3. Authentication Backend

**NextAuth Configuration** ([src/lib/auth.ts](src/lib/auth.ts))
- Added `CredentialsProvider` alongside Google OAuth
- Implements secure authorization flow:
  - Email/password validation
  - User lookup with password field
  - Password verification
  - Returns user data without password
- Updated `signIn` callback to handle both auth types
- Tracks authentication method in database

**Registration API** ([src/app/api/auth/register/route.ts](src/app/api/auth/register/route.ts))
- `POST /api/auth/register` endpoint
- Validates input (email format, password strength)
- Checks for duplicate emails
- Hashes password before storage
- Creates new user with 'viewer' role by default

### 4. Login Page

**Updated UI** ([src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx))
- Email and password input fields
- "Sign in with Email" button
- Divider: "Or continue with"
- Google OAuth button
- Form validation and error handling
- Loading states for both auth methods

### 5. Admin Seeding

**Seeding Script** ([scripts/seed-admin.ts](scripts/seed-admin.ts))
- Creates admin user with credentials
- Can be customized via environment variables
- Run with: `npm run seed:admin`
- Prevents duplicate admin creation

---

## Usage Guide

### For Users

#### Sign In with Credentials
1. Go to http://localhost:3001/login
2. Enter email and password
3. Click "Sign in with Email"
4. Redirected to homepage on success

#### Sign In with Google
1. Go to http://localhost:3001/login
2. Click "Sign in with Google"
3. Complete Google authentication
4. Redirected to homepage on success

### For Administrators

#### Create Admin User
```bash
npm run seed:admin
```

#### Create Custom Admin User
```bash
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="YourPassword123" ADMIN_NAME="Admin User" npm run seed:admin
```

#### Register New Users via API
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "viewer"
  }
}
```

---

## Security Features

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)

### Password Storage
- Passwords are hashed using **bcrypt** with 12 salt rounds
- Never stored in plain text
- Password field excluded from default queries

### Authentication Flow
- Credentials validated on server-side
- No user enumeration (same error for invalid email/password)
- JWT-based session management
- Secure session tokens

### API Protection
- All API routes require authentication
- Role-based access control enforced
- Admin-only operations protected

---

## API Reference

### Register New User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "User Name",
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user...",
    "name": "User Name",
    "email": "user@example.com",
    "role": "viewer"
  }
}
```

**Error Responses:**
- `400` - Invalid email format or weak password
- `409` - User with email already exists
- `500` - Internal server error

### Sign In with Credentials
Use NextAuth's built-in sign-in:

```javascript
// In browser/frontend
import { signIn } from 'next-auth/react';

const result = await signIn('credentials', {
  email: 'admin@prostream.com',
  password: 'Admin123!',
  redirect: false,
});

if (result?.ok) {
  // Success - redirect or update UI
} else {
  // Error - show message
}
```

---

## Migration from Google-Only

### Existing Users
- Existing Google OAuth users continue to work
- They can optionally add a password later (feature not yet implemented)
- `authMethod` set to 'google' for existing users

### New Users
- Can choose either authentication method
- Credentials users have `authMethod` set to 'credentials'
- Google users have `authMethod` set to 'google'

### Dual Authentication
- Users can link both Google and credentials (future enhancement)
- Would set `authMethod` to 'both'

---

## Testing

### Test Admin Login
1. Go to http://localhost:3001/login
2. Email: `admin@prostream.com`
3. Password: `Admin123!`
4. Should redirect to homepage with admin privileges

### Test User Registration
```javascript
// In browser console
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'TestPass123'
  })
}).then(r => r.json()).then(console.log);
```

### Test Credential Login
```javascript
// In browser console
import { signIn } from 'next-auth/react';

signIn('credentials', {
  email: 'test@example.com',
  password: 'TestPass123',
  redirect: false
}).then(console.log);
```

---

## Files Modified/Created

### Modified Files
- [src/models/User.ts](src/models/User.ts) - Added password and authMethod fields
- [src/lib/auth.ts](src/lib/auth.ts) - Added CredentialsProvider
- [src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx) - Added credentials form
- [package.json](package.json) - Added seed:admin script

### Created Files
- [src/lib/password.ts](src/lib/password.ts) - Password utilities
- [src/app/api/auth/register/route.ts](src/app/api/auth/register/route.ts) - Registration endpoint
- [scripts/seed-admin.ts](scripts/seed-admin.ts) - Admin seeding script
- [CREDENTIALS_AUTH_GUIDE.md](CREDENTIALS_AUTH_GUIDE.md) - This guide

### Installed Packages
- `bcryptjs` - Password hashing
- `@types/bcryptjs` - TypeScript types
- `tsx` - TypeScript script execution

---

## Troubleshooting

### Cannot login with credentials
- Check if user exists in database
- Verify password meets requirements
- Check browser console for errors
- Verify NextAuth configuration

### Registration fails
- Check email format
- Verify password strength
- Check for duplicate email
- Review server logs

### Admin seeding fails
- Check MongoDB connection
- Verify MONGODB_URI in .env.local
- Check if admin already exists
- Review script output

### Password validation errors
- Minimum 8 characters required
- Must include uppercase, lowercase, and number
- Check password meets all requirements

---

## Production Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Generate new NEXTAUTH_SECRET
- [ ] Update NEXTAUTH_URL to production domain
- [ ] Configure CORS if needed
- [ ] Enable rate limiting on login endpoint
- [ ] Set up email verification (optional)
- [ ] Configure password reset flow (future enhancement)
- [ ] Test all authentication flows
- [ ] Review security settings

---

## Future Enhancements

Potential features to add:
- Password reset functionality
- Email verification
- Two-factor authentication (2FA)
- Remember me option
- Social login (Facebook, GitHub, etc.)
- Account linking (Google + Credentials)
- Password strength meter on frontend
- Login attempt rate limiting

---

## Support

For issues or questions:
1. Check this guide
2. Review error messages in browser console
3. Check server logs: `npm run dev`
4. Verify environment variables in .env.local

---

**Status: ✅ Credentials Authentication Fully Implemented**

You can now login with:
- **Email**: admin@prostream.com
- **Password**: Admin123!

Last Updated: November 2025
