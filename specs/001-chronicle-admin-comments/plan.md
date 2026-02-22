# Implementation Plan: Chronicle with Admin Editing and Comments

**Branch**: `001-chronicle-admin-comments` | **Date**: 2026-02-19 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-chronicle-admin-comments/spec.md`

## Summary

Implement a Chronicle section on the start page displaying league announcements/news with admin CRUD capabilities and a commenting system. Administrators can create, edit, and delete chronicle entries with rich text formatting (bold, italic, links, lists, headers). All authenticated users can post and edit their own comments (plain text). The feature uses absolute timestamps, Redux state management for caching, axios for HTTP requests, and FluentUI 9 components for a responsive interface.

## Technical Context

**Language/Version**: TypeScript 4.9+ (strict mode), React 19.x  
**Primary Dependencies**:

- `@fluentui/react-components` 9.x (UI design system)
- `@reduxjs/toolkit` 2.x (state management)
- `react-router-dom` 7.x (routing)
- `axios` ^1.x (HTTP client - NEW for this feature)
- Rich text editor library (TBD in Phase 0 research)

**Storage**: Backend SQL database (ASP.NET Core Web API - existing)  
**Testing**: Jest + React Testing Library (existing configuration)  
**Target Platform**: Web application (responsive: mobile ≥320px, tablet, desktop)  
**Project Type**: Web frontend (React SPA) with REST API backend  
**Performance Goals**:

- Chronicle section loads <2s on page load
- Comment post completes <1s round-trip
- Rich text editor initializes <500ms
- 60fps UI interactions

**Constraints**:

- Must follow Constitution Principle VI (no duplicate API requests, request deduplication, Redux caching)
- Type safety: 100% TypeScript, zero `any` types
- Mobile-first responsive design
- XSS prevention: sanitize all user-generated content
- Backward compatible with existing APIManager patterns

**Scale/Scope**:

- Expected ~10-50 chronicle entries per year
- ~20-30 active users posting comments
- Average 3-10 comments per chronicle entry
- Rich text content: max 5,000 characters per entry

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Non-Negotiable Principles

| Principle                          | Status  | Compliance Notes                                                                                                                                                                        |
| ---------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Type Safety First**           | ✅ PASS | All entities, responses, props will be strictly typed. Interfaces for ChronicleEntry, Comment, and all API responses.                                                                   |
| **II. Component Architecture**     | ✅ PASS | Functional components only: `ChronicleList`, `ChronicleEntry`, `ChronicleEditor`, `CommentSection`, `CommentForm`, `CommentItem`. Each has single responsibility.                       |
| **III. State Management**          | ✅ PASS | Redux slice for chronicle entries (caching, optimistic updates). Local state for UI (editor open/close, form validation).                                                               |
| **IV. User Experience Excellence** | ✅ PASS | Mobile-first design, loading spinners during async ops, error messages, keyboard navigation, ARIA labels, FluentUI motion tokens.                                                       |
| **V. Code Quality Standards**      | ✅ PASS | Follows DRY principle, consistent formatting, logical file structure (`components/chronicle/`, `services/chronicleService.ts`, `store/chronicleSlice.ts`).                              |
| **VI. API Request Management**     | ✅ PASS | Use existing request deduplication utility. Axios interceptors for auth headers. Redux caching with TTL. AbortController for unmounted components. No duplicate chronicle list fetches. |

### Technology Stack Compliance

| Requirement              | Status  | Notes                                                                 |
| ------------------------ | ------- | --------------------------------------------------------------------- |
| React 19.x               | ✅ PASS | Using existing React setup with hooks                                 |
| TypeScript 4.9+ (strict) | ✅ PASS | Complete type coverage for all new code                               |
| FluentUI 9               | ✅ PASS | `Text`, `Button`, `Card`, `TextField`, `Spinner`, `MessageBar` for UI |
| Redux Toolkit 2.x        | ✅ PASS | `createSlice`, `createAsyncThunk` for chronicle/comments state        |
| React Router 7.x         | ✅ PASS | Start page already exists; no new routes required                     |
| Axios                    | ✅ PASS | NEW dependency - replaces fetch for this feature (user requirement)   |

### Gates Summary

**All gates PASSED** - Proceed to Phase 0 research

---

## Project Structure

### Documentation (this feature)

```text
specs/001-chronicle-admin-comments/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── chronicle-api.yaml  # OpenAPI spec for chronicle endpoints
│   └── comments-api.yaml   # OpenAPI spec for comment endpoints
├── checklists/
│   └── requirements.md  # Quality checklist (already completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── AppLayout.tsx                  # Existing - hosts pages
│   ├── Navigation.tsx                 # Existing
│   ├── PageContainer.tsx              # Existing
│   ├── PageHeader.tsx                 # Existing
│   └── chronicle/                     # NEW - chronicle feature components
│       ├── ChronicleList.tsx         # Display list of chronicle entries
│       ├── ChronicleCard.tsx         # Single chronicle entry card
│       ├── ChronicleEditor.tsx       # Admin create/edit form with rich text
│       ├── ChronicleDeleteDialog.tsx # Confirmation dialog for deletion
│       ├── CommentSection.tsx        # Comments container
│       ├── CommentList.tsx           # Display list of comments
│       ├── CommentItem.tsx           # Single comment display with edit
│       ├── CommentForm.tsx           # Post/edit comment form
│       └── index.ts                  # Barrel exports
│
├── pages/
│   ├── Home.tsx                       # MODIFIED - add Chronicle section
│   ├── Login.tsx                      # Existing
│   ├── Profile.tsx                    # Existing
│   ├── Rounds.tsx                     # Existing
│   └── Standings.tsx                  # Existing
│
├── services/
│   ├── APIManager.ts                  # Existing (fetch-based)
│   ├── CommentsService.ts             # Existing (fetch-based) - NOT USED for chronicle comments
│   ├── NewsService.ts                 # Existing (fetch-based)
│   ├── chronicleService.ts            # NEW - axios-based API client for chronicle
│   ├── chronicleCommentsService.ts    # NEW - axios-based API client for chronicle comments
│   └── axiosConfig.ts                 # NEW - axios instance with auth interceptors
│
├── store/
│   ├── store.ts                       # MODIFIED - add chronicle reducer
│   ├── roundsSlice.ts                 # Existing
│   ├── chronicleSlice.ts              # NEW - chronicle entries state
│   └── chronicleCommentsSlice.ts      # NEW - comments state per entry
│
├── types/
│   ├── round.ts                       # Existing
│   ├── svenskaspel.ts                 # Existing
│   ├── chronicle.ts                   # NEW - ChronicleEntry, ChronicleState interfaces
│   └── comment.ts                     # NEW - ChronicleComment interface (distinct from existing NewsComment)
│
├── utils/
│   ├── authHelpers.ts                 # Existing - getAuthHeaders, isAuthenticated
│   ├── authToken.ts                   # Existing
│   ├── requestDeduplication.ts        # Existing - reuse for axios
│   ├── retryWithBackoff.ts            # Existing
│   ├── sanitizeHtml.ts                # NEW - XSS prevention for rich text
│   └── userRoles.ts                   # NEW - check if user is admin
│
├── App.tsx                            # Existing - router config (no changes needed)
├── index.tsx                          # Existing - Redux provider already setup
└── ...

