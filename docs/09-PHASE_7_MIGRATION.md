# Phase 7: Data Migration

## Objective
Create and execute an idempotent migration script to backfill the `createdBy` field for existing resources.

## Status
✅ Complete

---

## Overview

Migration script backfills the `createdBy` field for all existing resources that were created before the multi-user access control system was implemented.

**Key Features:**
- Idempotent (safe to run multiple times)
- No data loss
- Simple and transparent
- Works offline (uses direct database connection)

---

## Migration Script

### File: `scripts/migrate-add-created-by.ts`

#### Purpose
Assigns ownership of all existing resources without `createdBy` to the first admin user in the system.

#### How It Works

```typescript
// 1. Connect to MongoDB
await connectToDatabase();

// 2. Find first admin user
const admin = await User.findOne({ role: 'Admin' });

// 3. Update all resources without createdBy
const tournamentsResult = await TournamentModel.updateMany(
  { createdBy: { $exists: false } },      // Find docs without createdBy
  { $set: { createdBy: adminId } }        // Set it to admin
);

// 4. Repeat for teams, players, master data
```

---

## Running the Migration

### Prerequisites

1. MongoDB connection must be configured
2. At least one admin user must exist
3. Database must be accessible

### Command

```bash
# Option 1: Using ts-node
npx ts-node scripts/migrate-add-created-by.ts

# Option 2: Using tsx (faster)
npx tsx scripts/migrate-add-created-by.ts
```

### Environment Setup

Ensure `.env.local` or `.env` contains:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
```

---

## Migration Output

### Sample Console Output

```
🔄 Starting migration: Adding createdBy field to existing resources...

📦 Connecting to MongoDB...
✓ Connected to MongoDB

👤 Finding admin user...
✓ Found admin user: admin123 (ID: 507f1f77bcf86cd799439011)

📋 Migrating tournaments...
✓ Updated 5 tournaments

🏛️  Migrating teams...
✓ Updated 12 teams

👥 Migrating players...
✓ Updated 48 players

🏛️  Migrating master teams...
✓ Updated 3 master teams

👥 Migrating master players...
✓ Updated 15 master players

════════════════════════════════════════════════════════════════
✅ Migration completed successfully!
════════════════════════════════════════════════════════════════

Total resources migrated: 83

Summary:
  • Tournaments: 5
  • Teams: 12
  • Players: 48
  • Master Teams: 3
  • Master Players: 15

All resources without createdBy have been assigned to admin: admin123

⚠️  Note: This migration is idempotent and safe to run multiple times.
```

---

## What Gets Migrated

### 1. Tournaments
**Table:** `tournaments` (or equivalent collection)

**Before:**
```json
{
  "_id": "tournament-1",
  "name": "Spring Tournament 2024",
  "createdBy": undefined
}
```

**After:**
```json
{
  "_id": "tournament-1",
  "name": "Spring Tournament 2024",
  "createdBy": "admin-user-id"
}
```

**Count:** Updates all tournaments without `createdBy` field

---

### 2. Teams
**Count:** Updates all teams without `createdBy` field

**Before:**
```json
{
  "_id": "team-1",
  "name": "Team A",
  "tournamentId": "tournament-1",
  "createdBy": undefined
}
```

**After:**
```json
{
  "_id": "team-1",
  "name": "Team A",
  "tournamentId": "tournament-1",
  "createdBy": "admin-user-id"
}
```

---

### 3. Players
**Count:** Updates all players without `createdBy` field

---

### 4. Master Teams
**Count:** Updates all master teams without `createdBy` field

**Purpose:** Master data shared across tournaments

---

### 5. Master Players
**Count:** Updates all master players without `createdBy` field

**Purpose:** Master data shared across tournaments

---

## Idempotency

### Safe to Run Multiple Times

The migration is **idempotent** - running it multiple times is safe:

```
First Run:
- Documents without createdBy: 83
- Updates: 83
- Documents with createdBy after: 83

Second Run:
- Documents without createdBy: 0 (already have createdBy)
- Updates: 0
- No changes made
```

**Result:** No duplicate updates, no data loss

---

## Database Query Details

### Tournament Update Query

```mongodb
db.tournaments.updateMany(
  { createdBy: { $exists: false } },
  { $set: { createdBy: "507f1f77bcf86cd799439011" } }
)
```

**Logic:**
- `$exists: false` → Find documents where field doesn't exist
- `$set` → Add the field with the value

### Verification Query

```mongodb
// Count documents with createdBy
db.tournaments.countDocuments({ createdBy: { $exists: true } })

// Count documents without createdBy
db.tournaments.countDocuments({ createdBy: { $exists: false } })
```

---

## Error Handling

### If Admin User Not Found

**Error Message:**
```
❌ Error: No admin user found. Please create an admin user first.
```

**Solution:**
1. Create an admin user first
2. Run migration again

**Create Admin User:**
```bash
# Via API
POST /api/auth/signup
{
  "username": "admin",
  "password": "SecurePassword123",
  "role": "Admin"
}
```

---

### If Database Connection Fails

**Error Message:**
```
❌ Migration failed with error:
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
1. Ensure MongoDB is running
2. Check MONGODB_URI in environment
3. Verify network connectivity

