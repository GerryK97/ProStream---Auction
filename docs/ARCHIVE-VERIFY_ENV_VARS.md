# How to Verify Your Environment Variables Are Correct

## 🔍 Method 1: Check via Debug Endpoint (Easiest)

### For Local Development

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open browser and go to:
   ```
   http://localhost:3000/api/debug/env-check
   ```

3. You'll see a JSON response showing:
   - All your environment variables
   - Whether they're set correctly
   - Recommendations if something is wrong

### For Vercel Production

1. Open browser and go to:
   ```
   https://YOUR-VERCEL-DOMAIN.vercel.app/api/debug/env-check
   ```

2. View the JSON response with your current env vars

---

## 🔍 Method 2: Check via Vercel Dashboard

### Step 1: Open Vercel Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project name
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)

### Step 2: Check These Variables

You should see:

| Variable | Should Be | Status |
|----------|-----------|--------|
| `NEXTAUTH_URL` | `https://YOUR-VERCEL-DOMAIN.vercel.app` | Check ✅ |
| `NEXTAUTH_SECRET` | (some long string) | Should be set ✅ |
| `MONGODB_URI` | `mongodb+srv://...` | Should be set ✅ |
| `NEXT_PUBLIC_API_URL` | (empty or your domain) | Optional |

### Step 3: What to Look For

