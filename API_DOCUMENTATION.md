# API Documentation

## Base URL
```
http://localhost:3001/api
```

---

## Tournaments API

### Get All Tournaments
```
GET /api/tournaments
```

**Response:**
```json
[
  {
    "_id": "t1",
    "name": "LPL 2025",
    "year": 2025,
    "company": "Default Company",
    "budgetPerTeam": 500000,
    "squadSize": 5,
    "basePricePerPlayer": 5000,
    "logoURL": "https://...",
    "status": "Draft"
  }
]
```

### Get Tournament by ID
```
GET /api/tournaments/:id
```

### Create Tournament
```
POST /api/tournaments
Content-Type: application/json

{
  "name": "Tournament Name",
  "year": 2025,
  "company": "Company Name",
  "budgetPerTeam": 500000,
  "squadSize": 10,
  "basePricePerPlayer": 5000,
  "logoURL": "https://..."
}
```

### Update Tournament
```
PUT /api/tournaments/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "Live"
}
```

### Delete Tournament
```
DELETE /api/tournaments/:id
```

---

## Teams API

### Get All Teams
```
GET /api/teams
```

**Response:**
```json
[
  {
    "_id": "team1",
    "tournamentId": "t1",
    "name": "Team Name",
    "shortCode": "TN",
    "ownerName": "Owner",
    "initialBudget": 10000000,
    "currentBalance": 10000000,
    "playersPurchased": [],
    "logoURL": "https://...",
    "primaryColor": "#FF0000",
    "secondaryColor": "#0000FF"
  }
]
```

### Get Team by ID
```
GET /api/teams/:id
```

### Create Team
```
POST /api/teams
Content-Type: application/json

{
  "name": "Team Name",
  "shortCode": "TN",
  "ownerName": "Owner Name",
  "logoURL": "https://..."
}
```

### Update Team
```
PUT /api/teams/:id
Content-Type: application/json

{
  "name": "Updated Team Name",
  "ownerName": "New Owner"
}
```

### Delete Team
```
DELETE /api/teams/:id
```

---

## Players API

### Get All Players
```
GET /api/players
```

**Response:**
```json
[
  {
    "_id": "p1",
    "tournamentId": "t1",
    "name": "Player Name",
    "stats": {
      "matchesPlayed": 50,
      "totalScore": 1200,
      "totalWickets": 5
    },
    "imageURL": "https://...",
    "isSold": false
  }
]
```

### Get Player by ID
```
GET /api/players/:id
```

### Create Player
```
POST /api/players
Content-Type: application/json

{
  "name": "Player Name",
  "stats": {
    "matchesPlayed": 50,
    "totalScore": 1200,
    "totalWickets": 5
  },
  "imageURL": "https://..."
}
```

### Update Player
```
PUT /api/players/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "stats": {
    "matchesPlayed": 60,
    "totalScore": 1500,
    "totalWickets": 8
  }
}
```

### Delete Player
```
DELETE /api/players/:id
```

---

## Testing Endpoints

You can test the API endpoints using:

### cURL Example
```bash
# Get all tournaments
curl http://localhost:3001/api/tournaments

# Create a tournament
curl -X POST http://localhost:3001/api/tournaments \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Tournament","year":2025,"budgetPerTeam":500000,"squadSize":10,"basePricePerPlayer":5000}'

# Update a tournament
curl -X PUT http://localhost:3001/api/tournaments/t1 \
  -H "Content-Type: application/json" \
  -d '{"status":"Live"}'

# Delete a tournament
curl -X DELETE http://localhost:3001/api/tournaments/t1
```

### Postman/Insomnia
Import the following collection or create requests manually:

**Base URL:** `http://localhost:3001/api`

**Endpoints:**
- GET `/tournaments`
- POST `/tournaments`
- GET `/tournaments/:id`
- PUT `/tournaments/:id`
- DELETE `/tournaments/:id`
- GET `/teams`
- POST `/teams`
- GET `/teams/:id`
- PUT `/teams/:id`
- DELETE `/teams/:id`
- GET `/players`
- POST `/players`
- GET `/players/:id`
- PUT `/players/:id`
- DELETE `/players/:id`

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `404` - Not Found
- `500` - Internal Server Error

---

## Frontend Integration

The API is integrated with the management pages using the API client:

```typescript
import { tournamentsAPI, teamsAPI, playersAPI } from '@/lib/api-client';

// Example usage
const tournaments = await tournamentsAPI.getAll();
const newTournament = await tournamentsAPI.create(data);
await tournamentsAPI.update(id, data);
await tournamentsAPI.delete(id);
```

---

## Data Persistence

**Current:** In-memory storage (data resets on server restart)
**Production:** Replace with database (MongoDB, PostgreSQL, etc.)

To add database persistence:
1. Update `src/lib/db.ts` with actual database connections
2. Replace in-memory arrays with database queries
3. Add proper connection pooling and error handling

---

## Security Notes

**For Production:**
- Add authentication middleware
- Implement rate limiting
- Add input validation and sanitization
- Use environment variables for sensitive data
- Enable CORS properly
- Add request logging
- Implement API versioning

---

## Next Steps

1. ✅ API routes created
2. ✅ In-memory database configured
3. ✅ API client utility created
4. 🔄 Connect frontend to API (in progress)
5. ⏳ Add authentication
6. ⏳ Replace with real database
7. ⏳ Add WebSocket for real-time updates
