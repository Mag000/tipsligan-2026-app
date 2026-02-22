/**
 * Type definitions for Weekly Stryktipset Betting feature
 * Feature: 002-weekly-betting
 * See: specs/002-weekly-betting/data-model.md
 */

// Core betting outcome type
export type Outcome = "1" | "X" | "2";

// Match status within a betting round
export type MatchStatus =
  | "scheduled"
  | "in_progress"
  | "finished"
  | "cancelled"
  | "postponed";

/**
 * A single football match within a betting round
 */
export interface BettingMatch {
  eventNumber: number; // 1-13
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffTime: string; // ISO 8601
  status: MatchStatus;
  result?: Outcome; // Set when finished
  score?: string; // e.g., "2-1"
}

/**
 * A Stryktipset betting round containing 13 matches
 */
export interface BettingRound {
  drawNumber: number;
  drawComment: string;
  openTime: string; // ISO 8601
  closeTime: string; // ISO 8601
  drawState: string;
  matches: BettingMatch[];
}

/**
 * A single prediction within a bet
 */
export interface BetSelection {
  matchNumber: number; // 1-13
  outcome: Outcome;
}

/**
 * A user's complete bet for a round
 */
export interface UserBet {
  id: string;
  userId: string;
  roundNumber: number;
  selections: BetSelection[];
  submittedAt: string; // ISO 8601
  isComplete: boolean;
}

/**
 * Redux state shape for betting feature
 */
export interface BettingState {
  // Current round data
  currentRound: BettingRound | null;
  currentRoundLoading: boolean;
  currentRoundError: string | null;

  // User's draft selections (before submit)
  draftSelections: Record<number, Outcome>; // matchNumber -> outcome

  // User's submitted bet for current round
  submittedBet: UserBet | null;
  submittedBetLoading: boolean;

  // Submission state
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;

  // Historical rounds (for US4)
  historicalRounds: Record<number, BettingRound>; // roundNumber -> Round
  historicalBets: Record<number, UserBet>; // roundNumber -> Bet
}
