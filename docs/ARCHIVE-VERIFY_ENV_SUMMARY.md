# 🔍 How to Verify Environment Variables - Quick Summary

You asked: **"How to check whether next variables correct"**

Here are **4 ways** to check if your environment variables are correct:

---

## 🥇 Method 1: Debug Endpoint (EASIEST - Try This First!)

### For Production (Vercel):

1. Open your browser and go to:
   ```
   https://YOUR-VERCEL-DOMAIN.vercel.app/api/debug/env-check
   ```
   (Replace with your actual Vercel domain)

2. You'll see a JSON response showing:
   - All your environment variables
   - ✅ or ❌ status for each
   - Recommendations if something is wrong

### Example Response:
```json
{
  "environmentVariables": {
    "NEXTAUTH_URL": "https://prostream-auction.vercel.app",
    "NEXTAUTH_SECRET": "✅ SET",
    "MONGODB_URI": "✅ SET (mongodb+srv://...)",
    "NEXT_PUBLIC_API_URL": "(empty - using same origin)"
  },
  "validationChecks": {
    "NEXTAUTH_URL_correct": "✅ LOOKS CORRECT",
    "MongoDB_connected": "✅ URI PROVIDED",
    "Auth_secret_set": "✅ SECRET SET"
  }
}
```

---

## 🥈 Method 2: Vercel Dashboard

### Step-by-Step:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project
3. Click **Settings** → **Environment Variables**
4. You should see these variables:

| Variable | Status | Should Show |
|----------|--------|-------------|
| `NEXTAUTH_URL` | ✅ Set | `https://your-domain.vercel.app` |
| `NEXTAUTH_SECRET` | ✅ Set | (hidden) `••••••••••` |
| `MONGODB_URI` | ✅ Set | (hidden) `mongodb+srv://••••••` |

### ❌ Wrong Values:
- `NEXTAUTH_URL` = `http://localhost:3000` ← This is the problem!
- `NEXTAUTH_URL` = (empty) ← Also wrong!
- `NEXTAUTH_URL` = `your-domain.vercel.app` ← Missing `https://`!

### ✅ Correct Value:
- `NEXTAUTH_URL` = `https://your-domain.vercel.app` ← Perfect!

---

## 🥉 Method 3: Test Login API Directly

### In Browser Console:

1. Press **F12** (opens developer tools)
2. Click **Console** tab
3. Paste this code (replace YOUR-DOMAIN):

```javascript
fetch('https://YOUR-DOMAIN.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    username: 'admin',
    password: 'Admin@123'
  })
})
.then(r => r.json())
.then(d => console.log('Status:', d))
.catch(e => console.error('Error:', e));
```

4. Press **Enter**
5. Look at the response:

**✅ Success (Status 200):**
```javascript
{success: true, token: "...", user: {...}}
```

**❌ Failure (Status 401):**
```javascript
{error: "Invalid username or password"}
```

**❌ Failure (Status 500):**
```javascript
{error: "Internal server error"}
```

---

## 🏅 Method 4: Check Vercel Deployment Logs

### Step-by-Step:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project
3. Click **Deployments** tab
4. Click your latest deployment
5. Click **Logs** tab
6. Look for lines like:

**✅ Good signs:**
```
✅ MongoDB connected successfully
NEXTAUTH_URL: https://prostream-auction.vercel.app
```

**❌ Bad signs:**
```
❌ MONGODB_URI is not defined
❌ NEXTAUTH_URL not set
Error: Cannot connect to database
```

---

## 📋 Quick Checklist

Print this and check each one:

```
For NEXTAUTH_URL in Vercel Settings:
☐ Starts with "https://" (not http://)
☐ Is NOT "localhost"
☐ Matches your Vercel domain exactly
☐ Example: https://prostream-auction.vercel.app

For NEXTAUTH_SECRET:
☐ Is set (shows ••••••••)
☐ NOT empty
☐ Same value as your local .env.local

For MONGODB_URI:
☐ Is set (shows mongodb+srv://••••••)
☐ NOT empty
☐ Starts with "mongodb+srv://"
```

---

## 🎯 The Most Common Problem

**Your `NEXTAUTH_URL` is probably set to `http://localhost:3000`**

### Fix it:

1. Go to Vercel → Settings → Environment Variables
2. Find `NEXTAUTH_URL`
3. Change from: `http://localhost:3000`
4. Change to: `https://YOUR-VERCEL-DOMAIN.vercel.app`
5. Click **Save**
6. Wait 2-3 minutes for redeploy
7. Hard refresh browser: **Ctrl+Shift+R**
8. Try login again

---

## ✅ Verification Steps (Do These In Order)

### Step 1: Check via Dashboard
- Go to Vercel Settings → Environment Variables
- Verify NEXTAUTH_URL is correct

### Step 2: Check via Debug Endpoint
- Go to `https://YOUR-DOMAIN.vercel.app/api/debug/env-check`
- Should show all variables as ✅

### Step 3: Test Login API
- Use browser console test code above
- Should return status 200 with token

### Step 4: Try Login in UI
- Go to `https://YOUR-DOMAIN.vercel.app`
- Click Login
- Enter: admin / Admin@123
- Should work!

---

## 🚨 If You Get 401 Error

Check in this order:

1. ❌ Is `NEXTAUTH_URL` correct in Vercel?
   - If no → Fix it, wait 2-3 min, hard refresh

2. ❌ Did you wait 2-3 minutes after changing env vars?
   - If no → Wait, then try again

3. ❌ Does admin user exist in MongoDB?
   - If no → Seed it to MongoDB

4. ❌ Did you hard refresh (Ctrl+Shift+R)?
   - If no → Do it now

5. ❌ Are you using correct credentials (admin / Admin@123)?
   - If no → Use exact credentials above

---

## 📞 Using Method 1 (Debug Endpoint) - Most Helpful

This shows you EXACTLY what values are set:

```
Go to: https://YOUR-DOMAIN.vercel.app/api/debug/env-check
```

**Share the response with me if you're stuck** - I can see exactly what's wrong.

---

## 💡 Most Important Points

1. **NEXTAUTH_URL must be your Vercel domain, not localhost**
   - ❌ `http://localhost:3000`
   - ✅ `https://prostream-auction.vercel.app`

2. **Wait 2-3 minutes after changing env vars**
   - Vercel needs time to redeploy

3. **Hard refresh browser after changes**
   - Ctrl+Shift+R (not just Ctrl+R)

4. **Check the debug endpoint to see actual values**
   - This is the easiest way to verify

---

## 📚 Full Documentation

For more details, see these files:

- **VERIFY_ENV_VARS.md** - Comprehensive guide with all methods
- **CHECK_ENV_STEP_BY_STEP.md** - Step-by-step visual guide
- **TEST_LOGIN_API.md** - How to test API directly
- **VERCEL_TROUBLESHOOTING.md** - Complete troubleshooting guide

---

## 🎯 Start Here

**Right now, do this:**

1. Go to `https://YOUR-VERCEL-DOMAIN.vercel.app/api/debug/env-check`
2. Look at the response
3. Find what shows ❌ (not set correctly)
4. Let me know what you see
5. I'll tell you exactly how to fix it

---

**Still getting 401?**
→ Use Method 1 (Debug Endpoint) to see what's actually set
→ Share the response with me

**Last Updated:** November 16, 2024
