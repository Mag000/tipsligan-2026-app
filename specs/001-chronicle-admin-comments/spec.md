# Feature Specification: Chronicle with Admin Editing and Comments

**Feature Branch**: `001-chronicle-admin-comments`  
**Created**: 2026-02-19  
**Status**: Draft  
**Input**: User description: "The app has a startpage with chronicle, editable for administrators, and a comment function below the chronicle."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Chronicle on Start Page (Priority: P1) 🎯 MVP

All users can view the chronicle (news/announcements) when they visit the start page, displaying the latest updates about the betting league in reverse chronological order.

**Why this priority**: Core MVP functionality - provides immediate value to all users by displaying important league information. Every user needs to see announcements.

**Independent Test**: Navigate to start page and verify chronicle entries are displayed with title, content, author, and timestamp. Can be tested by viewing the page without any admin functionality.

**Acceptance Scenarios**:

1. **Given** a user visits the start page, **When** the page loads, **Then** they see a "Chronicle" section displaying recent entries
2. **Given** multiple chronicle entries exist, **When** viewing the chronicle, **Then** entries are displayed in reverse chronological order (newest first)
3. **Given** a chronicle entry exists, **When** viewing it, **Then** it displays: title, content/body text, author name, and timestamp
4. **Given** no chronicle entries exist, **When** viewing the start page, **Then** display "No announcements yet" message
5. **Given** a chronicle entry has long content, **When** viewing the list, **Then** show a preview/excerpt with "Read more" option

---

### User Story 2 - Admin Create and Edit Chronicle Entries (Priority: P1) 🎯 MVP

Administrators can create new chronicle entries and edit existing ones to communicate important league information, updates, and announcements.

**Why this priority**: Essential admin functionality - without this, the chronicle cannot be populated. Blocking requirement for Story 1 to have any content.

**Independent Test**: Log in as administrator, click "Add Chronicle Entry", fill form with title and content, save, and verify entry appears on start page. Edit an existing entry and verify changes persist.

**Acceptance Scenarios**:

1. **Given** a user with administrator role is logged in, **When** visiting the start page, **Then** they see an "Add Chronicle Entry" button
2. **Given** an administrator clicks "Add Chronicle Entry", **When** the form appears, **Then** it includes fields for: title (required), content (required, rich text)
3. **Given** an administrator fills the form with valid data, **When** they click "Save", **Then** the entry is created with current timestamp and admin's name as author
4. **Given** an administrator views an existing chronicle entry, **When** they hover/click it, **Then** they see "Edit" and "Delete" actions
5. **Given** an administrator clicks "Edit" on an entry, **When** the editor opens, **Then** it displays the existing title and content in editable fields
6. **Given** an administrator edits an entry, **When** they save changes, **Then** the entry is updated and displays "Edited" indicator with edit timestamp
7. **Given** an administrator clicks "Delete" on an entry, **When** they confirm the action, **Then** the entry is permanently removed from the chronicle
8. **Given** a non-administrator user is logged in, **When** viewing the chronicle, **Then** they do NOT see "Add", "Edit", or "Delete" buttons

---

### User Story 3 - Post and View Comments (Priority: P2)

Authenticated users can post comments on chronicle entries and view comments from other users, enabling community discussion about league news.

**Why this priority**: Enhances engagement but not required for MVP. Chronicle can function without comments initially.

**Independent Test**: Log in as regular user, view a chronicle entry, post a comment, refresh page, and verify comment appears below the entry with username and timestamp.

**Acceptance Scenarios**:

1. **Given** an authenticated user views a chronicle entry, **When** scrolling below the entry, **Then** they see a "Comments" section
2. **Given** a chronicle entry has no comments, **When** viewing the comments section, **Then** display "No comments yet. Be the first to comment!"
3. **Given** a chronicle entry has existing comments, **When** viewing the comments section, **Then** comments are displayed in chronological order (oldest first) with: commenter name, comment text, and timestamp
4. **Given** an authenticated user is in the comments section, **When** they focus on the comment input, **Then** a text area appears with "Post Comment" button
5. **Given** a user types a comment (1-500 characters), **When** they click "Post Comment", **Then** the comment is added and appears immediately in the comments list
6. **Given** a user tries to post an empty comment, **When** they click "Post Comment", **Then** show validation error "Comment cannot be empty"
7. **Given** a user tries to post a comment longer than 500 characters, **When** they click "Post Comment", **Then** show validation error "Comment must be 500 characters or less"
8. **Given** a non-authenticated user views a chronicle entry, **When** viewing the comments section, **Then** they see existing comments but the comment input is replaced with "Log in to comment"

---

### User Story 4 - Edit Own Comments (Priority: P3)

Users can edit their own comments, and administrators can edit any comment, providing moderation capabilities and allowing users to correct mistakes.

**Why this priority**: Nice-to-have for user control and admin moderation. Can be added after basic commenting works. Editing is preferred over deletion to preserve conversation context.

