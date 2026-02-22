# Tasks: Chronicle with Admin Editing and Comments

**Input**: Design documents from `/specs/001-chronicle-admin-comments/`  
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [x] T001 Install axios, Lexical, DOMPurify, jwt-decode packages: `npm install axios@^1.8.0 lexical@^0.12.0 @lexical/react@^0.12.0 @lexical/html@^0.12.0 @lexical/list@^0.12.0 @lexical/link@^0.12.0 @lexical/rich-text@^0.12.0 dompurify@^3.0.0 isomorphic-dompurify@^2.0.0 jwt-decode@^4.0.0`
- [x] T002 [P] Install TypeScript type definitions: `npm install --save-dev @types/dompurify@^3.0.0`
- [x] T003 Create src/components/chronicle/ directory structure
- [x] T004 Verify existing dependencies (React 19.x, Redux Toolkit 2.x, FluentUI 9.x, React Router 7.x)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Axios Configuration & Services Setup

- [x] T005 Create axios instance with auth interceptors in src/services/axiosConfig.ts (auto-inject Bearer token, handle 401)

### Type Definitions

- [x] T006 [P] Define chronicle types in src/types/chronicle.ts (ChronicleEntry, CreateChronicleEntryRequest, UpdateChronicleEntryRequest, ChronicleEntriesResponse)
- [x] T007 [P] Define comment types in src/types/comment.ts (ChronicleComment, CreateCommentRequest, UpdateCommentRequest, ChronicleCommentsResponse)

### Utility Functions

- [x] T008 [P] Create HTML sanitization utilities in src/utils/sanitizeHtml.ts (sanitizeChronicleHtml with DOMPurify for allowed tags: p/strong/em/a/ul/ol/li/h1-h3, sanitizeCommentText strips all HTML)
- [x] T009 [P] Create admin role detection utility in src/utils/userRoles.ts (isCurrentUserAdmin, getCurrentUserRole using jwt-decode)

### Service Layer Skeleton

- [x] T010 Create chronicleService.ts in src/services/ (empty, will be populated in US1/US2)
- [x] T011 Create chronicleCommentsService.ts in src/services/ (empty, will be populated in US3/US4)

### Redux Store Setup

- [x] T012 [P] Create chronicleSlice.ts in src/store/ (ChronicleState interface, initial state with cache TTL 5 min, empty reducers/thunks)
- [x] T013 [P] Create chronicleCommentsSlice.ts in src/store/ (ChronicleCommentsState interface, commentsByEntryId Record, initial state)
- [x] T014 Register chronicle and chronicleComments reducers in src/store/store.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Chronicle on Start Page (Priority: P1) 🎯 MVP

**Goal**: All users can view the chronicle (news/announcements) when they visit the start page, displaying the latest updates in reverse chronological order.

**Independent Test**: Navigate to start page and verify chronicle entries are displayed with title, content, author, and timestamp. Verify "No announcements yet" message when no entries exist.

### Implementation for User Story 1

- [x] T015 [US1] Implement fetchChronicleEntries async thunk in src/store/chronicleSlice.ts (GET /chronicle with cache check, TTL 5 min)
- [x] T016 [US1] Implement getChronicleEntries method in src/services/chronicleService.ts (axios GET /chronicle with requestDeduplicator and retryWithBackoff)
- [x] T017 [P] [US1] Create ChronicleList component in src/components/chronicle/ChronicleList.tsx (fetch entries via Redux, loading spinner, error message, empty state "No announcements yet")
- [x] T018 [P] [US1] Create ChronicleCard component in src/components/chronicle/ChronicleCard.tsx (display title, content with dangerouslySetInnerHTML, author alias, formatted timestamp using Intl.DateTimeFormat, "Edited" indicator if lastEditedDate exists)
- [x] T019 [US1] Create barrel exports in src/components/chronicle/index.ts (export ChronicleList, ChronicleCard)
- [x] T020 [US1] Integrate ChronicleList into Home.tsx in src/pages/Home.tsx (add Chronicle section with PageHeader "Chronicle", render ChronicleList)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can view chronicle entries on start page in reverse chronological order

---

## Phase 4: User Story 2 - Admin Create and Edit Chronicle Entries (Priority: P1) 🎯 MVP

**Goal**: Administrators can create new chronicle entries and edit existing ones to communicate important league information, updates, and announcements.

**Independent Test**: Log in as administrator, click "Add Chronicle Entry", fill form with title and content, save, and verify entry appears on start page. Edit an existing entry and verify changes persist.

