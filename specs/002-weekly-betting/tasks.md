---
description: "Implementation tasks for Weekly Stryktipset Betting feature"
---

# Tasks: Weekly Stryktipset Betting

**Input**: Design documents from `/specs/002-weekly-betting/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/betting-api.md, quickstart.md

**Tests**: Tests are NOT explicitly requested in the feature specification, so test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Frontend: `src/` (repository root)
- Backend: .NET 9 API (assumed existing, tasks focus on frontend)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type definitions for betting feature

- [x] T001 [P] Create TypeScript type definitions in src/types/betting.ts with Outcome, MatchStatus, BettingMatch, BettingRound, BetSelection, UserBet types per data-model.md
- [x] T002 [P] Create Redux slice scaffold in src/store/bettingSlice.ts with initial state shape per data-model.md
- [x] T003 Add betting route to React Router configuration (main routing file)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Extend APIManager in src/services/APIManager.ts with `submitUserBet(roundNumber, selections)` method for POST /bets/{roundNumber}
- [x] T005 Create useBetting custom hook scaffold in src/hooks/useBetting.ts to encapsulate betting logic and Redux integration
- [x] T006 Create component folder structure src/components/betting/ with empty component files: BettingPage.tsx, MatchCard.tsx, BettingForm.tsx, DeadlineCountdown.tsx, BetSummary.tsx
- [x] T007 Create Betting page component in src/pages/Betting.tsx as route entry point

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Current Week's Matches (Priority: P1) 🎯 MVP

**Goal**: Display all 13 matches for the current Stryktipset round with match details and deadline

**Independent Test**: Navigate to /betting and verify all 13 matches load with home team, away team, kickoff time, and deadline countdown visible (no betting functionality required)

### Implementation for User Story 1

- [x] T008 [P] [US1] Implement Redux async thunk `fetchCurrentRound` in src/store/bettingSlice.ts using getSvenskaSpelDrawInfo from APIManager
- [x] T009 [P] [US1] Implement DeadlineCountdown component in src/components/betting/DeadlineCountdown.tsx with countdown timer logic per research.md Decision 4
- [x] T010 [US1] Implement BettingPage layout container in src/components/betting/BettingPage.tsx with round data fetching and loading/error states
- [x] T011 [US1] Implement MatchCard component in src/components/betting/MatchCard.tsx to display single match details (read-only for US1, match number, teams, kickoff time, league)
- [x] T012 [US1] Wire BettingPage to Betting.tsx page component in src/pages/Betting.tsx
- [x] T013 [US1] Add Constitution Principle VI compliance: Verify request deduplication in Redux thunk using requestDeduplicator utility
- [x] T014 [US1] Add loading spinner to BettingPage during data fetch (FluentUI Spinner component)
- [x] T015 [US1] Add error handling UI to BettingPage for API failures (FluentUI MessageBar component)
- [x] T016 [US1] Add mobile responsive styles to BettingPage and MatchCard (FluentUI makeStyles with mobile breakpoints per plan.md constraints)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can view matches and deadline on mobile

---

## Phase 4: User Story 2 - Place Bets on Matches (Priority: P2)

**Goal**: Allow users to select predictions (1/X/2) for each match and submit a complete bet

**Independent Test**: Select predictions for all 13 matches using 1/X/2 buttons, submit bet, and verify confirmation appears

### Implementation for User Story 2

- [x] T017 [P] [US2] Add draftSelections state management to Redux slice in src/store/bettingSlice.ts with actions for setSelection(matchNumber, outcome)
- [x] T018 [P] [US2] Implement Redux async thunk `submitBet` in src/store/bettingSlice.ts using submitUserBet from APIManager
- [x] T019 [US2] Update MatchCard component in src/components/betting/MatchCard.tsx to add interactive 1/X/2 buttons with selection onChange callback
- [x] T020 [US2] Style MatchCard buttons in src/components/betting/MatchCard.tsx with minimum 44x44px touch targets per research.md Decision 3 and FluentUI Button appearances
- [x] T021 [US2] Implement BetSummary component in src/components/betting/BetSummary.tsx to show "X of 13 selected" counter
- [x] T022 [US2] Create validation utility in src/utils/bettingValidation.ts with validateCompleteBet function (checks all 13 matches selected)
- [x] T023 [US2] Implement BettingForm wrapper component in src/components/betting/BettingForm.tsx with submit button and validation logic
- [x] T024 [US2] Wire BettingForm to BettingPage in src/components/betting/BettingPage.tsx and connect to Redux draft selections
- [x] T025 [US2] Add submit button state management: disable when incomplete or deadline passed in src/components/betting/BettingForm.tsx
- [x] T026 [US2] Add success confirmation UI in BettingForm after successful submission (FluentUI MessageBar with success variant)
- [x] T027 [US2] Add error handling for submission failures in BettingForm (display API error messages from Redux state)
- [x] T028 [US2] Add deadline enforcement: disable form and show message when deadline passed in src/components/betting/BettingPage.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can view and submit complete bets

---

## Phase 5: User Story 3 - View and Edit My Current Bet (Priority: P3)

**Goal**: Load previously submitted bet on page load and allow modifications before deadline

**Independent Test**: Submit a bet, navigate away, return to /betting, verify selections are pre-filled, modify 2-3 selections, re-submit successfully

### Implementation for User Story 3

- [ ] T029 [P] [US3] Implement Redux async thunk `fetchUserBet` in src/store/bettingSlice.ts using getUserBetsForRound from APIManager
- [ ] T030 [US3] Add submittedBet state to Redux slice in src/store/bettingSlice.ts with loading and error states
- [ ] T031 [US3] Update BettingPage in src/components/betting/BettingPage.tsx to fetch user bet on mount and populate draftSelections from submittedBet
- [ ] T032 [US3] Update MatchCard component in src/components/betting/MatchCard.tsx to show pre-selected state based on draftSelections from Redux
- [ ] T033 [US3] Update submitBet thunk in src/store/bettingSlice.ts to handle update scenario (upsert behavior per contracts/betting-api.md)
- [ ] T034 [US3] Update success message in BettingForm to differentiate "Bet saved" vs "Bet updated" based on whether submittedBet existed

**Checkpoint**: All core betting user stories (1, 2, 3) should now be independently functional

---

## Phase 6: User Story 4 - View Past Round Results (Priority: P4)

**Goal**: Display completed rounds with match results and user's betting performance

**Independent Test**: Select a past/completed round (if dropdown implemented), verify final scores and correct/incorrect indicators appear

### Implementation for User Story 4

- [x] T035 [P] [US4] Implement Redux async thunk `fetchRoundResults` in src/store/bettingSlice.ts using getSvenskaSpelDrawResult from APIManager
- [x] T036 [P] [US4] Add historicalRounds and historicalBets state to Redux slice in src/store/bettingSlice.ts
- [x] T037 [US4] Update MatchCard component in src/components/betting/MatchCard.tsx to show result mode: display final score and outcome when round is finished
- [x] T038 [US4] Add correct/incorrect indicator logic to MatchCard: compare user's prediction to actual result and show ✓ or ✗
- [x] T039 [US4] Create or update BetSummary component in src/components/betting/BetSummary.tsx to show "X of 13 correct" for completed rounds
- [x] T040 [US4] Update BettingPage in src/components/betting/BettingPage.tsx to handle past round display mode (read-only, results visible)
- [x] T041 [US4] Add round selector (dropdown or navigation) to switch between current and past rounds in src/components/betting/BettingPage.tsx (optional for MVP)

**Checkpoint**: All user stories should now be independently functional - users can view, bet, edit, and review results

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T042 [P] Add request deduplication verification: Audit all Redux thunks to ensure requestDeduplicator is used consistently per Constitution Principle VI
- [x] T043 [P] Performance optimization: Verify page load time <3s on throttled network (Chrome DevTools Slow 3G) per quickstart.md
- [x] T044 [P] Mobile responsiveness final check: Test all components at 320px, 375px, 768px widths per quickstart.md Scenario 7
- [x] T045 [P] Accessibility audit: Verify all touch targets meet 44x44px minimum per quickstart.md and Success Criteria SC-004
- [x] T046 Code cleanup: Remove console.logs, unused imports, and add JSDoc comments to complex functions
- [x] T047 Add loading state improvements: Implement skeleton screens for MatchCard components during initial load
- [x] T048 Add error recovery: Implement retry buttons for failed API calls in error MessageBars
- [x] T049 Run quickstart.md validation: Execute all 7 test scenarios from quickstart.md and fix any issues
- [x] T050 Update main README.md with betting feature documentation and /betting route information

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T003) - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase (T004-T007) completion
  - User stories CAN proceed in parallel if different team members work on them
  - OR sequentially in priority order: US1 → US2 → US3 → US4
- **Polish (Phase 7)**: Depends on all user stories being complete (T008-T041)

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Foundational phase - No dependencies on other stories
- **User Story 2 (P2)**: Depends only on Foundational phase - Builds on US1 components but independently testable
- **User Story 3 (P3)**: Depends only on Foundational phase - Extends US2 functionality but independently testable
- **User Story 4 (P4)**: Depends only on Foundational phase - Uses same components as US1-3 but independently testable

### Within Each Phase

**Phase 1 (Setup)**:

- T001, T002, T003 can all run in parallel (different files)

**Phase 2 (Foundational)**:

- T004, T005, T006, T007 have file dependencies:
  - T004 (APIManager) independent
  - T005 (useBetting hook) independent
  - T006 (component scaffolds) independent
  - T007 (Betting page) independent
- All can run in parallel

**Phase 3 (User Story 1)**:

- T008 (Redux thunk) and T009 (DeadlineCountdown) and T011 (MatchCard) can run in parallel
- T010 (BettingPage) depends on T008
- T012 (wire to page) depends on T010
- T013-T016 can be done after T012 in any order

**Phase 4 (User Story 2)**:

- T017, T018, T022 (Redux/validation) can run in parallel
- T019, T020 (MatchCard updates) can run together
- T021 (BetSummary) independent
- T023 (BettingForm) depends on T022
- T024-T028 depend on T023 but can be done in order

**Phase 5 (User Story 3)**:

- T029, T030 (Redux) can run in parallel
- T031-T034 follow sequentially

**Phase 6 (User Story 4)**:

- T035, T036 (Redux) can run in parallel
- T037-T041 follow sequentially

**Phase 7 (Polish)**:

- T042, T043, T044, T045 can all run in parallel (different concerns)
- T046-T048 can be done in any order
- T049, T050 should be last

### Parallel Opportunities

#### Within Setup (Phase 1)

```bash
Task T001: Create types/betting.ts
Task T002: Create store/bettingSlice.ts
Task T003: Add route to router
# All 3 can launch simultaneously
```

#### Within Foundational (Phase 2)

```bash
Task T004: Extend APIManager
Task T005: Create useBetting hook
Task T006: Create component folder structure
Task T007: Create pages/Betting.tsx
# All 4 can launch simultaneously
```

#### Within User Story 1

```bash
Task T008: Implement fetchCurrentRound thunk
Task T009: Implement DeadlineCountdown component
Task T011: Implement MatchCard component
# All 3 can launch simultaneously
```

#### Within Polish Phase

```bash
Task T042: Request deduplication audit
Task T043: Performance optimization
Task T044: Mobile responsiveness check
Task T045: Accessibility audit
# All 4 can launch simultaneously
```

---

## Parallel Example: User Story 1

```bash
# Step 1: Launch parallel tasks (T008, T009, T011)
Developer A: Implement fetchCurrentRound Redux thunk in src/store/bettingSlice.ts
Developer B: Implement DeadlineCountdown component in src/components/betting/DeadlineCountdown.tsx
Developer C: Implement MatchCard component in src/components/betting/MatchCard.tsx

