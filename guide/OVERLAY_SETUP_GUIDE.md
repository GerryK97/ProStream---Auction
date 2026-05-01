# Overlay Library Setup Guide

This guide will help you set up the new Overlay Library system with image previews.

## What Was Changed

### 1. **Database & API**
- Created MongoDB schema for Overlay Library ([src/models/OverlayLibrary.ts](src/models/OverlayLibrary.ts))
- Created API endpoints:
  - `GET /api/overlay-library` - Fetch all overlays
  - `POST /api/overlay-library` - Create new overlay
  - `PUT /api/overlay-library/[id]` - Update overlay
  - `DELETE /api/overlay-library/[id]` - Delete overlay
  - `POST /api/overlay-library/seed` - Seed database with existing overlays

### 2. **Frontend Changes**
- Updated [OverlayDashboard.tsx](src/components/OverlayDashboard.tsx):
  - Now fetches overlays from API instead of hardcoded data
  - Replaced live iframe preview with uploaded image preview
  - Saves overlay updates to database

- Updated [OverlayEditModal.tsx](src/components/OverlayEditModal.tsx):
  - Added folder path: `prostream-auction/overlays` for uploaded images
  - Already had full upload functionality

### 3. **Image Upload**
- Images are uploaded to Cloudinary
- Stored in folder: `prostream-auction/overlays`
- Preview images persist in database

## Setup Steps

### Step 1: Ensure MongoDB Connection

Make sure your `.env.local` file has the MongoDB connection string:

```env
MONGODB_URI=your_mongodb_connection_string
```

### Step 2: Seed the Database

You need to populate the database with the existing overlay data from [OverlayDashboard.tsx](src/components/OverlayDashboard.tsx).

**Option A: Using the Seed API (Recommended)**

Create a simple script or use a REST client to POST to `/api/overlay-library/seed` with the overlay data.

**Option B: Manual Script**

Run this from your browser console after logging in:

```javascript
// Extract overlays from the hardcoded array in OverlayDashboard.tsx
// (Copy the overlayTypes array from lines 49-684)

const overlays = [/* paste overlayTypes array here */];

const token = localStorage.getItem('auth_token');

fetch('/api/overlay-library/seed', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    overlays: overlays,
    clearExisting: true
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Step 3: Upload Preview Images

1. Go to the Overlay Library page
2. Click the **Edit** button (Admin only) on any overlay
3. Click **Upload Image** or paste an image URL
4. Images will be uploaded to Cloudinary in `prostream-auction/overlays` folder
5. Click **Save Changes**

### Step 4: Test the Preview

1. Click the **View** button (eye icon) on any overlay
2. The preview modal will now show the uploaded image instead of the live overlay iframe
3. If no image is uploaded, you'll see a placeholder with instructions

## Testing Checklist

- [ ] Database seeded with overlay data
- [ ] Can view all overlays in the library
- [ ] Can edit overlay metadata (Admin only)
- [ ] Can upload image for overlay preview
- [ ] Uploaded image saves to database
- [ ] Preview modal shows uploaded image
- [ ] Changes persist after page reload
- [ ] Images stored in correct Cloudinary folder

## Workflow Summary

### For Existing Overlays
1. Admin clicks **Edit** on an overlay
2. Uploads a preview image (or pastes URL)
3. Saves changes
4. Image is stored in Cloudinary and URL saved to database
5. Clicking **View** now shows the uploaded image

### For New Overlays
1. Admin creates overlay via API (POST `/api/overlay-library`)
2. Can immediately upload preview image via Edit modal
3. Preview image appears in both table thumbnail and full preview

## Technical Details

### Database Schema
```typescript
{
  _id: string;              // Overlay ID (e.g., 'player-card')
  name: string;             // Display name
  description: string;      // Description
  route: string;            // Overlay route (e.g., '/overlays/player-card')
  tags: string[];           // Search tags
  category: string;         // Category for filtering
  defaultParams: object;    // Default URL parameters
  parameterSchema: object;  // Parameter configuration
  imageURL: string;         // Preview image URL ← NEW
  dimensions: {
    width: number;
    height: number;
  };
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### API Endpoints

**GET /api/overlay-library**
- Query params: `?category=X&tag=Y&isActive=true`
- Returns: Array of overlay objects

**POST /api/overlay-library**
- Body: Overlay object
- Returns: Created overlay

**PUT /api/overlay-library/:id**
- Body: Partial overlay object (fields to update)
- Returns: Updated overlay

**DELETE /api/overlay-library/:id**
- Returns: Success message

**POST /api/overlay-library/seed**
- Body: `{ overlays: [], clearExisting: boolean }`
- Returns: Seed result

## Troubleshooting

### Images not uploading
- Check Cloudinary credentials in `.env.local`
- Check browser console for errors
- Verify file size is under 5MB

### Database not seeding
- Ensure MongoDB connection is working
- Check user is authenticated (has valid token)
- Verify overlay data format matches schema

### Preview showing placeholder
- Overlay needs an `imageURL` set
- Use Edit modal to upload an image
- Or update via API with image URL

### Changes not persisting
- Check MongoDB connection
- Verify API endpoints are working
- Check browser console for errors

## Rollback

If you need to revert to the old system:

1. The hardcoded `overlayTypes` array is still in [OverlayDashboard.tsx](src/components/OverlayDashboard.tsx) (lines 49-684)
2. The component falls back to this array if API fails
3. You can temporarily disable API fetching by commenting out the fetch logic

## Next Steps (Optional Enhancements)

- [ ] Add bulk image upload functionality
- [ ] Add image cropping/resizing in the UI
- [ ] Add overlay duplication feature
- [ ] Add overlay import/export
- [ ] Add version history for overlays
- [ ] Add overlay usage analytics
