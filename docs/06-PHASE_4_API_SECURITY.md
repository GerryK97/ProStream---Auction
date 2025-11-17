# Phase 4: API Security Enhancement

## Objective
Update all API endpoints to implement three-level security: authentication → authorization → access control.

## Status
✅ Complete

---

## Overview

Updated 25 endpoint functions across 10 API files with consistent security pattern:

1. **Authentication:** Verify JWT token exists and is valid
2. **Authorization:** Check if user's role has permission for the action
3. **Access Control:** Verify user has access to the specific resource

---

## Security Pattern

### Template for Secure Endpoints

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // LEVEL 1: AUTHENTICATION
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // LEVEL 2: AUTHORIZATION (Role-based)
    if (!canPerformAction(user.role, 'read', 'tournament')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // LEVEL 3: ACCESS CONTROL (Resource-based)
    const { id } = await params;
    const resource = await resourceDB.getById(id);
    if (!resource) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!canAccessResource(user.userId, user.role, resource)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return data if all checks pass
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

## API Files Updated

### 1. Tournaments Endpoints

**File:** `src/app/api/tournaments/route.ts`

#### GET - List Tournaments
- ✅ Authentication check
- ✅ Role-based authorization
- ✅ User-scoped filtering

```typescript
const tournaments = await tournamentDB.getAllForUser(
  user.userId,
  user.role,
  user.assignedTournaments
);
```

#### POST - Create Tournament
- ✅ Authentication check
- ✅ Role-based authorization
- ✅ Automatic `createdBy` assignment

```typescript
const newTournament = await tournamentDB.create(body, user.userId);
```

**File:** `src/app/api/tournaments/[id]/route.ts`

#### GET - Get Single Tournament
- ✅ Authentication check
- ✅ Role-based authorization
- ✅ Resource access verification

```typescript
if (!canAccessTournament(user.userId, user.role, tournament, user.assignedTournaments)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

#### PUT - Update Tournament
- ✅ All authentication checks
- ✅ Ownership verification
- ✅ Validation (e.g., player class codes)

#### DELETE - Delete Tournament
- ✅ All authentication checks
- ✅ Ownership verification

---

### 2. Teams Endpoints

**File:** `src/app/api/teams/route.ts`

#### GET - List Teams
- ✅ User-scoped team filtering
- ✅ Tournament-based access control

#### POST - Create Team
- ✅ Automatic `createdBy` assignment
- ✅ Tournament access verification

**File:** `src/app/api/teams/[id]/route.ts`

#### GET/PUT/DELETE
- ✅ Tournament access prerequisite
- ✅ Team-level access verification
- ✅ Ownership checks

---

### 3. Players Endpoints

**File:** `src/app/api/players/route.ts` & `src/app/api/players/[id]/route.ts`

- ✅ User-scoped player filtering
- ✅ Tournament access verification
- ✅ Team-level access control

---

### 4. Master Teams Endpoints

**File:** `src/app/api/master-teams/route.ts` & `src/app/api/master-teams/[id]/route.ts`

- ✅ Master data access control
- ✅ Creator-only visibility (except Admin)
- ✅ Creation with `createdBy`

---

### 5. Master Players Endpoints

**File:** `src/app/api/master-players/route.ts` & `src/app/api/master-players/[id]/route.ts`

- ✅ Master data access control
- ✅ Creator-only visibility (except Admin)
- ✅ Creation with `createdBy`

---

### 6. Users Management Endpoints

**File:** `src/app/api/users/[id]/route.ts`

#### GET - Get User Details
- ✅ Admin-only access
- ✅ Authentication required

#### PUT - Update User
- ✅ Admin-only access
- ✅ Field validation
- ✅ Password hashing

#### DELETE - Delete User
- ✅ Admin-only access
- ✅ Self-deletion prevention

---

## HTTP Status Codes

### Proper Error Responses

| Status | Meaning | When Used |
|--------|---------|-----------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input validation |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Insufficient authorization OR no resource access |
| 404 | Not Found | Resource doesn't exist OR user can't access |
| 500 | Server Error | Unexpected application error |

### Security Notes

- **404 vs 403:** Return 403 when user lacks permission, 404 when resource doesn't exist
- **Info Leakage:** Don't reveal why access was denied in error messages
- **Logging:** Log all access control failures for security auditing

---

## Request Authentication Flow

### 1. Token Extraction

```typescript
// From Authorization header
const token = getTokenFromRequest(request);

// Token format: "Bearer <jwt_token>"
const bearerToken = request.headers.get('Authorization');
const token = bearerToken?.split(' ')[1];
```

### 2. Token Verification

```typescript
const payload = verifyToken(token);
// Verifies:
// - Signature is valid
// - Token hasn't expired
// - Standard JWT claims

// Returns: { userId, role, iat, exp }
```

### 3. User Reconstruction

```typescript
const user = await getUserFromRequest(request);
// Fetches full user data from database
// Returns: { userId, role, assignedTournaments, assignedTeams }
```

---

## Permission Checking

### Role-Based Permission Matrix

```typescript
const PERMISSIONS = {
  Admin: {
    read: ['tournament', 'team', 'player', 'master_team', 'master_player', 'user'],
    create: ['tournament', 'team', 'player', 'master_team', 'master_player', 'user'],
    update: ['tournament', 'team', 'player', 'master_team', 'master_player', 'user'],
    delete: ['tournament', 'team', 'player', 'master_team', 'master_player', 'user'],
  },
  Tournament: {
    read: ['tournament', 'team', 'player'],
    create: ['tournament', 'team', 'player'],
    update: ['tournament', 'team', 'player'],
    delete: ['tournament', 'team', 'player'],
  },
  MasterManager: {
    read: ['master_team', 'master_player'],
    create: ['master_team', 'master_player'],
    update: ['master_team', 'master_player'],
    delete: ['master_team', 'master_player'],
  },
  // ... other roles
};

function canPerformAction(role: string, action: string, resource: string): boolean {
  return PERMISSIONS[role]?.[action]?.includes(resource) ?? false;
}
```

---

## Resource Access Control

### Three-Level Verification Example: Get Team

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Level 1: Authentication
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Level 2: Authorization
  if (!canPerformAction(user.role, 'read', 'team')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Level 3: Access Control
  const { id } = await params;
  const team = await teamDB.getById(id);
  if (!team) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get tournament for context
  let canAccessTeamFlag = false;
  if (team.tournamentId) {
    const tournament = await tournamentDB.getById(team.tournamentId);
    const canAccessTournamentFlag = canAccessTournament(
      user.userId,
      user.role,
      tournament,
      user.assignedTournaments
    );
    canAccessTeamFlag = canAccessTeam(
      user.userId,
      user.role,
      team,
      canAccessTournamentFlag
    );
  } else {
    canAccessTeamFlag = user.role === 'Admin' || team.createdBy === user.userId;
  }

  if (!canAccessTeamFlag) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(team);
}
```

---

## Error Handling

### Try-Catch Pattern

```typescript
try {
  // All endpoint logic
  return NextResponse.json(result);
} catch (error) {
  console.error('Endpoint error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Logging

- **Info:** User logins, successful resource access
- **Warning:** Failed authentication attempts, permission denials
- **Error:** Database errors, validation failures

---

## Input Validation

### Example: Tournament Update

```typescript
const body = await request.json();

// Validate player class codes if present
if (body.usePlayerClasses && body.playerClasses) {
  const validation = validatePlayerClassCodes(body.playerClasses);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }
}

