/**
 * Redux Toolkit slice for Weekly Stryktipset Betting feature
 * Feature: 002-weekly-betting
 * See: specs/002-weekly-betting/data-model.md
 */

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { APIManager } from "../services/APIManager";
import type {
  BettingMatch,
  BettingRound,
  BettingState,
  Outcome,
} from "../types/betting";

// T008: Async thunk to fetch current round
export const fetchCurrentRound = createAsyncThunk(
  "betting/fetchCurrentRound",
  async (roundNumber: number, { signal }) => {
    const response = await APIManager.getSvenskaSpelDrawInfo(
      roundNumber,
      signal,
    );

    // Transform Svenska Spel response to BettingRound
    const bettingMatches: BettingMatch[] = response.draw.events.map((event) => {
      const homeParticipant = event.participants.find((p) => p.type === "home");
      const awayParticipant = event.participants.find((p) => p.type === "away");

      return {
        eventNumber: event.eventNumber,
        homeTeam: homeParticipant?.name || "Unknown",
        awayTeam: awayParticipant?.name || "Unknown",
        league: event.league.name,
        kickoffTime: event.sportEventStart,
        status: event.sportEventStatus as BettingMatch["status"],
        result: event.outcomeScore ? undefined : undefined, // Will be set from result API
        score: event.outcomeScore,
      };
    });

    const bettingRound: BettingRound = {
      drawNumber: response.draw.drawNumber,
      drawComment: response.draw.drawComment,
      openTime: response.draw.openTime,
      closeTime: response.draw.closeTime,
      drawState: response.draw.drawState,
      matches: bettingMatches,
    };

    return bettingRound;
  },
);

// T018: Async thunk to submit bet
export const submitBet = createAsyncThunk(
  "betting/submitBet",
  async (
    {
      roundNumber,
      selections,
    }: { roundNumber: number; selections: Record<number, Outcome> },
    { rejectWithValue },
  ) => {
    try {
      // Convert Record to array format expected by API
      const selectionsArray = Object.entries(selections).map(
        ([matchNumber, outcome]) => ({
          matchNumber: parseInt(matchNumber, 10),
          outcome,
        }),
      );

      const response = await APIManager.submitUserBet(
        roundNumber,
        selectionsArray,
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit bet");
    }
  },
);

// T035: Async thunk to fetch round results
export const fetchRoundResults = createAsyncThunk(
  "betting/fetchRoundResults",
  async (roundNumber: number, { signal }) => {
    // Fetch both draw info and results
    const [drawInfoResponse, drawResultResponse] = await Promise.all([
      APIManager.getSvenskaSpelDrawInfo(roundNumber, signal),
      APIManager.getSvenskaSpelDrawResult(roundNumber, signal),
    ]);

    // Transform draw info to BettingRound
    const bettingMatches: BettingMatch[] = drawInfoResponse.draw.events.map(
      (event) => {
        const homeParticipant = event.participants.find(
          (p) => p.type === "home",
        );
        const awayParticipant = event.participants.find(
          (p) => p.type === "away",
        );

        // Find matching result
        const resultEvent = drawResultResponse.result.events.find(
          (r) => r.eventNumber === event.eventNumber,
        );

        return {
          eventNumber: event.eventNumber,
          homeTeam: homeParticipant?.name || "Unknown",
          awayTeam: awayParticipant?.name || "Unknown",
          league: event.league.name,
          kickoffTime: event.sportEventStart,
          status: "finished" as const,
          result: resultEvent?.outcome as Outcome | undefined,
          score: resultEvent?.outcomeScore,
        };
      },
    );

    const bettingRound: BettingRound = {
      drawNumber: drawInfoResponse.draw.drawNumber,
      drawComment: drawInfoResponse.draw.drawComment,
      openTime: drawInfoResponse.draw.openTime,
      closeTime: drawInfoResponse.draw.closeTime,
      drawState: "Closed",
      matches: bettingMatches,
    };

    return bettingRound;
  },
);

const initialState: BettingState = {
  // Current round data
  currentRound: null,
  currentRoundLoading: false,
  currentRoundError: null,

  // User's draft selections (before submit)
  draftSelections: {},

  // User's submitted bet for current round
  submittedBet: null,
  submittedBetLoading: false,

  // Submission state
  isSubmitting: false,
  submitError: null,
  submitSuccess: false,

  // Historical rounds (for US4)
  historicalRounds: {},
  historicalBets: {},
};

const bettingSlice = createSlice({
  name: "betting",
  initialState,
  reducers: {
    // Action to set a single match selection
    setSelection: (
      state,
      action: PayloadAction<{ matchNumber: number; outcome: Outcome }>,
    ) => {
      state.draftSelections[action.payload.matchNumber] =
        action.payload.outcome;
    },

    // Action to clear all draft selections
    clearDraftSelections: (state) => {
      state.draftSelections = {};
    },

    // Action to reset submit success flag
    resetSubmitSuccess: (state) => {
      state.submitSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // T008: fetchCurrentRound async thunk
    builder
      .addCase(fetchCurrentRound.pending, (state) => {
        state.currentRoundLoading = true;
        state.currentRoundError = null;
      })
      .addCase(fetchCurrentRound.fulfilled, (state, action) => {
        state.currentRoundLoading = false;
        state.currentRound = action.payload;
        state.currentRoundError = null;
      })
      .addCase(fetchCurrentRound.rejected, (state, action) => {
        state.currentRoundLoading = false;
        state.currentRoundError =
          action.error.message || "Failed to load round";
      });

    // T018: submitBet async thunk
    builder
      .addCase(submitBet.pending, (state) => {
        state.isSubmitting = true;
        state.submitError = null;
        state.submitSuccess = false;
      })
      .addCase(submitBet.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.submitSuccess = true;
        state.submitError = null;
        // Update submitted bet if response includes bet data
        if (action.payload.bet) {
          state.submittedBet = action.payload.bet;
        }
      })
      .addCase(submitBet.rejected, (state, action) => {
        state.isSubmitting = false;
        state.submitSuccess = false;
        state.submitError =
          (action.payload as string) || "Failed to submit bet";
      });

    // T035: fetchRoundResults async thunk
    builder
      .addCase(fetchRoundResults.pending, () => {
        // Loading state could be tracked per round if needed
      })
      .addCase(fetchRoundResults.fulfilled, (state, action) => {
        const round = action.payload;
        state.historicalRounds[round.drawNumber] = round;
      })
      .addCase(fetchRoundResults.rejected, () => {
        // T046: Error handling without console.log
        // Failed historical round fetches are handled in UI with retry button
      });

    // Async thunks will be added here in later tasks
    // T029: fetchUserBet
  },
});

export const { setSelection, clearDraftSelections, resetSubmitSuccess } =
  bettingSlice.actions;

export default bettingSlice.reducer;