**Independent Test**: Post a comment as a user, verify an "Edit" button appears on your own comment, click it, modify the text, save changes, and verify the updated comment appears with an "Edited" indicator.

**Acceptance Scenarios**:

1. **Given** a user views their own comment, **When** hovering/focusing on it, **Then** an "Edit" icon/button appears
2. **Given** a user clicks "Edit" on their own comment, **When** the editor opens, **Then** the existing comment text appears in an editable text area
3. **Given** a user edits their comment text, **When** they click "Save", **Then** the comment is updated and displays an "Edited" indicator with edit timestamp
4. **Given** a user tries to save an edited comment that is empty, **When** clicking "Save", **Then** show validation error "Comment cannot be empty"
5. **Given** a user tries to save an edited comment longer than 500 characters, **When** clicking "Save", **Then** show validation error "Comment must be 500 characters or less"
6. **Given** a user views another user's comment, **When** viewing it, **Then** no "Edit" button appears
7. **Given** an administrator views any comment, **When** viewing it, **Then** an "Edit" button appears
8. **Given** an administrator edits someone else's comment, **When** saved, **Then** the comment displays "Edited by [Admin Name]" with timestamp

---

### Edge Cases

- What happens when two administrators try to edit the same chronicle entry simultaneously? _(Implement last-write-wins or optimistic locking)_
- How does the system handle chronicle entries with extremely long content (10,000+ characters)? _(Enforce maximum length; suggest 5,000 characters)_
- What happens when a chronicle entry receives hundreds of comments? _(Implement pagination - e.g., show 20 comments per page with "Load More" button)_
- How are deleted chronicle entries handled if users have commented on them? _(Comments are cascade-deleted when parent entry is deleted; warn admin before deletion: "This will also delete X comments")_
- What happens if a user's account is deleted but they have existing comments? _(Comments remain but show "[Deleted User]" as author to preserve conversation context)_
- How is XSS prevented in chronicle content and comments? _(Sanitize HTML input; for chronicle entries allow bold, italic, links, lists, headers; for comments allow plain text only; strip all script tags)_
- What happens when two users try to edit the same comment simultaneously? _(Implement last-write-wins or optimistic locking with conflict detection)_
- What happens when navigating away while editing a chronicle entry with unsaved changes? _(Show "Unsaved changes will be lost" confirmation dialog)_

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display a "Chronicle" section on the start page visible to all authenticated users
- **FR-002**: System MUST display chronicle entries in reverse chronological order (newest first)
- **FR-003**: Each chronicle entry MUST display: title, content excerpt/full text, author name, and creation timestamp
- **FR-004**: System MUST identify users with administrator role distinctly from regular users
- **FR-005**: Administrators MUST be able to create new chronicle entries with a title (max 200 chars) and content (max 5,000 chars, rich text)
- **FR-006**: Administrators MUST be able to edit existing chronicle entries (title and content)
- **FR-007**: Administrators MUST be able to delete chronicle entries with confirmation prompt
- **FR-008**: System MUST record and display who created/edited each chronicle entry and when
- **FR-009**: System MUST display a "Comments" section below each chronicle entry
- **FR-010**: Authenticated users MUST be able to post comments (1-500 characters) on chronicle entries
- **FR-011**: System MUST display comments in chronological order (oldest first) with commenter name and timestamp
- **FR-012**: System MUST prevent empty comments from being posted
- **FR-013**: System MUST sanitize chronicle content and comments to prevent XSS attacks (allow bold, italic, links, lists, headers for chronicle; plain text only for comments)
- **FR-014**: Users MUST be able to edit their own comments within 500 character limit
- **FR-015**: Administrators MUST be able to edit any user's comment with edit attribution
- **FR-016**: Non-authenticated users MUST be able to view chronicle entries and comments but NOT post or edit comments
- **FR-017**: System MUST persist chronicle entries and comments to database
- **FR-018**: Chronicle entry deletion MUST cascade delete all associated comments with admin warning
- **FR-019**: System MUST validate content length limits: chronicle title (200 chars), chronicle content (5,000 chars), comments (500 chars)
- **FR-020**: System MUST display "Edited" indicator on modified chronicle entries with edit timestamp
- **FR-021**: System MUST format timestamps in absolute format (e.g., "Feb 19, 2026 14:30") for both chronicle entries and comments
- **FR-022**: Rich text editor for chronicle content MUST support standard formatting: bold, italic, links, unordered/ordered lists, and headers (H1-H3)
- **FR-023**: System MUST display "Edited" indicator on modified comments with edit timestamp
- **FR-024**: System MUST record who edited a comment (original author or admin) and display edit attribution for admin edits

### Key Entities

- **ChronicleEntry**: Represents a news/announcement post
  - Attributes: ID, Title, Content (rich text), AuthorID, CreatedDate, LastEditedDate, EditedBy (optional)
  - Relationships: Created by User (admin), has many Comments

