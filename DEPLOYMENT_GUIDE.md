# ProStream Auction - Deployment Guide

## Pre-Deployment Checklist

### 1. Local Environment Setup

#### Step 1: Create `.env.local` file
Copy `.env.example` and rename to `.env.local`. Fill in all required values:

```bash
# MongoDB Connection String - REQUIRED
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auction-db?retryWrites=true&w=majority

# NextAuth Configuration - REQUIRED FOR AUTH
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-generate-with-openssl-rand-base64-32

# Google OAuth Configuration - REQUIRED FOR GOOGLE SIGNIN
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# API Base URL (leave empty for development)
NEXT_PUBLIC_API_URL=

# Cloudinary Configuration - REQUIRED FOR IMAGE UPLOADS
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Pusher Configuration - REQUIRED FOR REAL-TIME UPDATES
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster

# Pusher Public Configuration
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

#### Step 2: Generate NEXTAUTH_SECRET
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

Copy the output and paste it as `NEXTAUTH_SECRET` in `.env.local`.

#### Step 3: Configure Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Choose "Web application"
6. Add authorized redirect URIs:
   - For local development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.com/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env.local`

#### Step 4: Configure MongoDB
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (or use existing)
3. Create a database user with strong password
4. Get connection string from "Connect" button
5. Format: `mongodb+srv://username:password@cluster.mongodb.net/auction-db?retryWrites=true&w=majority`
6. Copy to `.env.local`

### 2. Local Testing

#### Step 5: Install Dependencies
```bash
npm install
```

#### Step 6: Test Build Locally
```bash
npm run build
```

This will:
- Check for TypeScript errors
- Verify all imports and exports
- Test that all API routes can be instantiated
- Build optimized production bundle

**Expected output**: Build should complete without errors

#### Step 7: Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and verify:
- Homepage loads without errors
- Navigation bar appears
- No console errors in browser DevTools

#### Step 8: Test Authentication Flow
1. Click "Login" in navigation or visit `/login`
2. Click "Sign in with Google"
3. Sign in with your Google account
4. Should redirect to `/` (home page)
5. Navigation should show:
   - Your actual name (from Google account)
   - Your email address
   - "Admin" role (first user created)
   - Logout button
6. Visit `/users` and verify user management dashboard loads

#### Step 9: Test API Routes
Open browser console and test:

```javascript
// Test: Get tournaments
fetch('/api/tournaments').then(r => r.json()).then(console.log)

// Test: Get users (admin only)
fetch('/api/users').then(r => r.json()).then(console.log)
```

Should return:
- `GET /api/tournaments` → Array of tournaments (or empty array)
- `GET /api/users` → Array of users
- Unauthenticated requests → 401 Unauthorized

#### Step 10: Test Tournament Access Control
1. Create a new tournament in the app
2. Verify it appears in your tournament list
3. Check database that `createdBy` field is set to your user ID
4. Check that you're auto-assigned to it

#### Step 11: Test User Management
1. Go to `/users` page
2. Verify you see yourself listed as "Admin"
3. Create another test account:
   - Open in incognito window
   - Sign in with different Google account
   - Should appear as "Viewer" role
4. Back in main window, assign test user to a tournament
5. In incognito window, verify tournament appears in list
6. Remove assignment, verify tournament disappears

### 3. Database Setup

#### Step 12: Create Database Indexes
MongoDB indexes are created automatically by Mongoose models, but verify they exist:

```javascript
// In MongoDB Atlas Console, run:
db.users.getIndexes()
db.tournaments.getIndexes()
db.players.getIndexes()
```

Should see indexes on:
- **Users**: `email`, `googleId`, `assignedTournaments`
- **Tournaments**: `_id`, `status`
- **Players**: `tournamentId`, `masterPlayerId`

### 4. Pre-Deployment Verification

#### Step 13: Check All Environment Variables
```bash
# Verify these are in .env.local:
✓ MONGODB_URI
✓ NEXTAUTH_URL (http://localhost:3000 for local)
✓ NEXTAUTH_SECRET (generated secret)
✓ GOOGLE_CLIENT_ID
✓ GOOGLE_CLIENT_SECRET
✓ CLOUDINARY_CLOUD_NAME
✓ CLOUDINARY_API_KEY
✓ CLOUDINARY_API_SECRET
✓ PUSHER_APP_ID
✓ PUSHER_KEY
✓ PUSHER_SECRET
✓ PUSHER_CLUSTER
✓ NEXT_PUBLIC_PUSHER_KEY
✓ NEXT_PUBLIC_PUSHER_CLUSTER
```

#### Step 14: Run Production Build
```bash
npm run build
npm run start
```

Test production build locally:
- Navigate to `http://localhost:3000`
- Test login flow
- Test authentication protection
- Verify no console errors

## Deployment to Vercel

