# Test Login API Directly - Debug 401 Error

## 🎯 What This Does

Tests your login API directly without the UI, so you can see exactly what's failing.

---

## ✅ Method 1: Using Browser Console (Easiest)

### Step 1: Open Browser Console

1. Press **F12** on your keyboard
2. Click the **Console** tab
3. You should see a text input at the bottom

### Step 2: Test Login Endpoint

Copy this code and paste it into the console:

```javascript
// Test login
fetch('https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'Admin@123'
  })
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.error('Error:', error);
});
```

**Replace** `YOUR-VERCEL-DOMAIN` with your actual Vercel domain (e.g., `prostream-auction-gk97.vercel.app`)

### Step 3: Check the Response

Press **Enter** and look for output like:

**✅ Success (status 200):**
```
Status: 200
Response: {
  success: true,
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: {
    id: "u-...",
    username: "admin",
    email: "admin@example.com",
    role: "Admin",
    status: "Active"
  }
}
```

**❌ Failure (status 401):**
```
Status: 401
Response: {
  error: "Invalid username or password"
}
```

**❌ Failure (other errors):**
```
Status: 500
Response: {
  error: "Internal server error"
}
```

---

## 🔍 Interpreting the Results

### Status 200 - Success ✅
- Login endpoint is working
- Database is connected
- Admin user exists
- **Problem:** Issue is probably in the UI or browser

**What to do:**
1. Clear browser cache: Ctrl+Shift+R
2. Try login via UI again
3. If still fails, check browser console for other errors

### Status 401 - Authentication Failed ❌
- Admin user doesn't exist OR
- Wrong credentials OR
- User is suspended or not approved

