export interface ElimineringenRuleConfig {
  earlyWeeklyEliminationCount: number;
  lateWeeklyEliminationCount: number;
  /** 1-based round index within the competition at which late-phase rules kick in (default: 7, meaning rounds 1-6 = 2 eliminations, round 7+ = 1). */
  latePhaseStartRoundIndex?: number;
  tieBreakRule: "all-tied-poorest";
  noBetRule: "eliminate-all-no-bet";
  activeMarker: string;
}

export interface EliminationHistoryEntry {
  userId: string;
  eliminationRound: number;
  eliminationWeek: number;
  eliminationSequence: number;
  reason: "no-bet" | "tied-poorest" | "quota-poorest";
}

export interface ElimineringenStandingsRow {
  userId: string;
  displayName: string;
  position: number;
  correctCount: number;
  correctSafeCount: number;
  status: "active" | "eliminated" | "winner";
  eliminatedRound: number | null;
  eliminatedWeek: number | null;
  eliminationSequence: number | null;
  eliminationReason: EliminationHistoryEntry["reason"] | null;
}

export interface LiveEliminationState {
  isLiveRound: boolean;
  roundNumber: number | null;
  eliminationPositionUserIds: Set<string>;
}

export interface LiveScoreOverride {
  matchNumber: number;
  goalsHome: number;
  goalsAway: number;
}

export interface LiveRoundMatch {
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  goalsHome: number | null;
  goalsAway: number | null;
}

export interface RoundMeta {
  spRoundNum: number;
  year: number;
  month: number;
  week: number;
  finished: boolean;
  /** Comma-separated display names of users who placed no bets this round (from DB NoRow field). */
  noRow: string;
}

export interface EliminationTimelineEntry {
  roundNumber: number;
  week: number;
  eliminatedUserIds: string[];
  reason: EliminationHistoryEntry["reason"];
}

export interface ElimineringenComputationResult {
  rows: ElimineringenStandingsRow[];
  history: EliminationHistoryEntry[];
  timeline: EliminationTimelineEntry[];
}

export interface WeeklyEliminationEntry {
  week: number;
  spRoundNum: number;
  eliminatedUserIds: string[];
}
