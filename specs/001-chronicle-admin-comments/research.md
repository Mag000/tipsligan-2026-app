# Research Document: Chronicle with Admin Editing and Comments

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)  
**Phase**: 0 - Outline & Research  
**Date**: 2026-02-19

## Research Overview

This document consolidates technical research for implementing the Chronicle feature. All unknowns from the Technical Context have been resolved through systematic investigation and evaluation.

---

## 1. Rich Text Editor Selection

### Decision: **Lexical** (Meta/Facebook)

**Rationale**:

- Modern React-first editor replacing deprecated Draft.js
- Native TypeScript support with excellent type definitions
- Lightweight core (~22KB, full setup ~40-45KB gzipped)
- Built-in XSS sanitization and security
- React 19.x compatible with hooks-first API
- Accessibility features (ARIA, keyboard navigation) built-in
- Mobile-friendly with touch event support
- Headless architecture for seamless FluentUI 9 styling integration
- Active Meta maintenance (future-proof for 2026+)

**Alternatives Considered**:

- **TipTap**: Equally strong choice; ProseMirror-based with excellent TypeScript. Rejected due to smaller community than Lexical and some premium extensions requiring payment.
- **Slate.js**: Ultimate flexibility but steeper learning curve. Overkill for standard formatting requirements (bold, italic, links, lists, headers).
- **Draft.js**: Deprecated by Meta in favor of Lexical. Not recommended for new projects.
- **Quill**: Mature and stable but not React-native (DOM manipulation). Wrapper dependency creates integration friction.

**Implementation Details**:

```json
{
  "dependencies": {
    "lexical": "^0.12.0",
    "@lexical/react": "^0.12.0",
    "@lexical/html": "^0.12.0",
    "@lexical/list": "^0.12.0",
    "@lexical/link": "^0.12.0",
    "@lexical/rich-text": "^0.12.0"
  }
}
```

**Basic Integration Pattern**:

```typescript
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";

const editorConfig = {
  namespace: "ChronicleEditor",
  theme: {
    // FluentUI-compatible theme tokens
    paragraph: "editor-paragraph",
    heading: { h1: "editor-h1", h2: "editor-h2", h3: "editor-h3" },
    list: { ul: "editor-ul", ol: "editor-ol" },
    link: "editor-link",
  },
  nodes: [HeadingNode, ListNode, ListItemNode, LinkNode],
  onError: (error: Error) => console.error(error),
};
```

**Supported Formatting** (meets FR-022):

- Bold, italic
- Links
- Unordered/ordered lists
- Headers (H1, H2, H3)

**HTML Serialization**:

- Export: `$generateHtmlFromNodes(editor)`
- Import: `$generateNodesFromDOM(editor, dom)`
- Sanitization automatic (never outputs raw HTML)

---

## 2. Axios Configuration and Authentication

### Decision: Axios with Interceptor-Based Auth

**Rationale**:

- User explicitly requested axios for backend API requests
- Interceptors provide centralized auth header injection
- Better error handling than fetch (automatic JSON transformation)
- Native AbortController support (axios 1.8.0+)
- Easy integration with existing `requestDeduplication` and `retryWithBackoff` utilities

**Package Version**:

```json
{
  "dependencies": {
    "axios": "^1.8.0"
  }
}
```

**Implementation Pattern**:

```typescript
// src/services/axiosConfig.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getToken } from "../utils/authHelpers";

const API_BASE_URL = "http://localhost:52259/api";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: Auto-inject Bearer token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: Handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("🔐 401 Unauthorized - clearing token");
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  },
);
```

**Integration with Existing Utilities**:

1. **Request Deduplication**:

```typescript
import { requestDeduplicator } from "../utils/requestDeduplication";
import { axiosInstance } from "./axiosConfig";

export class ChronicleService {
  static async getChronicleEntries() {
    return requestDeduplicator.deduplicate("chronicle-all", async () => {
      const response = await axiosInstance.get("/chronicle");
      return response.data;
    });
  }
}
```

2. **Retry with Backoff**:

