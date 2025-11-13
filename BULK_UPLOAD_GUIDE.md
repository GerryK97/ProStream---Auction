# Bulk Player Upload Guide

## Overview
The bulk player upload feature allows you to import multiple master players at once using an Excel file, significantly speeding up the process of populating your player database.

## How to Use

### Step 1: Access the Feature
1. Navigate to **Manage → Players** in your application
2. Click the green **"Bulk Upload"** button at the top of the page
3. The upload panel will expand below

### Step 2: Download the Template
1. Click the **"Download Template"** button
2. An Excel file named `master_players_template.xlsx` will be downloaded
3. The template contains:
   - **Master Players sheet**: Sample data with 3 example players
   - **Instructions sheet**: Field descriptions and requirements

### Step 3: Fill in Your Data
Open the template and fill in your player data using these columns:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| Name | ✅ Yes | Full name of the player | Virat Kohli |
| Position | ✅ Yes | Player position | Batsman, Bowler, All-rounder, Wicket-keeper |
| Current Club | ✅ Yes | Current IPL or cricket team | Royal Challengers Bangalore |
| Photo URL | ❌ No | URL to player photo | https://example.com/photo.jpg |
| Matches Played | ❌ No | Total career matches | 223 |
| Total Score | ❌ No | Total career runs | 7263 |
| Total Wickets | ❌ No | Total career wickets | 145 |
| Suggested Class | ❌ No | Player class suggestion | Elite, Premium, Standard |

**Important Notes:**
- Required fields must be filled for every row
- Empty rows will be skipped
- Invalid rows will be reported in the results

### Step 4: Upload the File
1. Either drag and drop your Excel file onto the upload area, OR
2. Click **"Browse Files"** to select your file
3. Supported formats: `.xlsx`, `.xls`, `.csv`
4. Maximum file size: 10MB

### Step 5: Review Results
After upload, you'll see a detailed report showing:
- ✅ Number of players successfully imported
- ❌ Number of failed imports
- 📋 Row-specific error messages for failures
- ⚠️ Duplicate warnings with reasons

### Step 6: Fix Errors (if any)
If some players failed to import:
1. Review the error messages (includes row numbers)
2. Fix the issues in your Excel file
3. Click **"Upload Another File"** to retry
4. Only upload the fixed rows to avoid duplicates

## Features

### ✅ Validation
- **Required Fields**: Name, Position, Current Club must be filled
- **Data Types**: Numbers are validated for stats fields
- **File Format**: Only Excel/CSV files are accepted

### ✅ Duplicate Prevention
The system checks for duplicates using **Name + Position** combination:
- **Within Upload**: Prevents duplicate entries in the same file
- **Database Check**: Prevents adding players that already exist
- Comparison is **case-insensitive**

### ✅ Automatic ID Generation
- Players are automatically assigned sequential IDs: `PS001`, `PS002`, `PS003`, etc.
- IDs continue from the last player in the database
- **Batch-safe**: Multiple players in one upload get unique, sequential IDs without conflicts

### ✅ Error Reporting
Each failed row includes:
- Row number (matching your Excel file)
- Specific error message
- Reason for failure

## Common Issues & Solutions

### Issue: "Name is required"
**Solution**: Make sure the Name column is filled for all rows

### Issue: "Duplicate entry in file"
**Solution**: Remove duplicate rows from your Excel file

### Issue: "Player already exists in database"
**Solution**: This player is already in your system. Either:
- Remove them from your upload file
- Edit the existing player instead

### Issue: "Invalid file type"
**Solution**: Make sure your file has `.xlsx`, `.xls`, or `.csv` extension

### Issue: Upload shows 0 imported
**Solution**: Check that:
- Your Excel file has data (not just headers)
- Required fields are filled
- You're using the correct column names

## Technical Details

### API Endpoints
- **Upload**: `POST /api/master-players/bulk-import`
- **Template**: `GET /api/master-players/template`

### Field Mapping
Excel columns are mapped to database fields as follows:
```
Name             → name
Position         → position
Current Club     → currentClub
Photo URL        → photoURL (optional)
Matches Played   → careerStats.matchesPlayed
Total Score      → careerStats.totalScore
Total Wickets    → careerStats.totalWickets
Suggested Class  → suggestedClass (optional)
```

### Validation Rules
1. Name: Required, string, trimmed
2. Position: Required, string, trimmed
3. Current Club: Required, string, trimmed
4. Photo URL: Optional, string, trimmed
5. Stats: Optional, numbers only, default to 0
6. Suggested Class: Optional, string

### Duplicate Detection Algorithm
```
Duplicate Check = Name (case-insensitive) + Position (case-insensitive)
Example: "Virat Kohli" + "Batsman" = Unique Key
```

## Best Practices

1. **Start Small**: Test with 5-10 players first to ensure your format is correct
2. **Use Template**: Always start with the downloaded template to ensure correct formatting
3. **Check Duplicates**: Review existing players before uploading to avoid duplicates
4. **Batch Uploads**: For large datasets (100+ players), consider uploading in batches
5. **Save Your Files**: Keep your Excel files for future reference or updates
6. **Photo URLs**: Use reliable, permanent URLs for player photos (e.g., Cloudinary, AWS S3)

## Example Data

Here's a valid example row from the template:

```
Virat Kohli | Batsman | Royal Challengers Bangalore | https://example.com/virat.jpg | 223 | 7263 | 4 | Premium
```

## Support

If you encounter issues not covered in this guide:
1. Check the error messages in the upload results
2. Verify your Excel file format matches the template
3. Ensure all required fields are filled
4. Check for hidden characters or extra spaces in cells

## Feature Files

- **Backend API**: `src/app/api/master-players/bulk-import/route.ts`
- **Template Generator**: `src/app/api/master-players/template/route.ts`
- **Upload Component**: `src/components/BulkPlayerUpload.tsx`
- **Integration**: `src/components/ManagementDashboard.tsx`

---

**Last Updated**: 2025-11-13
**Feature Version**: 1.0.0
