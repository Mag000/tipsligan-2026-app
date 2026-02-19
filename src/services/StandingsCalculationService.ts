/**
 * Client-side standings calculation service
 * Replicates the server-side GetResultCounterList logic
 */

export interface StandingsCounter {
  userName: string;
  position: number;
  correctCount: number;
  correctSafeCount: number;
  totalBets: number;

  // Single bets (1 sign)
  single1Bets: number;
  single1Hits: number;
  singleXBets: number;
  singleXHits: number;
  single2Bets: number;
  single2Hits: number;

  // Hedge bets (2 signs)
  hedge12Bets: number;
  hedge12Hits: number;
  hedge1XBets: number;
  hedge1XHits: number;
  hedgeX2Bets: number;
  hedgeX2Hits: number;

  // Totals
  total1Bets: number;
  total1Hits: number;
  totalXBets: number;
  totalXHits: number;
  total2Bets: number;
  total2Hits: number;

  // Hunt points (calculated)
  huntPoints?: number;
}

export interface BaseStat {
  // Raw match data from API
  $id?: string;
  MatchId: number;
  MatchNumber: number;
  Year: number;
  Month: number;
  Week: number;
  HomeTeam: string;
  AwayTeam: string;
  Played: string; // User's bet: "1", "X", "2", or "1X", "X2", "12"
  Safe: number; // 1 if safe match, 0 otherwise
  Final: number; // 1 if match is finished, 0 otherwise
  UserId: string;
  SPRoundNum: number; // Svenska Spel round number
  GoalsHome: number;
  GoalsAway: number;
  Finished: number; // 1 if match is finished, 0 otherwise
}

export class StandingsCalculationService {
  /**
   * Calculate standings from base stats
   * @param baseStats Array of base stats (raw match records) from API
   * @param useNewRanking Use ranking algorithm from 2021+ (default: true for current year)
   * @returns Sorted array of standings counters
   */
  static calculateStandings(
    baseStats: BaseStat[],
    useNewRanking: boolean = true
  ): StandingsCounter[] {
    console.log(
      "🔢 Processing raw base stats:",
      baseStats.length,
      "match records"
    );

    // Calculate stats from raw match data
    const userStats = this.calculateUserStatsFromMatches(baseStats);

    console.log("👥 Calculated stats for", userStats.length, "users");

    // Sort according to ranking algorithm
    let counters = this.sortCounters(userStats, useNewRanking);

    // Assign positions
    counters = this.assignPositions(counters);

    // Calculate hunt points
    counters = counters.map((c) => this.setHuntPoints(c));

    return counters;
  }

  /**
   * Calculate user statistics from raw match records
   */
  private static calculateUserStatsFromMatches(
    baseStats: BaseStat[]
  ): StandingsCounter[] {
    // Group by user
    const userMatches = new Map<string, BaseStat[]>();

    baseStats.forEach((match) => {
      const userId = match.UserId || "Unknown";
      if (!userMatches.has(userId)) {
        userMatches.set(userId, []);
      }
      userMatches.get(userId)!.push(match);
    });

    // Calculate stats for each user
    return Array.from(userMatches.entries()).map(([userId, matches]) => {
      return this.calculateStatsForUser(userId, matches);
    });
  }

  /**
   * Calculate statistics for a single user from their match records
   */
  private static calculateStatsForUser(
    userId: string,
    matches: BaseStat[]
  ): StandingsCounter {
    const counter: StandingsCounter = {
      userName: userId,
      position: 0,
      correctCount: 0,
      correctSafeCount: 0,
      totalBets: 0,
      single1Bets: 0,
      single1Hits: 0,
      singleXBets: 0,
      singleXHits: 0,
      single2Bets: 0,
      single2Hits: 0,
      hedge12Bets: 0,
      hedge12Hits: 0,
      hedge1XBets: 0,
      hedge1XHits: 0,
      hedgeX2Bets: 0,
      hedgeX2Hits: 0,
      total1Bets: 0,
      total1Hits: 0,
      totalXBets: 0,
      totalXHits: 0,
      total2Bets: 0,
      total2Hits: 0,
    };

    matches.forEach((match) => {
      // Only process finished matches
      if (match.Finished !== 1 || match.Final !== 1) {
        return;
      }

      const bet = match.Played.toUpperCase();
      const isSafe = match.Safe === 1;

      // Determine actual result
      const actualResult = this.getMatchResult(
        match.GoalsHome,
        match.GoalsAway
      );

      // Check if bet was correct
      const isCorrect = this.isBetCorrect(bet, actualResult);

      // Update counters
      counter.totalBets++;

      if (isCorrect) {
        counter.correctCount++;
        if (isSafe) {
          counter.correctSafeCount++;
        }
      }

      // Update bet type counters
      this.updateBetTypeCounters(counter, bet, isCorrect);
      this.updateTotalCounters(counter, bet, isCorrect);
    });

    return counter;
  }

  /**
   * Get match result: "1", "X", or "2"
   */
  private static getMatchResult(goalsHome: number, goalsAway: number): string {
    if (goalsHome > goalsAway) return "1";
    if (goalsHome < goalsAway) return "2";
    return "X";
  }

  /**
   * Check if a bet covers the actual result
   */
  private static isBetCorrect(bet: string, actualResult: string): boolean {
    return bet.includes(actualResult);
  }

