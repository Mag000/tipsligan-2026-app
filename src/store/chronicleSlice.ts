import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChronicleService } from "../services/chronicleService";
import type { ChronicleEntry } from "../types/chronicle";
import type { RootState } from "./store";

export interface ChronicleState {
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

/**
 * Create a new chronicle entry (admin only)
 */
export const createChronicleEntry = createAsyncThunk(
  "chronicle/create",
  async (
    data: { title: string; content: string },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const entry = await ChronicleService.createEntry(data);
      dispatch(invalidateCache()); // Force refresh on next fetch
      return entry;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create entry",
      );
    }
  },
);

/**
 * Update an existing chronicle entry (admin only)
 */
export const updateChronicleEntry = createAsyncThunk(
  "chronicle/update",
  async (
    { id, data }: { id: number; data: { title: string; content: string } },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const entry = await ChronicleService.updateEntry(id, data);
      dispatch(invalidateCache()); // Force refresh on next fetch
      return entry;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update entry",
      );
    }
  },
);

/**
 * Delete a chronicle entry (admin only)
 */
export const deleteChronicleEntry = createAsyncThunk(
  "chronicle/delete",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      await ChronicleService.deleteEntry(id);
      dispatch(invalidateCache()); // Force refresh on next fetch
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete entry",
      );
    }
  },
);

/**
 * Chronicle slice for managing chronicle entries state
 */
const chronicleSlice = createSlice({
  name: "chronicle",
  initialState,
  reducers: {
    invalidateCache: (state) => {
      state.lastFetched = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch entries
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
      })
      // Create entry
      .addCase(createChronicleEntry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        createChronicleEntry.fulfilled,
        (state, action: PayloadAction<ChronicleEntry>) => {
          state.entries = [action.payload, ...state.entries]; // Add to top
          state.isLoading = false;
        },
      )
      .addCase(createChronicleEntry.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      // Update entry
      .addCase(updateChronicleEntry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateChronicleEntry.fulfilled,
        (state, action: PayloadAction<ChronicleEntry>) => {
          const index = state.entries.findIndex(
            (e) => e.id === action.payload.id,
          );
          if (index !== -1) {
            state.entries[index] = action.payload;
          }
          state.isLoading = false;
        },
      )
      .addCase(updateChronicleEntry.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      // Delete entry
      .addCase(deleteChronicleEntry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        deleteChronicleEntry.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.entries = state.entries.filter((e) => e.id !== action.payload);
          state.isLoading = false;
        },
      )
      .addCase(deleteChronicleEntry.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });
  },
});

export const { invalidateCache, clearError } = chronicleSlice.actions;
export default chronicleSlice.reducer;
