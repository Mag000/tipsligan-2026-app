# Standings Year Filter Fix

## Problem

The standings page showed **0 base stats records** even though 2025 data exists in the database.

## Root Cause

The year filtering logic in `baseStatsSlice.ts` was **case-sensitive** and only checked lowercase property names:

- Checked: `round.year`, `round.date`, `round.drawDate`, `round.startDate`
- **Missing**: `round.Year`, `round.Date`, `round.DrawDate`, `round.StartDate`, etc.

The API returns rounds with **uppercase property names** (e.g., `Year`, `RoundNumber`, `Date`), but the filter was only looking for lowercase versions.

## Solution

Updated both `fetchBaseStatsForCurrentYear` and `fetchBaseStatsForYear` functions to handle **both lowercase and uppercase** property names.

### Changes Made

#### 1. Year Extraction - Now Checks Both Cases

```typescript
// OLD - Only lowercase
const roundYear =
  round.year ||
  (round.date ? new Date(round.date).getFullYear() : null) ||
  (round.drawDate ? new Date(round.drawDate).getFullYear() : null) ||
  (round.startDate ? new Date(round.startDate).getFullYear() : null);

// NEW - Both lowercase and uppercase
const roundYear =
  round.year ||
  round.Year ||
  (round.date ? new Date(round.date).getFullYear() : null) ||
  (round.Date ? new Date(round.Date).getFullYear() : null) ||
  (round.drawDate ? new Date(round.drawDate).getFullYear() : null) ||
  (round.DrawDate ? new Date(round.DrawDate).getFullYear() : null) ||
  (round.startDate ? new Date(round.startDate).getFullYear() : null) ||
  (round.StartDate ? new Date(round.StartDate).getFullYear() : null);
```

#### 2. Round ID Extraction - Now Checks All Variants

```typescript
// OLD - Limited property checks
round.roundNumber || round.id || round.roundId || round.round;

// NEW - All known variants
round.roundNumber ||
  round.RoundNumber ||
  round.id ||
  round.Id ||
  round.roundId ||
  round.RoundId ||
  round.round ||
  round.Round ||
  round.SPRoundNum ||
  round.spRoundNum;
```

#### 3. Added Debug Logging

```typescript
// Log first round structure to diagnose issues
if (allRounds.length > 0) {
  console.log("🔍 Sample round structure:", allRounds[0]);
}

// Show available years in the data
const yearsFound = allRounds
  .map(
    (round: any) =>
      round.year ||
      round.Year ||
      (round.date ? new Date(round.date).getFullYear() : null) ||
      (round.Date ? new Date(round.Date).getFullYear() : null)
  )
  .filter((year: any) => year !== null);
const uniqueYears = Array.from(new Set(yearsFound));
console.log(`📅 Available years in rounds:`, uniqueYears);

// Log extracted round IDs
console.log(`🔢 Extracted ${roundIds.length} round IDs:`, roundIds);
```

#### 4. Added Warning for Rounds Without Year

```typescript
if (!roundYear) {
  console.log("⚠️ Could not determine year for round:", round);
}
```

## Testing

After this fix, the Standings page should now:

1. ✅ Successfully find rounds for year 2025
2. ✅ Extract correct round IDs (uppercase properties)
3. ✅ Fetch base stats for those rounds
4. ✅ Display the standings table

## Debug Console Output

You should now see:

```
📊 Fetching base stats for year 2025...
📦 Using X rounds from cache
🔍 Sample round structure: { RoundNumber: 1, Year: 2025, ... }
📅 Available years in rounds: [2025]
✅ Found X rounds for year 2025
🔢 Extracted X round IDs: [1, 2, 3, ...]
✅ Retrieved base stats for X rounds in 2025
```

## Files Modified

- `src/store/slices/baseStatsSlice.ts`
  - `fetchBaseStatsForCurrentYear()` - Lines ~50-90
  - `fetchBaseStatsForYear()` - Lines ~130-170

## Why This Happened

The C# backend API returns JSON with **PascalCase** property names (e.g., `RoundNumber`, `Year`), but the TypeScript code was written assuming **camelCase** (e.g., `roundNumber`, `year`).

The `Round` interface in `roundsSlice.ts` correctly defines both cases, but the filter logic wasn't using them.
