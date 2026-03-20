import {
  EliminationHistoryEntry,
  EliminationTimelineEntry,
  ElimineringenComputationResult,
  ElimineringenRuleConfig,
  ElimineringenStandingsRow,
  LiveEliminationState,
  LiveScoreOverride,
  RoundMeta,
  WeeklyEliminationEntry,
} from "../types/elimineringen";
import {
  BaseStat,
  StandingsCalculationService,
  StandingsCounter,
} from "./StandingsCalculationService";

const DEFAULT_RULE_CONFIG: ElimineringenRuleConfig = {
  earlyWeeklyEliminationCount: 2,
  lateWeeklyEliminationCount: 1,
  latePhaseStartRoundIndex: 7, // rounds 1-6 → 2 eliminations, round 7+ → 1 elimination
  tieBreakRule: "all-tied-poorest",
  noBetRule: "eliminate-all-no-bet",
  activeMarker: "⚠",
};

export class ElimineringenService {
  static getDefaultConfig(): ElimineringenRuleConfig {
    return DEFAULT_RULE_CONFIG;
  }

  static mergeLiveOverrides(
    baseStats: BaseStat[],
    roundNumber: number,
    overrides: Record<number, LiveScoreOverride>,
  ): BaseStat[] {
    return baseStats.map((stat) => {
      if (stat.SPRoundNum !== roundNumber) {
        return stat;
      }

      const override = overrides[stat.MatchNumber];
      if (!override) {
        return stat;
      }

      return {
        ...stat,
        GoalsHome: override.goalsHome,
        GoalsAway: override.goalsAway,
      };
    });
  }

