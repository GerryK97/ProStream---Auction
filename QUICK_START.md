# Quick Start Guide - ProStream Auction with Authentication

## 5-Minute Setup

### 1. Create `.env.local`
```bash
# Copy env.example and fill in your credentials
cp .env.example .env.local
```

**Required Credentials:**

1. **MongoDB URI** (get from MongoDB Atlas):
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auction-db?retryWrites=true&w=majority
   ```

2. **Google OAuth** (get from Google Cloud Console):
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

3. **NextAuth Secret** (generate):
   ```bash
   openssl rand -base64 32
   ```
   Copy output to `.env.local`:
   ```
   NEXTAUTH_SECRET=your-generated-secret
   ```

4. **Other services** (for image uploads and real-time):
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   PUSHER_APP_ID=your_app_id
   PUSHER_KEY=your_key
   PUSHER_SECRET=your_secret
   PUSHER_CLUSTER=your_cluster
   NEXT_PUBLIC_PUSHER_KEY=your_key
   NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
   ```

### 2. Install & Run
```bash
npm install
npm run dev
```

Visit: `http://localhost:3000`

### 3. Test Login
- Click "Login" button
- Sign in with Google
- Should see your name in navigation bar

## What's New - Authentication & User Management

### User Roles
```
Admin    → Full access, manage users and tournaments
Manager  → Can create tournaments, access assigned ones
Viewer   → Can only view assigned tournaments
```

### Key Features
✅ Google OAuth Sign-in
✅ Role-based Access Control
✅ Tournament-level permissions
✅ User Management Dashboard
✅ Auto-assign creator to tournament
✅ Admin can assign/unassign users

### New Pages
- `/login` - Login page with Google OAuth
- `/users` - User management (admin only)

### New API Routes
- `GET /api/users` - Get all users (admin only)
- `PATCH /api/users/[id]/role` - Change user role (admin only)
- `PATCH /api/users/[id]/tournaments` - Assign/unassign tournaments (admin only)

## Environment Variables Reference

### Required for Authentication
```
NEXTAUTH_URL=http://localhost:3000 (local) or https://your-domain.com (prod)
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

### Required for Database
```
MONGODB_URI=<from MongoDB Atlas>
```

### Required for Images
```
CLOUDINARY_CLOUD_NAME=<from Cloudinary>
CLOUDINARY_API_KEY=<from Cloudinary>
CLOUDINARY_API_SECRET=<from Cloudinary>
```

### Required for Real-time
```
PUSHER_APP_ID=<from Pusher>
PUSHER_KEY=<from Pusher>
PUSHER_SECRET=<from Pusher>
PUSHER_CLUSTER=<from Pusher>
NEXT_PUBLIC_PUSHER_KEY=<from Pusher>
NEXT_PUBLIC_PUSHER_CLUSTER=<from Pusher>
```

### Optional for Production
```
NEXT_PUBLIC_API_URL=https://your-domain.com (optional, for CORS)
```

## Verify Everything Works

```javascript
// In browser console, test these endpoints:

// 1. Get tournaments (should return array)
fetch('/api/tournaments').then(r => r.json()).then(console.log)

// 2. Get users (admin only)
fetch('/api/users').then(r => r.json()).then(console.log)

// 3. Try without login (should return 401)
// Logout first, then try:
fetch('/api/tournaments').then(r => console.log(r.status)) // Should be 401
```

## Testing Checklist

- [ ] Login page works
- [ ] Can sign in with Google
- [ ] Navigation shows your name
- [ ] `/users` page loads (admin only)
- [ ] Can create tournament
- [ ] Tournament appears in list
- [ ] Can edit your tournament
- [ ] Cannot edit others' tournaments (unless admin)

## Deploying to Vercel

### Before Deploy
1. Make sure `.env.local` is in `.gitignore` (it is)
2. Test locally with `npm run build` and `npm run start`
3. Commit all changes: `git push`

### On Vercel Dashboard
1. Connect GitHub repo
2. Add environment variables (see Environment Variables Reference above)
3. Add production Google OAuth redirect URI:
   ```
   https://your-vercel-url.vercel.app/api/auth/callback/google
   ```
4. Click Deploy

### After Deploy
1. Visit your Vercel URL
2. Test login flow
3. Verify no console errors

## Troubleshooting

### "Invalid Client" when signing in
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
- Verify Google OAuth redirect URI includes your URL
- For local: `http://localhost:3000/api/auth/callback/google`
- For Vercel: `https://your-vercel-url.vercel.app/api/auth/callback/google`

### "Database connection failed"
- Check `MONGODB_URI` in `.env.local`
- Verify MongoDB Atlas network access allows your IP
- Try: MongoDB Atlas → Network Access → Add `0.0.0.0/0`

### Blank page on `/login`
- Check browser console for errors (F12)
- Make sure `NEXTAUTH_SECRET` is set
- Make sure Google OAuth credentials are correct

### Cannot see users in `/users` page
- Must be logged in
- Must be Admin (first user is auto-admin)
- Check browser console for fetch errors

## File Structure

```
src/
  app/
    (auth)/
      login/
        page.tsx          ← Login page
    api/
      auth/
        [...nextauth]/
          route.ts        ← NextAuth configuration
      tournaments/
        route.ts          ← Protected tournament endpoints
        [id]/
          route.ts        ← Individual tournament routes
      users/
        route.ts          ← User management API
        [userId]/
          tournaments/
            route.ts      ← Assign/unassign tournaments
          role/
            route.ts      ← Change user role
    users/
      page.tsx            ← User management dashboard
  components/
    Navigation.tsx        ← Updated with user info
    UserManagementDashboard.tsx ← User management UI
  lib/
    auth.ts               ← NextAuth config
    api-auth.ts           ← API authentication helpers
    authorization.ts      ← Permission checking
  models/
    User.ts               ← User model
    Tournament.ts         ← Updated with createdBy
  types/
    index.ts              ← Updated with User type
middleware.ts             ← Route protection
```

## Key Implementation Details

### Authentication Flow
1. User clicks Login → `/login`
2. Clicks "Sign in with Google"
3. Google OAuth provider authenticates
4. Creates/updates user in MongoDB
5. Creates NextAuth session with user data
6. Stores in JWT with role and assignedTournaments
7. Redirects to homepage

### Authorization Flow
1. User requests protected resource
2. API middleware checks JWT token
3. Verifies user has permission (role + assignment)
4. Returns data or 401/403 error

### Tournament Access Control
- **Admin**: Sees ALL tournaments
- **Manager/Viewer**: Sees only assigned tournaments
- **Creator**: Automatically assigned to tournament
- **Assignment**: Only admin can assign/unassign

## Common Commands

```bash
# Development
npm run dev              # Start dev server

# Testing
npm run build          # Build for production
npm run start          # Run production build locally

# Database
# (run in MongoDB Atlas console)
db.users.find()        # View all users
db.tournaments.find()  # View all tournaments

# Environment
cat .env.local         # View current environment variables
```

## Next Steps

1. ✅ Setup `.env.local` with credentials
2. ✅ Run `npm install` and `npm run dev`
3. ✅ Test login with Google
4. ✅ Verify user management works
5. ✅ Deploy to Vercel
6. ✅ Test production deployment
7. ✅ Create admin user for team
8. ✅ Assign tournaments to team members

## Support

See detailed guides:
- `DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
- `SETUP_CHECKLIST.md` - Step-by-step checklist
