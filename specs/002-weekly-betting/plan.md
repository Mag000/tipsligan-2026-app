# Implementation Plan: Weekly Stryktipset Betting

**Branch**: `002-weekly-betting` | **Date**: 2026-02-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-weekly-betting/spec.md`

## Summary

Build a mobile-first betting interface for weekly Stryktipset rounds. Users view 13 matches from Svenska Spel API, select predictions (1/X/2), and submit bets before the deadline. Existing infrastructure (APIManager, Redux, FluentUI 9) is extended with a new `/betting` route and Redux slice for bet state management, following Constitution Principle VI (no duplicate API requests).

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), .NET 9 (backend API)
**Primary Dependencies**: React 19.x, FluentUI 9 (@fluentui/react-components), Redux Toolkit 2.x, Axios, React Router 7.x, Vite
**Storage**: SQL Server via .NET 9 backend (existing)
**Testing**: Jest + React Testing Library (frontend), xUnit (.NET)
**Target Platform**: Web (mobile-first responsive design, ≥320px width)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Page load <3s on 3G, bet submission <2s, 60fps animations
**Constraints**: Touch targets ≥44x44px, no duplicate API calls per page load
**Scale/Scope**: ~50 users, single round active at a time, 13 matches per round

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                   | Status  | Evidence                                                                       |
| ------------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| I. Type Safety First (NON-NEGOTIABLE)       | ✅ PASS | All new types in `types/betting.ts`, no `any` types, strict mode enabled       |
| II. Component Architecture                  | ✅ PASS | Functional components with hooks, FluentUI 9 primitives, responsive design     |
| III. State Management                       | ✅ PASS | Redux slice for bets, `createAsyncThunk` for API calls, normalized state       |
| IV. User Experience Excellence              | ✅ PASS | Mobile-first, loading spinners, user-friendly errors, accessible touch targets |
| V. Code Quality Standards                   | ✅ PASS | Clean component structure, reusable hooks, consistent file organization        |
| VI. API Request Management (NON-NEGOTIABLE) | ✅ PASS | Request deduplication via existing `requestDeduplicator`, cache-first loading  |

**Gate Result**: ALL PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/002-weekly-betting/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── betting-api.md   # API contract for betting endpoints
├── checklists/
│   └── requirements.md  # Requirements checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── betting/
│       ├── BettingPage.tsx         # Main betting page container
│       ├── MatchCard.tsx           # Individual match with 1/X/2 buttons
│       ├── BettingForm.tsx         # Form wrapper with submit button
│       ├── DeadlineCountdown.tsx   # Countdown timer component
│       └── BetSummary.tsx          # Summary of user's selections
├── hooks/
│   └── useBetting.ts               # Custom hook for betting logic
├── pages/
│   └── Betting.tsx                 # Route page component
├── store/
│   └── bettingSlice.ts             # Redux slice for betting state
├── types/
│   └── betting.ts                  # TypeScript types for betting
├── services/
│   └── APIManager.ts               # Extended with betting endpoints (existing)
└── utils/
    └── bettingValidation.ts        # Validation helpers
```

**Structure Decision**: Extend existing frontend structure with new `betting/` component folder and Redux slice. Backend endpoints already exist (`/bets/{round}/user`). Add new page route at `/betting`.

## Complexity Tracking

> No violations requiring justification - all principles pass.