  static buildEliminationTimeline(
    baseStats: BaseStat[],
    rounds: RoundMeta[],
    userDisplayNames: Record<string, string>,
    noBetUsersByRound: Record<number, Set<string>>,
    config: Partial<ElimineringenRuleConfig> = {},
  ): ElimineringenComputationResult {
    const effectiveConfig: ElimineringenRuleConfig = {
      ...DEFAULT_RULE_CONFIG,
      ...config,
    };

    const orderedRounds = [...rounds].sort(
      (a, b) => a.spRoundNum - b.spRoundNum,
    );
    const baseRows = this.toStandingsRows(baseStats, userDisplayNames);
    const activeUserIds = new Set(
      baseRows.map((row) => row.userId.toUpperCase()),
    );
    // Record the starting pool size — used to decide whether double-elimination
    // applies (server rule: only when contestants > 25).
    const totalContestants = activeUserIds.size;
    const eliminationHistory: EliminationHistoryEntry[] = [];
    const timeline: EliminationTimelineEntry[] = [];
    let eliminationSequence = 1;
    let roundIndex = 0;

    for (const round of orderedRounds) {
      if (activeUserIds.size <= 1) {
        break;
      }

      // Never eliminate based on a round that isn't finished yet — the live
      // round is handled separately by computeLiveEliminationPositions.
      if (!round.finished) {
        continue;
      }

      // Elimineringen only runs February–August (month 2–8).
      if (round.month < 2 || round.month >= 9) {
        continue;
      }

      roundIndex += 1;

      const roundStats = baseStats.filter(
        (stat) => stat.SPRoundNum === round.spRoundNum,
      );

      if (roundStats.length === 0) {
        // Round has no finalized stats yet — nothing to calculate or eliminate.
        continue;
      }

      // Per-round standings — only active (non-eliminated) users.
      const roundRows = this.toStandingsRows(
        roundStats,
        userDisplayNames,
      ).filter((row) => activeUserIds.has(row.userId.toUpperCase()));

      // Full counter map for the round — needed for server-equivalent
      // tie detection (mirrors parseToJson equality in GetEliminationResult).
      const roundCounterMap = this.buildRoundCounterMap(roundStats);

      // Build reverse map: lowercased display name → userId for active users.
      const displayNameToUserId = new Map<string, string>();
      for (const uid of activeUserIds) {
        const name = userDisplayNames[uid];
        if (name) {
          displayNameToUserId.set(name.toLowerCase(), uid);
        }
      }

      // Authoritative no-bet list from DB NoRow field (comma-separated names).
      const noRowNamesFromDb = (round.noRow ?? "")
        .split(",")
        .map((n) => n.trim().toLowerCase())
        .filter(Boolean);
      const noRowIdsFromDb = new Set<string>(
        noRowNamesFromDb
          .map((name) => displayNameToUserId.get(name))
          .filter((uid): uid is string => uid !== undefined),
      );
      // Runtime detection fallback for live rounds not yet written to DB.
      const explicitNoBetSet =
        noBetUsersByRound[round.spRoundNum] ?? new Set<string>();
      const effectiveNoBetSet = new Set<string>([
        ...noRowIdsFromDb,
        ...explicitNoBetSet,
      ]);

      // === Elimination logic (mirrors server GetEliminationResult) ===
      //
      // 1. Determine weekly quota.
      // 2. Eliminate no-bet users first; each one counts toward the quota.
      // 3. Fill any remaining quota from the worst-performing non-no-bet users.
      // 4. After quota is met, expand: if the last quota-eliminated user ties
      //    with the next remaining user (identical full stats = same position),
      //    also eliminate those tied users.

      let toEliminate = this.getWeeklyQuota(
        roundIndex,
        effectiveConfig,
        totalContestants,
      );

      // Stub builder for active users who have no bet data this round.
      const makeStub = (uid: string): ElimineringenStandingsRow => ({
        userId: uid,
        displayName: userDisplayNames[uid] || uid,
        position: roundRows.length + 1,
        correctCount: 0,
        correctSafeCount: 0,
        status: "active" as const,
        eliminatedRound: null,
        eliminatedWeek: null,
        eliminationSequence: null,
        eliminationReason: null,
      });

      // --- Step 1: no-bet users (in worst-first order where determinable) ---
      const eliminatedThisRound: Array<{
        row: ElimineringenStandingsRow;
        reason: EliminationHistoryEntry["reason"];
      }> = [];

      for (const uid of activeUserIds) {
        if (!effectiveNoBetSet.has(uid)) continue;
        const row =
          roundRows.find((r) => r.userId.toUpperCase() === uid) ??
          makeStub(uid);
        eliminatedThisRound.push({ row, reason: "no-bet" });
        toEliminate--;
      }

      // --- Step 2: worst-performing non-no-bet users to fill remaining quota ---
      const eliminatedIds = new Set(
        eliminatedThisRound.map((e) => e.row.userId.toUpperCase()),
      );
      const nonNoBetWorstFirst = [...roundRows]
        .filter((row) => !eliminatedIds.has(row.userId.toUpperCase()))
        .sort(this.comparePoorestFirst);

      let lastQuotaRow: ElimineringenStandingsRow | null = null;
      for (const row of nonNoBetWorstFirst) {
        if (toEliminate <= 0) break;
        eliminatedThisRound.push({ row, reason: "quota-poorest" });
        eliminatedIds.add(row.userId.toUpperCase());
        lastQuotaRow = row;
        toEliminate--;
      }

      // --- Step 3: tie expansion at the quota boundary ---
      // If the last quota-filled user (non-no-bet) has identical full stats
      // as the next remaining user, also eliminate those tied users.
      // Mirrors server: parseToJson(lastEliminated) == parseToJson(p)
      if (lastQuotaRow !== null) {
        const lastCounter = roundCounterMap.get(
          lastQuotaRow.userId.toUpperCase(),
        );
        if (lastCounter) {
          for (const row of nonNoBetWorstFirst) {
            if (eliminatedIds.has(row.userId.toUpperCase())) continue;
            const rowCounter = roundCounterMap.get(row.userId.toUpperCase());
            if (
              rowCounter &&
              this.countersAreStatisticallyEqual(lastCounter, rowCounter)
            ) {
              eliminatedThisRound.push({ row, reason: "tied-poorest" });
              eliminatedIds.add(row.userId.toUpperCase());
            }
          }
        }
      }

      // Guard: never eliminate everyone (keep at least 1 active user).
      const safeEliminated =
        eliminatedThisRound.length >= activeUserIds.size
          ? eliminatedThisRound.slice(0, Math.max(activeUserIds.size - 1, 0))
          : eliminatedThisRound;

      const eliminatedUserIds = safeEliminated.map((e) =>
        e.row.userId.toUpperCase(),
      );
      // Primary reason for the timeline entry (first non-no-bet reason, or no-bet).
      const roundReason: EliminationHistoryEntry["reason"] =
        safeEliminated.find((e) => e.reason !== "no-bet")?.reason ?? "no-bet";

      for (const { row, reason } of safeEliminated) {
        const uid = row.userId.toUpperCase();
        activeUserIds.delete(uid);
        eliminationHistory.push({
          userId: uid,
          eliminationRound: round.spRoundNum,
          eliminationWeek: round.week,
          eliminationSequence,
          reason,
        });
        eliminationSequence += 1;
      }

      timeline.push({
        roundNumber: round.spRoundNum,
        week: round.week,
        eliminatedUserIds,
        reason: roundReason,
      });
    }

    const overallRows = this.toStandingsRows(baseStats, userDisplayNames);
    const historyByUser = new Map(
      eliminationHistory.map((entry) => [entry.userId.toUpperCase(), entry]),
    );

    const rows = overallRows.map((row) => {
      const history = historyByUser.get(row.userId.toUpperCase());
      if (!history) {
        return {
          ...row,
          status:
            activeUserIds.size === 1 &&
            activeUserIds.has(row.userId.toUpperCase())
              ? ("winner" as const)
              : ("active" as const),
        };
      }

      return {
        ...row,
        status: "eliminated" as const,
        eliminatedRound: history.eliminationRound,
        eliminatedWeek: history.eliminationWeek,
        eliminationSequence: history.eliminationSequence,
        eliminationReason: history.reason,
      };
    });

    return {
      rows,
      history: eliminationHistory,
      timeline,
    };
  }

