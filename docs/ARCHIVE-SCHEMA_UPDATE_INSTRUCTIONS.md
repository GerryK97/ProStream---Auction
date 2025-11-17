# Schema Update: Remove photoURL from Player

## ✅ Changes Made (Commit: 7b95d84)

### 1. Player Model Schema Updated
**File:** `src/models/Player.ts`

```typescript
// BEFORE:
photoURL: { type: String, required: false },
imageURL: { type: String, required: false },

// AFTER:
imageURL: { type: String, required: false }, // ✅ Only imageURL
```

### 2. Player Creation Updated
**File:** `src/lib/db-mongodb.ts`

```typescript
// BEFORE:
const newPlayer: Player = {
  photoURL: masterPlayer.photoURL,  // ❌ Removed
  imageURL: masterPlayer.photoURL,  // ✅ Kept
};

// AFTER:
const newPlayer: Player = {
  imageURL: masterPlayer.photoURL,  // ✅ Only imageURL
};
```

### 3. TypeScript Interface Updated
**File:** `src/types/index.ts`

```typescript
// BEFORE:
export interface Player {
  photoURL?: string;    // ❌ Removed
  imageURL?: string;    // ✅ Kept
}

// AFTER:
export interface Player {
  imageURL?: string;    // ✅ Only imageURL
}
```

---

## 🚀 IMPORTANT: Restart Development Server

The changes won't take effect until you restart the server:

```bash
# Stop the current server (Ctrl+C)

# Pull latest changes
git pull origin claude/pusher-auction-control-analysis-011CV2Tzh7YbmdDAv1LwSVQn

# Clear Next.js cache (optional but recommended)
rm -rf .next

# Restart server
npm run dev
```

---

## 🧪 Test After Restart

### 1. Add a new player to a tournament:
```
Auction Setup → Select Tournament → Add Player → Select a master player
```

### 2. Check the database document:
The newly created player should have:
```json
{
  "_id": "p1736723456789abc",
  "masterPlayerId": "PS001",
  "tournamentId": "t12345",
  "name": "Player Name",
  "imageURL": "https://...",  // ✅ Only imageURL
  // NO photoURL field         // ✅ Removed
}
```

### 3. Check console logs:
```
[playerDB.createFromMaster] Successfully created player: p1736723456789abc (Player Name)
```

---

## 📊 Expected Behavior

| Action | Before Restart | After Restart |
|--------|---------------|---------------|
| Create new player | Sets both `photoURL` and `imageURL` ❌ | Only sets `imageURL` ✅ |
| Database document | Has both fields ❌ | Only has `imageURL` ✅ |
| Schema validation | Allows both fields ❌ | Only allows `imageURL` ✅ |

---

## ⚠️ Note: Existing Database Records

**Existing players** in the database will still have `photoURL` field:
- This is **normal** and **safe**
- MongoDB doesn't auto-delete fields when you update schemas
- Old records will continue to work (backward compatible)
- **New players** created after restart will only have `imageURL`

### To clean up existing records (optional):

```javascript
// Run this in MongoDB shell or via API
db.players.updateMany(
  { photoURL: { $exists: true } },
  { $unset: { photoURL: "" } }
);
```

---

## ✅ Summary

**Current Status:**
- ✅ Code is correct (only creates `imageURL`)
- ✅ Schema is correct (only defines `imageURL`)
- ✅ TypeScript types are correct

**Action Required:**
1. **Restart development server** (required)
2. Clear `.next` cache (recommended)
3. Test by adding a new player
4. Verify only `imageURL` is created

**After restart, all new players will only have `imageURL` field!** 🎉
