/**
 * Backend API Response Types
 * Types for data returned from the ASP.NET Web API backend
 */

/**
 * Backend match entity from database
 * Returned from /api/matches/{round} endpoint
 */
export interface BackendMatch {
  Id: number;
  id?: number;
  ID?: number;
  RoundId: number;
  MatchNumber: number;
  matchNumber?: number;
  EventNumber?: number;
  eventNumber?: number;
  HomeTeam: string;
  AwayTeam: string;
  GoalsHome: number | null;
  GoalsAway: number | null;
  Confirmed: boolean;
  Comment: string | null;
  Deadline?: string;
}

/**
 * Backend bet entity from database
 * Returned from /api/bets/{round} endpoints
 */
export interface BackendBet {
  Id: number;
  id?: number;
  aspnet_UsersUserId: string;
  matchesId?: number;
  matchesSet_Id?: number;
  MatchId?: number;
  matchId?: number;
  MatchNumber?: number;
  bet?: string;
  Bet?: string;
  tip?: string;
  Tip?: string;
  safe?: boolean;
  Safe?: boolean;
  isSafe?: boolean;
  IsSafe?: boolean;
  Final?: boolean;
  final?: boolean;
}

/**
 * Distribution data item from backend
 * Returned from /api/distribution/{round}
 */
export interface BackendDistributionItem {
  matchNumber?: number;
  MatchNumber?: number;
  eventNumber?: number;
  EventNumber?: number;
  count1?: number;
  Count1?: number;
  countX?: number;
  CountX?: number;
  count2?: number;
  Count2?: number;
}

/**
 * Normalized distribution by match number
 */
export interface DistributionByMatch {
  [matchNumber: number]: {
    "1": number;
    X: number;
    "2": number;
  };
}