### Implementation for User Story 2

- [x] T021 [US2] Implement createChronicleEntry async thunk in src/store/chronicleSlice.ts (POST /chronicle, optimistic update, invalidate cache)
- [x] T022 [US2] Implement updateChronicleEntry async thunk in src/store/chronicleSlice.ts (PUT /chronicle/{id}, optimistic update, invalidate cache)
- [x] T023 [US2] Implement deleteChronicleEntry async thunk in src/store/chronicleSlice.ts (DELETE /chronicle/{id}, optimistic update, invalidate cache)
- [x] T024 [US2] Implement createChronicleEntry method in src/services/chronicleService.ts (axios POST /chronicle)
- [x] T025 [US2] Implement updateChronicleEntry method in src/services/chronicleService.ts (axios PUT /chronicle/{id})
- [x] T026 [US2] Implement deleteChronicleEntry method in src/services/chronicleService.ts (axios DELETE /chronicle/{id})
- [x] T027 [P] [US2] Create ChronicleEditor component in src/components/chronicle/ChronicleEditor.tsx (Lexical editor with RichTextPlugin, HeadingNode, ListNode, LinkNode, form with title TextField, content editor, Save/Cancel buttons, validation: title max 200 chars, content max 5000 chars)
- [x] T028 [P] [US2] Create ChronicleDeleteDialog component in src/components/chronicle/ChronicleDeleteDialog.tsx (FluentUI Dialog with confirmation "This will also delete X comments", Delete/Cancel buttons)
- [x] T029 [US2] Add "Add Chronicle Entry" button to ChronicleList.tsx (visible only if isCurrentUserAdmin, opens ChronicleEditor in create mode)
- [x] T030 [US2] Add "Edit" and "Delete" buttons to ChronicleCard.tsx (visible only if isCurrentUserAdmin on hover/focus, Edit opens ChronicleEditor in edit mode, Delete opens ChronicleDeleteDialog)
- [x] T031 [US2] Update barrel exports in src/components/chronicle/index.ts (export ChronicleEditor, ChronicleDeleteDialog)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can view chronicle, admins can create/edit/delete entries

---

## Phase 5: User Story 3 - Post and View Comments (Priority: P2)

**Goal**: Authenticated users can post comments on chronicle entries and view comments from other users, enabling community discussion about league news.

**Independent Test**: Log in as regular user, view a chronicle entry, post a comment, refresh page, and verify comment appears below the entry with username and timestamp.

### Implementation for User Story 3

- [x] T032 [US3] Implement fetchComments async thunk in src/store/chronicleCommentsSlice.ts (GET /chronicle/{id}/comments with skip/take pagination, default 20 comments, hasMore flag)
- [x] T033 [US3] Implement createComment async thunk in src/store/chronicleCommentsSlice.ts (POST /chronicle/{id}/comments, optimistic update)
- [x] T034 [US3] Implement getComments method in src/services/chronicleCommentsService.ts (axios GET /chronicle/{chronicleId}/comments with skip/take params, requestDeduplicator)
- [x] T035 [US3] Implement createComment method in src/services/chronicleCommentsService.ts (axios POST /chronicle/{chronicleId}/comments)
- [x] T036 [P] [US3] Create CommentSection component in src/components/chronicle/CommentSection.tsx (container with "Comments" header, comment count, CommentList, CommentForm, "Load More" button if hasMore)
- [x] T037 [P] [US3] Create CommentList component in src/components/chronicle/CommentList.tsx (render list of CommentItem components in chronological order oldest first, empty state "No comments yet. Be the first to comment!")
- [x] T038 [P] [US3] Create CommentItem component in src/components/chronicle/CommentItem.tsx (display commenter alias, comment text sanitized with sanitizeCommentText, formatted timestamp, "Edited" indicator if lastEditedDate exists)
- [x] T039 [P] [US3] Create CommentForm component in src/components/chronicle/CommentForm.tsx (TextField for comment input, "Post Comment" button, validation: 1-500 chars, disabled if not authenticated with "Log in to comment" message)
- [x] T040 [US3] Integrate CommentSection into ChronicleCard.tsx (render below entry content, pass chronicleEntryId prop)
- [x] T041 [US3] Update barrel exports in src/components/chronicle/index.ts (export CommentSection, CommentList, CommentItem, CommentForm)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work - users can view chronicle, admins can manage entries, all authenticated users can post and view comments

---

## Phase 6: User Story 4 - Edit Own Comments (Priority: P3)

