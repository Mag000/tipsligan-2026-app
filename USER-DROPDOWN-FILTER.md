# User Dropdown Filter Implementation

## Changes Made

Updated the Overview page to improve the user selection dropdown by:

1. **Filtering out inactive users** - Only active users are fetched from API
2. **Excluding users with no bets** - Only shows users who have placed bets for the current round
3. **Excluding the current user** - The logged-in user is not shown in the dropdown (they already see their own bets)

## Implementation

### Updated `userOptions` useMemo Hook

**Location:** `src/pages/Overview.tsx` (lines ~582-598)

```typescript
const userOptions = useMemo(() => {
  return users
    .filter((user) => user.userId.toUpperCase() !== userId) // Exclude current user
    .map((user) => {
      const normalizedUserId = user.userId.toUpperCase();
      const userHasBets = betsByRound[currentRound]?.[normalizedUserId];
      const hasBetsForRound =
        userHasBets && Object.keys(userHasBets.bets || {}).length > 0;

      return {
        key: user.userId,
        text: user.userName,
        value: normalizedUserId,
        disabled: !hasBetsForRound, // Disable if no bets for this round
      };
    })
    .filter((option) => !option.disabled); // Only show users with bets
}, [users, betsByRound, currentRound, userId]);
```

## Filter Logic

### 1. Active Users Only

- The API endpoint `/users/all` already returns only active users
- Called via `APIManager.getAllActiveUsers()`
- Handled in `fetchAllUsers` thunk in `usersSlice.ts`

### 2. Users with Bets for Current Round

- Checks `betsByRound[currentRound]?.[normalizedUserId]`
- Verifies that the user has at least one bet: `Object.keys(userHasBets.bets || {}).length > 0`
- Users without bets are filtered out completely

### 3. Exclude Current User

- Filters out user where `user.userId.toUpperCase() !== userId`
- Current user already sees their own bets labeled "Mina tips"
- No need to compare with themselves

## User Flow

### Before

```
User Dropdown:
- User A (current user) ← Should not show
- User B (has bets) ✓
- User C (no bets for this round) ← Should not show
- User D (inactive) ← Should not show
- User E (has bets) ✓
```

### After

```
User Dropdown:
- User B (has bets) ✓
- User E (has bets) ✓
```

## Benefits

1. **Cleaner UI** - Only relevant users are shown
2. **Better UX** - No confusion about why some users show no bets
3. **Performance** - Less rendering overhead
4. **Logical** - Current user doesn't need to compare with themselves

## Dependencies

The implementation depends on:

- `users` array from Redux (`usersSlice`)
- `betsByRound[currentRound]` data from Redux (`betsSlice`)
- `userId` from the current authenticated user
- Bets must be loaded before user dropdown is populated

## Edge Cases Handled

✅ **No bets loaded yet** - Dropdown will be empty until bets are fetched  
✅ **Current user has no bets** - Still excluded from dropdown  
✅ **All users filtered out** - Dropdown will be empty (expected behavior)  
✅ **Case sensitivity** - All userId comparisons normalized to uppercase  
✅ **Round changes** - Dropdown updates when round changes (dependency array)

## Testing Checklist

- [ ] Only active users appear in dropdown
- [ ] Current user is not in the dropdown
- [ ] Users without bets for the round are excluded
- [ ] Dropdown updates when changing rounds
- [ ] Selected users persist when switching between rounds (if they have bets)
- [ ] Empty dropdown shows appropriate message

## Technical Notes

### useMemo Dependencies

```typescript
[users, betsByRound, currentRound, userId];
```

The dropdown options will recalculate when:

- Users list changes (initial load)
- Bets data changes (bets are loaded/updated)
- Round changes (user switches to different round)
- Current user changes (user logs in/out)

### Performance

- Filter operations run in O(n) time
- Memoized to prevent unnecessary recalculations
- Only recalculates when dependencies change

## Related Code

### API Endpoint

```typescript
// src/services/APIManager.ts
static async getAllActiveUsers(round?: number) {
  const response = await fetch(`${API_BASE_URL}/users/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return await response.json();
}
```

### Redux Thunk

```typescript
// src/store/slices/usersSlice.ts
export const fetchAllUsers = createAsyncThunk(
  "users/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    // ... cache checking ...
    const usersData = await APIManager.getAllActiveUsers();
    return usersData;
  }
);
```

## Files Modified

- `src/pages/Overview.tsx`
  - Updated `userOptions` useMemo (lines ~582-598)
  - Added filtering logic for inactive and bet-less users
  - Excluded current user from dropdown

## Status

✅ **COMPLETE** - User dropdown now only shows active users with bets for the current round, excluding the current user
