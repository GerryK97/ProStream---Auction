# Step-by-Step Visual Guide: How to Check Environment Variables

## 🎯 Goal
Verify that all your environment variables are correct on Vercel.

---

## ✅ Step 1: Check Your Vercel Domain

### What to do:

1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your "ProStream" project
3. Look at the **top of the page** - you'll see a blue button with your domain

### What you'll see:

```
Project: ProStream Auction
Visit 🔗 https://prostream-auction-gk97.vercel.app
```

**Copy this URL** - this is what your `NEXTAUTH_URL` should be.

---

## ✅ Step 2: Go to Environment Variables Settings

### What to do:

1. In the same Vercel project page
2. Click **Settings** (top navigation menu)
3. In the left sidebar, click **Environment Variables**

### What you'll see:

A list of all environment variables with values (some values hidden)

---

## ✅ Step 3: Check NEXTAUTH_URL Variable

### Look for this variable:

| Setting | Your Value | Should Be |
|---------|-----------|-----------|
| `NEXTAUTH_URL` | ? | `https://prostream-auction-gk97.vercel.app` |

### To view it:

1. Find the row with `NEXTAUTH_URL`
2. The value might be hidden - click the "👁️ Show" button to see it

### What to check:

**❌ WRONG - It shows:**
```
http://localhost:3000
(empty)
prostream-auction-gk97.vercel.app (missing https://)
```

**✅ RIGHT - It shows:**
```
https://prostream-auction-gk97.vercel.app
```

### If it's wrong:

1. Click on the `NEXTAUTH_URL` row
2. Click the **Edit** button (pencil icon)
3. Change the value to: `https://YOUR-VERCEL-DOMAIN.vercel.app`
4. Click **Save** or **Update**
5. **IMPORTANT:** Wait 2-3 minutes for redeploy

---

## ✅ Step 4: Check NEXTAUTH_SECRET

### Look for this variable:

| Setting | Status | Should Be |
|---------|--------|-----------|
| `NEXTAUTH_SECRET` | ? | Must be set |

### What you'll see:

- The value will be **hidden** (for security)
- It will show a bullet point: `••••••••••••••••••••••••`

### What to check:

**✅ GOOD:**
```
NEXTAUTH_SECRET: •••••••••••••••••• (has some value)
```

**❌ BAD:**
```
NEXTAUTH_SECRET: (not listed at all)
```

### If it's not set:

1. Click **Add** button (top right)
2. Variable name: `NEXTAUTH_SECRET`
3. Value: `4swXgVjmEKX9eblwKFfHW/kP3YGIGJMGcXE67M/T6TY=`
4. Click **Save** or **Add**

---

## ✅ Step 5: Check MONGODB_URI

### Look for this variable:

| Setting | Status | Should Be |
|---------|--------|-----------|
| `MONGODB_URI` | ? | Must be set |

### What you'll see:

- The value will be **hidden** (for security)
- It will show something like: `mongodb+srv://••••••`

### What to check:

**✅ GOOD:**
```
MONGODB_URI: mongodb+srv://•••••• (has mongodb url)
```

**❌ BAD:**
```
MONGODB_URI: (not listed at all)
```

### If it's not set:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click your cluster (Cluster0)
3. Click **Connect** button
4. Choose **Drivers** → **Node.js**
5. Copy the connection string
6. In Vercel, click **Add** button
7. Variable name: `MONGODB_URI`
8. Paste the connection string
9. Click **Save** or **Add**

---

## ✅ Step 6: Check Deployment Status

### What to do:

1. Go to your Vercel project
2. Click **Deployments** tab
3. Look at the **latest deployment** at the top

### What you'll see:

A list of deployments with dates and status

### What to check:

**✅ GOOD - Shows:**
```
Production deployment
✅ Ready · 2 minutes ago
```

**❌ BAD - Shows:**
```
❌ Error during deployment
🔄 Deploying...
```

### If deployment failed:

1. Click on the failed deployment
2. Click **Logs** tab
3. Scroll down to see the error message
4. Note the error and fix it

---

## ✅ Step 7: Wait for Redeploy

### IMPORTANT - Do NOT skip this:

