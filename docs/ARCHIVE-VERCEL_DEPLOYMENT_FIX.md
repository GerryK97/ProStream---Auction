# Vercel Deployment - Login Fix Guide

## 🔴 Problem: 401 Error on Login

You're getting a 401 error because the environment variables aren't set correctly for Vercel.

---

## ✅ Solution Steps

### Step 1: Update Vercel Environment Variables

Go to your Vercel project settings and update these variables:

**Navigate to:**
1. Vercel Dashboard → Your Project
2. Settings → Environment Variables

**Update/Add these variables:**

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXTAUTH_URL` | `https://your-vercel-domain.vercel.app` | Replace with your actual Vercel URL |
| `NEXTAUTH_SECRET` | `4swXgVjmEKX9eblwKFfHW/kP3YGIGJMGcXE67M/T6TY=` | Keep this same value |
| `MONGODB_URI` | (should already be set) | Verify it's the same as local |
| `NEXT_PUBLIC_API_URL` | `https://your-vercel-domain.vercel.app` | Your Vercel URL |

### Step 2: Redeploy

After updating environment variables:

1. Commit any changes to git
2. Push to your main branch
3. Vercel will automatically redeploy

### Step 3: Seed Admin User in Production

**Option A: Using MongoDB Atlas UI (Recommended)**

1. Go to MongoDB Atlas dashboard
2. Find your cluster
3. Click "Collections"
4. In the `prostream-auction` database, create a new collection called `users`
5. Insert this document:

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

**Note:** The passwordHash above is for password: `Admin@123`

**Option B: Using Vercel CLI**

If you have Vercel CLI installed:

```bash
# Create a temporary .env for seed script
echo "MONGODB_URI=your-production-uri" > .env.temp

# Run seed script
npx ts-node src/scripts/seed-admin.ts

# Remove temp file
rm .env.temp
```

---

## 🔍 Common Issues & Fixes

### Issue 1: Still Getting 401 After Updating Env Vars

**Causes:**
- Environment variables not redeployed
- Browser cache showing old version

**Fixes:**
1. Vercel automatically redeploys when you update env vars - wait 2-3 minutes
2. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. Clear browser cache and cookies
4. Try in an incognito/private window

### Issue 2: "Invalid username or password"

**Causes:**
- Admin user not seeded in production database
- Wrong credentials

**Fixes:**
1. Check admin user exists in MongoDB Atlas
2. Verify password is exactly: `Admin@123`
3. Verify username is exactly: `admin`

### Issue 3: CORS or Connection Errors

**Causes:**
- Wrong API URL in env vars
- Network issues

**Fixes:**
1. Ensure `NEXT_PUBLIC_API_URL` matches your Vercel domain
2. Check MongoDB connection string is correct
3. Verify MongoDB IP whitelist includes Vercel's IPs (0.0.0.0/0 recommended for development)

### Issue 4: "Cannot connect to database"

**Cause:**
- MongoDB connection string incorrect or database not accessible

**Fixes:**
1. Go to MongoDB Atlas
2. Click "Connect"
3. Choose "Drivers" → "Node.js"
4. Copy the connection string
5. Update `MONGODB_URI` in Vercel env vars
6. Make sure IP whitelist allows Vercel (use 0.0.0.0/0)

---

## 📋 Verification Checklist

After deployment, verify:

- ✅ `NEXTAUTH_URL` = Your Vercel URL (not localhost)
- ✅ `MONGODB_URI` = Production database connection string
- ✅ Admin user exists in MongoDB
- ✅ Can login with: `admin` / `Admin@123`
- ✅ See user info in top-right corner
- ✅ Can access `/users` (admin dashboard)

---

## 🔑 Login Credentials

After deployment:

**Admin User:**
- Username: `admin`
- Password: `Admin@123`

⚠️ **Change this password immediately!**

---

## 📝 Your Current Status

| Item | Status | Notes |
|------|--------|-------|
| NEXTAUTH_URL | ❌ Needs Update | Currently set to localhost |
| MONGODB_URI | ✅ Correct | Already in env vars |
| Admin User | ❓ Unknown | Need to verify/seed |
| Deployment | ✅ Live | Vercel deployment active |

---

## 🚀 Next Steps

1. **Update NEXTAUTH_URL** in Vercel to your domain
2. **Wait 2-3 minutes** for redeploy
3. **Seed admin user** using MongoDB Atlas UI (Option A above)
4. **Try logging in** with admin / Admin@123
5. **Change admin password** immediately after first login

---

## 💡 Pro Tips

1. **Keep NEXTAUTH_SECRET consistent** - Don't change this between environments
2. **Use strong secrets in production** - Consider generating a new one with: `openssl rand -base64 32`
3. **Whitelist IPs carefully** - Use 0.0.0.0/0 for ease during development, restrict later
4. **Test in incognito mode** - Avoids browser cache issues

---

## ❓ Still Having Issues?

Check these logs:

**Vercel Logs:**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click latest deployment
3. Go to "Logs" tab
4. Look for error messages

**MongoDB Logs:**
1. Go to MongoDB Atlas
2. Click your cluster
3. Go to "Activity" tab
4. Look for connection errors

---

## 📞 Support Resources

- Vercel Docs: https://vercel.com/docs/environment-variables
- MongoDB Connection Issues: https://docs.mongodb.com/manual/reference/connection-string/
- Next.js Deployment: https://nextjs.org/docs/deployment

---

**Last Updated:** November 16, 2024
**Status:** Deployment Fix Guide
