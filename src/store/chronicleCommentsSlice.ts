import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ChronicleCommentsService } from "../services/chronicleCommentsService";
import type { ChronicleComment } from "../types/comment";
import type { RootState } from "./store";

export interface ChronicleCommentsState {
  commentsByEntryId: Record<number, ChronicleComment[]>; // Keyed by chronicleEntryId
  totalCountByEntryId: Record<number, number>;
  hasMoreByEntryId: Record<number, boolean>;
  skipByEntryId: Record<number, number>; // Pagination offset
  take: number; // Page size (default: 20)
  isLoading: boolean;
  error: string | null;
}

const initialState: ChronicleCommentsState = {
  commentsByEntryId: {},
  totalCountByEntryId: {},
  hasMoreByEntryId: {},
  skipByEntryId: {},
  take: 20,
  isLoading: false,
  error: null,
};

/**
 * Fetch comments for a chronicle entry (with pagination)
 */
export const fetchComments = createAsyncThunk(
  "chronicleComments/fetch",
  async (
    {
      chronicleId,
      loadMore = false,
    }: { chronicleId: number; loadMore?: boolean },
    { getState, rejectWithValue },
  ) => {
    try {
      const state = (getState() as RootState).chronicleComments;
      const skip = loadMore ? state.skipByEntryId[chronicleId] || 0 : 0;
      const take = state.take;

      const response = await ChronicleCommentsService.getComments(
        chronicleId,
        skip,
        take,
      );

      return {
        chronicleId,
        comments: response.comments,
        totalCount: response.totalCount,
        hasMore: response.hasMore,
        skip,
        loadMore,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch comments",
      );
    }
  },
);

/**
 * Create a new comment on a chronicle entry
 */
export const createComment = createAsyncThunk(
  "chronicleComments/create",
  async (
    { chronicleId, text }: { chronicleId: number; text: string },
    { rejectWithValue },
  ) => {
    try {
      const comment = await ChronicleCommentsService.createComment(
        chronicleId,
        {
          text,
        },
      );
      return { chronicleId, comment };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to post comment",
      );
    }
  },
);

/**
 * Update an existing comment
 */
export const updateComment = createAsyncThunk(
  "chronicleComments/update",
  async (
    {
      chronicleId,
      commentId,
      text,
    }: { chronicleId: number; commentId: number; text: string },
    { rejectWithValue },
  ) => {
    try {
      const comment = await ChronicleCommentsService.updateComment(
        chronicleId,
        commentId,
        { text },
      );
      return { chronicleId, comment };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update comment",
      );
    }
  },
);

/**
 * Chronicle comments slice for managing comments state per entry
 */
const chronicleCommentsSlice = createSlice({
  name: "chronicleComments",
  initialState,
  reducers: {
    resetComments: (state, action) => {
      const entryId = action.payload;
      delete state.commentsByEntryId[entryId];
      delete state.totalCountByEntryId[entryId];
      delete state.hasMoreByEntryId[entryId];
      delete state.skipByEntryId[entryId];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch comments
      .addCase(fetchComments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { chronicleId, comments, totalCount, hasMore, skip, loadMore } =
          action.payload;

        if (loadMore) {
          // Append comments for "Load More"
          state.commentsByEntryId[chronicleId] = [
            ...(state.commentsByEntryId[chronicleId] || []),
            ...comments,
          ];
        } else {
          // Replace comments for initial load
          state.commentsByEntryId[chronicleId] = comments;
        }

        state.totalCountByEntryId[chronicleId] = totalCount;
        state.hasMoreByEntryId[chronicleId] = hasMore;
        state.skipByEntryId[chronicleId] = skip + comments.length;
        state.isLoading = false;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      // Create comment
      .addCase(createComment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        const { chronicleId, comment } = action.payload;

        // Add new comment to the end (chronological order)
        if (!state.commentsByEntryId[chronicleId]) {
          state.commentsByEntryId[chronicleId] = [];
        }
        state.commentsByEntryId[chronicleId].push(comment);

        // Update total count
        state.totalCountByEntryId[chronicleId] =
          (state.totalCountByEntryId[chronicleId] || 0) + 1;

        state.isLoading = false;
      })
      .addCase(createComment.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      // Update comment
      .addCase(updateComment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const { chronicleId, comment } = action.payload;

        // Find and update the comment
        const comments = state.commentsByEntryId[chronicleId];
        if (comments) {
          const index = comments.findIndex((c) => c.id === comment.id);
          if (index !== -1) {
            comments[index] = comment;
          }
        }

        state.isLoading = false;
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });
  },
});

export const { resetComments } = chronicleCommentsSlice.actions;
export default chronicleCommentsSlice.reducer;
