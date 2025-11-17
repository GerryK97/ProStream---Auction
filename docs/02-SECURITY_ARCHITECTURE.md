# Security Architecture - Multi-User Access Control

## Overview

ProStream implements a comprehensive three-level security model to ensure users only access resources they're authorized to view and modify.

---

## Three-Level Security Model

### Level 1: Authentication

**Purpose:** Verify the user is who they claim to be

**Implementation:**
```typescript
const user = await getUserFromRequest(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Verification:**
1. Extract JWT token from Authorization header
2. Verify token signature (ensures it wasn't forged)
3. Check token expiration (7-day expiration)
4. Fetch complete user data from database

**Failure Response:** 401 Unauthorized

**Cannot Be Bypassed By:**
- ❌ URL manipulation
- ❌ Network inspection
- ❌ Browser console tricks
- ❌ Forging tokens (signature won't match)

---

### Level 2: Authorization

**Purpose:** Verify the user has permission for this action type

**Implementation:**
```typescript
if (!canPerformAction(user.role, 'read', 'tournament')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Permission Matrix:**

```
ROLE              CREATE  READ  UPDATE  DELETE
Admin             ✅      ✅    ✅      ✅
Tournament Mgr    ✅      ✅    ✅      ✅
MasterManager     ✅      ✅    ✅      ✅
Team Mgr          ✅      ✅    ✅      ✅
Player Mgr        ✅      ✅    ✅      ✅
Audience          ❌      ✅    ❌      ❌
```

**Failure Response:** 403 Forbidden

**Cannot Be Bypassed By:**
- ❌ Role manipulation (checked server-side only)
- ❌ API endpoint guessing
- ❌ Browser storage modification (token checked server-side)

---

### Level 3: Access Control

**Purpose:** Verify the user has access to THIS SPECIFIC resource

**Implementation:**
```typescript
const tournament = await tournamentDB.getById(id);
if (!canAccessTournament(userId, userRole, tournament, assignedTournaments)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Access Rules:**

| Scenario | Can Access? | Reason |
|----------|-------------|--------|
| Admin accessing any resource | ✅ | Admin override |
| Creator accessing own resource | ✅ | Ownership |
| User assigned to tournament | ✅ | Assignment |
| User NOT assigned/creator | ❌ | No access |
| Audience role accessing tournament | ❌ | Permission denied |

**Failure Response:** 403 Forbidden

**Cannot Be Bypassed By:**
- ❌ Direct database manipulation (API enforces this)
- ❌ ID guessing (each resource checked individually)
- ❌ Admin impersonation (JWT signature prevents this)

---

## Data Isolation

### How Users See Different Data

#### Example: Three Users, Three Tournaments

**Setup:**
- User A creates Tournament A
- User B creates Tournament B
- Admin assigns Tournament A to User C

**Data Visibility:**

| User | Query: GET /api/tournaments | Returns |
|------|---------------------------|---------|
| User A (creator) | Tournament A, Tournament B | Tournament A only |
| User B (creator) | Tournament A, Tournament B | Tournament B only |
| User C (assigned) | Tournament A, Tournament B | Tournament A only |
| Admin | Tournament A, Tournament B | All tournaments |

**How It Works:**
```typescript
// Database returns filtered results
const tournaments = await tournamentDB.getAllForUser(
  userId,        // "user-a-id"
  userRole,      // "Tournament"
  assignedTournaments // []
);

// MongoDB query executed:
// db.tournaments.find({
//   $or: [
//     { createdBy: "user-a-id" },              // Created by user
//     { _id: { $in: [] } }                     // Assigned to user
//   ]
// })

// Returns: [Tournament A]
```

---

## Access Control by Resource Type

### Tournaments

**Who Can Access:**
- ✅ Creator (user who created the tournament)
- ✅ Users assigned to this tournament
- ✅ Admin (all tournaments)

**Who Cannot:**
- ❌ Other tournament creators
- ❌ Unassigned users
- ❌ Audience members (unless explicitly assigned)

**createdBy Field:**
- Set when tournament is created
- Used to identify owner
- Immutable (never changes)

---

### Teams

**Who Can Access:**
- ✅ Team creator
- ✅ Users with access to the team's tournament
- ✅ Admin

**Who Cannot:**
- ❌ Users without tournament access
- ❌ Other team creators

**Logic:**
```typescript
canAccessTeam(userId, role, team, canAccessTournament) {
  if (role === 'Admin') return true;                      // Admin can access
  if (team.createdBy === userId) return true;            // Creator can access
  if (canAccessTournament) return true;                  // Tournament access = team access
  return false;
}
```

---

### Players

**Who Can Access:**
- ✅ Player creator
- ✅ Users with access to the player's tournament
- ✅ Admin

**Who Cannot:**
- ❌ Users without tournament access
- ❌ Other player creators

**Logic:**
- Same as Teams (similar hierarchy)

---

### Master Teams & Master Players

**Who Can Access:**
- ✅ Creator (MasterManager)
- ✅ Admin

**Who Cannot:**
- ❌ Other MasterManagers
- ❌ All other roles

**Purpose:**
- Master data is isolated per creator
- Not shared between teams/tournaments
- Only visible to creator and admin

---

## Resource Ownership (createdBy)

### What It Is
A field on every resource that stores the `userId` of the user who created it.

**Implemented On:**
- Tournaments
- Teams
- Players
- Master Teams
- Master Players

**Example Document:**
```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Spring Auction 2024",
  "createdBy": "user-a-id",           // ← Set on creation
  "description": "...",
  "startDate": ISODate("2024-01-15"),
  // ... other fields
}
```

### When It's Set
```typescript
// When user creates a tournament
const newTournament = await tournamentDB.create(
  { name: "New Tournament" },
  userId  // ← This becomes createdBy
);

