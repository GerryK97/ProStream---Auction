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

---

## Bulk Add Players to Tournament (with Short Codes)

### Overview
This feature allows you to quickly add multiple players from the master registry to a specific tournament, with support for **short codes** to reduce typo errors when assigning player classes.

### How to Use

#### Step 1: Access the Feature
1. Navigate to **Auction Setup** for your tournament
2. Go to the **Players** tab
3. Click the green **"Bulk Add"** button
4. The bulk add modal will open

#### Step 2: Download Template
1. Click **"Download Template with Available Players"**
2. An Excel file will be downloaded containing:
   - **Available Players sheet**: All master players NOT yet in this tournament
   - **Instructions sheet**: Detailed guide with short code reference

#### Step 3: Fill in Your Data
The template includes these columns:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| Master Player ID | ✅ Auto-filled | Unique ID from master registry | PS001 |
| Name | ✅ Auto-filled | Player name (read-only reference) | Virat Kohli |
| Position | Read-only | Player position | Batsman |
| Current Club | Read-only | Current team | RCB |
| Matches | Read-only | Career matches played | 223 |
| Score | Read-only | Career total score | 7263 |
| Wickets | Read-only | Career wickets | 4 |
| Add (Yes/No) | ✅ Yes | Set to "Yes" to add this player | Yes, No |
| Player Class | ✅ Yes* | Player class for this tournament | P, G, S, B, Platinum, Gold, etc. |

\* Required only if tournament uses player classes

#### Step 4: Use Short Codes for Player Classes 🎯

**Instead of typing full class names, use short codes to reduce typos!**

| Short Code | Full Class Name | Alternative Codes |
|------------|----------------|-------------------|
| **P** | Platinum | Plat, platinum |
| **Pr** | Premium | Prem, premium |
| **G** | Gold | gold |
| **S** | Silver | Sil, silver |
| **St** | Standard | Std, standard |
| **B** | Bronze | Bro, bronze |
| **D** | Diamond | Dia, diamond |
| **E** | Elite | elite |

**Key Benefits:**
- ✅ **Case-insensitive**: "P", "p", "Plat", "PLAT" all work
- ✅ **Faster data entry**: Type 1 character instead of 8+
- ✅ **Fewer typos**: No more "Platnium" or "Premum" errors
- ✅ **Automatic resolution**: Short codes are converted to proper class names

**Examples:**
```
Row 1: Master Player ID=PS001, Add=Yes, Player Class=P       → Resolves to "Platinum"
Row 2: Master Player ID=PS002, Add=Yes, Player Class=g       → Resolves to "Gold"
Row 3: Master Player ID=PS003, Add=Yes, Player Class=Sil     → Resolves to "Silver"
Row 4: Master Player ID=PS004, Add=Yes, Player Class=Bronze  → Exact match works too!
```

#### Step 5: Upload and Review
1. Drag and drop or browse to select your filled template
2. Click **"Add Players to Tournament"**
3. Review the results:
   - ✅ Successfully added players
   - ❌ Failed players with specific error messages
   - ⚠️ Skipped players (Add=No or duplicates)

### Features

#### ✅ Smart Short Code Resolution
- Supports multiple variations per class
- Case-insensitive matching
- Falls back to exact match if short code not found
- Clear error messages if invalid code used

#### ✅ Duplicate Prevention
- Players already in the tournament are automatically detected
- Prevents adding the same player twice
- Shows clear "Already Added" warnings

#### ✅ Data Validation
- Required fields: Master Player ID, Name, Add (Yes/No)
- Player Class required only if tournament uses classes
- Player Class must match tournament's configured classes
- Invalid classes show available options + short codes in error

### Common Issues & Solutions

#### Issue: "Invalid Player Class 'Platnium'"
**Solution**: Use the short code "P" instead, or check spelling

#### Issue: "Player Class is required for this tournament"
**Solution**: This tournament uses player classes. Enter a class or short code in the Player Class column

#### Issue: "Already added to tournament"
**Solution**: This player is already in the tournament. They will be skipped automatically

#### Issue: Short code "P" not working
**Solution**: Make sure your tournament actually has a "Platinum" class configured. The short code must map to an existing class

### Best Practices for Tournament Bulk Add

1. **Use Short Codes**: Always use short codes (P, G, S, B) instead of typing full names
2. **Review Template**: Check the Instructions sheet for your tournament's specific classes
3. **Set Add=Yes**: Only set to "Yes" for players you want to add (default is "No")
4. **Keep Default Classes**: The template pre-fills suggested classes based on master player data
5. **Test First**: Try adding 3-5 players first before bulk adding all

### Technical Details

**API Endpoints:**
- **Upload**: `POST /api/players/bulk-add-to-tournament`
- **Template**: `GET /api/players/tournament-bulk-template?tournamentId={id}`

**Short Code Resolution Algorithm:**
1. Trim and normalize input to lowercase
2. Check for exact match (case-insensitive) with tournament classes
3. If no exact match, lookup in short code map
4. Find first matching class from possible mappings
5. Return resolved class name or null if no match

**Field Mapping:**
```
Master Player ID → masterPlayerId (required)
Name             → Validation reference (auto-filled)
Add (Yes/No)     → Controls if player is added
Player Class     → playerClass (resolved from short code)
```

### Example Usage

**Scenario**: Adding 5 players to a tournament with classes: Platinum, Gold, Silver, Bronze

**Excel File:**
```
Master Player ID | Name          | Add | Player Class
PS001           | Virat Kohli   | Yes | P
PS002           | MS Dhoni      | Yes | p
PS003           | R. Sharma     | Yes | G
PS004           | J. Bumrah     | Yes | plat
PS005           | R. Jadeja     | No  | S
```

**Result:**
- PS001: Added as Platinum ✅
- PS002: Added as Platinum ✅ (lowercase "p" works)
- PS003: Added as Gold ✅
- PS004: Added as Platinum ✅ ("plat" resolves to Platinum)
- PS005: Skipped ⚠️ (Add=No)

## Support

If you encounter issues not covered in this guide:
1. Check the error messages in the upload results
2. Verify your Excel file format matches the template
3. Ensure all required fields are filled
4. Check for hidden characters or extra spaces in cells
5. For short code issues, verify the class exists in your tournament configuration

## Feature Files

### Master Player Bulk Upload
- **Backend API**: `src/app/api/master-players/bulk-import/route.ts`
- **Template Generator**: `src/app/api/master-players/template/route.ts`
- **Upload Component**: `src/components/BulkPlayerUpload.tsx`
- **Integration**: `src/components/ManagementDashboard.tsx`

### Tournament Player Bulk Add (with Short Codes)
- **Backend API**: `src/app/api/players/bulk-add-to-tournament/route.ts`
- **Template Generator**: `src/app/api/players/tournament-bulk-template/route.ts`
- **Upload Component**: `src/components/BulkAddTournamentPlayers.tsx`
- **Integration**: `src/components/AuctionSetupPanel.tsx`

---

**Last Updated**: 2025-11-15
**Feature Version**: 1.1.0 (Added short code support for player classes)