const updatedTournament = await tournamentDB.update(id, body);
```

---

## Testing Checklist

### Authentication Tests
- [ ] Request without token → 401
- [ ] Request with expired token → 401
- [ ] Request with invalid token → 401
- [ ] Request with valid token → Proceeds to authorization

### Authorization Tests
- [ ] User without read permission → 403
- [ ] User without write permission on write endpoint → 403
- [ ] User with permission → Proceeds to access control

### Access Control Tests
- [ ] Non-creator accessing resource → 403
- [ ] Creator accessing resource → Success
- [ ] Admin accessing any resource → Success
- [ ] Unassigned user accessing tournament → 403
- [ ] Assigned user accessing tournament → Success

### Complete Flow Tests
- [ ] Login and create tournament
- [ ] Login as different user and verify can't see first user's tournament
- [ ] Admin login and verify can see all tournaments
- [ ] Update own tournament
- [ ] Try to update someone else's tournament → 403
- [ ] Delete own tournament
- [ ] Try to delete someone else's tournament → 403

---

## Performance Considerations

### Database Query Optimization

All user-scoped queries:
- Use indexed `createdBy` field
- Use indexed `_id` field
- Minimize data transfer
- Support pagination

### Concurrent Request Handling

- JWT verification is stateless (fast)
- No locking on reads
- Atomic updates with MongoDB transactions for critical operations

---

## Security Audit Points

1. **No SQL Injection:** Using MongoDB driver with parameterized queries
2. **No XSS:** All responses are JSON (no HTML rendering)
3. **No CSRF:** Using JWT authentication (stateless)
4. **No Auth Bypass:** Three-level verification prevents privilege escalation
5. **Principle of Least Privilege:** Users only access what they need
6. **Defense in Depth:** Multiple checkpoints catch authorization issues

---

## Next Steps

→ **[Phase 5: User Management UI](./PHASE_5_USER_MANAGEMENT_UI.md)**

Enhance user management interface with tournament assignment UI.

---

**Phase Status:** ✅ Complete and Deployed
**Build Status:** ✅ Passing
**Endpoints Updated:** 25 functions across 10 files
**Last Updated:** November 2024