**What to check:**
1. Admin user exists in MongoDB: [Check MongoDB](#step-4-verify-admin-user-in-mongodb)
2. Username is exactly `admin` (lowercase)
3. Password is exactly `Admin@123` (capital A, capital number)

### Status 500 - Server Error ❌
- Something is wrong on the server
- Could be database connection issue
- Could be missing environment variables

**What to do:**
1. Check Vercel deployment logs
2. Verify MONGODB_URI is set
3. Verify NEXTAUTH_SECRET is set
4. Check if MongoDB is accessible

### Network Error (failed to fetch) ❌
- Cannot reach the server
- URL is wrong
- Network is down
- CORS issue

**What to do:**
1. Verify domain is correct
2. Verify you can access the main page at that domain
3. Check if Vercel is responding
4. Try again in a few moments

---

## ✅ Method 2: Using cURL (Command Line)

If you have cURL installed:

```bash
curl -X POST https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}' \
  | jq '.'
```

Or without pretty formatting:

```bash
curl -X POST https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

---

## ✅ Method 3: Using Postman (Advanced)

If you have Postman installed:

1. Open Postman
2. Create new request
3. Set method to **POST**
4. URL: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/login`
5. Go to **Body** tab
6. Select **raw** and **JSON**
7. Paste:
   ```json
   {
     "username": "admin",
     "password": "Admin@123"
   }
   ```
8. Click **Send**
9. Check the response

---

## 🔍 Testing Different Credentials

You can also test with different usernames/passwords to debug:

```javascript
// Test with wrong password
fetch('https://YOUR-DOMAIN.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    username: 'admin',
    password: 'WrongPassword'  // Wrong password
  })
})
.then(r => r.json())
.then(d => console.log(d));
```

Expected response:
```json
{
  "error": "Invalid username or password"
}
```

---

## 🔍 Testing Session Validation

After successful login, test the session endpoint:

```javascript
// 1. First, login and get token
const loginResponse = await fetch('https://YOUR-DOMAIN.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    username: 'admin',
    password: 'Admin@123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.token;

console.log('Token:', token);

// 2. Then, test the session endpoint with that token
const sessionResponse = await fetch('https://YOUR-DOMAIN.vercel.app/api/auth/session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ token })
});

const sessionData = await sessionResponse.json();
console.log('Session:', sessionData);
```

**Expected response:**
```json
{
  "success": true,
  "user": {
    "id": "u-...",
    "username": "admin",
    "email": "admin@example.com",
    "role": "Admin",
    "status": "Active"
  }
}
```

---

## 📋 Diagnostic Flowchart

```
Test Login API
    ↓
Status 200 ✅ → Login works! Problem is in UI/Browser
    ↓ Hard refresh and try again

Status 401 ❌ → Authentication failed
    ↓
    Does admin user exist in MongoDB?
    ├─ No → Seed admin user to MongoDB
    ├─ Yes → Is status "Active"?
            ├─ No (Suspended/Pending) → Change status to Active
            └─ Yes → Check credentials are exact match

Status 500 ❌ → Server error
    ↓
    Check environment variables set?
    ├─ NEXTAUTH_URL? → Set it
    ├─ NEXTAUTH_SECRET? → Set it
    ├─ MONGODB_URI? → Set it
    └─ Redeploy and try again

Network Error ❌ → Cannot reach server
    ↓
    Is domain correct?
    ├─ No → Use correct Vercel domain
    └─ Yes → Wait a moment and try again
```

---

## 🚨 Troubleshooting by Error Message

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid username or password` | Wrong credentials or user doesn't exist | Check admin user in MongoDB |
| `Account is pending admin approval` | User not approved yet | Change status to "Active" in MongoDB |
| `Account has been suspended` | User is suspended | Change status to "Active" in MongoDB |
| `Cannot connect to database` | MONGODB_URI wrong or no connection | Check MongoDB URI in env vars |
| `NEXTAUTH_URL not set` | Missing environment variable | Set NEXTAUTH_URL in Vercel |
| `Internal server error` | Unknown error on server | Check Vercel deployment logs |
| Network timeout | Server too slow or unreachable | Wait and try again |

---

## ✅ Step-by-Step: Complete Test

### Step 1: Prepare

1. Go to your Vercel domain (don't need to be on specific page)
2. Press **F12** to open console
3. Copy your Vercel domain (e.g., `prostream-auction-gk97.vercel.app`)

### Step 2: Modify the Test Code

Find this line in the code below:
```javascript
fetch('https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/login',
```

Replace `YOUR-VERCEL-DOMAIN` with your actual domain

### Step 3: Run the Test

Paste the modified code into console and press Enter:

```javascript
const domain = 'prostream-auction-gk97.vercel.app'; // CHANGE THIS

fetch(`https://${domain}/api/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'Admin@123'
  })
})
.then(response => {
  console.log('📊 Status Code:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Response:', data);
  if (data.token) {
    console.log('🔑 Token received:', data.token.substring(0, 50) + '...');
  }
  if (data.error) {
    console.error('❌ Error:', data.error);
  }
})
.catch(error => {
  console.error('🔌 Network Error:', error.message);
});
```

### Step 4: Review Output

Look for one of these outcomes:

**✅ Success:**
```
📊 Status Code: 200
✅ Response: {success: true, token: "...", user: {...}}
🔑 Token received: eyJhbGciOiJIUzI1NiIsIn...
```

**❌ Auth Failed:**
```
📊 Status Code: 401
❌ Error: Invalid username or password
```

**❌ Server Error:**
```
📊 Status Code: 500
❌ Error: Internal server error
```

**❌ Network Error:**
```
🔌 Network Error: Failed to fetch
```

---

## 💡 Pro Tips

1. **Save the test code** in a text file so you can reuse it
2. **Watch the network tab** (Network tab in DevTools) to see actual requests
3. **Check timestamps** - logs show when requests were made
4. **Try with different credentials** - helps narrow down if it's a login issue

---

## 🆘 If All Else Fails

1. Copy the full console output (all errors/messages)
2. Go to Vercel → Deployments → Latest → Logs
3. Copy any error messages from there
4. Collect these together and review:
   - What exact error message?
   - At what step does it fail?
   - Is it a 401, 500, or network error?

---

**Last Updated:** November 16, 2024
**Status:** API Testing Guide
