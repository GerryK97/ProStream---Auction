# Pre-Deployment Steps - Action Items

This document outlines exactly what you need to do before deploying to Vercel.

## Step-by-Step Instructions

### STEP 1: Setup Local Environment Variables

**Time: 15 minutes**

1. Open your project folder
2. Create a new file named `.env.local` (copy from `.env.example`)
3. Fill in the following credentials:

#### 1a. MongoDB Setup (Get from MongoDB Atlas)
Go to https://www.mongodb.com/cloud/atlas

- [ ] Create or login to MongoDB Atlas account
- [ ] Create a cluster (or use existing)
- [ ] Click "Connect"
- [ ] Select "Connect your application"
- [ ] Copy the connection string
- [ ] Replace `<password>` with your database password
- [ ] Add to `.env.local`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auction-db?retryWrites=true&w=majority
```

#### 1b. Google OAuth Setup (Get from Google Cloud Console)
Go to https://console.cloud.google.com

- [ ] Create new project or select existing
- [ ] Enable "Google+ API"
- [ ] Go to "Credentials" → "Create Credentials" → "OAuth client ID"
- [ ] Choose "Web application"
- [ ] Under "Authorized redirect URIs" add:
  ```
  http://localhost:3000/api/auth/callback/google
  ```
- [ ] Copy "Client ID" and "Client Secret"
- [ ] Add to `.env.local`:
```
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

#### 1c. Generate NEXTAUTH_SECRET
Run this command in your terminal:
```bash
openssl rand -base64 32
```

Copy the output and add to `.env.local`:
```
NEXTAUTH_SECRET=<paste-the-generated-value-here>
```

#### 1d. NextAuth Configuration
Add to `.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
```

#### 1e. Cloudinary Setup (For image uploads)
Go to https://cloudinary.com

- [ ] Create account or login
- [ ] Go to Dashboard
- [ ] Copy "Cloud Name"
- [ ] Go to Settings → API Keys
- [ ] Copy "API Key" and "API Secret"
- [ ] Add to `.env.local`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 1f. Pusher Setup (For real-time features)
Go to https://pusher.com

- [ ] Create account or login
- [ ] Create a new app
- [ ] Copy credentials to `.env.local`:
```
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

**Verify your `.env.local` has all these variables:**
```
MONGODB_URI=...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=...
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=...
```

---

### STEP 2: Install Dependencies

**Time: 5 minutes**

Run in your terminal:
```bash
npm install
```

Wait for all dependencies to install.

---

### STEP 3: Build Project Locally

**Time: 5 minutes**

Run:
```bash
npm run build
```

**Expected result:**
- No red errors
- Shows "ready - started server" or similar
- Completes successfully

If you see errors:
- Fix TypeScript errors
- Check that all imports are correct
- Verify `.env.local` is in the correct location

---

### STEP 4: Test Locally

**Time: 10 minutes**

Start development server:
```bash
npm run dev
```

#### Test 4a: Homepage
- [ ] Open `http://localhost:3000` in browser
- [ ] Page should load without errors
- [ ] Navigation bar should be visible
- [ ] "Login" button should appear (if not logged in)

#### Test 4b: Login Flow
- [ ] Click "Login" button
- [ ] Click "Sign in with Google"
- [ ] Sign in with your Google account
- [ ] Should redirect to homepage
- [ ] Navigation should show:
  - [ ] Your name
  - [ ] Your email
  - [ ] "Admin" role
  - [ ] "Logout" button

#### Test 4c: User Management
- [ ] Visit `http://localhost:3000/users`
- [ ] Should load user management dashboard
- [ ] Should see yourself listed as "Admin"
- [ ] Should see "Manage" button for your account

#### Test 4d: API Endpoints
Open browser DevTools (F12) → Console and run:

```javascript
// Should return array of tournaments
fetch('/api/tournaments').then(r => r.json()).then(console.log)

// Should return array of users
fetch('/api/users').then(r => r.json()).then(console.log)
```

#### Test 4e: Create Tournament
- [ ] Go to `/manage` or `/auction` page
- [ ] Create a new tournament
- [ ] Verify it appears in your tournament list
- [ ] Verify you're automatically assigned to it

#### Test 4f: Check Console Errors
- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Should show NO red errors
- [ ] Warnings are OK

---

### STEP 5: Test Production Build Locally

**Time: 10 minutes**

Run:
```bash
npm run build
npm run start
```

Test the production build:
- [ ] Open `http://localhost:3000`
- [ ] Test login flow
- [ ] Verify no errors in console
- [ ] Stop with Ctrl+C when done

---

