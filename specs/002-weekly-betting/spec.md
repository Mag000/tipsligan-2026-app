# Feature Specification: Weekly Stryktipset Betting

**Feature Branch**: `002-weekly-betting`  
**Created**: 2026-02-20  
**Status**: Draft  
**Input**: User description: "Build a mobile friendly site that handles weekly bettings on Stryktipset"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Current Week's Matches (Priority: P1)

As a registered user, I want to view the current Stryktipset round's 13 matches so I can see what games are available for betting this week.

**Why this priority**: This is the foundation - users cannot place bets without first seeing the available matches. Without this, no other functionality is useful.

**Independent Test**: Can be fully tested by logging in and navigating to the betting page. Delivers value by showing match information (teams, kickoff times, leagues) even before betting is implemented.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I navigate to the betting page, **Then** I see all 13 matches for the current Stryktipset round with home team, away team, match number (1-13), and kickoff time
2. **Given** I am viewing matches on mobile (<768px), **When** the page loads, **Then** matches display in a clear, scrollable list with touch-friendly spacing
3. **Given** a round has a deadline, **When** I view the matches, **Then** I see a countdown or deadline indicator showing when betting closes
4. **Given** no active round exists, **When** I navigate to the betting page, **Then** I see a friendly message indicating no round is currently open

---

### User Story 2 - Place Bets on Matches (Priority: P2)

As a registered user, I want to select my predictions (1, X, or 2) for each of the 13 matches so I can participate in the weekly Stryktipset competition.

**Why this priority**: Core betting functionality - the primary purpose of the application. Depends on US1 (viewing matches).

**Independent Test**: Can be tested by selecting predictions for all 13 matches and submitting. Delivers the core value proposition of participating in the betting league.

**Acceptance Scenarios**:

1. **Given** I am viewing the current round, **When** I tap on "1", "X", or "2" for a match, **Then** that prediction is visually selected and I can see my current selections
2. **Given** I have selected predictions for all 13 matches, **When** I tap the submit button, **Then** my bet is saved and I receive confirmation
3. **Given** I submit fewer than 13 predictions, **When** I tap submit, **Then** I see a clear message indicating which matches need predictions
4. **Given** the deadline has passed, **When** I try to submit or modify bets, **Then** I see a message that betting is closed for this round
5. **Given** I am on mobile, **When** I tap 1/X/2 buttons, **Then** they are at least 44x44 pixels for easy touch interaction

---

### User Story 3 - View and Edit My Current Bet (Priority: P3)

As a registered user, I want to see my previously submitted bet for the current round and edit it before the deadline so I can change my mind.

**Why this priority**: Improves user experience by allowing corrections. Not essential for MVP but expected functionality.

**Independent Test**: Can be tested by submitting a bet, navigating away, returning, verifying selections persist, modifying, and re-submitting.

**Acceptance Scenarios**:

1. **Given** I have submitted a bet for the current round, **When** I return to the betting page, **Then** I see my previously submitted predictions pre-selected
2. **Given** I want to change my bet, **When** I modify selections and submit, **Then** my bet is updated and I receive confirmation of the change
3. **Given** I am viewing my bet, **When** I look at each match, **Then** I can distinguish between "no prediction yet" and my selected prediction

---

### User Story 4 - View Past Round Results (Priority: P4)

As a registered user, I want to view completed rounds with match results and my betting performance so I can track how well I did.

**Why this priority**: Historical data is valuable but not essential for weekly participation. Can be added after core betting works.

**Independent Test**: Can be tested by selecting a past round and verifying results display correctly with correct/incorrect indicators.

**Acceptance Scenarios**:

1. **Given** a round has finished, **When** I view that round, **Then** I see final scores (e.g., "2-1") and correct outcomes (1, X, or 2) for each match
2. **Given** I placed a bet on a finished round, **When** I view that round, **Then** my predictions are shown alongside the actual results with correct/incorrect indicators
3. **Given** I am viewing a past round, **When** I look at the summary, **Then** I see how many matches I predicted correctly (e.g., "9 of 13 correct")

---

### Edge Cases

- What happens when a match is cancelled/postponed? System should display the match status and handle "void" results appropriately
- What happens when the user loses network connectivity while submitting? System should show error and retain draft selections locally
- What happens when two users submit at the exact same time? Each user's bet should be stored independently without conflicts
- What happens when the deadline expires while user is filling in predictions? System should prevent submission and show clear error

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display all 13 matches for the current Stryktipset round from Svenska Spel API
- **FR-002**: System MUST show match details: match number, home team, away team, league name, kickoff time
- **FR-003**: System MUST display the round deadline prominently so users know when betting closes
- **FR-004**: System MUST allow users to select exactly one prediction (1, X, or 2) per match
- **FR-005**: System MUST validate that all 13 predictions are selected before allowing submission
- **FR-006**: System MUST save user bets to the backend and confirm successful submission
- **FR-007**: System MUST prevent bet submission after the round deadline has passed
- **FR-008**: System MUST load and display previously submitted bets when user returns to the page
- **FR-009**: System MUST allow users to modify and re-submit bets before the deadline
- **FR-010**: System MUST work on mobile devices with touch-friendly interactions (minimum 44x44px tap targets)
- **FR-011**: System MUST follow Constitution Principle VI - no duplicate API requests per page load
- **FR-012**: System MUST show loading indicators during API calls (per Constitution Principle IV)
- **FR-013**: System MUST handle API errors gracefully with user-friendly messages (per Constitution Principle IV)

### Key Entities

- **Round**: A Stryktipset betting round containing 13 matches, identified by draw number, with open/close times
- **Match**: A football match within a round, with home team, away team, kickoff time, league, and result (1, X, or 2 when finished)
- **Bet**: A user's predictions for a round, containing 13 outcomes (one per match), with submission timestamp
- **User**: An authenticated participant who places bets (existing entity)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can view current round matches and submit a complete bet in under 2 minutes on mobile
- **SC-002**: 95% of bet submissions complete successfully on first attempt
- **SC-003**: Page loads and displays all match data within 3 seconds on 3G mobile connection
- **SC-004**: Touch targets meet accessibility guidelines (minimum 44x44px) as verified by manual testing
- **SC-005**: No duplicate API calls are made when loading the betting page (verified via network inspection)
- **SC-006**: Users can complete the entire betting flow using only their thumb on a mobile device (one-handed operation)

## Assumptions

- Users are already authenticated via the existing login system
- Svenska Spel API integration is already functional (existing APIManager.ts)
- Round and match data structures from `types/round.ts` and `types/svenskaspel.ts` are usable as-is or with minor extensions
- Backend API endpoints for saving/retrieving user bets exist or will be created
- The existing FluentUI 9 component library provides sufficient mobile-friendly components
