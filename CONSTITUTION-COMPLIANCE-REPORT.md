# API Request Management - Constitution Compliance Implementation

**Date**: 2026-02-19  
**Constitution Version**: 1.1.0  
**Principle**: VI. API Request Management (NON-NEGOTIABLE)

## ✅ Completed Implementations

### 1. Request Deduplication Utility ✅

**File**: `src/utils/requestDeduplication.ts`

**Features**:

- Prevents duplicate concurrent API requests with the same key
- Returns existing promise if request already in-flight
- Automatic cleanup after request completes
- Monitoring methods (`isRequestPending`, `getPendingCount`)
- Global cleanup method (`clear()`)

**Usage Example**:

```typescript
// In APIManager
static async getSvenskaSpelDrawInfo(round: number, signal?: AbortSignal) {
  return requestDeduplicator.deduplicate(
    `drawInfo-${round}`,
    () => retryWithBackoff(async () => {
      // ... fetch logic
    })
  );
}
```

---

### 2. Retry Logic with Exponential Backoff ✅

**File**: `src/utils/retryWithBackoff.ts`

**Features**:

- Configurable max retries (default: 3)
- Exponential backoff with jitter (prevents thundering herd)
- Smart retry decisions (retries network/5xx errors, not 4xx)
- Customizable `shouldRetry` function
- Max delay cap (default: 30 seconds)
- Retry callbacks for monitoring

**Usage Example**:

```typescript
await retryWithBackoff(() => fetch("/api/endpoint"), {
  maxRetries: 3,
  baseDelay: 1000,
});
```

---

### 3. AbortController Support ✅

**Updated Methods in `APIManager.ts`**:

All critical read methods now accept an optional `signal` parameter:

- `getSvenskaSpelDrawInfo(round, signal?)`
- `getSvenskaSpelDrawResult(round, signal?)`
- `getUserBetsForRound(round, userId?, signal?)`
- `getBetsForRound(round, signal?)`
- `getDistributionForRound(round, signal?)`
- `getAllRounds(signal?)`
- `getMatchesForRound(round, signal?)`

**Usage Example**:

```typescript
const abortController = new AbortController();

// Start request
APIManager.getSvenskaSpelDrawInfo(round, abortController.signal);

// Cancel on component unmount
useEffect(() => {
  return () => abortController.abort();
}, []);
```

---

### 4. Redux Toolkit Store ✅

**Files Created**:

- `src/store/store.ts` - Store configuration
- `src/store/roundsSlice.ts` - Rounds state management

**Features**:

- **Typed hooks**: `useAppDispatch`, `useAppSelector`
- **Async thunks**: `fetchAllRounds`, `fetchRoundData`
- **Cache management**: TTL-based cache (5 minutes default)
- **Loading states**: Per-round loading indicators
- **Error handling**: Per-round error tracking
- **Actions**: `setCurrentRound`, `updateUserBet`, `clearRoundCache`

**State Shape**:

```typescript
{
  rounds: {
    currentRound: number | null;
    availableRounds: Round[];
    roundsData: {
      [roundNumber]: {
        drawInfo: SvenskaSpelResponse;
        userBets: Record<number, UserBet>;
        allUsersBets: Record<string, Record<number, UserBet>>;
        distribution: Record<number, { "1": number; X: number; "2": number }>;
        loading: boolean;
        error: string | null;
        lastFetched: number; // Timestamp for cache invalidation
      }
    };
  }
}
```

---

### 5. Provider Integration ✅

**File**: `src/index.tsx`

Redux Provider wraps the entire app:

```typescript
<Provider store={store}>
  <App />
</Provider>
```

---

## ⚠️ Remaining Work

### 1. Complete App.tsx Refactoring

**Status**: ⚠️ PARTIAL

**Current State**:

- Redux store created and configured
- Imports updated to include Redux hooks
- Local state still present

**Required Changes**:

- Replace `useState` for `currentRound`, `roundsData`, `availableRounds` with Redux selectors
- Update `loadRoundData` to dispatch `fetchRoundData` thunk
- Update initialization logic to dispatch `fetchAllRounds`
- Add AbortController for cleanup on unmount

