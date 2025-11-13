# Pre-Deployment Setup Checklist

## Phase 1: Local Environment (Before Running Locally)

- [ ] Copy `.env.example` to `.env.local`
- [ ] Generate `NEXTAUTH_SECRET`:
  ```bash
  openssl rand -base64 32
  ```
  Paste output into `NEXTAUTH_SECRET` in `.env.local`

- [ ] **MongoDB Setup**:
  - [ ] Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  - [ ] Create cluster or use existing
  - [ ] Create database user
  - [ ] Get connection string
  - [ ] Add to `.env.local` as `MONGODB_URI`

- [ ] **Google OAuth Setup**:
  - [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
  - [ ] Enable Google+ API
  - [ ] Create OAuth 2.0 Client ID
  - [ ] Add redirect URI: `http://localhost:3000/api/auth/callback/google`
  - [ ] Copy Client ID to `GOOGLE_CLIENT_ID` in `.env.local`
  - [ ] Copy Client Secret to `GOOGLE_CLIENT_SECRET` in `.env.local`

- [ ] **Cloudinary Setup** (if using image uploads):
  - [ ] Go to [Cloudinary](https://cloudinary.com/)
  - [ ] Create account or login
  - [ ] Copy Cloud Name to `CLOUDINARY_CLOUD_NAME`
  - [ ] Generate API Key and Secret
  - [ ] Add to `.env.local`

- [ ] **Pusher Setup** (if using real-time features):
  - [ ] Go to [Pusher](https://pusher.com/)
  - [ ] Create account or login
  - [ ] Create application
  - [ ] Copy credentials to `.env.local`

- [ ] Verify all required variables are in `.env.local`:
  ```
  MONGODB_URI
  NEXTAUTH_URL=http://localhost:3000
  NEXTAUTH_SECRET
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET
  PUSHER_APP_ID
  PUSHER_KEY
  PUSHER_SECRET
  PUSHER_CLUSTER
  NEXT_PUBLIC_PUSHER_KEY
  NEXT_PUBLIC_PUSHER_CLUSTER
  ```

## Phase 2: Local Testing

- [ ] Install dependencies:
  ```bash
  npm install
  ```

- [ ] Build project locally:
  ```bash
  npm run build
  ```
  ✓ Should complete without errors
  ✓ Should show "ready - started server" message

- [ ] Run development server:
  ```bash
  npm run dev
  ```

- [ ] Test Authentication Flow:
  - [ ] Open `http://localhost:3000`
  - [ ] Click "Login" button
  - [ ] Sign in with Google
  - [ ] Verify redirects to home page
  - [ ] Verify navigation shows your name, email, role
  - [ ] Verify "Logout" button appears

- [ ] Test Protected Routes:
  - [ ] Visit `http://localhost:3000/users`
  - [ ] Should load user management dashboard
  - [ ] Should see yourself listed as first user
  - [ ] Should see "Admin" role badge

- [ ] Test API Endpoints (in browser console):
  ```javascript
  // Should return array (or empty array)
  fetch('/api/tournaments').then(r => r.json()).then(console.log)

  // Should return array of users
  fetch('/api/users').then(r => r.json()).then(console.log)
  ```

- [ ] Test Tournament Creation:
  - [ ] Create a new tournament via UI
  - [ ] Verify it appears in tournament list
  - [ ] Verify you're auto-assigned to it
  - [ ] Check MongoDB that `createdBy` is set to your user ID

- [ ] Test User Management:
  - [ ] Open another browser (incognito) or device
  - [ ] Sign in with different Google account
  - [ ] Verify new user appears in `/users` with "Viewer" role
  - [ ] Back in main window, assign tournament to new user
  - [ ] In other window, verify tournament appears in list

- [ ] Check for Console Errors:
  - [ ] Open browser DevTools (F12)
  - [ ] Go to Console tab
  - [ ] Should have no red errors
  - [ ] Warnings are OK

- [ ] Run Production Build:
  ```bash
  npm run build
  npm run start
  ```
  - [ ] Should start on `http://localhost:3000`
  - [ ] Test login flow in production build
  - [ ] Verify performance is good

## Phase 3: Pre-Deployment Verification

- [ ] **Code Quality**:
  - [ ] No console errors in development
  - [ ] No TypeScript errors: `npm run build`
  - [ ] All API endpoints tested and working
  - [ ] Database indexes created automatically

- [ ] **Security Check**:
  - [ ] `.env.local` is in `.gitignore`
  - [ ] No secrets in code
  - [ ] NEXTAUTH_SECRET is strong (32+ chars)
  - [ ] All environment variables are required fields

- [ ] **Git Status**:
  - [ ] All changes committed
  - [ ] Run: `git status` (should show clean)
  - [ ] Code pushed to GitHub main/Production branch

## Phase 4: Vercel Deployment

- [ ] **Create Vercel Account**:
  - [ ] Go to [Vercel](https://vercel.com/)
  - [ ] Sign up with GitHub account

- [ ] **Connect GitHub Repository**:
  - [ ] Go to Vercel Dashboard
  - [ ] Click "Add New..." → "Project"
  - [ ] Select your repository
  - [ ] Click "Import"

- [ ] **Generate Production NEXTAUTH_SECRET**:
  - [ ] Run: `openssl rand -base64 32`
  - [ ] Copy output (different from local)

- [ ] **Setup Google OAuth for Production**:
  - [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
  - [ ] Create NEW OAuth credentials (don't reuse local ones)
  - [ ] Add redirect URI: `https://your-vercel-url.vercel.app/api/auth/callback/google`
  - [ ] Copy new Client ID and Secret

- [ ] **Add Environment Variables to Vercel**:
  - [ ] Go to Project Settings → Environment Variables
  - [ ] Add all variables with PRODUCTION values:
    ```
    MONGODB_URI=<production-mongodb-uri>
    NEXTAUTH_URL=https://your-vercel-url.vercel.app
    NEXTAUTH_SECRET=<generated-production-secret>
    GOOGLE_CLIENT_ID=<production-google-client-id>
    GOOGLE_CLIENT_SECRET=<production-google-client-secret>
    CLOUDINARY_CLOUD_NAME=<your-cloud-name>
    CLOUDINARY_API_KEY=<your-api-key>
    CLOUDINARY_API_SECRET=<your-api-secret>
    PUSHER_APP_ID=<your-app-id>
    PUSHER_KEY=<your-key>
    PUSHER_SECRET=<your-secret>
    PUSHER_CLUSTER=<your-cluster>
    NEXT_PUBLIC_PUSHER_KEY=<your-key>
    NEXT_PUBLIC_PUSHER_CLUSTER=<your-cluster>
    NEXT_PUBLIC_API_URL=https://your-vercel-url.vercel.app
    ```

- [ ] **Configure MongoDB for Vercel**:
  - [ ] Go to MongoDB Atlas → Security → Network Access
  - [ ] Add IP Address `0.0.0.0/0` (allows Vercel)
  - [ ] Or add specific Vercel IP ranges if known

- [ ] **Deploy**:
  - [ ] Click "Deploy" button in Vercel
  - [ ] Wait for deployment (shows progress)
  - [ ] Wait for all checks to pass (green ✓)
  - [ ] Click "Visit" to open deployed app

## Phase 5: Post-Deployment Testing

- [ ] **Access Deployed App**:
  - [ ] Visit your Vercel URL
  - [ ] Page should load (no 500 errors)
  - [ ] Navigation bar should be visible

- [ ] **Test Authentication**:
  - [ ] Click "Login" button
  - [ ] Sign in with Google
  - [ ] Should redirect to home page
  - [ ] Should show your name, email, role

- [ ] **Test Protected Routes**:
  - [ ] Visit `/users` page
  - [ ] Should load user management dashboard
  - [ ] Should see list of users

- [ ] **Test API Endpoints** (in browser console):
  ```javascript
  fetch('/api/tournaments').then(r => r.json()).then(console.log)
  fetch('/api/users').then(r => r.json()).then(console.log)
  ```

- [ ] **Check Vercel Logs**:
  - [ ] Go to Vercel Dashboard
  - [ ] Click on deployment
  - [ ] Check "Functions" logs for errors
  - [ ] No 500 errors or connection issues

- [ ] **Monitor Performance**:
  - [ ] Page load time should be < 3 seconds
  - [ ] No red errors in browser console
  - [ ] All API calls returning data

## Phase 6: Production Readiness

- [ ] **Create Admin Account**:
  - [ ] First user to sign in automatically gets "Admin" role
  - [ ] Verify this is correct account

- [ ] **Configure Users**:
  - [ ] Create accounts for team members
  - [ ] Assign appropriate roles (admin, manager, viewer)
  - [ ] Assign tournaments to users

- [ ] **Setup Custom Domain** (optional):
  - [ ] Go to Vercel Project Settings
  - [ ] Add custom domain
  - [ ] Update Google OAuth redirect URI to custom domain
  - [ ] Update `NEXTAUTH_URL` to custom domain

- [ ] **Enable Monitoring**:
  - [ ] Set up error tracking (Sentry, etc.)
  - [ ] Configure alerts for deployment issues
  - [ ] Monitor MongoDB Atlas usage

- [ ] **Backup Strategy**:
  - [ ] Enable MongoDB Atlas automated backups
  - [ ] Test restore procedure
  - [ ] Document backup retention policy

- [ ] **Documentation**:
  - [ ] Share deployment guide with team
  - [ ] Document admin procedures
  - [ ] Document troubleshooting steps

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid Client" Google error | Verify Google OAuth credentials and redirect URI |
| "NEXTAUTH_SECRET is not set" | Check Vercel env vars, regenerate and redeploy |
| "Database connection failed" | Check MongoDB URI and network access settings |
| "401 Unauthorized" on API calls | Ensure you're logged in, check auth middleware |
| Build fails on Vercel | Check build logs, verify all env vars are set |
| Slow page loads | Check MongoDB query performance, add indexes |

## Support Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment/vercel)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [MongoDB Atlas Docs](https://docs.mongodb.com/atlas/)
- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [Vercel Docs](https://vercel.com/docs)
