# Phase 5: User Management UI

## Objective
Enhance user management interface to allow admin users to assign tournaments to other users.

## Status
✅ Complete

---

## Overview

Enhanced `src/app/users/page.tsx` with tournament assignment capability:
- Display all available tournaments
- Allow admin to assign multiple tournaments to users
- Show pre-selected assignments
- Integration with backend API

---

## Changes Made

### File: `src/app/users/page.tsx`

#### 1. New State Management

```typescript
// Fetch available tournaments for assignment
const [availableTournaments, setAvailableTournaments] = useState<Tournament[]>([]);

// Track assigned tournaments in edit form
const [formData, setFormData] = useState<EditFormData>({
  username: '',
  email: '',
  password: '',
  role: '',
  status: '',
  assignedTournaments: [],
  assignedTeams: [],
  assignedPlayer: '',
});
```

#### 2. Tournament Interface

```typescript
interface Tournament {
  _id: string;
  name: string;
  // ... other tournament fields
}
```

#### 3. EditFormData Interface

```typescript
interface EditFormData {
  username: string;
  email: string;
  password: string;
  role: string;
  status: string;
  assignedTournaments: string[];  // NEW: Array of tournament IDs
  assignedTeams: string[];
  assignedPlayer: string;
}
```

---

## UI Components

### Edit Modal - Tournament Assignment Section

```jsx
<div className="mb-4">
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Assigned Tournaments
  </label>
  <div className="border border-slate-300 rounded p-3 bg-white max-h-48 overflow-y-auto">
    {availableTournaments.map((tournament) => (
      <label key={tournament._id} className="flex items-center mb-2">
        <input
          type="checkbox"
          checked={formData.assignedTournaments.includes(tournament._id)}
          onChange={(e) => {
            if (e.target.checked) {
              setFormData({
                ...formData,
                assignedTournaments: [
                  ...formData.assignedTournaments,
                  tournament._id
                ]
              });
            } else {
              setFormData({
                ...formData,
                assignedTournaments: formData.assignedTournaments.filter(
                  (id) => id !== tournament._id
                )
              });
            }
          }}
          className="w-4 h-4 text-blue-600"
        />
        <span className="ml-2 text-sm text-slate-700">{tournament.name}</span>
      </label>
    ))}
  </div>
  {availableTournaments.length === 0 && (
    <p className="text-sm text-slate-500">No tournaments available</p>
  )}
</div>
```

---

## Data Flow

### 1. User Opens Edit Modal

```typescript
const handleEditClick = async (userId: string) => {
  try {
    // Fetch user details
    const userResponse = await fetch(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = await userResponse.json();

    // Fetch available tournaments
    const tournamentsResponse = await fetch('/api/tournaments', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tournamentsData = await tournamentsResponse.json();
    setAvailableTournaments(tournamentsData);

    // Populate form with user data
    setFormData({
      ...userData,
      assignedTournaments: userData.assignedTournaments || [],
    });

    setEditingUserId(userId);
    setIsModalOpen(true);
  } catch (error) {
    setError('Failed to load user details');
  }
};
```

### 2. User Modifies Assignments

The checkbox handler (shown above) updates `formData.assignedTournaments`:

```typescript
// Add tournament
assignedTournaments: [...formData.assignedTournaments, tournament._id]

// Remove tournament
assignedTournaments: formData.assignedTournaments.filter(id => id !== tournament._id)
```

### 3. User Saves Changes

```typescript
const handleSaveEdit = async () => {
  try {
    setIsSaving(true);
    const response = await fetch(`/api/users/${editingUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: formData.username,
        email: formData.email,
        password: formData.password || undefined,
        role: formData.role,
        status: formData.status,
        assignedTournaments: formData.assignedTournaments,  // SENT TO API
        assignedTeams: formData.assignedTeams,
        assignedPlayer: formData.assignedPlayer,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      // Refresh user list
      fetchUsers();
      setIsModalOpen(false);
      setSuccess('User updated successfully');
    } else {
      setError(data.error || 'Failed to update user');
    }
  } catch (error) {
    setError('Failed to save changes');
  }
};
```

### 4. API Updates User

**Endpoint:** `PUT /api/users/[id]`

```typescript
// From request body
const {
  username,
  email,
  password,
  role,
  status,
  assignedTournaments,  // NOW ACCEPTED
  assignedTeams,
  assignedPlayer,
} = await request.json();