**Goal**: Users can edit their own comments, and administrators can edit any comment, providing moderation capabilities and allowing users to correct mistakes.

**Independent Test**: Post a comment as a user, verify an "Edit" button appears on your own comment, click it, modify the text, save changes, and verify the updated comment appears with an "Edited" indicator.

### Implementation for User Story 4

- [x] T042 [US4] Implement updateComment async thunk in src/store/chronicleCommentsSlice.ts (PUT /chronicle/{chronicleId}/comments/{commentId}, optimistic update)
- [x] T043 [US4] Implement updateComment method in src/services/chronicleCommentsService.ts (axios PUT /chronicle/{chronicleId}/comments/{commentId})
- [x] T044 [US4] Add edit state to CommentItem.tsx (isEditing boolean, TextField for editing, Save/Cancel buttons, validation: 1-500 chars)
- [x] T045 [US4] Add "Edit" button to CommentItem.tsx (visible on hover/focus if current user is comment author OR isCurrentUserAdmin, toggles isEditing state)
- [x] T046 [US4] Add edit attribution to CommentItem.tsx (display "Edited by [Admin Name]" if editedById differs from authorId, only show editedByAlias when admin edits)

**Checkpoint**: All user stories should now be independently functional - users can view chronicle, admins can manage entries, authenticated users can post/edit comments

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T047 [P] Add unsaved changes warning to ChronicleEditor.tsx (show confirmation dialog before navigating away with unsaved changes)
- [ ] T048 [P] Add loading states to all async operations (Spinner components during chronicle fetch, comment fetch, create/edit/delete operations)
- [ ] T049 [P] Add error handling for network failures (MessageBar with error message, retry button)
- [ ] T050 [P] Add optimistic UI updates for comment creation/editing (immediately show new/edited comment, rollback on error)
- [ ] T051 Add ARIA labels for accessibility (keyboard navigation, screen reader support for Chronicle and Comments sections)
- [ ] T052 Add responsive design adjustments for mobile (≥320px, touch-friendly buttons, collapsible comment sections)
- [ ] T053 [P] Update quickstart.md with actual implementation notes and gotchas encountered
- [ ] T054 Verify all TypeScript types are strict (no `any` types, strict mode enabled)
- [ ] T055 Run Constitution compliance check (verify Principle VI: no duplicate requests, cache TTL working, request deduplication active)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on User Story 1 (uses ChronicleList and ChronicleCard components) - Integrates admin CRUD into existing view
- **User Story 3 (P2)**: Depends on User Story 1 (CommentSection integrates into ChronicleCard) - Otherwise independently testable
- **User Story 4 (P3)**: Depends on User Story 3 (adds edit functionality to CommentItem) - Extends existing comment display

### Within Each User Story

#### User Story 1 (View Chronicle)

1. Redux thunk (T015) and service method (T016) can be done in parallel with components (T017, T018)
2. ChronicleList (T017) and ChronicleCard (T018) can be built in parallel
3. Barrel exports (T019) after components complete
4. Integration into Home.tsx (T020) after ChronicleList is ready

#### User Story 2 (Admin Create/Edit)

1. Redux thunks (T021-T023) and service methods (T024-T026) first
2. ChronicleEditor (T027) and ChronicleDeleteDialog (T028) can be built in parallel
3. Update ChronicleList (T029) and ChronicleCard (T030) to add admin buttons
4. Barrel exports (T031) after new components complete

#### User Story 3 (Post/View Comments)

1. Redux thunks (T032-T033) and service methods (T034-T035) first
2. All 4 components (T036-T039) can be built in parallel: CommentSection, CommentList, CommentItem, CommentForm
3. Integration into ChronicleCard (T040) after CommentSection is ready
4. Barrel exports (T041) after new components complete

#### User Story 4 (Edit Own Comments)

1. Redux thunk (T042) and service method (T043) first
2. Update CommentItem with edit state (T044), edit button (T045), and attribution (T046) - must be sequential

### Parallel Opportunities

- **Setup**: T002 (type definitions) can run parallel with T001 (package install)
- **Foundational Phase 2**:
  - T006 (chronicle types) and T007 (comment types) can run in parallel
  - T008 (sanitization utils) and T009 (admin role utils) can run in parallel
  - T012 (chronicleSlice) and T013 (chronicleCommentsSlice) can run in parallel