```typescript
import { retryWithBackoff } from "../utils/retryWithBackoff";

// Custom retry logic for axios errors
const shouldRetryAxiosError = (error: any): boolean => {
  if (!error.isAxiosError) return false;
  if (!error.response) return true; // Network error
  const status = error.response.status;
  return status >= 500 || status === 408 || status === 429;
};

export class ChronicleService {
  static async getChronicleEntries() {
    return requestDeduplicator.deduplicate("chronicle-all", () =>
      retryWithBackoff(
        async () => {
          const response = await axiosInstance.get("/chronicle");
          return response.data;
        },
        { maxRetries: 3, baseDelay: 1000, shouldRetry: shouldRetryAxiosError },
      ),
    );
  }
}
```

3. **AbortController Support**:

```typescript
// Use native signal parameter (axios 1.8.0+supports AbortSignal directly)
export class ChronicleService {
  static async getChronicleEntries(signal?: AbortSignal) {
    return requestDeduplicator.deduplicate("chronicle-all", async () => {
      const response = await axiosInstance.get("/chronicle", { signal });
      return response.data;
    });
  }
}
```

**Error Handling Pattern**:

```typescript
import { AxiosError } from "axios";

export interface ApiErrorResponse {
  message: string;
  status: number;
  data?: any;
}

export function handleAxiosError(error: unknown): ApiErrorResponse {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      return {
        message: axiosError.response.data?.message || axiosError.message,
        status: axiosError.response.status,
        data: axiosError.response.data,
      };
    }
    return { message: "Network error", status: 0 };
  }
  return { message: "Unknown error", status: 0 };
}
```

---

## 3. HTML Sanitization Strategy

### Decision: DOMPurify with Strict Configuration

**Rationale**:

- Industry-standard library for XSS prevention
- Allows safe HTML subset (bold, italic, links, lists, headers)
- Strips all script tags, event handlers, dangerous attributes
- Well-tested against XSS attacks
- Works with Lexical HTML output

**Package Version**:

```json
{
  "dependencies": {
    "dompurify": "^3.0.0",
    "isomorphic-dompurify": "^2.0.0"
  },
  "devDependencies": {
    "@types/dompurify": "^3.0.0"
  }
}
```

**Implementation**:

```typescript
// src/utils/sanitizeHtml.ts
import DOMPurify from "isomorphic-dompurify";

export interface SanitizeOptions {
  allowLists?: boolean;
  allowLinks?: boolean;
  allowHeadings?: boolean;
}

export function sanitizeChronicleHtml(
  html: string,
  options: SanitizeOptions = {},
): string {
  const {
    allowLists = true,
    allowLinks = true,
    allowHeadings = true,
  } = options;

  const allowedTags = [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    ...(allowLists ? ["ul", "ol", "li"] : []),
    ...(allowLinks ? ["a"] : []),
    ...(allowHeadings ? ["h1", "h2", "h3"] : []),
  ];

  const allowedAttributes = allowLinks ? { a: ["href", "target", "rel"] } : {};

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
  });
}

// For plain text comments (no HTML allowed)
export function sanitizeCommentText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });
}
```

**Usage with Lexical**:

```typescript
import { $generateHtmlFromNodes } from "@lexical/html";
import { sanitizeChronicleHtml } from "../utils/sanitizeHtml";

// Save chronicle entry
const htmlContent = $generateHtmlFromNodes(editor);
const sanitizedHtml = sanitizeChronicleHtml(htmlContent);
// Send sanitizedHtml to backend
```

---

## 4. Admin Role Detection

### Decision: Backend-Provided Role in Token/User Context

**Current Authentication Structure**:

- Token stored in `localStorage` (key: "token")
- `getAuthHeaders()` adds `Authorization: Bearer {token}` header
- Backend returns user info on login (UserId, Alias)

**Implementation Strategy**:

**Option A: Role in JWT Token (Recommended)**

- Backend includes `role` or `isAdmin` claim in JWT token
- Frontend decodes JWT to extract role
- Pattern:

```typescript
// src/utils/userRoles.ts
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  userId: number;
  username: string;
  role?: string; // 'admin' or 'user'
  isAdmin?: boolean;
}

export function isCurrentUserAdmin(): boolean {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = jwtDecode<TokenPayload>(token);
    return payload.role === "admin" || payload.isAdmin === true;
  } catch {
    return false;
  }
}

export function getCurrentUserRole(): "admin" | "user" | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = jwtDecode<TokenPayload>(token);
    return payload.role === "admin" || payload.isAdmin ? "admin" : "user";
  } catch {
    return null;
  }
}
```