  static detectNoBetUsersForRound(
    activeUserIds: Set<string>,
    allBetsForRound: unknown[],
  ): Set<string> {
    const userHasBet = new Map<string, boolean>();

    for (const entry of allBetsForRound) {
      const userId = this.extractUserId(entry);
      if (!userId || !activeUserIds.has(userId)) {
        continue;
      }

      const hasAnyBet = this.hasAnyBet(entry);
      userHasBet.set(userId, userHasBet.get(userId) === true || hasAnyBet);
    }

    const noBetUsers = new Set<string>();
    for (const activeUserId of activeUserIds) {
      if (userHasBet.get(activeUserId) !== true) {
        noBetUsers.add(activeUserId);
      }
    }

    return noBetUsers;
  }

  static computeLiveEliminationPositions(
    rows: ElimineringenStandingsRow[],
    isLiveRound: boolean,
    weeklyQuota: number,
    noBetUsers: Set<string> = new Set<string>(),
  ): LiveEliminationState {
    if (!isLiveRound || rows.length === 0 || weeklyQuota <= 0) {
      return {
        isLiveRound,
        roundNumber: null,
        eliminationPositionUserIds: new Set<string>(),
      };
    }

    const atRisk = new Set<string>();
    let toEliminate = weeklyQuota;

    // Step 1: no-bet users are at risk first, each counts toward quota.
    for (const uid of noBetUsers) {
      atRisk.add(uid.toUpperCase());
      toEliminate--;
    }

    // Step 2: fill remaining quota from worst active non-no-bet users.
    if (toEliminate > 0) {
      const activeNonNoBet = rows
        .filter(
          (r) => r.status === "active" && !atRisk.has(r.userId.toUpperCase()),
        )
        .sort(this.comparePoorestFirst);

      let lastRow: ElimineringenStandingsRow | null = null;
      for (const row of activeNonNoBet) {
        if (toEliminate <= 0) break;
        atRisk.add(row.userId.toUpperCase());
        lastRow = row;
        toEliminate--;
      }

      // Step 3: also mark tied users at the quota boundary as at risk.
      if (lastRow !== null) {
        for (const row of activeNonNoBet) {
          if (atRisk.has(row.userId.toUpperCase())) continue;
          if (row.position === lastRow.position) {
            atRisk.add(row.userId.toUpperCase());
          }
        }
      }
    }

    return {
      isLiveRound,
      roundNumber: null,
      eliminationPositionUserIds: atRisk,
    };
  }