### STEP 6: Commit to GitHub

**Time: 5 minutes**

Check what files changed:
```bash
git status
```

Add all changes:
```bash
git add .
```

Commit:
```bash
git commit -m "chore: Add authentication and user management system"
```

Push to GitHub:
```bash
git push origin main
```
(or your branch name)

---

### STEP 7: Deploy to Vercel

**Time: 20 minutes**

#### 7a: Create Vercel Account
- [ ] Go to https://vercel.com
- [ ] Sign up with GitHub (if not already signed up)

#### 7b: Import Project
- [ ] Go to Vercel Dashboard
- [ ] Click "Add New..." → "Project"
- [ ] Select your GitHub repository
- [ ] Click "Import"

#### 7c: Configure Environment Variables
Vercel will ask for environment variables.

Add these (use PRODUCTION values, not local ones):

**Critical - Must be different from local!**

Generate a NEW NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

Create NEW Google OAuth credentials for production:
1. Go to Google Cloud Console
2. Create new OAuth credentials
3. Add redirect URI: `https://your-vercel-deployment-url.vercel.app/api/auth/callback/google`
4. Copy new Client ID and Secret

**Environment Variables to Add:**

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auction-db?retryWrites=true&w=majority

NEXTAUTH_URL=https://your-vercel-deployment-url.vercel.app
(Vercel will show you the URL during setup)

NEXTAUTH_SECRET=<newly-generated-secret-key>

GOOGLE_CLIENT_ID=<new-production-client-id>
GOOGLE_CLIENT_SECRET=<new-production-client-secret>

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster

NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster

NEXT_PUBLIC_API_URL=https://your-vercel-deployment-url.vercel.app
```

#### 7d: Configure MongoDB for Vercel
MongoDB needs to allow connections from Vercel IPs.

Go to MongoDB Atlas:
1. Select your cluster
2. Go to Security → Network Access
3. Click "Add IP Address"
4. Add: `0.0.0.0/0` (allows all IPs for now)
5. Click "Confirm"

#### 7e: Deploy
- [ ] Click "Deploy" button in Vercel
- [ ] Wait for deployment to complete (shows checkmark when done)
- [ ] Wait for build status to show "Ready"

#### 7f: Test Deployment
- [ ] Click "Visit" to open deployed site
- [ ] Test login flow
- [ ] Verify no errors in browser console
- [ ] Go to `/users` page
- [ ] Verify user management works

---

### STEP 8: Verify Deployment

**Time: 10 minutes**

#### 8a: Check Vercel Logs
- [ ] Go to Vercel Dashboard
- [ ] Click on your project
- [ ] Go to "Deployments" tab
- [ ] Click latest deployment
- [ ] Check for any error messages

#### 8b: Test Live Endpoints
Open browser console and test:

```javascript
// Should return array
fetch('/api/tournaments').then(r => r.json()).then(console.log)

// Should return array
fetch('/api/users').then(r => r.json()).then(console.log)
```

#### 8c: Test Unauthenticated Access
```javascript
// Logout first, then:
// Should return 401 Unauthorized
fetch('/api/tournaments').then(r => r.json()).then(console.log)
```

---

## Troubleshooting

### Problem: "Invalid Client" when signing in
**Solution:**
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
2. Go to Google Cloud Console
3. Verify redirect URI includes your domain/URL exactly
4. Regenerate credentials if needed

### Problem: Build fails
**Solution:**
1. Check Vercel build logs (click deployment → Logs)
2. Common issues:
   - Missing environment variables
   - TypeScript errors
   - Missing dependencies
3. Run `npm run build` locally to debug

### Problem: "Database connection failed"
**Solution:**
1. Verify `MONGODB_URI` is correct in Vercel
2. Go to MongoDB Atlas → Network Access
3. Verify IP `0.0.0.0/0` is added
4. Try connecting from MongoDB Atlas compass to test

### Problem: Blank page or 500 error
**Solution:**
1. Check browser console (F12) for errors
2. Check Vercel logs
3. Verify all environment variables are set
4. Check that `.env.local` is NOT committed to Git

---

## Summary

Once you complete all steps:

✅ You'll have authentication working locally
✅ You'll have a deployed version on Vercel
✅ You'll have user management system
✅ You'll have tournament access control
✅ You'll be ready for production use

**Total time: ~1.5-2 hours**

---

## Next: After Deployment

Once deployed successfully:

1. Create additional admin accounts for your team
2. Assign users to tournaments
3. Test all features in production
4. Set up monitoring (optional)
5. Plan backup strategy

See `DEPLOYMENT_GUIDE.md` for detailed information on any step.