---

### If Script Crashes

**Recovery:**
```bash
# The migration is idempotent - safe to run again
npx tsx scripts/migrate-add-created-by.ts
```

No need to manually fix anything - the script will:
1. Find which documents already have `createdBy`
2. Skip those documents
3. Only update documents that still need it

---

## Before and After Access Control

### Before Migration

```
Resource without createdBy
  ↓
User tries to access
  ↓
canModifyResource() returns false (because createdBy is missing)
  ↓
User gets 403 Forbidden
  ✗ User cannot access their own resource
```

### After Migration

```
Resource with createdBy = admin
  ↓
User tries to access
  ↓
canModifyResource() checks:
  - Is user admin? YES
  ✓ User can access
```

**Note:** Only admin can access migrated resources initially. Reassign ownership if needed:

```typescript
// Update a specific resource's ownership
await tournamentDB.update(tournamentId, {
  createdBy: newUserId
});
```

---

## When to Run Migration

### Timing

1. **Right after deploying Phase 1-3 code:** Before users try to access existing resources
2. **In staging environment first:** Test thoroughly
3. **Then in production:** Run against live database
4. **Multiple times is safe:** Can run anytime without issues

### Recommended Schedule

1. Deploy code changes
2. Run migration in staging
3. Verify data integrity
4. Run migration in production
5. Verify all resources are accessible

---

## Verification After Migration

### Check Database

```mongodb
// Count migrated tournaments
db.tournaments.countDocuments({ createdBy: { $exists: true } })

// Show example
db.tournaments.findOne({ _id: ObjectId("...") })
```

### Test in Application

1. Login as admin
2. List all resources
3. Verify all existing resources appear
4. Test creating new resources

---

## Troubleshooting

### Problem: "No admin user found"

**Cause:** No users in database or no users with `role: 'Admin'`

**Solution:**
```bash
# Create admin user via signup
POST /api/auth/signup
{
  "username": "admin",
  "password": "AdminPassword123"
}

# Then update role to Admin in database
db.users.updateOne(
  { username: "admin" },
  { $set: { role: "Admin" } }
)
```

### Problem: "Cannot connect to MongoDB"

**Cause:** Database not running or connection string incorrect

**Solution:**
```bash
# Verify MongoDB is running
mongosh

# Check environment variables
echo $MONGODB_URI

# Update .env if needed
MONGODB_URI=mongodb://localhost:27017/prostream
```

### Problem: Partial migration (some resources updated)

**Cause:** Script interrupted during execution

**Solution:** Just run again - it will only update remaining documents

---

## Performance Characteristics

### Estimated Migration Times

| Collection | Typical Count | Time |
|-----------|--------------|------|
| Tournaments | 10-100 | < 1 second |
| Teams | 50-500 | < 1 second |
| Players | 200-2000 | 1-2 seconds |
| Master Teams | 10-100 | < 1 second |
| Master Players | 50-500 | < 1 second |
| **Total** | 320-3,100 | **2-5 seconds** |

**Note:** Actual time depends on database size and network latency

---

## Rollback (If Needed)

### Reverse Migration

If you need to remove the `createdBy` field:

```typescript
// Remove createdBy field
db.tournaments.updateMany(
  {},
  { $unset: { createdBy: "" } }
);
```

**Warning:** This removes access control - only do if reverting to old system.

---

## After Migration Checklist

- [ ] Migration script ran successfully
- [ ] No errors in console output
- [ ] Total count matches expectations
- [ ] Database contains createdBy values
- [ ] Access control checks work
- [ ] Admin can see all resources
- [ ] Users see only their resources
- [ ] New resources get createdBy assigned

---

## Migration in CI/CD Pipeline

### Automated Migration

```yaml
# .github/workflows/deploy.yml
- name: Run Migration
  run: npx tsx scripts/migrate-add-created-by.ts
  env:
    MONGODB_URI: ${{ secrets.MONGODB_URI_PROD }}
```

### Manual Trigger

```bash
# Run locally before deployment
npx tsx scripts/migrate-add-created-by.ts

# Or via deployment tools
vercel env pull
npx tsx scripts/migrate-add-created-by.ts
```

---

## Next Steps

→ **[Deployment Guide](../GUIDES/DEPLOYMENT_GUIDE.md)**

Deploy the complete multi-user access control system to production.

---

**Phase Status:** ✅ Complete and Executed
**Resources Migrated:** Typically 200-3000+ records
**Migration Time:** 2-5 seconds (typical)
**Idempotent:** ✅ Yes - Safe to run multiple times
**Last Updated:** November 2024