  /**
   * Returns true when two counters are fully statistically identical across
   * the entire tie-breaking chain. Mirrors the server-side parseToJson equality
   * used in GetEliminationResult to detect ties at the elimination boundary.
   */
  private static countersAreStatisticallyEqual(
    a: StandingsCounter,
    b: StandingsCounter,
  ): boolean {
    return (
      a.correctCount === b.correctCount &&
      a.correctSafeCount === b.correctSafeCount &&
      a.totalXHits === b.totalXHits &&
      a.total2Hits === b.total2Hits &&
      a.singleXHits === b.singleXHits &&
      a.single2Hits === b.single2Hits &&
      a.single1Hits === b.single1Hits &&
      a.hedgeX2Hits === b.hedgeX2Hits &&
      a.hedge1XHits === b.hedge1XHits &&
      a.hedge12Hits === b.hedge12Hits &&
      a.singleXBets === b.singleXBets &&
      a.single2Bets === b.single2Bets &&
      a.hedgeX2Bets === b.hedgeX2Bets &&
      a.hedge1XBets === b.hedge1XBets &&
      a.hedge12Bets === b.hedge12Bets
    );
  }

  /**
   * Computes per-round standings and returns a userId (uppercased) → StandingsCounter map.
   * Used for full-stat tie detection in buildEliminationTimeline.
   */
  private static buildRoundCounterMap(
    roundStats: BaseStat[],
  ): Map<string, StandingsCounter> {
    const latestYear = roundStats.reduce(
      (max, s) => Math.max(max, s.Year || max),
      0,
    );
    const counters = StandingsCalculationService.calculateStandings(
      roundStats,
      StandingsCalculationService.shouldUseNewRanking(latestYear || undefined),
    );
    const map = new Map<string, StandingsCounter>();
    for (const c of counters) {
      map.set(String(c.userName).toUpperCase(), c);
    }
    return map;
  }

  private static comparePoorestFirst(
    first: ElimineringenStandingsRow,
    second: ElimineringenStandingsRow,
  ): number {
    if (first.correctCount !== second.correctCount) {
      return first.correctCount - second.correctCount;
    }

    if (first.correctSafeCount !== second.correctSafeCount) {
      return first.correctSafeCount - second.correctSafeCount;
    }

    return second.position - first.position;
  }

  private static getWeeklyQuota(
    roundIndex: number,
    config: ElimineringenRuleConfig,
    totalContestants: number = 0,
  ): number {
    // Mirror server rule: double-elimination only applies when contestants > 25.
    if (totalContestants > 0 && totalContestants <= 25) {
      return config.lateWeeklyEliminationCount; // always 1
    }

    if (
      typeof config.latePhaseStartRoundIndex === "number" &&
      roundIndex >= config.latePhaseStartRoundIndex
    ) {
      return config.lateWeeklyEliminationCount;
    }

    return config.earlyWeeklyEliminationCount;
  }