  /**
   * Update bet type specific counters (single vs hedge)
   */
  private static updateBetTypeCounters(
    counter: StandingsCounter,
    bet: string,
    isCorrect: boolean
  ): void {
    const betLength = bet.length;

    if (betLength === 1) {
      // Single bets
      if (bet === "1") {
        counter.single1Bets++;
        if (isCorrect) counter.single1Hits++;
      } else if (bet === "X") {
        counter.singleXBets++;
        if (isCorrect) counter.singleXHits++;
      } else if (bet === "2") {
        counter.single2Bets++;
        if (isCorrect) counter.single2Hits++;
      }
    } else if (betLength === 2) {
      // Hedge bets
      const sortedBet = bet.split("").sort().join("");
      if (sortedBet === "12") {
        counter.hedge12Bets++;
        if (isCorrect) counter.hedge12Hits++;
      } else if (sortedBet === "1X") {
        counter.hedge1XBets++;
        if (isCorrect) counter.hedge1XHits++;
      } else if (sortedBet === "2X") {
        counter.hedgeX2Bets++;
        if (isCorrect) counter.hedgeX2Hits++;
      }
    }
  }

  /**
   * Update total counters (all bets containing 1, X, or 2)
   */
  private static updateTotalCounters(
    counter: StandingsCounter,
    bet: string,
    isCorrect: boolean
  ): void {
    if (bet.includes("1")) {
      counter.total1Bets++;
      if (isCorrect) counter.total1Hits++;
    }
    if (bet.includes("X")) {
      counter.totalXBets++;
      if (isCorrect) counter.totalXHits++;
    }
    if (bet.includes("2")) {
      counter.total2Bets++;
      if (isCorrect) counter.total2Hits++;
    }
  }

  /**
   * Sort counters according to ranking algorithm
   * New ranking (2021+): Different tie-breaking order
   * Old ranking (pre-2021): Original tie-breaking order
   */
  private static sortCounters(
    counters: StandingsCounter[],
    useNewRanking: boolean
  ): StandingsCounter[] {
    return counters.sort((a, b) => {
      // Primary: Correct count (descending)
      if (a.correctCount !== b.correctCount) {
        return b.correctCount - a.correctCount;
      }

      // Secondary: Correct safe count (descending)
      if (a.correctSafeCount !== b.correctSafeCount) {
        return b.correctSafeCount - a.correctSafeCount;
      }

      // Third: Total X hits (descending)
      if (a.totalXHits !== b.totalXHits) {
        return b.totalXHits - a.totalXHits;
      }

      // Fourth: Total 2 hits (descending)
      if (a.total2Hits !== b.total2Hits) {
        return b.total2Hits - a.total2Hits;
      }

      // Fifth: Single X hits (descending)
      if (a.singleXHits !== b.singleXHits) {
        return b.singleXHits - a.singleXHits;
      }

      // Sixth: Single 2 hits (descending)
      if (a.single2Hits !== b.single2Hits) {
        return b.single2Hits - a.single2Hits;
      }

      // Seventh: Single 1 hits (descending)
      if (a.single1Hits !== b.single1Hits) {
        return b.single1Hits - a.single1Hits;
      }

      if (useNewRanking) {
        // New ranking (2021+): HedgeX2 before Hedge1X before Hedge12
        if (a.hedgeX2Hits !== b.hedgeX2Hits) {
          return b.hedgeX2Hits - a.hedgeX2Hits;
        }
        if (a.hedge1XHits !== b.hedge1XHits) {
          return b.hedge1XHits - a.hedge1XHits;
        }
        if (a.hedge12Hits !== b.hedge12Hits) {
          return b.hedge12Hits - a.hedge12Hits;
        }
      } else {
        // Old ranking (pre-2021): Hedge12 before HedgeX2 before Hedge1X
        if (a.hedge12Hits !== b.hedge12Hits) {
          return b.hedge12Hits - a.hedge12Hits;
        }
        if (a.hedgeX2Hits !== b.hedgeX2Hits) {
          return b.hedgeX2Hits - a.hedgeX2Hits;
        }
        if (a.hedge1XHits !== b.hedge1XHits) {
          return b.hedge1XHits - a.hedge1XHits;
        }
      }

      // Bets as tie-breakers (descending)
      if (a.singleXBets !== b.singleXBets) {
        return b.singleXBets - a.singleXBets;
      }
      if (a.single2Bets !== b.single2Bets) {
        return b.single2Bets - a.single2Bets;
      }

      if (useNewRanking) {
        if (a.hedgeX2Bets !== b.hedgeX2Bets) {
          return b.hedgeX2Bets - a.hedgeX2Bets;
        }
        if (a.hedge1XBets !== b.hedge1XBets) {
          return b.hedge1XBets - a.hedge1XBets;
        }
        if (a.hedge12Bets !== b.hedge12Bets) {
          return b.hedge12Bets - a.hedge12Bets;
        }
      } else {
        if (a.hedge12Bets !== b.hedge12Bets) {
          return b.hedge12Bets - a.hedge12Bets;
        }
        if (a.hedgeX2Bets !== b.hedgeX2Bets) {
          return b.hedgeX2Bets - a.hedgeX2Bets;
        }
      }

      return 0; // Equal
    });
  }

  /**
   * Assign position numbers after sorting
   */
  private static assignPositions(
    counters: StandingsCounter[]
  ): StandingsCounter[] {
    return counters.map((counter, index) => ({
      ...counter,
      position: index + 1,
    }));
  }

  /**
   * Calculate hunt points for a counter
   * Hunt points = correct count + (correct safe count * 2)
   */
  private static setHuntPoints(counter: StandingsCounter): StandingsCounter {
    const huntPoints = counter.correctCount + counter.correctSafeCount * 2;
    return {
      ...counter,
      huntPoints,
    };
  }

  /**
   * Determine if new ranking should be used based on year
   */
  static shouldUseNewRanking(year?: number): boolean {
    const targetYear = year || new Date().getFullYear();
    return targetYear > 2020;
  }
}