// Creates document with:
{
  name: "New Tournament",
  createdBy: userId    // ← Automatically set
}
```

### Immutability
- ✅ Set once on creation
- ❌ Never changed afterwards
- ❌ Cannot be transferred to another user (by design)

**Reason:**
- Prevents accidental/malicious ownership changes
- Ensures resource audit trail
- Only admin can modify createdBy directly in DB (emergency cases only)

---

## User Assignment (assignedTournaments)

### What It Is
An array of tournament IDs that an admin has assigned to a user.

**Stored In:** User document

**Example:**
```javascript
{
  "_id": ObjectId("user-c-id"),
  "username": "tournament_manager",
  "role": "Tournament",
  "assignedTournaments": [
    "tournament-a-id",
    "tournament-b-id"
  ],
  // ... other fields
}
```

### How It Works

**Assignment by Admin:**
```typescript
// Admin assigns Tournament A to User C
PUT /api/users/user-c-id
{
  "assignedTournaments": ["tournament-a-id"]
}
```

**Access Check:**
```typescript
const accessible = tournaments.filter(t =>
  t.createdBy === userId ||                     // Or they created it
  assignedTournaments.includes(t._id)           // Or it's assigned
);
```

**Result:**
- User C can now see Tournament A
- User C can create teams/players in Tournament A
- User C cannot see Tournament A's details if not assigned

---

## Role-Based Access Control (RBAC)

### Roles and Capabilities

#### Admin
**Capabilities:**
- ✅ See all resources
- ✅ Create any resource
- ✅ Modify any resource
- ✅ Delete any resource
- ✅ Manage users
- ✅ Assign tournaments to users
- ✅ Transfer resource ownership

**Use Case:** System administrator

#### Tournament Manager
**Capabilities:**
- ✅ Create tournaments (becomes owner)
- ✅ See assigned tournaments
- ✅ Modify own tournaments
- ✅ Create teams/players in own tournaments
- ❌ See other users' tournaments
- ❌ Modify other users' resources
- ❌ Manage other users

**Use Case:** Tournament organizer

#### Master Manager
**Capabilities:**
- ✅ Create master teams/players
- ✅ See own master data
- ✅ Modify own master data
- ❌ See other users' master data
- ❌ Manage tournaments

**Use Case:** Content manager for shared player/team data

#### Team Manager
**Capabilities:**
- ✅ Create/manage teams (in accessible tournaments)
- ✅ See team details
- ✅ Modify own teams
- ❌ See other users' teams
- ❌ Modify other users' teams

**Use Case:** Team organizer

#### Player Manager
**Capabilities:**
- ✅ Create/manage players (in accessible tournaments)
- ✅ See player details
- ✅ Modify own players
- ❌ See other users' players
- ❌ Modify other users' players

**Use Case:** Roster manager

#### Audience
**Capabilities:**
- ✅ View auction (read-only)
- ❌ Create/modify anything
- ❌ See admin functions
- ❌ Access user management

**Use Case:** Spectator

---

## Permission Matrix

### Complete Permission Matrix

| Resource | Role | Create | Read Own | Read All | Update | Delete |
|----------|------|--------|----------|----------|--------|--------|
| Tournament | Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tournament | TournamentMgr | ✅ | ✅ | ❌ | ✅ | ✅ |
| Tournament | MasterMgr | ❌ | ❌ | ❌ | ❌ | ❌ |
| Tournament | Audience | ❌ | ✅* | ❌ | ❌ | ❌ |
| Team | Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Team | TournamentMgr | ✅ | ✅ | ❌ | ✅ | ✅ |
| Team | MasterMgr | ❌ | ❌ | ❌ | ❌ | ❌ |
| Player | Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Player | TournamentMgr | ✅ | ✅ | ❌ | ✅ | ✅ |
| MasterTeam | Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| MasterTeam | MasterMgr | ✅ | ✅ | ❌ | ✅ | ✅ |
| MasterTeam | Others | ❌ | ❌ | ❌ | ❌ | ❌ |
| User | Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| User | Others | ❌ | ✅ | ❌ | ✅* | ❌ |

*Can only see self, can only modify own password

---

## API Endpoint Security Pattern

### Standard Security Implementation

Every protected endpoint follows this pattern:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔐 LEVEL 1: AUTHENTICATION
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 🔐 LEVEL 2: AUTHORIZATION
    if (!canPerformAction(user.role, 'read', 'tournament')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 🔐 LEVEL 3: ACCESS CONTROL
    const { id } = await params;
    const resource = await resourceDB.getById(id);

    if (!resource) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (!canAccessTournament(user.userId, user.role, resource)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // ✅ All checks passed
    return NextResponse.json(resource);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## HTTP Status Codes

### 401 Unauthorized
**Meaning:** User is not authenticated

**When Returned:**
- Missing Authorization header
- Invalid JWT token
- Expired token
- Token signature doesn't match

**Cannot Fix By:** Changing permissions or ownership

**Fix:** Login again to get new token

### 403 Forbidden
**Meaning:** User is authenticated but lacks permission

**When Returned:**
- User's role doesn't allow this action
- User doesn't own this resource
- User not assigned to this tournament
- Resource doesn't exist and user can't be told that

**Cannot Fix By:** Authentication (already authenticated)

**Fix:** Get proper role, ownership, or assignment

### 404 Not Found
**Meaning:** Resource doesn't exist OR user can't access it

**Why Both?**
Security through obscurity - we don't tell user if resource exists if they can't access it.

---

## Information Security Principles

### Principle 1: Defense in Depth

**Implementation:**
- Authentication at API level ✅
- Authorization at API level ✅
- Access control at API level ✅
- Database filtering (extra layer) ✅

**Result:** Multiple layers prevent breakthrough

### Principle 2: Least Privilege

**Implementation:**
- Users only get minimum necessary access
- Admin required for system-wide actions
- Audience members can't create resources
- Master managers don't access tournaments

**Result:** Damage from compromised account is limited

### Principle 3: Fail Secure

**Implementation:**
- Default deny (not authenticated = 401)
- Unknown roles get no access
- Missing fields treated as unauthorized
- 404 returned if user can't access (don't reveal existence)

**Result:** Errors default to secure state, not open

### Principle 4: Separation of Concerns

**Implementation:**
- Authentication (JWT verification)
- Authorization (role checking)
- Access Control (resource checking)

**Result:** Each layer independent, easier to audit

### Principle 5: Audit Trail

**Implementation:**
- `createdBy` identifies resource creator
- Timestamps on all documents (via MongoDB)
- Error logging on access denials

**Result:** Can trace who created/accessed what

---

## Threat Model

### Threats We Protect Against

#### 1. Unauthorized Resource Access
**Threat:** User tries to view another user's tournament

**Protection:**
- canAccessTournament() checks ownership/assignment
- API returns 403 if not authorized
- Database filtering adds extra layer

**Result:** ✅ User cannot access resource

#### 2. Privilege Escalation
**Threat:** User tries to elevate their role to Admin

**Protection:**
- Role stored in database (not changeable by user)
- Role verified server-side on every request
- JWT token includes role but verified against DB

**Result:** ✅ Role cannot be elevated

#### 3. Token Forgery
**Threat:** User creates fake JWT token

**Protection:**
- JWT signature verified with secret key
- Cannot be forged without secret
- Signature verification happens server-side

**Result:** ✅ Forged token rejected

#### 4. Session Hijacking
**Threat:** Attacker steals user's token

**Protection:**
- HTTPS required in production (prevents interception)
- Token expires after 7 days
- If stolen, attacker has limited window
- Token validation on every request

**Result:** ✅ Time-limited exposure

#### 5. SQL/NoSQL Injection
**Threat:** User passes malicious code in request

**Protection:**
- Using Mongoose ODM with parameterized queries
- No string concatenation in queries
- Input validation on all fields

**Result:** ✅ Injected code executed safely

#### 6. Cross-Site Request Forgery (CSRF)
**Threat:** Attacker tricks user into making unwanted request

**Protection:**
- Using JWT (not session cookies)
- Stateless authentication
- Same-origin policy still applies

**Result:** ✅ CSRF protection by design

#### 7. Information Disclosure
**Threat:** Error messages reveal system details

**Protection:**
- Generic error messages: "Forbidden" not "User X doesn't have access"
- 404 returned for non-existent and unauthorized
- Detailed errors only in server logs

**Result:** ✅ Information not leaked

---

## Audit & Compliance

### Access Logging

All access attempts should be logged:

```typescript
// Example: Log access attempts
console.log({
  timestamp: new Date(),
  userId: user.userId,
  action: 'GET /api/tournaments/123',
  status: 403,
  reason: 'User not assigned to tournament'
});
```

### Data Protection

**createdBy Field:**
- ✅ Identifies who owns data
- ✅ Enables right-to-be-forgotten implementation
- ✅ Supports data deletion on user removal

**User Records:**
- ✅ Password hashed with bcrypt (10 rounds)
- ✅ Tokens expire after 7 days
- ✅ No sensitive data in logs

---

## Common Security Questions

### Q: Can admin bypass access control?
**A:** Yes, by design. Admin has complete access to everything.

**Is this a security issue?** No, if admin accounts are properly protected.

### Q: Can I transfer resource ownership?
**A:** Only admin can directly modify `createdBy` in database.

**Best practice:** Delete and recreate resource if needed.

### Q: What if someone steals a user's JWT token?
**A:** Token expires in 7 days. Shorter expiration available if needed.

### Q: Are passwords stored securely?
**A:** Yes, bcrypt with 10 salt rounds. ~0.1 seconds to hash.

### Q: Can users see each other in the system?
**A:** Only admin can see user list. Regular users only see themselves.

### Q: What happens if database is compromised?
**A:**
- Passwords are bcrypt (cannot be reversed)
- Tokens require secret key to forge
- Damage is limited to current data (no session hijacking)

---

## Recommendations

### Production Checklist

- [ ] Use HTTPS everywhere (enforced by Vercel)
- [ ] Set JWT_SECRET to strong random value
- [ ] Rotate JWT_SECRET periodically
- [ ] Monitor access logs for suspicious activity
- [ ] Keep dependencies updated
- [ ] Enable database encryption at rest
- [ ] Regular security audits
- [ ] Backup database regularly

### Future Enhancements

1. **Rate Limiting:** Prevent brute force attacks
2. **IP Whitelisting:** Restrict access by IP
3. **2FA:** Two-factor authentication for admins
4. **API Keys:** For programmatic access
5. **Audit Logs:** Detailed access history
6. **SAML/OAuth:** Enterprise authentication

---

## References

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/security-checklist/)

---

**Last Updated:** November 2024
**Status:** Production Ready ✅
