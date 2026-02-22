# Research: Weekly Stryktipset Betting

**Feature**: 002-weekly-betting
**Date**: 2026-02-20
**Purpose**: Document technical decisions and research findings before implementation

## Executive Summary

This feature extends the existing Tipsligan 2026 App to provide a mobile-friendly betting interface for weekly Stryktipset rounds. Research confirms that existing infrastructure (APIManager, Redux store, FluentUI 9) supports all requirements with minimal additions.

---

## Decision 1: State Management for Bet Selections

**Decision**: Use Redux Toolkit slice with local draft state

**Rationale**:

- Constitution Principle III mandates Redux Toolkit for global state
- Bet selections are global (persist across page navigation)
- `createAsyncThunk` provides built-in loading/error states aligned with Principle VI
- Local component state (`useState`) used only for transient UI (e.g., button hover)

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Pure local state (useState) | Selections lost on navigation; violates single source of truth |
| React Context | Redux already established; adding Context creates state fragmentation |
| Zustand | Would introduce new dependency; Redux Toolkit already in constitution |

**Implementation Notes**:

- Create `bettingSlice.ts` with `currentRoundSelections: Record<number, '1' | 'X' | '2'>`
- Use `createAsyncThunk` for `submitBet` action with pending/fulfilled/rejected states
- Cache submitted bets in Redux to avoid refetching (Constitution Principle VI)

---

## Decision 2: API Request Deduplication Pattern

**Decision**: Extend existing `requestDeduplicator` utility for betting endpoints

**Rationale**:

- Constitution Principle VI (NON-NEGOTIABLE) requires no duplicate concurrent requests
- `requestDeduplicator` already proven in `APIManager.ts` for other endpoints
- Consistent pattern across codebase

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| RTK Query | Would require significant refactor; existing pattern works well |
| Custom hook with useRef tracking | Ad-hoc solution; requestDeduplicator is standardized |
| No deduplication | Violates Constitution Principle VI |

**Implementation Notes**:

- Wrap `getUserBetsForRound` calls (already wrapped)
- New `submitBet` endpoint uses POST (mutations not cached)
- Add loading flag in Redux to prevent double-submission

---

## Decision 3: Mobile Touch Target Implementation

**Decision**: FluentUI 9 Button with custom minimum size styling

**Rationale**:

- FluentUI 9 Buttons support custom sizing via `style` or `makeStyles`
- Constitution requires minimum 44x44px touch targets
- FluentUI tokens provide consistent spacing

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Native HTML buttons | Lose FluentUI styling consistency |
| Custom toggle component | FluentUI ToggleButton exists; don't reinvent |
| Radio buttons | Less intuitive for 1/X/2 selection UX |

**Implementation Notes**:

```typescript
const useStyles = makeStyles({
  outcomeButton: {
    minWidth: "44px",
    minHeight: "44px",
    padding: "8px 16px",
  },
});
```

- Use `appearance="primary"` for selected state
- Use `appearance="outline"` for unselected state

---

## Decision 4: Deadline Countdown Display

**Decision**: Client-side countdown using `setInterval` with server time sync

**Rationale**:

- Round deadline comes from Svenska Spel API (`closeTime` field)
- Client-side interval provides real-time countdown
- Parse ISO 8601 date, diff against `Date.now()`

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Server-side countdown refresh | Unnecessary API calls; violates Principle VI |
| Static display (no countdown) | Poor UX for time-sensitive betting |
| WebSocket real-time | Over-engineered for simple countdown |

**Implementation Notes**:

- Component: `DeadlineCountdown.tsx`
- Update every second when <1 hour remaining
- Update every minute when >1 hour remaining
- Disable betting form when deadline reached

---

## Decision 5: Bet Persistence Strategy

**Decision**: Server-side persistence via existing `/bets/{round}/user` endpoint

**Rationale**:

- Backend already has bet storage (Entity Framework + SQL Server)
- `getUserBetsForRound` in APIManager already fetches user bets
- Submit via existing pattern; extend if needed

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| localStorage backup | Useful for offline but adds complexity; server is source of truth |
| IndexedDB | Over-engineered for 13 selections |
| New endpoint design | Existing endpoints cover requirements |

**Implementation Notes**:

- On page load: Fetch existing bet if any, populate Redux state
- On submit: POST to backend, update Redux on success
- Optimistic update: Show success immediately, rollback on failure

---

## Decision 6: Component Structure

**Decision**: Single page with subcomponents, no internal routing

**Rationale**:

- Betting flow is linear (view matches → select → submit)
- No need for tabs or sub-routes
- Page container pattern consistent with existing pages

**File Structure**:

```
src/components/betting/
├── BettingPage.tsx         # Layout container
├── MatchCard.tsx           # Single match with 1/X/2 buttons
├── BettingForm.tsx         # Form wrapper with validation
├── DeadlineCountdown.tsx   # Countdown display
└── BetSummary.tsx          # Selection summary (e.g., "12 of 13 selected")
```

---

## Technology Validation

| Technology    | Version | Validation                                       |
| ------------- | ------- | ------------------------------------------------ |
| TypeScript    | 5.x     | Verified in tsconfig.json (`"target": "ES2020"`) |
| React         | 19.x    | Verified in package.json                         |
| FluentUI 9    | 9.72.x  | Already installed and used                       |
| Redux Toolkit | 2.x     | Already installed and used                       |
| Axios         | 1.13.x  | Already installed (via axiosConfig.ts)           |
| .NET 9        | Backend | Specified by user; existing API endpoints work   |

---

## Risks and Mitigations

| Risk                                                      | Probability | Impact | Mitigation                                                        |
| --------------------------------------------------------- | ----------- | ------ | ----------------------------------------------------------------- |
| Deadline race condition (user submits as deadline passes) | Medium      | Low    | Server-side deadline validation; frontend disables form 30s early |
| Mobile performance (13 MatchCards)                        | Low         | Medium | Virtualization only if needed; FluentUI is optimized              |
| API rate limiting                                         | Low         | Medium | Request deduplication already in place                            |

---

## Open Questions

All questions resolved - no NEEDS CLARIFICATION items remain.

---

## References

- [Constitution v1.1.0](.specify/memory/constitution.md)
- [Feature Specification](./spec.md)
- [Existing APIManager](../../src/services/APIManager.ts)
- [Svenska Spel Types](../../src/types/svenskaspel.ts)