**❌ WRONG:**
- `NEXTAUTH_URL = http://localhost:3000`
- `NEXTAUTH_URL = (empty)`
- `NEXTAUTH_URL = your-domain.vercel.app` (missing https://)

**✅ CORRECT:**
- `NEXTAUTH_URL = https://your-domain.vercel.app`
- `NEXTAUTH_URL = https://prostream-auction.vercel.app`

---

## 🔍 Method 3: Check Vercel Deployment Logs

### Step 1: View Deployment Details

1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** tab
3. Click your latest deployment

### Step 2: Check Runtime Logs

1. Click **Logs** tab at the top
2. Look for messages like:

**✅ Good signs:**
```
✅ MongoDB connected successfully
NEXTAUTH_URL: https://your-domain.vercel.app
AUTH initialized
```

**❌ Bad signs:**
```
❌ NEXTAUTH_URL not set
❌ MongoDB connection failed
❌ Cannot find NEXTAUTH_SECRET
```

### Step 3: Read the Full Error

If you see errors, scroll down to see:
- Full error message
- Stack trace
- Line number where error occurred

---

## 🔍 Method 4: Check Browser Console

### Step 1: Open Developer Tools

1. Press **F12** on your keyboard
2. Click **Console** tab

### Step 2: Check for Errors

Look for red error messages like:

**❌ Common errors:**
```
Failed to load resource: the server responded with a status of 401 ()
POST /api/auth/login 401
Fetch failed
```

### Step 3: Check Network Requests

1. Click **Network** tab
2. Try to login
3. Look for the login request (POST /api/auth/login)
4. Click it and check:
   - **Status**: Should be 200 (not 401)
   - **Response**: Should show token if successful

---

## 📋 Complete Verification Checklist

Use this to verify everything step by step:

### Local Development (.env.local)

```
[ ] NEXTAUTH_URL = http://localhost:3000
    Reason: You're testing locally

[ ] NEXTAUTH_SECRET = (any value)
    Reason: Must be set, value doesn't matter for local testing

[ ] MONGODB_URI = (your connection string)
    Reason: Need to connect to database

[ ] npm run dev works
    Reason: Dev server must start without errors
```

### Vercel Production (Settings → Environment Variables)

```
[ ] NEXTAUTH_URL = https://YOUR-EXACT-VERCEL-DOMAIN.vercel.app
    Example: https://prostream-auction.vercel.app
    Reason: This is your production URL

[ ] NEXTAUTH_SECRET = (same value as local .env.local)
    Reason: Must be consistent across all environments

[ ] MONGODB_URI = (same connection string as local)
    Reason: Should point to same production database

[ ] Latest deployment shows green checkmark
    Reason: Deployment must succeed

[ ] Wait 2-3 minutes after updating env vars
    Reason: Vercel needs time to redeploy

[ ] Hard refresh browser (Ctrl+Shift+R)
    Reason: Clear browser cache
```

### Database (MongoDB Atlas)

```
[ ] MongoDB Atlas is accessible
    Reason: Connection must work

[ ] users collection exists
    Reason: Admin user stored here

[ ] Admin user document exists
    Reason: Needed for login

[ ] Connection string is correct
    Reason: Vercel must be able to connect
```

---

## 🚀 How to Find Your Correct Vercel Domain

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project
3. Look at the **top of the page** - you'll see:
   ```
   🔗 https://YOUR-PROJECT.vercel.app
   Visit
   ```
4. That's your domain - use it for `NEXTAUTH_URL`

---

## ⚠️ Common Mistakes

### Mistake #1: Wrong Domain Format
```
❌ WRONG: prostream-auction.vercel.app
✅ RIGHT: https://prostream-auction.vercel.app
```
Always include `https://`

### Mistake #2: Typos in Domain
```
❌ WRONG: https://prostream-auction.versel.app (typo: versel)
✅ RIGHT: https://prostream-auction.vercel.app
```
Copy/paste to avoid typos

### Mistake #3: Using Wrong Environment
```
❌ WRONG: Set localhost on production
✅ RIGHT: Set localhost on local, domain on Vercel
```
Different values for different environments

### Mistake #4: Not Waiting for Redeploy
```
❌ WRONG: Change env var, refresh immediately
✅ RIGHT: Change env var, wait 2-3 minutes, refresh
```
Vercel needs time to redeploy

### Mistake #5: Browser Cache
```
❌ WRONG: Simple refresh (Ctrl+R)
✅ RIGHT: Hard refresh (Ctrl+Shift+R)
```
Clear browser cache to see new version

---

## 🔧 If Something is Wrong

### If NEXTAUTH_URL is wrong:
1. Go to Vercel Settings → Environment Variables
2. Click on `NEXTAUTH_URL` variable
3. Update the value
4. Click Save
5. Wait 2-3 minutes

### If MONGODB_URI is wrong:
1. Go to MongoDB Atlas
2. Click "Connect" on your cluster
3. Choose "Drivers" → "Node.js"
4. Copy the connection string
5. Update in Vercel Settings → Environment Variables
6. Click Save

### If something is missing:
1. Go to Vercel Settings → Environment Variables
2. Click "Add" (top right)
3. Fill in the variable name and value
4. Click Save

---

## ✅ Final Check

Before assuming there's an error, verify:

1. ✅ All variables are in Vercel Settings
2. ✅ Values are exactly correct (no typos)
3. ✅ NEXTAUTH_URL matches your Vercel domain
4. ✅ Latest deployment shows green checkmark
5. ✅ 2-3 minutes have passed since last change
6. ✅ Browser cache cleared (Ctrl+Shift+R)
7. ✅ Admin user exists in MongoDB
8. ✅ Tried in incognito window

---

## 📊 Example: Correct Setup

### Local (.env.local)
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=4swXgVjmEKX9eblwKFfHW/kP3YGIGJMGcXE67M/T6TY=
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/prostream-auction
```

### Vercel (Settings → Environment Variables)
```
NEXTAUTH_URL=https://prostream-auction.vercel.app
NEXTAUTH_SECRET=4swXgVjmEKX9eblwKFfHW/kP3YGIGJMGcXE67M/T6TY=
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/prostream-auction
```

Notice: NEXTAUTH_SECRET and MONGODB_URI are the SAME between local and Vercel.

---

## 🆘 Still Having Issues?

1. Use Method 1 (Debug Endpoint) to see what's actually set
2. Compare with Method 2 (Vercel Dashboard) to verify
3. Check Method 3 (Deployment Logs) for specific errors
4. Review Method 4 (Browser Console) for client-side issues

Each method shows different information - use them all to narrow down the problem.

---

**Last Updated:** November 16, 2024
**Status:** Environment Variable Verification Guide