  private static extractUserId(entry: unknown): string | null {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const maybeUserId =
      (entry as Record<string, unknown>).UserId ??
      (entry as Record<string, unknown>).userId ??
      (entry as Record<string, unknown>).aspnet_UsersUserId;

    if (!maybeUserId) {
      return null;
    }

    return String(maybeUserId).toUpperCase();
  }

  private static hasAnyBet(entry: unknown): boolean {
    if (!entry || typeof entry !== "object") {
      return false;
    }

    const record = entry as Record<string, unknown>;
    const played = record.Played ?? record.played ?? record.bet;
    if (typeof played === "string") {
      return played.trim().length > 0;
    }

    const bets = record.bets;
    if (!bets) {
      return false;
    }

    if (Array.isArray(bets)) {
      return bets.length > 0;
    }

    if (typeof bets === "object") {
      return Object.keys(bets as Record<string, unknown>).length > 0;
    }

    return false;
  }

  /**
   * Calculates which users are eliminated each week, derived purely from baseStats.
   * Rounds are inferred from the stats themselves (grouped by SPRoundNum).
   * Only rounds with Week <= currentWeek and Month 2–8 that are finished are processed.
   *
   * @param baseStats  Raw match-level records from the API.
   * @param currentWeek  Upper bound week number (inclusive). Rounds beyond this week are ignored.
   * @param userDisplayNames  Optional userId → display name map (uppercased keys).
   * @param config  Optional rule overrides.
   * @returns Array of weekly entries in chronological round order.
   */
  static calculateEliminationsByWeek(
    baseStats: BaseStat[],
    currentWeek: number,
    userDisplayNames: Record<string, string> = {},
    config: Partial<ElimineringenRuleConfig> = {},
  ): WeeklyEliminationEntry[] {
    const effectiveConfig: ElimineringenRuleConfig = {
      ...DEFAULT_RULE_CONFIG,
      ...config,
    };

    // Group stats by round.
    const roundMap = new Map<number, BaseStat[]>();
    for (const stat of baseStats) {
      if (!roundMap.has(stat.SPRoundNum)) {
        roundMap.set(stat.SPRoundNum, []);
      }
      roundMap.get(stat.SPRoundNum)!.push(stat);
    }

    // Derive round metadata from the stats themselves.
    const rounds: Array<{
      spRoundNum: number;
      week: number;
      month: number;
      finished: boolean;
    }> = [];
    for (const [spRoundNum, stats] of roundMap) {
      const sample = stats[0];
      const finished = stats.every((s) => s.Finished === 1);
      rounds.push({
        spRoundNum,
        week: sample.Week,
        month: sample.Month,
        finished,
      });
    }
    rounds.sort((a, b) => a.spRoundNum - b.spRoundNum);

    // All unique participants (uppercased).
    const activeUserIds = new Set<string>(
      baseStats.map((s) => s.UserId.toUpperCase()),
    );
    const totalContestants = activeUserIds.size;

    const result: WeeklyEliminationEntry[] = [];
    let roundIndex = 0;

    for (const round of rounds) {
      if (activeUserIds.size <= 1) break;
      if (!round.finished) continue;
      if (round.month < 2 || round.month >= 9) continue;
      if (round.week > currentWeek) continue;

      roundIndex++;

      const roundStats = roundMap.get(round.spRoundNum)!;
      const roundRows = this.toStandingsRows(
        roundStats,
        userDisplayNames,
      ).filter((row) => activeUserIds.has(row.userId.toUpperCase()));
      const roundCounterMap = this.buildRoundCounterMap(roundStats);

      // Detect no-bet users: active users absent from this round's stats.
      const usersWithStats = new Set(
        roundStats.map((s) => s.UserId.toUpperCase()),
      );
      const noBetIds = new Set<string>();
      for (const uid of activeUserIds) {
        if (!usersWithStats.has(uid)) noBetIds.add(uid);
      }

      let toEliminate = this.getWeeklyQuota(
        roundIndex,
        effectiveConfig,
        totalContestants,
      );

      const eliminatedThisRound: Array<{
        userId: string;
        reason: EliminationHistoryEntry["reason"];
      }> = [];

      // Step 1: no-bet users.
      for (const uid of activeUserIds) {
        if (!noBetIds.has(uid)) continue;
        eliminatedThisRound.push({ userId: uid, reason: "no-bet" });
        toEliminate--;
      }

      // Step 2: worst-performing non-no-bet users.
      const eliminatedIds = new Set(eliminatedThisRound.map((e) => e.userId));
      const nonNoBetWorstFirst = [...roundRows]
        .filter((row) => !eliminatedIds.has(row.userId.toUpperCase()))
        .sort(this.comparePoorestFirst);

      let lastQuotaRow: ElimineringenStandingsRow | null = null;
      for (const row of nonNoBetWorstFirst) {
        if (toEliminate <= 0) break;
        eliminatedThisRound.push({
          userId: row.userId.toUpperCase(),
          reason: "quota-poorest",
        });
        eliminatedIds.add(row.userId.toUpperCase());
        lastQuotaRow = row;
        toEliminate--;
      }

      // Step 3: tie expansion at the quota boundary.
      if (lastQuotaRow !== null) {
        const lastCounter = roundCounterMap.get(
          lastQuotaRow.userId.toUpperCase(),
        );
        if (lastCounter) {
          for (const row of nonNoBetWorstFirst) {
            if (eliminatedIds.has(row.userId.toUpperCase())) continue;
            const rowCounter = roundCounterMap.get(row.userId.toUpperCase());
            if (
              rowCounter &&
              this.countersAreStatisticallyEqual(lastCounter, rowCounter)
            ) {
              eliminatedThisRound.push({
                userId: row.userId.toUpperCase(),
                reason: "tied-poorest",
              });
              eliminatedIds.add(row.userId.toUpperCase());
            }
          }
        }
      }

      // Guard: never eliminate the last remaining user.
      const safeEliminated =
        eliminatedThisRound.length >= activeUserIds.size
          ? eliminatedThisRound.slice(0, Math.max(activeUserIds.size - 1, 0))
          : eliminatedThisRound;

      for (const { userId } of safeEliminated) {
        activeUserIds.delete(userId);
      }

      result.push({
        week: round.week,
        spRoundNum: round.spRoundNum,
        eliminatedUserIds: safeEliminated.map((e) => e.userId),
      });
    }

    return result;
  }