# Step 2: After T008 completes, Developer A continues with:
Developer A: Implement BettingPage layout in src/components/betting/BettingPage.tsx (T010)

# Step 3: Wire everything together (T012)
# Step 4: Add polish (T013-T016) in any order
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. **Complete Phase 1: Setup** (T001-T003)
   - Create type definitions
   - Create Redux slice scaffold
   - Add route
2. **Complete Phase 2: Foundational** (T004-T007)
   - Extend APIManager
   - Create hook and component structure
3. **Complete Phase 3: User Story 1** (T008-T016)
   - Implement view matches functionality
   - Test independently per quickstart.md Scenario 1
4. **STOP and VALIDATE**:
   - Users can navigate to /betting
   - See all 13 matches
   - View deadline countdown
   - Mobile responsive
   - No duplicate API calls
5. **Deploy/demo if ready** - This is a working MVP!

### Incremental Delivery (Recommended)

1. **Foundation** (Phase 1 + 2) → ~1-2 days
   - Setup complete, ready for feature work
2. **MVP: User Story 1** (Phase 3) → ~2-3 days
   - Users can VIEW matches
   - Test with quickstart.md Scenario 1
   - Deploy/Demo - First value delivered!
3. **Core Feature: User Story 2** (Phase 4) → ~3-4 days
   - Users can PLACE bets
   - Test with quickstart.md Scenario 2
   - Deploy/Demo - Core functionality live!
