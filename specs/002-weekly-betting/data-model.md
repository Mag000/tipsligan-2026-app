# Data Model: Weekly Stryktipset Betting

**Feature**: 002-weekly-betting
**Date**: 2026-02-20
**Purpose**: Define entities, relationships, and TypeScript types for betting feature

---

## Entity Overview

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      Round      │───┬───│      Match      │       │      User       │
│  (Stryktipset)  │   │   │  (13 per round) │       │   (existing)    │
└─────────────────┘   │   └─────────────────┘       └─────────────────┘
                      │                                     │
                      │   ┌─────────────────┐               │
                      └───│       Bet       │───────────────┘
                          │ (User's picks)  │
                          └─────────────────┘
```

---

## Entity: Round

A Stryktipset betting round from Svenska Spel containing 13 football matches.

| Field         | Type              | Description                                | Source           |
| ------------- | ----------------- | ------------------------------------------ | ---------------- |
| `drawNumber`  | number            | Unique identifier for the round            | Svenska Spel API |
| `drawComment` | string            | Description (e.g., "Stryktipset Omgång 7") | Svenska Spel API |
| `openTime`    | string (ISO 8601) | When betting opens                         | Svenska Spel API |
| `closeTime`   | string (ISO 8601) | Deadline for betting                       | Svenska Spel API |
| `drawState`   | string            | Current state (e.g., "Open", "Closed")     | Svenska Spel API |
| `matches`     | Match[]           | Array of 13 matches                        | Svenska Spel API |

**Validation Rules**:

- `drawNumber` must be positive integer
- `closeTime` must be after `openTime`
- `matches` array must contain exactly 13 items

---

## Entity: Match

A single football match within a round.

| Field         | Type              | Description                             | Source                                            |
| ------------- | ----------------- | --------------------------------------- | ------------------------------------------------- |
| `eventNumber` | number            | Position in round (1-13)                | Svenska Spel API                                  |
| `homeTeam`    | string            | Home team name                          | Svenska Spel API `participants[type="home"].name` |
| `awayTeam`    | string            | Away team name                          | Svenska Spel API `participants[type="away"].name` |
| `league`      | string            | League name                             | Svenska Spel API `league.name`                    |
| `kickoffTime` | string (ISO 8601) | Match start time                        | Svenska Spel API `sportEventStart`                |
| `status`      | MatchStatus       | Current status                          | Svenska Spel API `sportEventStatus`               |
| `result`      | Outcome \| null   | Final result (1/X/2) when finished      | Svenska Spel Result API                           |
| `score`       | string \| null    | Final score (e.g., "2-1") when finished | Svenska Spel Result API                           |

**Validation Rules**:

- `eventNumber` must be 1-13
- `homeTeam` and `awayTeam` must be non-empty strings
- `result` is null until match is finished

---

## Entity: Bet

A user's predictions for a round.

| Field         | Type              | Description                            | Source            |
| ------------- | ----------------- | -------------------------------------- | ----------------- |
| `id`          | string (UUID)     | Unique bet identifier                  | Backend generated |
| `userId`      | string (UUID)     | Reference to User                      | Auth token        |
| `roundNumber` | number            | Reference to Round.drawNumber          | User selection    |
| `selections`  | BetSelection[]    | Array of 13 predictions                | User input        |
| `submittedAt` | string (ISO 8601) | When bet was submitted/updated         | Backend timestamp |
| `isComplete`  | boolean           | Whether all 13 matches have selections | Derived           |

**Validation Rules**:

- `selections` array must have 13 items for submission
- All selections must be valid outcomes ('1', 'X', '2')
- Cannot submit after `Round.closeTime`
- One bet per user per round (update replaces previous)

---

## Entity: BetSelection

A single prediction within a bet.

| Field         | Type    | Description                           |
| ------------- | ------- | ------------------------------------- |
| `matchNumber` | number  | Reference to Match.eventNumber (1-13) |
| `outcome`     | Outcome | User's prediction ('1', 'X', or '2')  |

---

## Type: Outcome

```typescript
type Outcome = "1" | "X" | "2";
```

| Value | Meaning       |
| ----- | ------------- |
| `'1'` | Home team win |
| `'X'` | Draw          |
| `'2'` | Away team win |

---

## Type: MatchStatus

```typescript
type MatchStatus =
  | "scheduled"
  | "in_progress"
  | "finished"
  | "cancelled"
  | "postponed";
```

---

## Redux State Shape

```typescript
interface BettingState {
  // Current round data
  currentRound: Round | null;
  currentRoundLoading: boolean;
  currentRoundError: string | null;

  // User's draft selections (before submit)
  draftSelections: Record<number, Outcome>; // matchNumber -> outcome

  // User's submitted bet for current round
  submittedBet: Bet | null;
  submittedBetLoading: boolean;

  // Submission state
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;

  // Historical rounds (for US4)
  historicalRounds: Record<number, Round>; // roundNumber -> Round
  historicalBets: Record<number, Bet>; // roundNumber -> Bet
}
```

---

## TypeScript Types (types/betting.ts)

```typescript
// Core types
export type Outcome = "1" | "X" | "2";
export type MatchStatus =
  | "scheduled"
  | "in_progress"
  | "finished"
  | "cancelled"
  | "postponed";

// Match within a betting round
export interface BettingMatch {
  eventNumber: number; // 1-13
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffTime: string; // ISO 8601
  status: MatchStatus;
  result?: Outcome; // Set when finished
  score?: string; // e.g., "2-1"
}

// Betting round
export interface BettingRound {
  drawNumber: number;
  drawComment: string;
  openTime: string; // ISO 8601
  closeTime: string; // ISO 8601
  drawState: string;
  matches: BettingMatch[];
}

// Single selection in a bet
export interface BetSelection {
  matchNumber: number; // 1-13
  outcome: Outcome;
}

// User's complete bet
export interface UserBet {
  id: string;
  userId: string;
  roundNumber: number;
  selections: BetSelection[];
  submittedAt: string; // ISO 8601
  isComplete: boolean;
}

// Request payload for submitting a bet
export interface SubmitBetRequest {
  roundNumber: number;
  selections: BetSelection[];
}

// Response from submit endpoint
export interface SubmitBetResponse {
  success: boolean;
  bet: UserBet;
  message?: string;
}

// Redux state
export interface BettingState {
  currentRound: BettingRound | null;
  currentRoundLoading: boolean;
  currentRoundError: string | null;

  draftSelections: Record<number, Outcome>;

  submittedBet: UserBet | null;
  submittedBetLoading: boolean;

  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;

  historicalRounds: Record<number, BettingRound>;
  historicalBets: Record<number, UserBet>;
}
```

---

## Mapping from Svenska Spel API

| Frontend Field             | Svenska Spel API Path                                          |
| -------------------------- | -------------------------------------------------------------- |
| `BettingMatch.eventNumber` | `draw.events[].eventNumber`                                    |
| `BettingMatch.homeTeam`    | `draw.events[].participants.find(p => p.type === 'home').name` |
| `BettingMatch.awayTeam`    | `draw.events[].participants.find(p => p.type === 'away').name` |
| `BettingMatch.league`      | `draw.events[].league.name`                                    |
| `BettingMatch.kickoffTime` | `draw.events[].sportEventStart`                                |
| `BettingMatch.status`      | `draw.events[].sportEventStatus`                               |
| `BettingRound.drawNumber`  | `draw.drawNumber`                                              |
| `BettingRound.closeTime`   | `draw.closeTime`                                               |

---

## State Transitions

### Bet Lifecycle

```
[No Bet] ──select──> [Draft] ──submit──> [Submitted]
                        │                    │
                        │                    │ modify+submit
                        ▼                    ▼
                     [Draft] <──load───── [Submitted]

                     (if before deadline)
```

### Round Lifecycle

```
[Loading] ──success──> [Active] ──deadline──> [Closed] ──results──> [Finished]
    │                                                                    │
    └──error──> [Error]                                                  │
                                                    [Show results + user performance]
```
