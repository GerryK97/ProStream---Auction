# Vercel 401 Login Error - Comprehensive Troubleshooting

## 🔴 Error: "Failed to load resource: the server responded with a status of 401"

This error occurs during the login request and means the authentication is failing.

---

## 🔍 Root Causes (in order of likelihood)

### 1. **NEXTAUTH_URL Not Set to Production Domain** (Most Common)
**Symptom:** Login button works but requests fail with 401
**Fix:** See [Fix #1](#fix-1-update-nextauth_url)

### 2. **Admin User Not Seeded in Production**
**Symptom:** Login form appears but credentials don't work
**Fix:** See [Fix #2](#fix-2-seed-admin-user)

### 3. **Environment Variables Not Redeployed**
**Symptom:** Changes don't take effect after 5+ minutes
**Fix:** See [Fix #3](#fix-3-force-redeploy)

### 4. **API URL Configuration Issue**
**Symptom:** Requests reach server but fail unexpectedly
**Fix:** See [Fix #4](#fix-4-verify-api-urls)

### 5. **Database Connection Issue**
**Symptom:** All requests fail with server error
**Fix:** See [Fix #5](#fix-5-verify-database-connection)

---

## 🔧 Fixes

### Fix #1: Update NEXTAUTH_URL

**The Problem:** Your `.env.local` has `NEXTAUTH_URL=http://localhost:3000`, but Vercel is at a different domain.

**The Solution:**

1. **Get your Vercel URL:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Open your project
   - Copy the domain shown at top (e.g., `prostream-auction.vercel.app`)

2. **Update in Vercel:**
   - Settings → Environment Variables
   - Find `NEXTAUTH_URL`
   - Change to: `https://YOUR-DOMAIN.vercel.app`
   - Click Save

3. **Wait for redeploy:**
   - Takes 1-3 minutes
   - Watch the "Deployments" tab

4. **Test:**
   - Hard refresh: `Ctrl+Shift+R`
   - Try login again

---

### Fix #2: Seed Admin User

**The Problem:** Admin user doesn't exist in production database.

**The Solution:**

**Option A: Via MongoDB Atlas UI (Easiest)**

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click your cluster (Cluster0)
3. Click "Collections" tab
4. Find `prostream-auction` database
5. If no `users` collection exists:
   - Click "Create Collection"
   - Name: `users`
   - Click "Create"

6. Click into `users` collection
7. Click "+ Insert Document"
8. Paste this:

```json
{
  "_id": "u-admin-001",
  "username": "admin",
  "email": "admin@example.com",
  "passwordHash": "$2b$10$OhVGfkREKwNCdSfJZFx5Ae.HfFfF3dCLjBf8PqVCJCqXB8/7k8/5a",
  "role": "Admin",
  "status": "Active",
  "assignedTournaments": [],
  "assignedTeams": [],
  "assignedPlayer": null,
  "lastLogin": null,
  "lastIPAddress": null,
  "createdAt": {"$date": "2024-11-16T00:00:00.000Z"},
  "updatedAt": {"$date": "2024-11-16T00:00:00.000Z"}
}
```

9. Click "Insert"

**Option B: Via Vercel CLI**

```bash
# 1. Ensure you have Node.js and npm
npm --version

# 2. Install ts-node globally
npm install -g ts-node

# 3. Run the seed script with production database
MONGODB_URI="your-production-mongodb-uri" npx ts-node src/scripts/seed-admin.ts
```

---

### Fix #3: Force Redeploy

**The Problem:** Environment variables changed but site didn't update.

**The Solution:**

**Automatic (Easiest):**
- Go to Vercel → Deployments
- Click the latest deployment
- Click "Redeploy" button

**Manual Redeploy:**
```bash
# 1. Make a small change to any file
# 2. Commit it
git add .
git commit -m "trigger redeploy"
git push

# 3. Vercel automatically redeploys
```

---

### Fix #4: Verify API URLs

**The Problem:** API requests are going to wrong URL.

**The Solution:**

1. Check Vercel environment variables:
   - Settings → Environment Variables
   - Verify `NEXT_PUBLIC_API_URL` is set to your domain or empty:
     - For empty (recommended): `NEXT_PUBLIC_API_URL=` (blank)
     - For explicit: `NEXT_PUBLIC_API_URL=https://your-domain.vercel.app`

2. Check browser console:
   - Right-click → Inspect → Console tab
   - Look for network requests
   - Verify they're going to correct domain

3. If using explicit API URL:
   - Ensure it exactly matches your Vercel domain
   - Check trailing slashes (shouldn't have one)

---

### Fix #5: Verify Database Connection

**The Problem:** Database isn't reachable from Vercel.

**The Solution:**

1. **Check MongoDB IP Whitelist:**
   - Go to MongoDB Atlas
   - Click "Network Access" (left sidebar)
   - Look for IP access list
   - Verify `0.0.0.0/0` is whitelisted (or your Vercel IP)
   - If not, add it:
     - Click "Add IP Address"
     - Enter `0.0.0.0/0` (allows all IPs)
     - Click "Confirm"

2. **Verify Connection String:**
   - In Vercel env vars, check `MONGODB_URI`
   - Format should be:
     ```
     mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
     ```
   - No angle brackets or placeholders

3. **Test Connection:**
   - Check Vercel deployment logs
   - Look for "MongoDB connected" message
   - If error, note the specific message

---

## 📊 Diagnostic Checklist

Run through this to identify the issue:

```
[ ] Step 1: Environment Variables
    [ ] NEXTAUTH_URL is set to Vercel domain (not localhost)
    [ ] MONGODB_URI is set to production database
    [ ] NEXTAUTH_SECRET is set (same as local)
    [ ] NEXT_PUBLIC_API_URL is empty or set to domain
    [ ] No typos in URLs

[ ] Step 2: Deployment
    [ ] Latest deployment shows green checkmark
    [ ] Deployment was created AFTER env var changes
    [ ] Waited 2-3 minutes after env var update

[ ] Step 3: Database
    [ ] MongoDB users collection exists
    [ ] Admin user document exists in collection
    [ ] All required fields present in admin doc
    [ ] MongoDB IP whitelist allows all IPs (0.0.0.0/0)

[ ] Step 4: Browser
    [ ] Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
    [ ] Browser cache cleared
    [ ] Incognito/private window tried
    [ ] No browser extensions blocking requests

[ ] Step 5: Network
    [ ] Vercel domain is accessible
    [ ] DNS resolves correctly
    [ ] No VPN/proxy blocking requests
```

---

## 📋 Testing Requests

### Test Login Endpoint

Open browser console (F12) and run:

```javascript
// Test login endpoint
fetch('https://YOUR-DOMAIN.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    username: 'admin',
    password: 'Admin@123'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

**Expected responses:**
- ✅ Success: `{success: true, token: "...", user: {...}}`
- ❌ 401: `{error: "Invalid username or password"}`
- ❌ 500: Database connection error

### Check Environment Variables in Runtime

Open Vercel deployment logs and look for:
```
MongoDB connected
NextAuth URL: https://your-domain.vercel.app
```

---

## 🔑 Key Points to Remember

1. **NEXTAUTH_URL must be your actual Vercel domain**
   - NOT localhost
   - NOT without https://
   - Must match exactly

2. **Redeploy takes 1-3 minutes**
   - Be patient after env var changes
   - Check "Deployments" tab to confirm

3. **Admin user must exist in production**
   - Different database than local
   - Must be seeded manually

4. **Password is case-sensitive**
   - Username: `admin` (lowercase)
   - Password: `Admin@123` (capital A, capital number)

5. **Browser cache can cause issues**
   - Always hard refresh
   - Or use incognito window

---

## 🆘 When All Else Fails

1. **Check Vercel Logs:**
   ```
   Deployments → Latest → Logs
   Look for errors
   ```

2. **Check Browser Network Tab:**
   ```
   F12 → Network tab
   Reload page
   Look for 401 request
   Click it → Response tab
   See exact error message
   ```

3. **Check MongoDB Activity:**
   ```
   MongoDB Atlas → Activity
   Look for connection attempts
   Check for errors
   ```

4. **Review Configuration:**
   - Ensure all env vars match between:
     - `.env.local` (your machine)
     - Vercel project settings
     - MongoDB connection string

---

## 📞 Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Wrong credentials or no user | Seed admin user |
| `Cannot connect to database` | Wrong MONGODB_URI or whitelist | Update URI, whitelist 0.0.0.0/0 |
| `Invalid hostname` | NEXTAUTH_URL is wrong | Update to Vercel domain |
| `ENOTFOUND` | Domain doesn't exist | Check URL spelling |
| `timeout` | Network too slow | Try again, check connection |

---

## ✅ Success Indicators

When fixed, you should see:

1. ✅ Login page loads without errors
2. ✅ Can submit username and password
3. ✅ Redirects to dashboard after login
4. ✅ User info shows in top-right corner
5. ✅ Can logout successfully

---

**Last Updated:** November 16, 2024
**Status:** Comprehensive Troubleshooting Guide
