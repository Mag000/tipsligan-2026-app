# API Contract: Weekly Betting

**Feature**: 002-weekly-betting
**Date**: 2026-02-20
**Base URL**: `/api`
**Authentication**: Bearer token in `Authorization` header

---

## Overview

This contract defines the frontend-backend API for the weekly betting feature. Existing endpoints are already implemented; this document confirms their contract and defines any new endpoints needed.

---

## Endpoints

### 1. Get Current Round Info

Fetch the current active Stryktipset round with all 13 matches.

**Endpoint**: `GET /drawInfo/{roundNumber}`
**Status**: ✅ Existing (APIManager.getSvenskaSpelDrawInfo)

**Request**:

```http
GET /api/drawInfo/1234
Authorization: Bearer <token>
```

**Response**: `200 OK`

```json
{
  "draw": {
    "drawNumber": 1234,
    "drawComment": "Stryktipset Omgång 7",
    "openTime": "2026-02-17T00:00:00Z",
    "closeTime": "2026-02-22T15:59:00Z",
    "drawState": "Open",
    "events": [
      {
        "eventNumber": 1,
        "sportEventStart": "2026-02-22T16:00:00Z",
        "sportEventStatus": "scheduled",
        "participants": [
          { "type": "home", "name": "AIK" },
          { "type": "away", "name": "Djurgården" }
        ],
        "league": {
          "name": "Allsvenskan"
        }
      }
      // ... 12 more events
    ]
  }
}
```

**Error Responses**:

- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Round not found
- `500 Internal Server Error` - Backend error

---

### 2. Get User's Bet for Round

Fetch the current user's bet for a specific round.

**Endpoint**: `GET /bets/{roundNumber}/user`
**Status**: ✅ Existing (APIManager.getUserBetsForRound)

**Request**:

```http
GET /api/bets/1234/user
Authorization: Bearer <token>
```

**Response**: `200 OK`

```json
[
  {
    "Id": "uuid-string",
    "aspnet_UsersUserId": "user-uuid",
    "RoundNo": 1234,
    "Match1": "1",
    "Match2": "X",
    "Match3": "2",
    // ... Match4-Match13
    "SubmittedAt": "2026-02-20T14:30:00Z"
  }
]
```

**Notes**:

- Returns array (may be empty if no bet)
- Frontend filters by userId
- Fields Match1-Match13 contain '1', 'X', or '2'

---

### 3. Submit/Update Bet

Submit a new bet or update existing bet for a round.

**Endpoint**: `POST /bets/{roundNumber}`
**Status**: 🆕 New or update existing

**Request**:

```http
POST /api/bets/1234
Authorization: Bearer <token>
Content-Type: application/json

{
  "selections": [
    { "matchNumber": 1, "outcome": "1" },
    { "matchNumber": 2, "outcome": "X" },
    { "matchNumber": 3, "outcome": "2" },
    // ... all 13 selections
  ]
}
```

**Response**: `200 OK` (update) or `201 Created` (new)

```json
{
  "success": true,
  "bet": {
    "id": "uuid-string",
    "userId": "user-uuid",
    "roundNumber": 1234,
    "selections": [
      { "matchNumber": 1, "outcome": "1" }
      // ... all 13
    ],
    "submittedAt": "2026-02-20T14:30:00Z",
    "isComplete": true
  },
  "message": "Bet saved successfully"
}
```

**Error Responses**:

- `400 Bad Request` - Invalid selections or incomplete bet
  ```json
  {
    "success": false,
    "message": "All 13 matches must have selections",
    "missingMatches": [5, 9]
  }
  ```
- `403 Forbidden` - Deadline passed
  ```json
  {
    "success": false,
    "message": "Betting deadline has passed"
  }
  ```
- `401 Unauthorized` - Invalid or missing token
- `500 Internal Server Error` - Backend error

**Validation**:

- Must include exactly 13 selections
- Each outcome must be '1', 'X', or '2'
- Server validates deadline (closeTime)
- Upsert behavior: creates new or updates existing bet

---

### 4. Get Round Results

Fetch results for a completed round.