  /**
   * Returns the total number of eliminated users up to and including currentWeek.
   */
  static getTotalEliminatedCount(
    baseStats: BaseStat[],
    currentWeek: number,
    userDisplayNames: Record<string, string> = {},
    config: Partial<ElimineringenRuleConfig> = {},
  ): number {
    return this.calculateEliminationsByWeek(
      baseStats,
      currentWeek,
      userDisplayNames,
      config,
    ).reduce((sum, entry) => sum + entry.eliminatedUserIds.length, 0);
  }

  private static toStandingsRows(
    baseStats: BaseStat[],
    userDisplayNames: Record<string, string>,
  ): ElimineringenStandingsRow[] {
    const latestYear = baseStats.reduce((maxYear, stat) => {
      return Math.max(maxYear, stat.Year || maxYear);
    }, 0);

    const standings = StandingsCalculationService.calculateStandings(
      baseStats,
      StandingsCalculationService.shouldUseNewRanking(latestYear || undefined),
    );

    return standings.map((player) => {
      const userId = String(player.userName).toUpperCase();
      return {
        userId,
        displayName: userDisplayNames[userId] || player.userName,
        position: player.position,
        correctCount: player.correctCount,
        correctSafeCount: player.correctSafeCount,
        status: "active",
        eliminatedRound: null,
        eliminatedWeek: null,
        eliminationSequence: null,
        eliminationReason: null,
      };
    });
  }
}
