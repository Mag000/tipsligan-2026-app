import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { APIManager } from "../services/APIManager";
import { SvenskaSpelResponse } from "../types/svenskaspel";
import { cleanupOldCache, shouldFetchData } from "../utils/cacheHelpers";
import { requestDeduplicator } from "../utils/requestDeduplication";

// Types
export interface UserBet {
  matchId: string;
  eventNumber: number;
  bets: Array<"1" | "X" | "2">;
  isSafe: boolean;
  isFinalized: boolean;
}

export interface RoundData {
  drawInfo: SvenskaSpelResponse | null;
  userBets: Record<number, UserBet>;
  safeMatchNumber: number | null;
  isFinalized: boolean;
  allUsersBets: Record<string, Record<number, UserBet>>;
  distribution: Record<number, { "1": number; X: number; "2": number }>;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheValid: boolean;
  requestInFlight: boolean;
  fetchAttempts: number;
}

export interface Round {
  id?: number;
  SPRoundNum: number;
  Year: number;
  Week: number;
  Month?: number;
  Comment?: string;
  Finished?: boolean;
}

interface RoundsState {
  currentRound: number | null;
  availableRounds: Round[];
  roundsData: Record<number, RoundData>;
  loadingRounds: boolean;
  error: string | null;
}

const initialRoundData: RoundData = {
  drawInfo: null,
  userBets: {},
  safeMatchNumber: null,
  isFinalized: false,
  allUsersBets: {},
  distribution: {},
  loading: false,
  error: null,
  lastFetched: null,
  cacheValid: false,
  requestInFlight: false,
  fetchAttempts: 0,
};

const initialState: RoundsState = {
  currentRound: null,
  availableRounds: [],
  roundsData: {},
  loadingRounds: false,
  error: null,
};