tests/                                  # Test files mirror src/ structure
└── components/
    └── chronicle/
        ├── ChronicleList.test.tsx
        ├── ChronicleEditor.test.tsx
        └── CommentSection.test.tsx
```

**Structure Decision**: Web application (frontend single project). All new chronicle/commenting functionality is client-side React components consuming REST APIs provided by existing ASP.NET Core backend. Axios integration is isolated to new chronicle services to avoid disrupting existing fetch-based APIManager patterns. Backend API endpoints will be created separately (out of scope for thisplan, mentioned in `contracts/` for reference).

---

## Complexity Tracking

| Violation                                                    | Why Needed                                                                                                                                                                                                     | Simpler Alternative Rejected Because                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Adding axios alongside existing fetch**                    | User explicitly requested axios for backend API requests. Axios provides interceptors for centralized auth header injection, better error handling, and automatic JSON transformation.                         | Continuing with fetch would require refactoring existing request deduplication utilities to work with axios patterns, or forcing this feature to use patterns inconsistent with user's preference. Axios is isolated to new chronicle services only, minimizing impact on existing code. |
| **Separate comment types** (ChronicleComment vs NewsComment) | Chronicle comments have different edit capabilities (edit by creator/admin with attribution) compared to existing news comments. Separate interfaces prevent confusion and allow independent schema evolution. | Reusing NewsComment would require adding optional fields (EditedBy, LastEditedDate) that don't apply to news comments, violating single responsibility and causing type confusion.                                                                                                       |

**No constitutional violations** - all complexity is justified and documented.

---
