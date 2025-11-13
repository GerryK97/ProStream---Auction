# API Testing Guide - Authentication System

## 🚀 Quick Test Commands

All API requests must be authenticated. Use these commands to test the endpoints.

### Prerequisites
- Dev server running on http://localhost:3001
- You must be logged in via Google OAuth first (or test will return 401)

---

## 📋 Test Suite 1: Unauthenticated Requests (Should Fail)

### Test 1.1: Get Tournaments (No Auth)
```bash
curl -X GET "http://localhost:3001/api/tournaments" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{"error":"Unauthorized - Please login"}
```

**Status:** ✅ TESTED - Returns 401 Unauthorized

### Test 1.2: Get Users (No Auth)
```bash
curl -X GET "http://localhost:3001/api/users" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{"error":"Unauthorized - Please login"}
```

**Status:** ✅ TESTED - Returns 401 Unauthorized

### Test 1.3: Create Tournament (No Auth)
```bash
curl -X POST "http://localhost:3001/api/tournaments" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tournament",
    "year": 2024,
    "budgetPerTeam": 10000,
    "squadSize": 11,
    "basePricePerPlayer": 100
  }'
```

**Expected Response:**
```json
{"error":"Unauthorized - Please login"}
```

**Status:** ✅ TESTED - Returns 401 Unauthorized

---

## 🔐 Test Suite 2: NextAuth Endpoints

### Test 2.1: Get Current Session (No Auth)
```bash
curl -X GET "http://localhost:3001/api/auth/session" \
  -H "Content-Type: application/json"
```

**Expected Response:** (Empty or null)

**Status:** ✅ TESTED - Returns null for unauthenticated users

### Test 2.2: SignIn Providers (Check Available)
```bash
curl -X GET "http://localhost:3001/api/auth/providers" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth",
    ...
  }
}
```

---

## 🔑 Test Suite 3: Authentication Flow (Browser Required)

### Manual Test 3.1: Google Sign-In
1. Open browser to: `http://localhost:3001`
2. Look for "Login" button in navigation
3. Click "Sign in with Google"
4. Authenticate with Google account
5. Should redirect to homepage with user info

**Expected Results:**
- ✓ Redirected to homepage
- ✓ Navigation shows your name
- ✓ Navigation shows your email
- ✓ Shows "Admin" role for first user
- ✓ "Logout" button appears

### Manual Test 3.2: User Session Persistence
1. After login, refresh page (F5)
2. Should still be logged in
3. Navigation should still show your user info

**Expected Results:**
- ✓ Session persists across page refresh
- ✓ User info still visible
- ✓ No redirect to login

### Manual Test 3.3: Logout
1. Click "Logout" button in navigation
2. Should redirect to login page
3. Session should be cleared

**Expected Results:**
- ✓ Redirected to login page
- ✓ User info removed
- ✓ "Login" button appears again

---

## 📊 Test Suite 4: Authenticated API Requests

After logging in, test these endpoints using browser console or curl with auth cookies.

### Test 4.1: Get Tournaments (Authenticated)
```javascript
// In browser console after login
fetch('/api/tournaments')
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
[] // Empty array (or array of tournaments if any exist)
```

**Status:** ⏳ REQUIRES LOGIN - Use browser console

### Test 4.2: Get Users (Authenticated)
```javascript
// In browser console after login
fetch('/api/users')
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
[
  {
    "_id": "user...",
    "name": "Your Name",
    "email": "your@email.com",
    "role": "admin",
    "assignedTournaments": []
  }
]
```

**Status:** ⏳ REQUIRES LOGIN - Use browser console

### Test 4.3: Create Tournament (Authenticated)
```javascript
// In browser console after login
fetch('/api/tournaments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Tournament',
    year: 2024,
    budgetPerTeam: 10000,
    squadSize: 11,
    basePricePerPlayer: 100
  })
})
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "_id": "t...",
  "name": "Test Tournament",
  "year": 2024,
  "budgetPerTeam": 10000,
  "squadSize": 11,
  "basePricePerPlayer": 100,
  "createdBy": "user...",
  "status": "Draft",
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Key Points:**
- ✓ `createdBy` should be your user ID
- ✓ You should be auto-assigned to tournament
- ✓ Status should be "Draft"

---

## 👥 Test Suite 5: User Management

### Test 5.1: User Management Dashboard
1. After login, navigate to: `http://localhost:3001/users`
2. Should see admin dashboard with users table

**Expected Results:**
- ✓ User management page loads
- ✓ Shows list of users
- ✓ Shows "Admin" badge for admin users
- ✓ Shows tournament count for each user
- ✓ "Manage" buttons for each user

### Test 5.2: Change User Role (Authenticated)
```javascript
// In browser console after login (as admin)
const userId = 'user_id_here'; // From users list
fetch(`/api/users/${userId}/role`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ role: 'manager' })
})
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "message": "User role updated successfully",
  "user": {
    "_id": "user...",
    "name": "User Name",
    "email": "user@email.com",
    "role": "manager",
    "assignedTournaments": [...]
  }
}
```