// Async Thunks
export const fetchAllRounds = createAsyncThunk(
  "rounds/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const rounds = await APIManager.getAllRounds();
      return rounds;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Fetches all data for a specific round with caching and request deduplication
 *
 * This thunk implements Constitution Principle VI (API Request Management):
 * - Uses 5-minute TTL cache to prevent redundant API calls
 * - Request deduplication prevents concurrent duplicate calls to same endpoint
 * - Force parameter allows manual refresh (user-initiated action)
 *
 * Data fetched:
 * - Draw info from Svenska Spel API (matches, odds, scores)
 * - Results (if draw is finalized)
 * - User's bets for all matches
 * - All users' bets for comparison
 * - Bet distribution statistics
 *
 * @param round - Svenska Spel round number (SPRoundNum)
 * @param userId - Optional user ID (extracted from token if not provided)
 * @param force - If true, bypass cache and fetch fresh data (for manual refresh)
 *
 * @returns Object with round number, data, and fromCache flag
 *
 * @example
 * ```typescript
 * // Cache hit (no API call)
 * dispatch(fetchRoundData({ round: 5 }));
 *
 * // Force refresh (manual user action)
 * dispatch(fetchRoundData({ round: 5, force: true }));
 * ```
 */
export const fetchRoundData = createAsyncThunk(
  "rounds/fetchRoundData",
  async (
    {
      round,
      userId,
      force,
    }: { round: number; userId?: string; force?: boolean },
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState() as { rounds: RoundsState };
      const existingData = state.rounds.roundsData[round];
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

      // Check if we should fetch data (using cache helpers)
      const needsFetch = shouldFetchData(
        existingData,
        force || false,
        CACHE_TTL,
      );

      if (!needsFetch && existingData) {
        const cacheAge = existingData.lastFetched
          ? Date.now() - existingData.lastFetched
          : 0;
        console.log(
          `✅ Using cached data for round ${round} (age: ${Math.round(cacheAge / 1000)}s)`,
        );
        return { round, data: existingData, fromCache: true };
      }

      console.log(`🔍 Fetching fresh data for round ${round}...`);

      // Fetch draw info (with request deduplication)
      const drawInfo = await requestDeduplicator.deduplicate(
        `drawInfo-${round}`,
        async () => await APIManager.getSvenskaSpelDrawInfo(round),
      );

      // Check if results are needed
      const shouldFetchResults =
        drawInfo.draw.drawState?.toLowerCase() === "finalized" ||
        drawInfo.draw.drawState?.toLowerCase() === "result";

      if (shouldFetchResults) {
        try {
          const resultInfo = await APIManager.getSvenskaSpelDrawResult(round);
          const resultEvents = resultInfo.result.events || [];
          drawInfo.draw.events = drawInfo.draw.events.map((forecastEvent) => {
            const resultEvent = resultEvents.find(
              (re) => re.eventNumber === forecastEvent.eventNumber,
            );
            if (resultEvent?.outcomeScore) {
              return {
                ...forecastEvent,
                outcomeScore: resultEvent.outcomeScore,
                sportEventStatus: "Slut",
              };
            }
            return forecastEvent;
          });
        } catch (error) {
          console.warn("⚠️ Could not fetch results:", error);
        }
      }

      // Fetch matches for mapping
      const roundMatches = await APIManager.getMatchesForRound(round);
      const matchIdToEventNumber = new Map<number, number>();
      roundMatches.forEach((match: any) => {
        const matchIdRaw = match.Id || match.id || match.ID;
        const matchId =
          typeof matchIdRaw === "string"
            ? parseInt(matchIdRaw, 10)
            : matchIdRaw;
        const eventNum =
          match.MatchNumber ||
          match.matchNumber ||
          match.EventNumber ||
          match.eventNumber;
        if (matchId && eventNum) {
          matchIdToEventNumber.set(matchId, eventNum);
        }
      });

      // Fetch user bets
      const betsData = await APIManager.getUserBetsForRound(round, userId);
      const betsMap: Record<number, UserBet> = {};
      let safeBet: number | null = null;
      let finalized = false;

      betsData.forEach((bet: any) => {
        const matchId =
          bet.matchesId || bet.matchesSet_Id || bet.MatchId || bet.matchId;
        const eventNum = matchIdToEventNumber.get(matchId);
        if (!eventNum) return;

        const betValue = bet.bet || bet.Bet || bet.tip || bet.Tip;
        const normalizedBet = betValue?.toString().toUpperCase();

        if (!betsMap[eventNum]) {
          betsMap[eventNum] = {
            matchId: bet.Id || bet.id,
            eventNumber: eventNum,
            bets: [],
            isSafe: false,
            isFinalized: bet.Final === true || bet.final === true,
          };
        }

        if (
          normalizedBet &&
          (normalizedBet === "1" ||
            normalizedBet === "X" ||
            normalizedBet === "2") &&
          !betsMap[eventNum].bets.includes(normalizedBet as "1" | "X" | "2")
        ) {
          betsMap[eventNum].bets.push(normalizedBet as "1" | "X" | "2");
        }

        const isSafe =
          bet.safe || bet.Safe || bet.isSafe || bet.IsSafe || false;
        if (isSafe) {
          safeBet = eventNum;
          betsMap[eventNum].isSafe = true;
        }

        if (bet.Final || bet.final) {
          finalized = true;
        }
      });

      // Fetch all users' bets (with request deduplication)
      const allBetsData = await requestDeduplicator.deduplicate(
        `bets-${round}`,
        async () => await APIManager.getBetsForRound(round),
      );
      const allUsersBetsMap: Record<string, Record<number, UserBet>> = {};

      allBetsData.forEach((bet: any) => {
        const matchId =
          bet.matchesId || bet.matchesSet_Id || bet.MatchId || bet.matchId;
        const eventNum = matchIdToEventNumber.get(matchId);
        if (!eventNum) return;

        const userIdRaw = bet.aspnet_UsersUserId || bet.userId || bet.UserId;
        const userIdStr = String(userIdRaw);

        if (!allUsersBetsMap[userIdStr]) {
          allUsersBetsMap[userIdStr] = {};
        }

        const betValue = bet.bet || bet.Bet || bet.tip || bet.Tip;
        const normalizedBet = betValue?.toString().toUpperCase();

        if (!allUsersBetsMap[userIdStr][eventNum]) {
          allUsersBetsMap[userIdStr][eventNum] = {
            matchId: bet.Id || bet.id,
            eventNumber: eventNum,
            bets: [],
            isSafe: false,
            isFinalized: bet.Final === true || bet.final === true,
          };
        }

        if (
          normalizedBet &&
          (normalizedBet === "1" ||
            normalizedBet === "X" ||
            normalizedBet === "2") &&
          !allUsersBetsMap[userIdStr][eventNum].bets.includes(
            normalizedBet as "1" | "X" | "2",
          )
        ) {
          allUsersBetsMap[userIdStr][eventNum].bets.push(
            normalizedBet as "1" | "X" | "2",
          );
        }

        const isSafe =
          bet.safe || bet.Safe || bet.isSafe || bet.IsSafe || false;
        if (isSafe) {
          allUsersBetsMap[userIdStr][eventNum].isSafe = true;
        }
      });

      // Fetch distribution
      let distribution = {};
      try {
        distribution = await APIManager.getDistributionForRound(round);
      } catch (error) {
        console.warn("⚠️ Could not fetch distribution:", error);
      }

      const roundData: RoundData = {
        drawInfo,
        userBets: betsMap,
        safeMatchNumber: safeBet,
        isFinalized: finalized,
        allUsersBets: allUsersBetsMap,
        distribution,
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cacheValid: true,
        requestInFlight: false,
        fetchAttempts: 0,
      };

      return { round, data: roundData, fromCache: false };
    } catch (error: any) {
      console.error(`❌ Error fetching round ${round}:`, error);

      // Differentiate between network errors and API errors
      let errorMessage = "Failed to load round data. Please try again.";

      if (
        error.message?.toLowerCase().includes("network") ||
        error.message?.toLowerCase().includes("fetch")
      ) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.response) {
        // API error with response
        const status = error.response.status;
        if (status === 404) {
          errorMessage = `Round ${round} not found.`;
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (status === 401 || status === 403) {
          errorMessage = "Authentication error. Please log in again.";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  },
);

// Slice
const roundsSlice = createSlice({
  name: "rounds",
  initialState,
  reducers: {
    setCurrentRound: (state, action: PayloadAction<number>) => {
      state.currentRound = action.payload;
    },
    updateUserBet: (
      state,
      action: PayloadAction<{
        round: number;
        eventNumber: number;
        bet: UserBet;
      }>,
    ) => {
      const { round, eventNumber, bet } = action.payload;
      if (!state.roundsData[round]) {
        state.roundsData[round] = { ...initialRoundData };
      }
      state.roundsData[round].userBets[eventNumber] = bet;
    },
    clearRoundCache: (state, action: PayloadAction<number>) => {
      const round = action.payload;
      if (state.roundsData[round]) {
        state.roundsData[round].lastFetched = null;
      }
    },
    forceRefreshRound: (state, action: PayloadAction<number>) => {
      const round = action.payload;
      if (state.roundsData[round]) {
        state.roundsData[round].cacheValid = false;
        state.roundsData[round].lastFetched = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all rounds
      .addCase(fetchAllRounds.pending, (state) => {
        state.loadingRounds = true;
        state.error = null;
      })
      .addCase(fetchAllRounds.fulfilled, (state, action) => {
        state.loadingRounds = false;
        state.availableRounds = action.payload;
      })
      .addCase(fetchAllRounds.rejected, (state, action) => {
        state.loadingRounds = false;
        state.error = action.payload as string;
      })
      // Fetch round data
      .addCase(fetchRoundData.pending, (state, action) => {
        const round = action.meta.arg.round;
        if (!state.roundsData[round]) {
          state.roundsData[round] = { ...initialRoundData };
        }
        state.roundsData[round].loading = true;
        state.roundsData[round].error = null;
        state.roundsData[round].requestInFlight = true;
      })
      .addCase(fetchRoundData.fulfilled, (state, action) => {
        const { round, data } = action.payload;
        state.roundsData[round] = data;
        state.roundsData[round].requestInFlight = false;
        state.roundsData[round].cacheValid = true;
        // Cleanup old cache entries to keep only 10 most recent rounds
        state.roundsData = cleanupOldCache(state.roundsData, 10);
      })
      .addCase(fetchRoundData.rejected, (state, action) => {
        const round = action.meta.arg.round;
        if (state.roundsData[round]) {
          state.roundsData[round].loading = false;
          state.roundsData[round].error = action.payload as string;
          state.roundsData[round].requestInFlight = false;
          state.roundsData[round].fetchAttempts += 1;
        }
      });
  },
});

export const {
  setCurrentRound,
  updateUserBet,
  clearRoundCache,
  forceRefreshRound,
} = roundsSlice.actions;
export default roundsSlice.reducer;