4. **Enhancement: User Story 3** (Phase 5) → ~1-2 days
   - Users can EDIT bets
   - Test with quickstart.md Scenario 3
   - Deploy/Demo - Improved UX!
5. **Historical Data: User Story 4** (Phase 6) → ~2-3 days
   - Users can VIEW past results
   - Test with quickstart.md Scenario 5
   - Deploy/Demo - Full feature set!
6. **Polish** (Phase 7) → ~1-2 days
   - Performance, accessibility, documentation
   - Final validation with all quickstart.md scenarios

**Total Estimate**: 10-16 days for complete feature

### Parallel Team Strategy

With 2-3 developers:

1. **Week 1**: All devs work together on Setup + Foundational (T001-T007)
2. **Week 2**: Once T007 is complete, split work:
   - **Developer A**: User Story 1 (T008-T016)
   - **Developer B**: User Story 2 foundation work (T017-T018, T022)
   - **Developer C**: Prepare components for US2/US3 (T019-T021)
3. **Week 3**: Continue in parallel:
   - Each developer completes their assigned user story
   - Integrate and test stories independently
4. **Week 4**: Polish and cross-story validation

---

## Notes

- **[P] marker**: Tasks with [P] work on different files and have no blocking dependencies, safe to run in parallel
- **[Story] label**: Maps each task to its user story for traceability and independent testing
- **Constitution Principle VI**: All API calls must use request deduplication (verified in T013, audited in T042)
- **Success Criteria**: Tasks explicitly address SC-001 through SC-006 from spec.md
- **Mobile-first**: Touch targets, responsive design, and mobile testing integrated throughout
- **Independent testing**: Each user story phase ends with a checkpoint where that story can be tested in isolation
- **No tests included**: Feature spec did not explicitly request TDD or test tasks
- **Commit strategy**: Commit after each task or logical group (e.g., after T016, after T028, etc.)
- **Risk mitigation**: Deadline validation (T028), performance verification (T043), accessibility audit (T045)

---

## Validation Checklist

Before marking tasks.md as complete, verify:

- [ ] All user stories from spec.md are represented (US1, US2, US3, US4)
- [ ] All entities from data-model.md are covered (Round, Match, Bet, BetSelection types in T001)
- [ ] All API endpoints from contracts/betting-api.md are used (drawInfo, user bets, submit in T004, T008, T029, T035)
- [ ] All research decisions are implemented (state management T002, deduplication T013, touch targets T020, deadline T009, persistence T029, component structure T006)
- [ ] Success criteria from spec.md are addressed (SC-001 to SC-006)
- [ ] All quickstart.md scenarios can be executed (referenced in T049)
- [ ] Constitution principles are followed (Type Safety T001, Components T011, State T002, UX T014-T016, Quality T046, API Management T013/T042)
- [ ] File paths are specific and absolute (all tasks include exact file paths)
- [ ] Checklist format is correct (all tasks have `- [ ] [ID] [P?] [Story?] Description with path`)
- [ ] MVP is clearly identified (Phase 3 marked with 🎯 MVP)
- [ ] Independent test criteria defined for each user story phase
