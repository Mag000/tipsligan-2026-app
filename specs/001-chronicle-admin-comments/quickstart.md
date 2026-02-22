# Quick Start Guide: Chronicle with Admin Editing and Comments

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Research**: [research.md](research.md) | **Data Model**: [data-model.md](data-model.md)  
**Phase**: 1 - Design & Contracts  
**Date**: 2026-02-19

This guide provides developers with practical instructions for building the Chronicle feature following the technical decisions in the [research document](research.md).

---

## Table of Contents

1. [Setup & Dependencies](#1-setup--dependencies)
2. [Project Structure](#2-project-structure)
3. [Axios Configuration](#3-axios-configuration)
4. [Type Definitions](#4-type-definitions)
5. [API Service Layer](#5-api-service-layer)
6. [Redux Store Setup](#6-redux-store-setup)
7. [UI Components](#7-ui-components)
8. [Admin Role Detection](#8-admin-role-detection)
9. [HTML Sanitization](#9-html-sanitization)
10. [Rich Text Editor Integration](#10-rich-text-editor-integration)
11. [Testing Strategy](#11-testing-strategy)
12. [Common Gotchas](#12-common-gotchas)

---

## 1. Setup & Dependencies

### Install Required Packages

```bash
npm install axios@^1.8.0 \
  lexical@^0.12.0 \
  @lexical/react@^0.12.0 \
  @lexical/html@^0.12.0 \
  @lexical/list@^0.12.0 \
  @lexical/link@^0.12.0 \
  @lexical/rich-text@^0.12.0 \
  dompurify@^3.0.0 \
  isomorphic-dompurify@^2.0.0 \
  jwt-decode@^4.0.0

npm install --save-dev @types/dompurify@^3.0.0
```

### Verify Existing Dependencies

Ensure these are already installed (should be present):

- `react@^19.x`
- `@reduxjs/toolkit@^2.x`
- `@fluentui/react-components@^9.x`
- `react-router-dom@^7.x`

---

## 2. Project Structure

Create the following directories and files:

```bash
# Components
mkdir -p src/components/chronicle
touch src/components/chronicle/ChronicleList.tsx
touch src/components/chronicle/ChronicleCard.tsx
touch src/components/chronicle/ChronicleEditor.tsx
touch src/components/chronicle/ChronicleDeleteDialog.tsx
touch src/components/chronicle/CommentSection.tsx
touch src/components/chronicle/CommentList.tsx
touch src/components/chronicle/CommentItem.tsx
touch src/components/chronicle/CommentForm.tsx
touch src/components/chronicle/index.ts

# Services
touch src/services/axiosConfig.ts
touch src/services/chronicleService.ts
touch src/services/chronicleCommentsService.ts

# Store (Redux slices)
touch src/store/chronicleSlice.ts
touch src/store/chronicleCommentsSlice.ts

# Types
touch src/types/chronicle.ts
touch src/types/comment.ts

# Utils
touch src/utils/sanitizeHtml.ts
touch src/utils/userRoles.ts
```

---

## 3. Axios Configuration

### Create Axios Instance with Auth Interceptors

**File**: `src/services/axiosConfig.ts`

```typescript
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getToken } from "../utils/authHelpers";

const API_BASE_URL = "http://localhost:52259/api";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Auto-inject Bearer token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor: Handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(
      `✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`,
    );
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("🔐 401 Unauthorized - clearing token");
      localStorage.removeItem("token");
      // ProtectedRoute will handle redirect
    }
    return Promise.reject(error);
  },
);

// Export types for convenience
export type { AxiosError, AxiosResponse } from "axios";
```

---

## 4. Type Definitions

### Chronicle Types

**File**: `src/types/chronicle.ts`

```typescript
export interface ChronicleEntry {
  id: number;
  title: string;
  content: string; // Sanitized HTML
  authorId: number;
  authorAlias: string;
  createdDate: string; // ISO 8601
  lastEditedDate?: string;
  editedById?: number;
  editedByAlias?: string;
  commentCount?: number;
}

export interface CreateChronicleEntryRequest {
  title: string;
  content: string; // HTML
}

export interface UpdateChronicleEntryRequest {
  title: string;
  content: string; // HTML
}

export interface ChronicleEntriesResponse {
  entries: ChronicleEntry[];
  totalCount: number;
}
```

### Comment Types

**File**: `src/types/comment.ts`

```typescript
export interface ChronicleComment {
  id: number;
  text: string;
  authorId: number;
  authorAlias: string;
  chronicleEntryId: number;
  createdDate: string; // ISO 8601
  lastEditedDate?: string;
  editedById?: number;
  editedByAlias?: string;
}

export interface CreateCommentRequest {
  text: string;
}

export interface UpdateCommentRequest {
  text: string;
}

export interface ChronicleCommentsResponse {
  comments: ChronicleComment[];
  totalCount: number;
  hasMore: boolean;
}
```

---

## 5. API Service Layer

### Chronicle Service

**File**: `src/services/chronicleService.ts`

```typescript
import { axiosInstance, AxiosError } from "./axiosConfig";
import { requestDeduplicator } from "../utils/requestDeduplication";
import { retryWithBackoff } from "../utils/retryWithBackoff";
import type {
  ChronicleEntry,
  ChronicleEntriesResponse,
  CreateChronicleEntryRequest,
  UpdateChronicleEntryRequest,
} from "../types/chronicle";

export class ChronicleService {
  /**
   * Fetch all chronicle entries (with deduplication and retry)
   */
  static async getAllEntries(signal?: AbortSignal): Promise<ChronicleEntry[]> {
    return requestDeduplicator.deduplicate("chronicle-all", () =>
      retryWithBackoff(
        async () => {
          const response = await axiosInstance.get<ChronicleEntriesResponse>(
            "/chronicle",
            { signal },
          );
          return response.data.entries;
        },
        {
          shouldRetry: (error: any) =>
            error.isAxiosError &&
            (!error.response || error.response.status >= 500),
        },
      ),
    );
  }

  /**
   * Get single chronicle entry by ID
   */
  static async getEntryById(
    id: number,
    signal?: AbortSignal,
  ): Promise<ChronicleEntry> {
    const response = await axiosInstance.get<ChronicleEntry>(
      `/chronicle/${id}`,
      { signal },
    );
    return response.data;
  }

  /**
   * Create new chronicle entry (admin only)
   */
  static async createEntry(
    data: CreateChronicleEntryRequest,
  ): Promise<ChronicleEntry> {
    const response = await axiosInstance.post<ChronicleEntry>(
      "/chronicle",
      data,
    );
    return response.data;
  }

  /**
   * Update chronicle entry (admin only)
   */
  static async updateEntry(
    id: number,
    data: UpdateChronicleEntryRequest,
  ): Promise<ChronicleEntry> {
    const response = await axiosInstance.put<ChronicleEntry>(
      `/chronicle/${id}`,
      data,
    );
    return response.data;
  }

  /**
   * Delete chronicle entry (admin only)
   */
  static async deleteEntry(id: number): Promise<void> {
    await axiosInstance.delete(`/chronicle/${id}`);
  }
}
```

### Comments Service

**File**: `src/services/chronicleCommentsService.ts`

```typescript
import { axiosInstance } from "./axiosConfig";
import type {
  ChronicleComment,
  ChronicleCommentsResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "../types/comment";

export class ChronicleCommentsService {
  /**
   * Fetch comments for a chronicle entry (with pagination)
   */
  static async getComments(
    chronicleId: number,
    skip: number = 0,
    take: number = 20,
    signal?: AbortSignal,
  ): Promise<ChronicleCommentsResponse> {
    const response = await axiosInstance.get<ChronicleCommentsResponse>(
      `/chronicle/${chronicleId}/comments`,
      { params: { skip, take }, signal },
    );
    return response.data;
  }

  /**
   * Post new comment
   */
  static async createComment(
    chronicleId: number,
    data: CreateCommentRequest,
  ): Promise<ChronicleComment> {
    const response = await axiosInstance.post<ChronicleComment>(
      `/chronicle/${chronicleId}/comments`,
      data,
    );
    return response.data;
  }

  /**
   * Update comment (author or admin only)
   */
  static async updateComment(
    chronicleId: number,
    commentId: number,
    data: UpdateCommentRequest,
  ): Promise<ChronicleComment> {
    const response = await axiosInstance.put<ChronicleComment>(
      `/chronicle/${chronicleId}/comments/${commentId}`,
      data,
    );
    return response.data;
  }
}
```

---

## 6. Redux Store Setup

### Chronicle Slice

**File**: `src/store/chronicleSlice.ts`

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ChronicleService } from "../services/chronicleService";
import type { ChronicleEntry } from "../types/chronicle";
import type { RootState } from "./store";

interface ChronicleState {
  entries: ChronicleEntry[];
  lastFetched: number | null;
  cacheTTL: number; // 5 minutes
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

/**
 * Fetch all chronicle entries (with cache check)
 */
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
      return state.entries;
    }

    try {
      return await ChronicleService.getAllEntries();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch chronicle",
      );
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
      .addCase(
        fetchChronicleEntries.fulfilled,
        (state, action: PayloadAction<ChronicleEntry[]>) => {
          state.entries = action.payload;
          state.lastFetched = Date.now();
          state.isLoading = false;
        },
      )
      .addCase(fetchChronicleEntries.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });
  },
});

export const { invalidateCache } = chronicleSlice.actions;
export default chronicleSlice.reducer;
```

### Update Store Configuration

**File**: `src/store/store.ts` (add to existing config)

```typescript
import chronicleReducer from "./chronicleSlice";
import chronicleCommentsReducer from "./chronicleCommentsSlice";

export const store = configureStore({
  reducer: {
    rounds: roundsReducer, // Existing
    chronicle: chronicleReducer, // NEW
    chronicleComments: chronicleCommentsReducer, // NEW
  },
});
```

---

## 7. UI Components

### Chronicle List Component

**File**: `src/components/chronicle/ChronicleList.tsx`

```typescript
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { fetchChronicleEntries } from '../../store/chronicleSlice';
import { Spinner, Text, makeStyles } from '@fluentui/react-components';
import { ChronicleCard } from './ChronicleCard';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: '32px',
  },
  error: {
    color: 'var(--colorPaletteRedForeground1)',
    padding: '16px',
  },
  empty: {
    padding: '32px',
    textAlign: 'center',
    color: 'var(--colorNeutralForeground3)',
  },
});

export const ChronicleList: React.FC = () => {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const { entries, isLoading, error } = useAppSelector(state => state.chronicle);

  useEffect(() => {
    dispatch(fetchChronicleEntries());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner label="Loading chronicle..." />
      </div>
    );
  }

  if (error) {
    return <Text className={styles.error}>Error: {error}</Text>;
  }

  if (entries.length === 0) {
    return <Text className={styles.empty}>No announcements yet.</Text>;
  }

  return (
    <div className={styles.container}>
      {entries.map(entry => (
        <ChronicleCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
};
```

### Example Chronicle Card (Skeleton)

**File**: `src/components/chronicle/ChronicleCard.tsx`

```typescript
import React from 'react';
import { Card, Text, makeStyles } from '@fluentui/react-components';
import type { ChronicleEntry } from '../../types/chronicle';
import { formatAbsoluteTimestamp } from '../../utils/formatTimestamp';

const useStyles = makeStyles({
  card: {
    padding: '16px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  meta: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground3)',
    marginBottom: '12px',
  },
  content: {
    '& p': { marginBottom: '8px' },
    '& ul': { paddingLeft: '20px' },
    '& a': { color: 'var(--colorBrandForeground1)', textDecoration: 'none' },
  },
});

interface Props {
  entry: ChronicleEntry;
}

export const ChronicleCard: React.FC<Props> = ({ entry }) => {
  const styles = useStyles();

  return (
    <Card className={styles.card}>
      <Text className={styles.title}>{entry.title}</Text>
      <Text className={styles.meta}>
        By {entry.authorAlias} • {formatAbsoluteTimestamp(entry.createdDate)}
        {entry.lastEditedDate && ` • Edited ${formatAbsoluteTimestamp(entry.lastEditedDate)}`}
      </Text>
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: entry.content }}
      />
      {/* CommentSection component goes here */}
    </Card>
  );
};
```

---

## 8. Admin Role Detection

**File**: `src/utils/userRoles.ts`

```typescript
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  userId: number;
  username: string;
  role?: string;
  isAdmin?: boolean;
}

/**
 * Check if current user is admin
 */
export function isCurrentUserAdmin(): boolean {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = jwtDecode<TokenPayload>(token);
    return payload.role === "admin" || payload.isAdmin === true;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return false;
  }
}

/**
 * Get current user role
 */
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

**Usage in Components**:

```typescript
import { isCurrentUserAdmin } from '../../utils/userRoles';

const MyComponent: React.FC = () => {
  const isAdmin = isCurrentUserAdmin();

  return (
    <>
      {isAdmin && <Button>Create Chronicle Entry</Button>}
    </>
  );
};
```

---

## 9. HTML Sanitization

**File**: `src/utils/sanitizeHtml.ts`

```typescript
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize chronicle HTML content (allows rich text formatting)
 */
export function sanitizeChronicleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "ul",
      "ol",
      "li",
      "a",
      "h1",
      "h2",
      "h3",
    ],
    ALLOWED_ATTR: { a: ["href", "target", "rel"] },
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize comment text (strips all HTML)
 */
export function sanitizeCommentText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });
}
```

**Usage**:

```typescript
import { sanitizeChronicleHtml } from "../utils/sanitizeHtml";
import { $generateHtmlFromNodes } from "@lexical/html";

// When saving chronicle entry
const rawHtml = $generateHtmlFromNodes(editor);
const sanitizedHtml = sanitizeChronicleHtml(rawHtml);
await ChronicleService.createEntry({ title, content: sanitizedHtml });
```

---

## 10. Rich Text Editor Integration

**File**: `src/components/chronicle/ChronicleEditor.tsx` (simplified)

```typescript
import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';

const editorConfig = {
  namespace: 'ChronicleEditor',
  theme: {},
  onError: (error: Error) => console.error(error),
  nodes: [HeadingNode, ListNode, ListItemNode, LinkNode],
};

export const ChronicleEditor: React.FC = () => {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable style={{ minHeight: '200px', padding: '12px', border: '1px solid #ccc' }} />}
        placeholder={<div>Enter chronicle content...</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin />
    </LexicalComposer>
  );
};
```

---

## 11. Testing Strategy

### Unit Tests (Example)

**File**: `src/services/chronicleService.test.ts`

```typescript
import { ChronicleService } from "./chronicleService";
import { axiosInstance } from "./axiosConfig";

jest.mock("./axiosConfig");

describe("ChronicleService", () => {
  it("should fetch all entries", async () => {
    const mockData = { entries: [{ id: 1, title: "Test" }], totalCount: 1 };
    (axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockData });

    const result = await ChronicleService.getAllEntries();

    expect(result).toEqual(mockData.entries);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/chronicle",
      expect.any(Object),
    );
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { ChronicleList } from './ChronicleList';
import { Provider } from 'react-redux';
import { store } from '../../store/store';

test('renders chronicle list', () => {
  render(
    <Provider store={store}>
      <ChronicleList />
    </Provider>
  );

  expect(screen.getByText(/Loading chronicle/i)).toBeInTheDocument();
});
```

---

## 12. Common Gotchas

### ⚠️ CORS Issues

- Ensure backend allows `http://localhost:3000` origin
- Check that axios baseURL matches backend API URL

### ⚠️ Token Expiration

- JWT tokens may expire; handle 401 responses in axios interceptor
- Clear token and redirect to login on 401

### ⚠️ HTML Sanitization

- **Always sanitize** HTML before rendering with `dangerouslySetInnerHTML`
- Use sanitization both client-side (UX feedback) and server-side (security)

### ⚠️ Request Deduplication

- Deduplication uses promise reuse; don't deduplicate POST/PUT/DELETE (write operations)
- Only deduplicate read operations (GET)

### ⚠️ Cache Invalidation

- Remember to call `dispatch(invalidateCache())` after creating/editing/deleting entries
- Otherwise users see stale data

### ⚠️ AbortController Cleanup

- Always abort requests on component unmount to prevent memory leaks
- Use `useEffect` cleanup function:
  ```typescript
  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, []);
  ```

---

## Next Steps

1. ✅ Dependencies installed
2. ✅ Project structure created
3. ✅ Axios configured with interceptors
4. ✅ Type definitions added
5. ✅ API services implemented
6. ✅ Redux slices created
7. ⬜ Implement UI components (ChronicleList, ChronicleCard, etc.)
8. ⬜ Add rich text editor toolbar
9. ⬜ Implement comment section with pagination
10. ⬜ Write tests
11. ⬜ Integrate into Home page

**For detailed implementation tasks**, see `tasks.md` (generated by `/speckit.tasks` command).