**Package**:

```json
{
  "dependencies": {
    "jwt-decode": "^4.0.0"
  }
}
```

**Option B: Dedicated API Endpoint**

- Call `/api/users/me` or `/api/users/current` to get user details including role
- Cache in Redux store
- Pattern:

```typescript
// Redux slice
export const fetchCurrentUser = createAsyncThunk(
  "user/fetchCurrent",
  async () => {
    const response = await axiosInstance.get("/users/me");
    return response.data; // { userId, username, role, isAdmin }
  },
);

// Component usage
const { currentUser } = useAppSelector((state) => state.user);
const isAdmin = currentUser?.isAdmin || currentUser?.role === "admin";
```

**Recommendation**: **Option A (JWT Token)** - Faster (no API call), immediate role access on login, follows JWT best practices. Backend team should add `isAdmin: boolean` claim to JWT token.

---

## 5. Comment Pagination Strategy

### Decision: Load More (Infinite Scroll) with 20 Comments Initial

**Rationale**:

- Average 3-10 comments per chronicle entry (spec)
- Start with showing 20 comments initially
- Add "Load More" button if >20 comments exist
- Infinite scroll for mobile UX (desktop shows button)

**Implementation Pattern**:

```typescript
// API endpoint design (backend contract)
GET /api/chronicle/{chronicleId}/comments?skip=0&take=20
Response: { comments: Comment[], totalCount: number, hasMore: boolean }

// Redux thunk
export const fetchComments = createAsyncThunk(
  'comments/fetch',
  async ({ chronicleId, skip = 0, take = 20 }: CommentParams) => {
    const response = await axiosInstance.get(
      `/chronicle/${chronicleId}/comments?skip=${skip}&take=${take}`
    );
    return response.data;
  }
);

// Slice state
interface CommentsState {
  items: ChronicleComment[];
  totalCount: number;
  hasMore: boolean;
  skip: number;
  take: number;
}

// Component
const CommentSection: React.FC<{ chronicleId: number }> = ({ chronicleId }) => {
  const { items, hasMore, skip, take } = useAppSelector(state => state.comments);
  const dispatch = useAppDispatch();

  const loadMore = () => {
    dispatch(fetchComments({ chronicleId, skip: skip + take, take }));
  };

  return (
    <div>
      {items.map(comment => <CommentItem key={comment.id} comment={comment} />)}
      {hasMore && <Button onClick={loadMore}>Load More Comments</Button>}
    </div>
  );
};
```

**Threshold**: Show pagination UI when comments exceed 20 (configurable via constant).

---

## 6. Redux Caching Strategy

### Decision: TTL-Based Cache with Manual Invalidation

**Pattern** (following existing `roundsSlice.ts`):

```typescript
// src/store/chronicleSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface ChronicleState {
  entries: ChronicleEntry[];
  lastFetched: number | null;
  cacheTTL: number; // 5 minutes = 300000ms
  isLoading: boolean;
  error: string | null;
}

const initialState: ChronicleState = {
  entries: [],
  lastFetched: null,
  cacheTTL: 300000, // 5 minutes
  isLoading: false,
  error: null,
};

export const fetchChronicleEntries = createAsyncThunk(
  "chronicle/fetchAll",
  async (forceRefresh: boolean = false, { getState, rejectWithValue }) => {
    const state = (getState() as RootState).chronicle;
    const now = Date.now();

    // Check cache validity
    if (
      !forceRefresh &&
      state.lastFetched &&
      now - state.lastFetched < state.cacheTTL
    ) {
      console.log("📦 Using cached chronicle entries");
      return state.entries; // Return cached data
    }

    try {
      const response = await axiosInstance.get("/chronicle");
      return response.data;
    } catch (error) {
      return rejectWithValue(handleAxiosError(error));
    }
  },
);

const chronicleSlice = createSlice({
  name: "chronicle",
  initialState,
  reducers: {
    invalidateCache: (state) => {
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChronicleEntries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChronicleEntries.fulfilled, (state, action) => {
        state.entries = action.payload;
        state.lastFetched = Date.now();
        state.isLoading = false;
      })
      .addCase(fetchChronicleEntries.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });
  },
});
```