**Recommendation**:

```typescript
// Replace local state with Redux
const dispatch = useAppDispatch();
const { currentRound, roundsData, availableRounds } = useAppSelector(
  (state) => state.rounds,
);

// Replace loadRoundData
const loadRoundData = useCallback(
  async (round: number, force = false) => {
    await dispatch(
      fetchRoundData({ round, userId: "current", force }),
    ).unwrap();
  },
  [dispatch],
);

// Update setCurrentRound
const setCurrentRound = useCallback(
  (round: number) => {
    dispatch(setCurrentRoundAction(round));
  },
  [dispatch],
);
```

---

### 2. Update Component Requests

**Files to Update**:

- `src/pages/Rounds.tsx` - Add AbortController for requests
- `src/pages/Standings.tsx` - Use Redux for data
- Other pages using APIManager directly

**Pattern to Follow**:

```typescript
useEffect(() => {
  const controller = new AbortController();

  APIManager.getSomeData(controller.signal)
    .then(data => /* handle */)
    .catch(err => {
      if (err.name === 'AbortError') {
        console.log('Request cancelled');
        return;
      }
      // Handle actual error
    });

  return () => controller.abort();
}, [dependencies]);
```

---

### 3. Add Write Operation Deduplication

**Status**: ❌ NOT STARTED

Write operations (POST/PUT/DELETE) need special handling:

**Methods Requiring Update**:

- `saveBet()` - Should debounce rapid saves
- `finalizeBetsForRound()` - Should prevent duplicate finalization
- `updateStandings()` - Should deduplicate
- `syncSvenskaSpeDrawToDatabase()` - Should deduplicate

**Pattern**:

```typescript
// Debounce for user-triggered writes
import { debounce } from "lodash-es"; // or custom implementation

const debouncedSaveBet = debounce(
  (round, matchNumber, bet) => APIManager.saveBet(round, matchNumber, bet),
  300,
  { leading: false, trailing: true },
);
```

---

### 4. Implement Debouncing Utility

**Status**: ❌ NOT STARTED

Create `src/utils/debounce.ts`:

```typescript
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
```

---

### 5. Add Request Queue for Sequential Operations

**Status**: ❌ NOT STARTED

Some operations must be sequential (e.g., finalize then fetch results).

Create `src/utils/requestQueue.ts`:

```typescript
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
    }

    this.isProcessing = false;
  }
}

export const requestQueue = new RequestQueue();
```

---

## 📊 Compliance Status Summary

| Requirement                               | Status      | Priority | ETA                    |
| ----------------------------------------- | ----------- | -------- | ---------------------- |
| ✅ No duplicate concurrent requests       | **DONE**    | CRITICAL | Complete               |
| ✅ Request cancellation (AbortController) | **DONE**    | CRITICAL | Complete               |
| ⚠️ Loading state coordination             | **PARTIAL** | CRITICAL | Needs App.tsx update   |
| ❌ Debouncing for user input              | **TODO**    | High     | 30 min                 |
| ✅ Redux thunk patterns                   | **DONE**    | High     | Complete               |
| ✅ Retry with exponential backoff         | **DONE**    | High     | Complete               |
| ⚠️ Request batching                       | **PARTIAL** | Medium   | Exists in some methods |
| ⚠️ Cache-first strategy                   | **PARTIAL** | High     | Implemented in Redux   |

---

## 🚀 Next Steps (Priority Order)

### Immediate (Critical Path)

1. **Complete App.tsx Redux integration** (30-45 min)
   - Replace local state with Redux selectors
   - Update all setState calls to dispatch actions
   - Add AbortController for cleanup

2. **Test Redux data flow** (15 min)
   - Verify rounds load correctly
   - Check loading/error states
   - Ensure cache invalidation works

### Short Term (Same Day)

3. **Add debouncing to write operations** (20 min)
   - Create debounce utility
   - Wrap saveBet with debounce
   - Test rapid bet changes