### Test 5.3: Assign Tournament to User (Authenticated)
```javascript
// In browser console after login (as admin)
const userId = 'user_id_here';
const tournamentId = 't_id_here'; // From tournaments list
fetch(`/api/users/${userId}/tournaments`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tournamentId: tournamentId,
    action: 'assign'
  })
})
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "message": "Tournament assigned successfully",
  "user": {
    "_id": "user...",
    "name": "User Name",
    "email": "user@email.com",
    "role": "manager",
    "assignedTournaments": ["t_id_here", ...]
  }
}
```

---

## 🔒 Test Suite 6: Access Control

### Test 6.1: Access Control - Non-Admin Cannot Change Roles
**Setup:**
1. Login as User 1 (non-admin)
2. Get another user's ID

**Test:**
```javascript
const otherUserId = 'user_id_here';
fetch(`/api/users/${otherUserId}/role`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ role: 'admin' })
})
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{"error":"Forbidden - Admin access required"}
```

**Status:** ⏳ REQUIRES MANUAL TEST

### Test 6.2: Access Control - Users See Only Assigned Tournaments
**Setup:**
1. User A: Admin
2. User B: Non-admin
3. Tournament 1: Created by Admin, not assigned to User B
4. Tournament 2: Created by Admin, assigned to User B

**Test with User B:**
```javascript
fetch('/api/tournaments')
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
[
  // Only Tournament 2 should appear
  {
    "_id": "t_id_2",
    "name": "Tournament 2",
    ...
  }
]
```

**Status:** ⏳ REQUIRES MANUAL TEST

### Test 6.3: Access Control - Admin Sees All Tournaments
**Setup:**
1. Login as Admin
2. Multiple tournaments created

**Test:**
```javascript
fetch('/api/tournaments')
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
[
  // ALL tournaments visible to admin
  { "_id": "t_id_1", ... },
  { "_id": "t_id_2", ... },
  { "_id": "t_id_3", ... }
]
```

**Status:** ⏳ REQUIRES MANUAL TEST

---

## 📈 Test Suite 7: Performance & Edge Cases

### Test 7.1: Rapid Successive Requests
```javascript
for(let i = 0; i < 10; i++) {
  fetch('/api/tournaments')
    .then(r => r.json())
    .then(() => console.log(`Request ${i+1} OK`))
}
```

**Expected:** All requests succeed, no race conditions

### Test 7.2: Invalid Tournament ID
```javascript
fetch('/api/tournaments/invalid-id')
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{"error":"Tournament not found"}
```

### Test 7.3: Missing Required Fields
```javascript
fetch('/api/tournaments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Incomplete Tournament'
    // Missing required fields
  })
})
  .then(r => r.json())
  .then(console.log)
```

**Expected:** Error response with validation message

---

## ✅ Test Results Summary

### Completed Tests
- ✅ Unauthenticated API requests return 401
- ✅ Homepage loads successfully
- ✅ NextAuth endpoints respond correctly
- ✅ Session endpoint works for auth checks

### Pending Manual Tests (Require Browser)
- ⏳ Google Sign-In flow
- ⏳ Session persistence
- ⏳ Logout functionality
- ⏳ User management dashboard UI
- ⏳ Authenticated API requests
- ⏳ Role-based access control
- ⏳ Tournament assignment
- ⏳ Permission enforcement

### How to Run Full Test Suite

1. **Open Browser to Development Server**
   ```
   http://localhost:3001
   ```

2. **Test Login Flow**
   - Click Login button
   - Sign in with Google
   - Verify user info displays

3. **Test API in Browser Console**
   ```javascript
   // Get tournaments
   fetch('/api/tournaments').then(r => r.json()).then(console.log)

   // Create tournament
   fetch('/api/tournaments', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       name: 'Test',
       year: 2024,
       budgetPerTeam: 10000,
       squadSize: 11,
       basePricePerPlayer: 100
     })
   }).then(r => r.json()).then(console.log)
   ```

4. **Test User Management**
   - Navigate to `/users`
   - See user list
   - Create second user
   - Test role changes
   - Test tournament assignments

5. **Test Access Control**
   - Logout and login as different user
   - Verify can only see assigned tournaments
   - Login as admin to see all tournaments

---

## 🐛 Debugging Tips

### If API returns 401
- Check browser console for errors
- Verify you're logged in
- Check cookies are being sent
- Check NEXTAUTH_SECRET in .env.local

### If page loads but no user info
- Clear browser cache
- Refresh page
- Check browser console for errors
- Verify SessionProvider is in layout

### If tournament creation fails
- Check all required fields are provided
- Verify you're authenticated
- Check MongoDB connection in logs
- Look for validation errors in response

### Check Dev Server Logs
```bash
tail -f /tmp/dev.log
```

---

## 📱 Mobile Testing

Same tests apply on mobile devices using the same URLs:
- http://192.168.1.208:3001 (or your local IP)
- Test on different browsers
- Test on different devices

---

## 🚀 Next: Deployment Testing

After all manual tests pass, follow [PRE_DEPLOYMENT_STEPS.md](./PRE_DEPLOYMENT_STEPS.md) to test production build and deploy to Vercel.

---

**Testing Status: Ready for Manual Execution**

All automated tests passed. Awaiting manual browser-based testing.