After changing environment variables:

1. **Wait 2-3 minutes** for Vercel to redeploy
2. Watch the **Deployments** tab
3. You should see a new deployment appear with a green checkmark
4. Once it's green, proceed to next step

### What you'll see during redeploy:

```
Pending deployment...    🔄
Building...             🔄
Deploying...            🔄
Ready                   ✅
```

---

## ✅ Step 8: Clear Browser Cache

After redeploy completes:

1. Go to your Vercel domain: `https://YOUR-DOMAIN.vercel.app`
2. Press **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
   - This does a "hard refresh" and clears cache
3. Wait for page to reload

---

## ✅ Step 9: Try the Debug Endpoint

### To verify everything is correct:

1. Go to: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/debug/env-check`
2. You'll see a JSON response showing all your variables

### Look for these lines:

**✅ GOOD:**
```json
{
  "NEXTAUTH_URL": "https://prostream-auction-gk97.vercel.app",
  "NEXTAUTH_SECRET": "✅ SET",
  "MONGODB_URI": "✅ SET (...)"
}
```

**❌ BAD:**
```json
{
  "NEXTAUTH_URL": "❌ NOT SET",
  "NEXTAUTH_SECRET": "❌ NOT SET"
}
```

---

## ✅ Step 10: Test Login

Now try to login:

1. Go to: `https://YOUR-VERCEL-DOMAIN.vercel.app`
2. Click **Login**
3. Enter:
   - Username: `admin`
   - Password: `Admin@123`
4. Click **Login**

### What you should see:

**✅ Success:**
- Redirects to dashboard
- See username in top-right corner
- Can access pages

**❌ Still failing:**
- Shows 401 error
- Login button still shows error message
- Stays on login page

---

## 🆘 If Still Not Working

### Do these things in order:

1. **Check if admin user exists:**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Click your cluster → Collections
   - Look for `users` collection
   - Should see at least 1 document with username "admin"

2. **Try incognito window:**
   - Press Ctrl+Shift+N (Chrome) or Cmd+Shift+N (Safari)
   - Go to your Vercel domain again
   - Try login
   - This avoids browser cache issues

3. **Check Vercel logs:**
   - Go to Vercel → Deployments → Latest
   - Click **Logs** tab
   - Look for error messages

4. **Read the error message:**
   - Open browser F12 → Console tab
   - Try login again
   - Look for red error messages
   - Note what it says

---

## 📋 Quick Checklist

Print this and check each box:

```
☐ Vercel domain found (step 1)
☐ Went to Environment Variables (step 2)
☐ NEXTAUTH_URL is correct (step 3)
☐ NEXTAUTH_SECRET is set (step 4)
☐ MONGODB_URI is set (step 5)
☐ Deployment shows green checkmark (step 6)
☐ Waited 2-3 minutes after changes (step 7)
☐ Hard refreshed browser (Ctrl+Shift+R) (step 8)
☐ Checked debug endpoint shows variables (step 9)
☐ Tried login with admin/Admin@123 (step 10)
☐ Login worked! ✅
```

---

## 🎯 Expected Results

When everything is correct, you should:

1. ✅ See green checkmark on latest deployment
2. ✅ Debug endpoint shows all variables set correctly
3. ✅ Login form accepts your credentials
4. ✅ See dashboard after login
5. ✅ See username in top-right corner
6. ✅ Can click dropdown to logout

---

## 🚨 Emergency: Reset Everything

If nothing is working, try this:

1. **Delete all auth environment variables:**
   - Go to Vercel → Settings → Environment Variables
   - Delete: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_API_URL`

2. **Re-add them carefully:**
   - Click **Add Variable**
   - Name: `NEXTAUTH_URL`
   - Value: `https://YOUR-EXACT-DOMAIN.vercel.app` (copy/paste from top of Vercel page)
   - Click Add
   - Repeat for other variables

3. **Wait for redeploy:**
   - 2-3 minutes

4. **Hard refresh and test:**
   - Ctrl+Shift+R
   - Try login

---

**Last Updated:** November 16, 2024
**Status:** Step-by-Step Verification Guide