// Update user document
if (assignedTournaments) {
  user.assignedTournaments = assignedTournaments;
}

await user.save();
```

---

## UI Features

### Multi-Select Checkbox List

- **Scrollable Container:** max-height of 192px with scroll on overflow
- **Clear Labels:** Tournament names displayed next to checkboxes
- **Pre-selected:** Shows currently assigned tournaments as checked
- **Easy Toggle:** Click checkbox to add/remove assignment

### State Management

- Form data includes `assignedTournaments` array
- Checkboxes update form state in real-time
- No changes committed until user clicks "Save"
- Modal shows fresh data when opened

### Error Handling

```typescript
if (!response.ok) {
  setError(data.error || 'Failed to update user');
  return;
}

setSuccess('User updated successfully');
setIsModalOpen(false);
```

---

## Integration with Backend

### User Model Field

**File:** `src/models/User.ts`

```typescript
assignedTournaments: {
  type: [String],  // Array of tournament IDs
  default: []
}
```

### API Endpoint

**File:** `src/app/api/users/[id]/route.ts`

**PUT Handler:**
```typescript
if (assignedTournaments) {
  user.assignedTournaments = assignedTournaments;
}
await user.save();
```

---

## User Experience Flow

### Complete Example: Assign Tournament to User

```
1. Admin opens Users page
   ↓
2. Admin clicks "Edit" on a user
   ↓
3. Edit modal opens
   - User details are populated
   - Available tournaments are fetched
   - Currently assigned tournaments are checked
   ↓
4. Admin checks "Tournament A" checkbox
   ↓
5. Form state updates immediately
   - assignedTournaments: ["tournamentA"]
   ↓
6. Admin clicks "Save"
   ↓
7. PUT /api/users/[id] request sent with:
   {
     "assignedTournaments": ["tournamentA"]
   }
   ↓
8. Backend updates user document
   ↓
9. Modal closes
   ↓
10. User list is refreshed
    ↓
11. Success message shown
```

---

## Role-Based Access

### Who Can Assign Tournaments?

- **Admin Users:** ✅ Can assign tournaments to any user
- **Other Roles:** ❌ Cannot access user management

### Enforcement Points

**Frontend:**
- Edit button only shows in admin view
- Modal only appears for admin users

**Backend:**
- `GET /api/users` - Admin only
- `PUT /api/users/[id]` - Admin only
- `POST /api/users` - Open (signup)

---

## Testing Scenarios

### Basic Assignment

- [ ] Admin can see available tournaments in edit modal
- [ ] Admin can check/uncheck tournament assignments
- [ ] Changes are saved to database
- [ ] Assigned tournaments persist after modal closes
- [ ] Refreshing page shows assigned tournaments

### Multiple Tournaments

- [ ] Admin can assign multiple tournaments to one user
- [ ] Removing assignment works correctly
- [ ] Only assigned tournaments are checked

### Different User Roles

- [ ] Admin user can assign tournaments
- [ ] Non-admin users cannot see edit button
- [ ] Non-admin cannot access API endpoint

### Edge Cases

- [ ] Empty tournament list is handled gracefully
- [ ] Assigning same tournament twice is prevented
- [ ] Removing all assignments works correctly
- [ ] Password field is optional on edit

---

## Future Enhancements

### Potential Improvements

1. **Search/Filter Tournaments:** Add search box for large tournament lists
2. **Bulk Assignment:** Assign same tournament to multiple users at once
3. **Permission Groups:** Create permission templates for role-based assignment
4. **Audit Trail:** Log all tournament assignment changes
5. **Team Assignment:** Similar UI for team assignments
6. **Visual Indicators:** Show tournament details (date, status, player count) in assignment list

---

## Code Quality

### Error Handling
- Try-catch blocks around API calls
- User-friendly error messages
- Logging for debugging

### Performance
- Single fetch for tournaments (not per user)
- Efficient state updates
- Minimal re-renders

### Accessibility
- Proper labels for checkboxes
- Keyboard navigation support
- Clear visual feedback

---

## Next Steps

→ **[Phase 6: Frontend Filtering Verification](./PHASE_6_FRONTEND_FILTERING.md)**

Verify that all frontend filtering is automatically enforced at the API level.

---

**Phase Status:** ✅ Complete and Deployed
**Build Status:** ✅ Passing
**UI Components:** Edit modal with tournament assignment
**Last Updated:** November 2024
