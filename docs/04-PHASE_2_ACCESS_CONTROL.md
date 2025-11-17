# Phase 2: Access Control Functions

## Objective
Create helper functions for granular permission checking at multiple levels (tournament, team, player, master data).

## Status
✅ Complete

---

## Overview

Created two new utility files for access control:

1. **`src/lib/request-helpers.ts`** - Extract authenticated user from requests
2. **Enhanced `src/lib/permissions.ts`** - Add access control functions

---

## Request Helpers

### File: `src/lib/request-helpers.ts`

#### Function: `getUserFromRequest()`

**Purpose:** Extract authenticated user information from JWT token in request

**Signature:**
```typescript
export async function getUserFromRequest(request: NextRequest): Promise<RequestUser | null>
```

**Returns:** User object with:
- `userId` - User's MongoDB ID
- `role` - User's role (Admin, Tournament, etc.)
- `assignedTournaments` - Array of tournament IDs assigned to user
- `assignedTeams` - Array of team IDs assigned to user

**Usage:**
```typescript
const user = await getUserFromRequest(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Error Handling:**
- Returns `null` if no token found
- Returns `null` if token is invalid/expired
- Logs errors for debugging

---

#### Function: `isAuthenticatedRequest()`

**Purpose:** Simple boolean check if request has valid authentication

**Signature:**
```typescript
export async function isAuthenticatedRequest(request: NextRequest): Promise<boolean>
```

**Usage:**
```typescript
if (!await isAuthenticatedRequest(request)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## Access Control Functions

### File: Enhanced `src/lib/permissions.ts`

#### Function: `canAccessTournament()`

**Purpose:** Check if user has access to a specific tournament

**Signature:**
```typescript
export function canAccessTournament(
  userId: string,
  userRole: string,
  tournament: any,
  assignedTournaments: string[]
): boolean
```

**Logic:**
- **Admin:** ✅ Always allowed
- **Creator:** ✅ Allowed if `tournament.createdBy === userId`
- **Assigned:** ✅ Allowed if tournament ID is in `assignedTournaments`
- **Others:** ❌ Denied

**Usage:**
```typescript
if (!canAccessTournament(userId, userRole, tournament, assignedTournaments)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

#### Function: `canAccessTeam()`

**Purpose:** Check if user has access to a specific team

**Signature:**
```typescript
export function canAccessTeam(
  userId: string,
  userRole: string,
  team: any,
  canAccessTournament: boolean
): boolean
```

**Logic:**
- **Admin:** ✅ Always allowed
- **Creator:** ✅ Allowed if `team.createdBy === userId`
- **Tournament Access:** ✅ Allowed if user has access to the team's tournament
- **Others:** ❌ Denied

**Usage:**
```typescript
const canAccessTournamentFlag = canAccessTournament(...);
if (!canAccessTeam(userId, userRole, team, canAccessTournamentFlag)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

#### Function: `canAccessPlayer()`

**Purpose:** Check if user has access to a specific player

**Signature:**
```typescript
export function canAccessPlayer(
  userId: string,
  userRole: string,
  player: any,
  canAccessTournament: boolean
): boolean
```

**Logic:**
- **Admin:** ✅ Always allowed
- **Creator:** ✅ Allowed if `player.createdBy === userId`
- **Tournament Access:** ✅ Allowed if user has access to the player's tournament
- **Others:** ❌ Denied

---

#### Function: `canAccessMasterTeam()`

**Purpose:** Check if user has access to a master team

**Signature:**
```typescript
export function canAccessMasterTeam(
  userId: string,
  userRole: string,
  masterTeam: any
): boolean
```

**Logic:**
- **Admin:** ✅ Always allowed
- **Creator:** ✅ Allowed if `masterTeam.createdBy === userId`
- **MasterManager Role:** ✅ Allowed (can see own master data)
- **Others:** ❌ Denied

---

#### Function: `canAccessMasterPlayer()`

**Purpose:** Check if user has access to a master player

**Signature:**
```typescript
export function canAccessMasterPlayer(
  userId: string,
  userRole: string,
  masterPlayer: any
): boolean
```

**Logic:**
- **Admin:** ✅ Always allowed
- **Creator:** ✅ Allowed if `masterPlayer.createdBy === userId`
- **MasterManager Role:** ✅ Allowed (can see own master data)
- **Others:** ❌ Denied

---

#### Function: `canModifyResource()`

**Purpose:** Check if user can modify (update/delete) a resource

**Signature:**
```typescript
export function canModifyResource(
  userId: string,
  userRole: string,
  resource: any
): boolean
```

**Logic:**
- **Admin:** ✅ Always allowed
- **Creator:** ✅ Allowed if `resource.createdBy === userId`
- **Others:** ❌ Denied

**Usage:**
```typescript
if (!canModifyResource(userId, userRole, team)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

#### Function: `canTransferOwnership()`

**Purpose:** Check if a user role can transfer ownership of resources

**Signature:**
```typescript
export function canTransferOwnership(userRole: string): boolean
```

**Logic:**
- **Admin:** ✅ Can transfer ownership
- **Others:** ❌ Cannot transfer ownership

**Purpose:** Prevents accidental or malicious ownership changes

---

## Permission Matrix

### By User Role

| Action | Admin | Manager | Team Lead | Player | Audience |
|--------|-------|---------|-----------|--------|----------|
| Access own resources | ✅ | ✅ | ✅ | ✅ | ❌ |
| Access assigned resources | ✅ | ✅ | ✅ | ✅ | ❌ |
| Access all tournament resources | ✅ | * | * | * | ❌ |
| Create resources | ✅ | ✅ | ✅ | ✅ | ❌ |
| Modify own resources | ✅ | ✅ | ✅ | ✅ | ❌ |
| Modify all resources | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete resources | ✅ | ✅* | ✅* | ✅* | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assign users | ✅ | ❌ | ❌ | ❌ | ❌ |

*Can only modify/delete own resources

---

## Testing Scenarios

### Access Control Tests

1. **Tournament Access**
   - [ ] Admin can access all tournaments
   - [ ] Creator can access own tournament
   - [ ] Assigned user can access tournament
   - [ ] Unassigned user cannot access tournament

2. **Team Access**
   - [ ] Admin can access all teams
   - [ ] Creator can access own team
   - [ ] User with tournament access can access team
   - [ ] Unassigned user cannot access team

3. **Master Data Access**
   - [ ] MasterManager sees only own master data
   - [ ] Admin sees all master data
   - [ ] Others cannot access master data

4. **Modification Rights**
   - [ ] Owner can modify their resource
   - [ ] Admin can modify any resource
   - [ ] Non-owner cannot modify resource

---

## Implementation Checklist

- [ ] `request-helpers.ts` created with user extraction functions
- [ ] `permissions.ts` enhanced with 7 new access control functions
- [ ] All functions have TypeScript type safety
- [ ] Functions handle edge cases (null/undefined values)
- [ ] No circular dependencies between modules
- [ ] Unit tests for permission logic (optional but recommended)

---

## Integration Points

### Where These Functions Are Used

1. **API Endpoints** (Phase 4)
   - All GET endpoints use `canAccessX()` functions
   - All PUT/DELETE endpoints use `canModifyResource()`

2. **Database Filtering** (Phase 3)
   - User-scoped methods use these rules to filter results

3. **User Management** (Phase 5)
   - Tournament assignment UI respects role-based permissions

---

## Error Responses

### Standard HTTP Status Codes

- **401 Unauthorized:** No valid authentication token
- **403 Forbidden:** User lacks permission for this action
- **404 Not Found:** Resource doesn't exist OR user cannot access it

**Note:** 404 is returned instead of 403 when resource doesn't exist to prevent information leakage.

---

## Next Steps

→ **[Phase 3: Database Filtering Methods](./PHASE_3_DATABASE_FILTERING.md)**

Implement user-scoped database queries that automatically filter results based on user permissions.

---

**Phase Status:** ✅ Complete and Deployed
**Build Status:** ✅ Passing
**Last Updated:** November 2024