4. **Update Rounds.tsx and Standings.tsx** (30 min)
   - Add AbortController to all requests
   - Use Redux selectors where appropriate
   - Remove direct APIManager calls from render

### Medium Term (This Week)

5. **Add request queue for sequential operations** (30 min)
6. **Add comprehensive error boundaries** (20 min)
7. **Add request monitoring/debugging tools** (optional)

---

## 🧪 Testing Checklist

- [ ] Rapid round switching doesn't cause duplicate requests
- [ ] Component unmount cancels in-flight requests
- [ ] Failed requests retry automatically
- [ ] Cache prevents redundant API calls
- [ ] Rapid bet changes are debounced
- [ ] Finalize button can't be clicked twice
- [ ] Network errors show user-friendly messages
- [ ] Redux DevTools shows proper state updates

---

## 📝 Code Quality Verification

- [x] No `any` types without justification
- [x] All new files have TypeScript interfaces
- [x] Error handling follows constitution
- [x] Console logs are informative (🔄, ✅, ❌ prefixes)
- [x] Functions have single responsibility
- [ ] All methods updated with AbortController (only critical ones done)
- [x] Redux state is normalized
- [x] Immutable updates via Redux Toolkit

---

## 💬 Suggested Commit Messages

```bash
# For completed work
git add src/utils/requestDeduplication.ts src/utils/retryWithBackoff.ts
git commit -m "feat: implement request deduplication and retry logic

- Add RequestDeduplicator utility to prevent duplicate concurrent requests
- Implement exponential backoff with jitter for failed requests
- Follows Constitution Principle VI: API Request Management"

git add src/store/
git commit -m "feat: implement Redux Toolkit store with caching

- Create roundsSlice with typed async thunks
- Add cache-first strategy with TTL-based invalidation
- Configure store with proper Redux Toolkit patterns
- Export typed hooks for type-safe dispatch/selectors"

git add src/services/APIManager.ts src/index.tsx
git commit -m "feat: add AbortController support and integrate Redux

- Update critical APIManager methods with AbortController signals
- Wrap App with Redux Provider
- Apply request deduplication to all GET methods
- Add retry logic to network-volatile endpoints"

# For pending work
git commit -m "refactor: migrate App.tsx to Redux state management

- Replace local state with Redux selectors
- Update loadRoundData to dispatch fetchRoundData thunk
- Add AbortController cleanup on component unmount
- Completes Constitution Principle VI implementation"
```

---

## 📚 Documentation for Developers

### Using Request Deduplication

```typescript
// Automatically handled in APIManager for all updated methods
const data = await APIManager.getSvenskaSpelDrawInfo(round);
// If another call with same round is in-flight, reuses that promise
```

###Using AbortController

```typescript
function MyComponent() {
  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        const data = await APIManager.getRoundData(1, controller.signal);
        // Process data
      } catch (error) {
        if (error.name === "AbortError") return; // Cancelled
        console.error("Error loading data:", error);
      }
    };

    loadData();

    return () => controller.abort(); // Cancel on unmount
  }, []);

  // ...
}
```

### Using Redux for Round Data

```typescript
import { useAppSelector, useAppDispatch } from "./store/store";
import { fetchRoundData, setCurrentRound } from "./store/roundsSlice";

function MyComponent() {
  const dispatch = useAppDispatch();
  const { currentRound, roundsData } = useAppSelector((state) => state.rounds);

  const round1Data = roundsData[1]; // Access specific round
  const isLoading = round1Data?.loading ?? false;
  const error = round1Data?.error;

  // Load data
  const loadData = async () => {
    try {
      await dispatch(fetchRoundData({ round: 1, userId: "current" })).unwrap();
    } catch (error) {
      console.error("Failed to load:", error);
    }
  };

  // Switch round
  const switchRound = (newRound: number) => {
    dispatch(setCurrentRound(newRound));
  };

  // ...
}
```

---

**End of Implementation Report**
**Compliance Level**: ~70% Complete  
**Estimated Time to 100%**: 2-3 hours
