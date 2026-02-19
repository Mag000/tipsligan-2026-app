# Standings Table Debug Guide

## Problem

No standings table is showing on the Standings page.

## Quick Diagnosis Steps

### 1. Check Browser Console (F12)

Open the Standings page and look for these console messages:

#### Expected Messages (Success):

```
📊 Calculating standings from base stats...
🔍 Base stats state: { baseStats: [...], baseStatsLength: X, ... }
📦 Using X base stat records
🏆 Using new (2021+) ranking algorithm
✅ Calculated standings for X players
```

#### Problem Messages:

```
⚠️ No base stats available
⏳ Waiting for base stats to load...
❌ Failed to calculate standings: [error]
```

### 2. Check Redux State

In browser console, type:

```javascript
// Check if Redux store has base stats
window.store = require("./store/store").default;
console.log("Base stats:", window.store.getState().baseStats);
```

Or use Redux DevTools extension to inspect:

- Go to Redux tab
- Look for `baseStats` state
- Check if `stats` array has data

### 3. Visual Debug Info

The page now shows debug information when no standings are displayed:

- **Base stats**: Number of records
- **Loading**: Whether data is still loading
- **Error**: Any error messages
- **Sample stat**: First stat record (if data exists)

## Common Issues & Solutions

### Issue 1: Base Stats Not Loaded

**Symptoms:**

- Debug shows "Base stats: 0 records"
- Console shows "⚠️ No base stats available"

**Solution:**
Check if `fetchBaseStatsForCurrentYear` is being called in `App.tsx`:

```typescript
// Should be in App.tsx useEffect
dispatch(fetchBaseStatsForCurrentYear(String(user.userId)));
```

**Quick Fix:**

1. Check `src/App.tsx` line 29
2. Verify user is logged in (userId exists)
3. Check network tab for `/basestats` API call

### Issue 2: Base Stats Loading Forever

**Symptoms:**

- Debug shows "Loading: Yes"
- Console shows "⏳ Waiting for base stats to load..."

**Solution:**
Check network tab for failed API call:

1. F12 → Network tab
2. Filter: "basestats"
3. Check status code (should be 200)
4. Check response body

### Issue 3: No Rounds for Current Year

**Symptoms:**

- Console shows "⚠️ No rounds found for year 2025"
- Base stats request not made

**Solution:**
Check if rounds exist for 2025:

```javascript
// In browser console
console.log("Rounds:", window.store.getState().rounds.rounds);
// Look for rounds with year: 2025 or 2026
```

If no rounds for 2025, the app might need to fetch 2024 or 2026 data instead.

### Issue 4: Wrong Data Structure

**Symptoms:**

- Base stats loaded but standings still empty
- Console shows data but calculation fails

**Solution:**
Check the structure of base stats:

```javascript
// Should have these fields per stat:
{
  userName: "Player Name",
  correctCount: 10,
  correctSafeCount: 2,
  single1Bets: 5,
  // ... etc
}
```

## Manual Test Commands

### Test in Browser Console:

```javascript
// 1. Import service
import { StandingsCalculationService } from "./services/StandingsCalculationService";

// 2. Get base stats from Redux
const baseStats = window.store.getState().baseStats.stats;
console.log("Base stats count:", baseStats.length);

// 3. Try to calculate manually
const standings = StandingsCalculationService.calculateStandings(
  baseStats,
  true
);
console.log("Calculated standings:", standings);
```

## Check API Response Format

### Expected Base Stats Format:

```json
[
  {
    "userName": "Player1",
    "userId": "guid-here",
    "roundNumber": 4933,
    "correctCount": 10,
    "correctSafeCount": 2,
    "single1Bets": 5,
    "single1Hits": 3,
    "singleXBets": 3,
    "singleXHits": 1,
    "single2Bets": 5,
    "single2Hits": 4,
    "hedge12Bets": 0,
    "hedge12Hits": 0,
    "hedge1XBets": 0,
    "hedge1XHits": 0,
    "hedgeX2Bets": 0,
    "hedgeX2Hits": 0,
    "total1Bets": 5,
    "total1Hits": 3,
    "totalXBets": 3,
    "totalXHits": 1,
    "total2Bets": 5,
    "total2Hits": 4,
    "totalBets": 13
  }
]
```

## Temporary Fix: Use Mock Data

If you need to test the UI without real data, you can temporarily add mock data in `Standings.tsx`:

```typescript
// In calculateStandings function, add at the top:
const mockStats = [
  {
    userName: "Test Player 1",
    correctCount: 45,
    correctSafeCount: 12,
    single1Bets: 20,
    single1Hits: 15,
    singleXBets: 10,
    singleXHits: 8,
    single2Bets: 15,
    single2Hits: 12,
    hedge12Bets: 0,
    hedge12Hits: 0,
    hedge1XBets: 0,
    hedge1XHits: 0,
    hedgeX2Bets: 0,
    hedgeX2Hits: 0,
    total1Bets: 20,
    total1Hits: 15,
    totalXBets: 10,
    totalXHits: 8,
    total2Bets: 15,
    total2Hits: 12,
    totalBets: 45,
  },
  // Add more mock players...
];

// Use mock data for testing
const calculatedStandings = StandingsCalculationService.calculateStandings(
  mockStats, // Use this instead of baseStats
  useNewRanking
);
```

## Next Steps

1. **Open Standings page** in browser
2. **Open DevTools** (F12)
3. **Check Console tab** for debug messages
4. **Check Debug Info** shown on the page
5. **Report back** what you see

### What to Report:

- Number of base stats records: \_\_\_
- Loading status: \_\_\_
- Error message (if any): \_\_\_
- Sample stat data (if available): \_\_\_
- Console log messages: \_\_\_

## Quick Reference

| Symptom                | Likely Cause           | Fix                                 |
| ---------------------- | ---------------------- | ----------------------------------- |
| "0 records"            | Base stats not fetched | Check App.tsx, verify API call      |
| "Loading: Yes" forever | API call failed        | Check Network tab, verify endpoint  |
| Data but no table      | Calculation error      | Check console for error stack trace |
| Wrong year data        | Year mismatch          | Verify rounds have current year     |