- **User Story 1**: T017 (ChronicleList) and T018 (ChronicleCard) can run in parallel
- **User Story 2**: T027 (ChronicleEditor) and T028 (ChronicleDeleteDialog) can run in parallel
- **User Story 3**: T036 (CommentSection), T037 (CommentList), T038 (CommentItem), T039 (CommentForm) can all run in parallel
- **Polish**: T047 (unsaved warning), T048 (loading states), T049 (error handling), T050 (optimistic updates), T053 (quickstart update) can all run in parallel

### Full Parallel Example for User Story 3

Once T032-T035 (Redux + services) are complete:

```bash
# 4 developers can work simultaneously on different components:
Developer A: T036 - CommentSection.tsx
Developer B: T037 - CommentList.tsx
Developer C: T038 - CommentItem.tsx
Developer D: T039 - CommentForm.tsx

# After all 4 complete, one developer integrates:
Developer A: T040 - Integrate CommentSection into ChronicleCard.tsx
Developer A: T041 - Update barrel exports
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only - Both P1)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T014) - **CRITICAL CHECKPOINT**
3. Complete Phase 3: User Story 1 (T015-T020) - View chronicle entries
4. Complete Phase 4: User Story 2 (T021-T031) - Admin CRUD operations
5. **STOP and VALIDATE**: Test that:
   - Regular users can view chronicle entries on start page
   - Admins can create, edit, and delete entries
   - Chronicle section loads <2s, displays in reverse chronological order
6. **Deploy/demo MVP** - Core value delivered!

### Incremental Delivery

1. **Foundation** (Setup + Foundational) → Infrastructure ready
2. **MVP v1** (+ User Story 1) → Users can view chronicle (read-only)
3. **MVP v2** (+ User Story 2) → Admins can manage chronicle content ✅ **DEPLOY**
4. **Enhancement v1** (+ User Story 3) → Users can post and view comments ✅ **DEPLOY**
5. **Enhancement v2** (+ User Story 4) → Users can edit comments, admins can moderate ✅ **DEPLOY**
6. **Polish** (+ Phase 7) → Production-ready with error handling, accessibility ✅ **FINAL RELEASE**

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

1. **Foundation (1 week)**: All 3 developers complete Phase 1 & 2 together
2. **MVP Sprint (1 week)**:
   - Developer A: User Story 1 (View Chronicle) - T015-T020
   - Developer B: Starts User Story 2 prep (can begin T027 ChronicleEditor, T028 ChronicleDeleteDialog in parallel)
   - Developer C: Works on User Story 3 prep (can begin T036-T039 comment components if foundational is done)
3. **Integration Sprint (1 week)**:
   - Developer A: Finishes User Story 2 integration (T029-T031)
   - Developer B: Finishes User Story 3 integration (T040-T041)
   - Developer C: Completes User Story 4 (T042-T046)
4. **Polish Sprint (3 days)**: All 3 developers work on Phase 7 tasks in parallel

---

## Task Breakdown Summary

- **Total Tasks**: 55
- **Phase 1 (Setup)**: 4 tasks
- **Phase 2 (Foundational)**: 10 tasks (BLOCKING - must complete before ANY user story)
- **Phase 3 (US1 - View Chronicle)**: 6 tasks
- **Phase 4 (US2 - Admin CRUD)**: 11 tasks
- **Phase 5 (US3 - Post/View Comments)**: 10 tasks
- **Phase 6 (US4 - Edit Comments)**: 5 tasks
- **Phase 7 (Polish)**: 9 tasks

### Parallel Opportunities

- **19 tasks** marked with [P] can run in parallel with other tasks (35% of tasks)

### MVP Scope

- **MVP = Phase 1 + Phase 2 + Phase 3 + Phase 4** (31 tasks total)
- Delivers core value: Users view chronicle, admins manage content
- Can be completed in 2-3 weeks with 1-2 developers

### Enhancements

- **P2 Enhancement** (User Story 3): +10 tasks → Adds commenting system
- **P3 Enhancement** (User Story 4): +5 tasks → Adds comment editing/moderation

---

## Notes

- All tasks follow strict checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- [P] tasks = Different files, no dependencies on other in-progress tasks within same phase
- [Story] label maps task to specific user story for traceability (US1, US2, US3, US4)
- Each user story is independently completable and testable after foundational phase
- No test tasks included (tests not explicitly requested in feature specification)
- Stop at checkpoints to validate each user story works independently before proceeding
- Constitution Principle VI compliance: T015 (cache TTL), T016 (request deduplication), T055 (final compliance check)
- Commit after completing each task or logical group of parallel tasks
