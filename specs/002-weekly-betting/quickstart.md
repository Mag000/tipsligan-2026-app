# Quickstart: Weekly Stryktipset Betting

**Feature**: 002-weekly-betting
**Date**: 2026-02-20
**Purpose**: Manual testing scenarios to validate implementation

---

## Prerequisites

1. **Backend running** at `http://localhost:52259`
2. **Frontend running** at `http://localhost:3000` (via `npm run dev`)
3. **Valid user account** (login credentials)
4. **Active Stryktipset round** (check Svenska Spel for current draw number)

---

## Test Scenario 1: View Current Round (US1)

**Goal**: Verify user can view all 13 matches with details

### Steps

1. Login with valid credentials
2. Navigate to `/betting` route
3. Observe loading spinner during data fetch

### Expected Results

- [ ] Page shows 13 match cards
- [ ] Each card displays: match number (1-13), home team, away team, kickoff time
- [ ] Deadline countdown is visible at top
- [ ] No console errors
- [ ] Network tab shows only 1 call to `/drawInfo/{round}` (no duplicates)

### Mobile Test

1. Open Chrome DevTools, set responsive mode to iPhone SE (375px)
2. Verify all matches visible via scrolling
3. Verify touch targets (1/X/2 buttons) are at least 44x44px

---

## Test Scenario 2: Place a Bet (US2)

**Goal**: Verify user can select predictions and submit

### Steps

1. Complete Scenario 1 (viewing matches)
2. For each match, tap one of the 1/X/2 buttons
3. Observe visual selection state change
4. After selecting all 13, tap Submit button

### Expected Results

- [ ] Selected button shows primary/highlighted appearance
- [ ] Summary shows "13 of 13 selected"
- [ ] Submit button enabled when all selected
- [ ] Confirmation message appears after submit
- [ ] Network tab shows 1 POST to `/bets/{round}`
- [ ] Console shows no duplicate requests

### Partial Selection Test

1. Select only 10 of 13 matches
2. Tap Submit button
3. Expected: Error message indicating missing matches

---

## Test Scenario 3: View and Edit Existing Bet (US3)

**Goal**: Verify previously submitted bet loads and can be modified

### Steps

1. Complete Scenario 2 (submit a bet)
2. Navigate away from betting page (e.g., go to Home)
3. Navigate back to `/betting`
4. Observe that previous selections are pre-filled
5. Change 2-3 selections
6. Submit again

### Expected Results

- [ ] Returning to page shows previously submitted selections
- [ ] Modified selections can be submitted
- [ ] Confirmation shows "Bet updated"
- [ ] Only 1 GET request to `/bets/{round}/user` (deduplication)

---

## Test Scenario 4: Deadline Enforcement

**Goal**: Verify betting is blocked after deadline

### Steps (Simulated)

1. For this test, modify frontend to use a past deadline (temporary)
2. Or wait for an actual deadline to pass
3. Attempt to submit a bet

### Expected Results

- [ ] Submit button is disabled
- [ ] Message indicates "Betting closed for this round"
- [ ] 1/X/2 buttons may still be tappable (for review) but submit blocked

---

## Test Scenario 5: Past Round Results (US4)

**Goal**: Verify completed rounds show results

### Steps

1. Navigate to betting page
2. Select a past/completed round from dropdown (if available)
3. View results

### Expected Results

- [ ] Final scores displayed (e.g., "2-1")
- [ ] Correct outcome highlighted (1/X/2)
- [ ] User's prediction shown alongside actual result
- [ ] Correct/incorrect indicator (✓ or ✗)
- [ ] Summary "X of 13 correct"

---

## Test Scenario 6: Error Handling

**Goal**: Verify graceful error handling

### Network Error Test

1. Open DevTools, go to Network tab
2. Enable "Offline" mode
3. Navigate to `/betting`

**Expected**:

- [ ] Loading spinner appears
- [ ] Error message displays (e.g., "Unable to load round data")
- [ ] No crash or blank screen
- [ ] Retry button available

### API Error Test

1. Stop backend server
2. Navigate to `/betting`

**Expected**:

- [ ] User-friendly error message
- [ ] No stack traces or technical details shown to user

---

## Test Scenario 7: Mobile One-Handed Operation (SC-006)

**Goal**: Verify thumb-reachable UI

### Steps

1. Hold phone in right hand (thumb at bottom-right)
2. Complete full betting flow using only thumb

### Expected Results

- [ ] All 1/X/2 buttons reachable
- [ ] Submit button at bottom of screen (no scrolling to find it)
- [ ] Deadline/header viewable by scrolling up briefly
- [ ] Flow completable in under 2 minutes

---

## Performance Verification

### Page Load Time (SC-003)

1. Open DevTools > Network > throttle to "Slow 3G"
2. Hard refresh `/betting` page
3. Time from request start to fully rendered

**Target**: <3 seconds

### Duplicate Request Check (SC-005)

1. Open DevTools > Network
2. Navigate to `/betting`
3. Count requests to `/drawInfo/{round}`

**Target**: Exactly 1 request (not 2+)

---

## Checklist Summary

| Scenario                | US     | Status |
| ----------------------- | ------ | ------ |
| View 13 matches         | US1    | ☐      |
| Mobile responsive       | US1    | ☐      |
| Select predictions      | US2    | ☐      |
| Submit bet              | US2    | ☐      |
| Validation (incomplete) | US2    | ☐      |
| Load existing bet       | US3    | ☐      |
| Update bet              | US3    | ☐      |
| Past results            | US4    | ☐      |
| Deadline enforcement    | Edge   | ☐      |
| Error handling          | Edge   | ☐      |
| One-handed mobile       | SC-006 | ☐      |
| No duplicate requests   | SC-005 | ☐      |

---

## Environment Notes

**Test Round Number**: **\_\_\_** (fill in current Svenska Spel draw number)

**Test User Credentials**:

- Username: **\_\_\_**
- Password: **\_\_\_** (do not commit to repo!)

**Backend Status**: ☐ Running on port 52259
**Frontend Status**: ☐ Running on port 3000