- **Comment**: User response to a chronicle entry
  - Attributes: ID, Text (plain text, 500 char max), AuthorID, ChronicleEntryID, CreatedDate, LastEditedDate (optional), EditedByID (optional, for admin edits)
  - Relationships: Belongs to ChronicleEntry, created by User, optionally edited by User (admin)

- **User**: Existing entity (from authentication system)
  - Extended attributes: IsAdministrator (boolean role flag)
  - Relationships: Can create ChronicleEntries (if admin), can create Comments

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All authenticated users can view the chronicle section on the start page within 2 seconds of page load
- **SC-002**: Administrators can create a new chronicle entry in under 1 minute (including writing content and saving)
- **SC-003**: Administrators can edit an existing chronicle entry in under 1 minute
- **SC-004**: Users can post a comment on a chronicle entry in under 15 seconds
- **SC-005**: Comments appear immediately after posting without requiring page refresh (or refresh completes in under 1 second)
- **SC-006**: 90% of users successfully find and read the most recent chronicle entry on first visit to start page
- **SC-007**: System prevents 100% of XSS attempts through content sanitization
- **SC-008**: Chronicle section loads and displays correctly on desktop, tablet, and mobile devices (responsive design)
- **SC-009**: Zero data loss occurs during chronicle entry or comment creation/editing
- **SC-010**: Administrators receive confirmation feedback (success message) within 1 second of saving/editing/deleting actions

### User Satisfaction Goals

- **SC-011**: Users report that the chronicle provides valuable league information (target: 80% agree in user survey)
- **SC-012**: Administrators find the chronicle management interface intuitive and easy to use (target: 90% satisfaction)
- **SC-013**: Comment discussions increase user engagement with the platform (target: 40% of users post at least one comment within first month)

## Assumptions

1. **Authentication system exists**: User authentication is already implemented; users have roles (admin vs regular user)
2. **User identification**: System can identify current logged-in user and their role
3. **Database available**: Backend has database access for persisting chronicle entries and comments
4. **API infrastructure**: Backend API endpoints can be created/modified to support chronicle CRUD operations
5. **FluentUI components**: Project uses FluentUI 9 components that can be adapted for chronicle and comment UI
6. **Responsive design standards**: Existing app has established responsive breakpoints and patterns to follow

## Out of Scope

- **Email notifications** when new chronicle entries or comments are posted (future enhancement)
- **Comment threading/replies** (flat comment structure only in v1)
- **Rich text formatting in comments** (plain text only; rich text only for chronicle entries)
- **Like/reaction system** for chronicle entries or comments
- **Comment deletion** (editing is supported; permanent deletion is not available)
- **Comment edit history/versioning** (only the current version is displayed with "Edited" indicator)
- **Draft chronicle entries** (entries are published immediately upon creation)
- **Pinning entries** to keep specific announcements at the top regardless of date
- **Read/unread tracking** for chronicle entries
- **Search/filter chronicle** by date or keyword
- **Attachments/images in comments** (text only)

## Technical Considerations (Non-prescriptive)

While implementation details will be determined in the planning phase, consider:

- **Data validation**: Both frontend and backend validation for content length and required fields
- **Security**: SQL injection prevention, XSS sanitization, CSRF protection, authorization checks
- **Performance**: Consider pagination for large numbers of entries/comments, database indexing on timestamps
- **User experience**: Loading states, error messages, confirmation dialogs, success feedback
- **Accessibility**: Keyboard navigation, screen reader support, ARIA labels
- **Mobile responsiveness**: Touch-friendly comment input, appropriate text sizes, collapsible sections

## Additional Considerations

For future planning phase discussion:

1. **Comment pagination threshold**: How many comments before implementing "Load More" pagination? (Suggest 20-50 as reasonable default)
2. **Image support**: Should chronicle entries support embedded images in future versions? If yes, what upload size limits?
3. **Edit time window**: Should there be a time limit on how long after posting a comment can be edited? (e.g., 15 minutes) Or unlimited editing?

## Definition of Done

This feature is complete when:

- [ ] Chronicle section appears on start page for all authenticated users
- [ ] Administrators can create, edit, and delete chronicle entries
- [ ] All users can view chronicle entries with proper formatting
- [ ] Authenticated users can post comments on chronicle entries
- [ ] Users can edit their own comments; admins can edit any comment with attribution
- [ ] All content is properly sanitized against XSS (chronicle: bold/italic/links/lists/headers allowed; comments: plain text only)
- [ ] Input validation prevents invalid data entry
- [ ] Responsive design works on mobile, tablet, and desktop
- [ ] Loading states and error messages provide clear feedback
- [ ] Database persists all entries and comments reliably
- [ ] All acceptance scenarios in user stories pass testing
- [ ] Code follows project's TypeScript and React conventions
- [ ] Zero TypeScript compilation errors
- [ ] Complies with Constitution Principle VI (no duplicate API requests, proper error handling, Redux state management)
