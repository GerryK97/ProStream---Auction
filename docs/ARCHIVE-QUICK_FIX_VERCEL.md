# Quick Fix: 401 Login Error on Vercel - Step by Step

## 🎯 What's Wrong

Your Vercel deployment has a 401 error because:
1. **`NEXTAUTH_URL` is set to `localhost`** (needs your Vercel domain)
2. **Admin user might not exist** in production database

## ✅ Fix in 5 Minutes

### Step 1: Get Your Vercel URL (1 min)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your "ProStream" project
3. Look for the domain at the top (example: `prostream-auction.vercel.app`)
4. Copy it (you'll need this in Step 2)

### Step 2: Update Environment Variables (2 min)

1. In your Vercel project, click **Settings**
2. Click **Environment Variables** (left sidebar)
3. Find the variable **`NEXTAUTH_URL`**
4. Change its value from `http://localhost:3000` to:
   ```
   https://YOUR-VERCEL-DOMAIN.vercel.app
   ```
   (Replace `YOUR-VERCEL-DOMAIN` with your actual domain from Step 1)

5. Add/Update **`NEXT_PUBLIC_API_URL`**:
   ```
   https://YOUR-VERCEL-DOMAIN.vercel.app
   ```

6. Click **Save**
7. Vercel will automatically redeploy (takes 1-2 minutes)

### Step 3: Seed Admin User (2 min)

Go to [MongoDB Atlas](https://cloud.mongodb.com):

1. Login to your account
2. Click your **Cluster** (Cluster0)
3. Click **Collections** tab
4. Find the database `prostream-auction`
5. Right-click the database name → **Create Collection**
6. Name it `users` → Click **Create**

Now insert the admin user:

1. Click the `users` collection
2. Click **+ Insert Document**
3. Replace the default JSON with this:

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

4. Click **Insert**

### Step 4: Test Login (30 sec)

1. Go to your Vercel domain: `https://YOUR-VERCEL-DOMAIN.vercel.app`
2. Click **Login**
3. Enter:
   - **Username:** `admin`
   - **Password:** `Admin@123`
4. Click **Login**

✅ **Should work now!**

---

## 🔧 If It Still Doesn't Work

### Try These Steps:

1. **Hard refresh browser** (clears cache):
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Open in incognito/private window** (avoids cache):
   - Chrome: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`
   - Safari: `Cmd + Shift + N`

3. **Check Vercel Logs**:
   - Go to your project → **Deployments** tab
   - Click the latest deployment
   - Scroll to **Logs** section
   - Look for error messages

4. **Verify MongoDB**:
   - Go to MongoDB Atlas
   - Click your cluster
   - Check the `users` collection has the admin document
   - Verify the document has all required fields

### Still Stuck?

Check these:
- ✅ `NEXTAUTH_URL` = Your Vercel domain (not localhost)
- ✅ Redeployment completed (wait 2-3 min after env var change)
- ✅ Admin user document exists in MongoDB
- ✅ Browser cache cleared (hard refresh)

---

## 📝 What You Changed

| Item | Old Value | New Value |
|------|-----------|-----------|
| NEXTAUTH_URL | http://localhost:3000 | https://YOUR-DOMAIN.vercel.app |
| NEXT_PUBLIC_API_URL | (empty) | https://YOUR-DOMAIN.vercel.app |
| Admin User | (missing) | (added to MongoDB) |

---

## 🚀 After Login Works

1. **Change admin password immediately**:
   - Click the user dropdown (top-right)
   - Navigate to `/users`
   - Edit admin user
   - Set new password

2. **Create other users** as needed:
   - Go to `/users`
   - Click "+ Create User"
   - Fill in details
   - Click "Create"

3. **Manage approvals**:
   - Go to `/users`
   - Click "Pending Approval" tab
   - Approve audience members

---

## 📞 Need More Help?

If you're still getting errors, share:
1. Your Vercel domain (the actual URL)
2. The exact error message from browser console
3. The error from Vercel Deployment Logs

---

**That's it! 🎉**

Your login should now work on Vercel. The key was updating `NEXTAUTH_URL` to your production domain instead of localhost.