**Cache Invalidation Triggers**:

- After creating new chronicle entry: `dispatch(invalidateCache())`
- After editing chronicle entry: `dispatch(invalidateCache())`
- After deleting chronicle entry: `dispatch(invalidateCache())`
- Manual refresh button: `dispatch(fetchChronicleEntries(true))`

**Optimistic Updates** (optional enhancement):

```typescript
// When creating a new entry, optimistically add to state
export const createChronicleEntry = createAsyncThunk(
  "chronicle/create",
  async (entry: NewChronicleEntry, { dispatch }) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticEntry = {
      ...entry,
      id: tempId,
      createdDate: new Date().toISOString(),
    };

    // Add optimistically
    dispatch(chronicleSlice.actions.addOptimistic(optimisticEntry));

    try {
      const response = await axiosInstance.post("/chronicle", entry);
      dispatch(
        chronicleSlice.actions.replaceOptimistic({
          tempId,
          realEntry: response.data,
        }),
      );
      return response.data;
    } catch (error) {
      dispatch(chronicleSlice.actions.removeOptimistic(tempId));
      throw error;
    }
  },
);
```

---

## 7. Timestamp Formatting

### Decision: Absolute Format with `Intl.DateTimeFormat`

**Based on User Clarification**: Absolute timestamps (e.g., "Feb 19, 2026 14:30")

**Implementation**:

```typescript
// src/utils/formatTimestamp.ts
export function formatAbsoluteTimestamp(isoDate: string): string {
  const date = new Date(isoDate);

  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  // Output example: "19 feb. 2026 14:30"
}

// Alternative: Match user's example format "Feb 19, 2026 14:30"
export function formatAbsoluteTimestampEN(isoDate: string): string {
  const date = new Date(isoDate);

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  // Output example: "Feb 19, 2026, 14:30"
}
```

**Usage**:

```typescript
<Text>{formatAbsoluteTimestamp(entry.createdDate)}</Text>
```

---

## Research Summary

| Research Topic         | Decision                  | Packages Required                                 | Estimated Complexity |
| ---------------------- | ------------------------- | ------------------------------------------------- | -------------------- |
| **Rich Text Editor**   | Lexical (Meta)            | lexical@0.12, @lexical/react, @lexical/html, etc. | Medium               |
| **HTTP Client**        | Axios with interceptors   | axios@1.8                                         | Low                  |
| **HTML Sanitization**  | DOMPurify                 | dompurify@3.0, isomorphic-dompurify@2.0           | Low                  |
| **Admin Role Check**   | JWT decode (token claims) | jwt-decode@4.0                                    | Low                  |
| **Comment Pagination** | Load More (20 initial)    | None (custom impl)                                | Low                  |
| **Redux Caching**      | TTL + manual invalidation | None (existing patterns)                          | Low                  |
| **Timestamps**         | Intl.DateTimeFormat       | None (native API)                                 | Low                  |

**All unknowns resolved** ✅ - Ready to proceed to Phase 1: Design & Contracts

---

## Dependencies to Add

```json
{
  "dependencies": {
    "axios": "^1.8.0",
    "lexical": "^0.12.0",
    "@lexical/react": "^0.12.0",
    "@lexical/html": "^0.12.0",
    "@lexical/list": "^0.12.0",
    "@lexical/link": "^0.12.0",
    "@lexical/rich-text": "^0.12.0",
    "dompurify": "^3.0.0",
    "isomorphic-dompurify": "^2.0.0",
    "jwt-decode": "^4.0.0"
  },
  "devDependencies": {
    "@types/dompurify": "^3.0.0"
  }
}
```

**Installation Command**:

```bash
npm install axios@^1.8.0 lexical@^0.12.0 @lexical/react@^0.12.0 @lexical/html@^0.12.0 @lexical/list@^0.12.0 @lexical/link@^0.12.0 @lexical/rich-text@^0.12.0 dompurify@^3.0.0 isomorphic-dompurify@^2.0.0 jwt-decode@^4.0.0 && npm install --save-dev @types/dompurify@^3.0.0
```