**Endpoint**: `GET /drawResult/{roundNumber}`
**Status**: ✅ Existing (APIManager.getSvenskaSpelDrawResult)

**Request**:

```http
GET /api/drawResult/1234
Authorization: Bearer <token>
```

**Response**: `200 OK`

```json
{
  "result": {
    "drawNumber": 1234,
    "events": [
      {
        "eventNumber": 1,
        "outcome": "2",
        "outcomeScore": "1-2",
        "cancelled": false
      }
      // ... 12 more events
    ]
  }
}
```

---

### 5. Get Available Rounds

Fetch list of available rounds for dropdown selection.

**Endpoint**: `GET /draws`
**Status**: ✅ Existing (APIManager.getSvenskaSpelDraws)

---

## Type Definitions (Backend DTO)

### SubmitBetRequestDTO (.NET)

```csharp
public record SubmitBetRequestDTO
{
    public required List<BetSelectionDTO> Selections { get; init; }
}

public record BetSelectionDTO
{
    public required int MatchNumber { get; init; }  // 1-13
    public required string Outcome { get; init; }   // "1", "X", "2"
}
```

### SubmitBetResponseDTO (.NET)

```csharp
public record SubmitBetResponseDTO
{
    public required bool Success { get; init; }
    public required UserBetDTO Bet { get; init; }
    public string? Message { get; init; }
}

public record UserBetDTO
{
    public required string Id { get; init; }
    public required string UserId { get; init; }
    public required int RoundNumber { get; init; }
    public required List<BetSelectionDTO> Selections { get; init; }
    public required DateTime SubmittedAt { get; init; }
    public required bool IsComplete { get; init; }
}
```

---

## Frontend Service Methods (APIManager.ts)

### New Method: submitBet

```typescript
static async submitBet(
  roundNumber: number,
  selections: BetSelection[],
  signal?: AbortSignal
): Promise<SubmitBetResponse> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/bets/${roundNumber}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ selections }),
    signal
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit bet');
  }

  return await response.json();
}
```

---

## Request Deduplication

Per Constitution Principle VI, the following caching applies:

| Endpoint                | Cache Key                   | TTL               | Invalidation                 |
| ----------------------- | --------------------------- | ----------------- | ---------------------------- |
| GET /drawInfo/{round}   | `drawInfo-{round}`          | Until page unload | Manual refresh               |
| GET /bets/{round}/user  | `userBets-{round}-{userId}` | Until submit      | On successful submit         |
| POST /bets/{round}      | N/A (mutations not cached)  | N/A               | N/A                          |
| GET /drawResult/{round} | `drawResult-{round}`        | Indefinite        | Never (results don't change) |

---

## Sequence Diagram

```
User                    Frontend                   Backend                Svenska Spel
 │                         │                          │                        │
 │  Navigate to /betting   │                          │                        │
 │────────────────────────>│                          │                        │
 │                         │                          │                        │
 │                         │  GET /drawInfo/{round}   │                        │
 │                         │─────────────────────────>│                        │
 │                         │                          │  GET /api/stryktipset  │
 │                         │                          │───────────────────────>│
 │                         │                          │<───────────────────────│
 │                         │<─────────────────────────│                        │
 │                         │                          │                        │
 │                         │  GET /bets/{round}/user  │                        │
 │                         │─────────────────────────>│                        │
 │                         │<─────────────────────────│                        │
 │                         │                          │                        │
 │   Display matches       │                          │                        │
 │<────────────────────────│                          │                        │
 │                         │                          │                        │
 │   Select outcomes       │                          │                        │
 │────────────────────────>│                          │                        │
 │   (local state update)  │                          │                        │
 │                         │                          │                        │
 │   Click Submit          │                          │                        │
 │────────────────────────>│                          │                        │
 │                         │  POST /bets/{round}      │                        │
 │                         │─────────────────────────>│                        │
 │                         │                          │  (validate + save)     │
 │                         │<─────────────────────────│                        │
 │                         │                          │                        │
 │   Show confirmation     │                          │                        │
 │<────────────────────────│                          │                        │
```