### Step 15: Prepare Vercel Deployment

1. **Push code to GitHub** (if not already pushed):
```bash
git add .
git commit -m "chore: Add authentication and user management"
git push origin main
```

2. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

3. **Import Project**:
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

### Step 16: Configure Environment Variables in Vercel

In Vercel project settings, add these environment variables:

**Production Environment:**
```
MONGODB_URI=your-mongodb-atlas-uri
NEXTAUTH_URL=https://your-domain.com (or https://your-vercel-url.vercel.app)
NEXTAUTH_SECRET=your-generated-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
NEXT_PUBLIC_API_URL=https://your-domain.com
```

**Important:** Use DIFFERENT Google OAuth credentials for production!
1. Add `https://your-vercel-url.vercel.app/api/auth/callback/google` to Google Console authorized URIs
2. Create separate OAuth credentials for production

### Step 17: Configure Google OAuth for Production

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new OAuth 2.0 Client ID (or update existing)
3. Add authorized redirect URI:
   ```
   https://your-vercel-url.vercel.app/api/auth/callback/google
   ```
4. Copy new Client ID and Secret
5. Add to Vercel environment variables

### Step 18: Deploy to Vercel

1. In Vercel dashboard, click "Deploy"
2. Wait for deployment to complete (shows green checkmark)
3. Click "Visit" to open deployed application
4. Verify it loads without errors

### Step 19: Post-Deployment Testing

Test the production deployment:

1. **Test Public Pages**:
   - Visit home page → should load
   - Visit login page → should load

2. **Test Authentication**:
   - Click "Login" button
   - Sign in with Google
   - Should redirect to home page
   - Navigation should show your user info

3. **Test Protected Routes**:
   - Try visiting `/users` without login → should redirect to `/login`
   - After login, `/users` should load

4. **Test API Endpoints**:
   - Open browser DevTools Console
   - Run: `fetch('/api/tournaments').then(r => r.json()).then(console.log)`
   - Should return tournament data
   - Try unauthenticated request → should get 401 error

5. **Test User Management**:
   - First user should have "Admin" role
   - Can view all users at `/users`
   - Can manage user roles and tournament assignments

### Step 20: Monitor Deployment

1. **Check Vercel Logs**:
   - Go to Vercel dashboard
   - Click on your project
   - Go to "Deployments" tab
   - Click latest deployment
   - Click "Functions" or "Logs" to view function execution

2. **Monitor for Errors**:
   - Check browser console for client errors
   - Check Vercel function logs for API errors
   - Check MongoDB Atlas dashboard for connection issues

## Troubleshooting

### Issue: "Invalid Client" when signing in with Google
**Solution**:
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check Google Console authorized redirect URIs include your Vercel URL
- Verify `NEXTAUTH_URL` matches your deployment URL exactly

### Issue: "NEXTAUTH_SECRET is not set"
**Solution**:
- Verify `NEXTAUTH_SECRET` is set in Vercel environment variables
- Regenerate with: `openssl rand -base64 32`
- Redeploy after updating

### Issue: "Unauthorized" when accessing `/users` page
**Solution**:
- Must be logged in first
- Verify authentication middleware is working
- Check that user has "Admin" role in database

### Issue: Database connection fails
**Solution**:
- Verify `MONGODB_URI` is correct in Vercel env vars
- Check MongoDB Atlas network access includes Vercel IP ranges
  - Go to MongoDB Atlas → Security → Network Access
  - Add `0.0.0.0/0` (allows all IPs) for development/testing
  - Or add specific Vercel IPs if available

### Issue: Build fails on Vercel
**Solution**:
- Check Vercel build logs for specific error
- Common issues:
  - Missing environment variables
  - TypeScript errors
  - Missing dependencies
- Run `npm run build` locally to debug

## Security Considerations

1. **Never commit `.env.local`** to Git - it's in `.gitignore`
2. **Rotate credentials periodically**:
   - Google OAuth credentials
   - MongoDB username/password
   - NEXTAUTH_SECRET
3. **Use strong passwords** for MongoDB and OAuth
4. **Restrict MongoDB network access** to Vercel IPs only in production
5. **Enable HTTPS** on custom domain (Vercel does this automatically)
6. **Monitor user access** regularly through `/users` page

## Rollback Plan

If something goes wrong in production:

1. **Revert Code**:
```bash
git revert <commit-hash>
git push origin main
```

2. **Vercel will auto-redeploy** from updated code

3. **If database is affected**, restore from MongoDB Atlas backup:
   - Go to MongoDB Atlas
   - Clusters → Backups
   - Restore from snapshot

## Next Steps

After successful deployment:

1. Test all features in production
2. Create admin user for production
3. Assign tournaments to appropriate users
4. Monitor error logs regularly
5. Plan regular backups of MongoDB database
