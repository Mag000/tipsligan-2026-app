import {
  SvenskaSpelResponse,
  SvenskaSpelResultResponse,
} from "../types/svenskaspel";
import { getAuthHeaders, isAuthenticated } from "../utils/authHelpers";
import { requestDeduplicator } from "../utils/requestDeduplication";
import { retryWithBackoff } from "../utils/retryWithBackoff";

const API_BASE_URL = "http://localhost:52259/api";

/** Response shape from GET /api/round/latest-synced */
interface LatestSyncedRound {
  LatestSPRoundNum: number;
  NewRoundsCreated: number;
}

export class APIManager {
  // Authentication
  static async login(username: string, password: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();

    // Use the token from backend response
    // If backend returns a Token field, use it; otherwise create a base64-encoded token
    let token: string;

    if (data.Token) {
      // Backend returned a token - use it directly
      token = data.Token;
    } else {
      // Fallback: create base64-encoded token from user data
      const tokenPayload = {
        userId: data.UserId,
        username: data.Alias,
        timestamp: Date.now(),
        sessionId: Math.random().toString(36).substring(7),
      };
      token = btoa(JSON.stringify(tokenPayload));
    }

    // Store the token
    localStorage.setItem("token", token);

    return token;
  }

  // Matches
  static async getMatches() {
    const headers = getAuthHeaders();
    if (!headers) return []; // Redirect to login is already triggered

    const response = await fetch(`${API_BASE_URL}/matches`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch matches");
    }

    return await response.json();
  }

  // Standings
  static async getStandings() {
    const headers = getAuthHeaders();
    if (!headers) return []; // Redirect to login is already triggered

    const response = await fetch(`${API_BASE_URL}/standings`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch standings");
    }

    return await response.json();
  }

  // Predictions - userId is extracted from Bearer token on backend
  static async getUserPredictions() {
    const headers = getAuthHeaders();
    if (!headers) return []; // Redirect to login is already triggered

    const response = await fetch(`${API_BASE_URL}/predictions/user`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch predictions");
    }

    return await response.json();
  }

  static async submitPrediction(
    matchId: number,
    homeScore: number,
    awayScore: number,
  ) {
    const headers = getAuthHeaders() || undefined;

    const response = await fetch(`${API_BASE_URL}/predictions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ matchId, homeScore, awayScore }),
    });

    if (!response.ok) {
      throw new Error("Failed to submit prediction");
    }

    return await response.json();
  }
  // Check if user is authenticated (has valid token in localStorage)
  static isAuthenticated(): boolean {
    return isAuthenticated();
  }

  // Get user bets for a specific round - userId is extracted from Bearer token on backend
  static async getUserBetsForRound(round: number, signal?: AbortSignal) {
    return requestDeduplicator.deduplicate(`userBets-${round}`, async () => {
      try {
        const headers = getAuthHeaders() || undefined;

        const response = await fetch(`${API_BASE_URL}/bets/${round}/user`, {
          headers,
          signal,
        });

        if (!response.ok) {
          console.warn(
            `⚠️ Failed to fetch bets for round ${round}: ${response.status} ${response.statusText}`,
          );
          return []; // Return empty array instead of throwing
        }

        const allBets = await response.json();
        console.log(
          `✅ User bets for round ${round} (${allBets.length}):`,
          allBets,
        );
        return allBets;
      } catch (error) {
        console.warn(`⚠️ Error fetching user bets for round ${round}:`, error);
        return []; // Return empty array on error so app continues to work
      }
    });
  }

  // Submit or update user bet for a specific round
  // POST /bets/{roundNumber} - See contracts/betting-api.md
  static async submitUserBet(
    roundNumber: number,
    selections: Array<{ matchNumber: number; outcome: "1" | "X" | "2" }>,
  ) {
    const headers = getAuthHeaders();
    if (!headers) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_BASE_URL}/bets/${roundNumber}`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selections }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to submit bet: ${response.status}`,
      );
    }

    return await response.json();
  }

  // Svenska Spel API - Via backend to avoid CORS
  static async getSvenskaSpelDrawInfo(
    round: number,
    signal?: AbortSignal,
  ): Promise<SvenskaSpelResponse> {
    return requestDeduplicator.deduplicate(`drawInfo-${round}`, () =>
      retryWithBackoff(async () => {
        const headers = getAuthHeaders();
        if (!headers) return {} as SvenskaSpelResponse; // Redirect triggered

        const response = await fetch(`${API_BASE_URL}/drawInfo/${round}`, {
          method: "GET",
          headers,
          mode: "cors",
          signal,
        });

        if (!response.ok) {
          const error: any = new Error(
            `Failed to fetch draw info: ${response.status}`,
          );
          error.status = response.status;
          throw error;
        }

        const responseJson = await response.json();
        return responseJson as SvenskaSpelResponse;
      }),
    );
  }

  // Fetch results for finalized draws
  static async getSvenskaSpelDrawResult(
    round: number,
    signal?: AbortSignal,
  ): Promise<SvenskaSpelResultResponse> {
    return requestDeduplicator.deduplicate(`drawResult-${round}`, () =>
      retryWithBackoff(async () => {
        const headers = getAuthHeaders();
        if (!headers) return {} as SvenskaSpelResultResponse; // Redirect triggered

        const response = await fetch(`${API_BASE_URL}/drawResult/${round}`, {
          method: "GET",
          headers,
          mode: "cors",
          signal,
        });

        if (!response.ok) {
          const error: any = new Error(
            `Failed to fetch draw result: ${response.status}`,
          );
          error.status = response.status;
          throw error;
        }

        const responseJson = await response.json();
        return responseJson as SvenskaSpelResultResponse;
      }),
    );
  }

  static async getSvenskaSpelDraws(): Promise<any> {
    try {
      const headers = getAuthHeaders();
      if (!headers) return []; // Redirect triggered

      let response = await fetch(API_BASE_URL + `/draws`, {
        headers,
        mode: "cors",
      });
      let responseJson = await response.json();
      return responseJson;
    } catch (error) {
      console.error(error);
    }
  }

  // Get bets for a specific round (all users)
  static async getBetsForRound(round: number, signal?: AbortSignal) {
    return requestDeduplicator.deduplicate(`allBets-${round}`, () =>
      retryWithBackoff(async () => {
        const headers = getAuthHeaders();
        if (!headers) return []; // Redirect triggered

        const response = await fetch(`${API_BASE_URL}/bets/${round}`, {
          headers,
          signal,
        });

        if (!response.ok) {
          const error: any = new Error(
            `Failed to fetch bets for round ${round}`,
          );
          error.status = response.status;
          throw error;
        }

        const bets = await response.json();
        console.log(`📦 Fetched ${bets.length} bets for round ${round}`);
        return bets;
      }),
    );
  }

  // Get distribution (streckfördelning) for a specific round
  static async getDistributionForRound(round: number, signal?: AbortSignal) {
    return requestDeduplicator.deduplicate(`distribution-${round}`, () =>
      retryWithBackoff(async () => {
        const headers = getAuthHeaders();
        if (!headers) return {}; // Redirect triggered

        const response = await fetch(`${API_BASE_URL}/distribution/${round}`, {
          headers,
          signal,
        });

        if (!response.ok) {
          const error: any = new Error(
            `Failed to fetch distribution for round ${round}`,
          );
          error.status = response.status;
          throw error;
        }

        const distribution = await response.json();
        console.log(
          `📊 Fetched distribution for round ${round}:`,
          distribution,
        );
        return distribution;
      }),
    );
  }

  // Finalize bets for a specific round - userId extracted from Bearer token on backend
  static async finalizeBetsForRound(round: number) {
    try {
      const headers = getAuthHeaders() || undefined;

      const response = await fetch(`${API_BASE_URL}/bets/${round}/finalize`, {
        method: "PUT",
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to finalize bets for round ${round}: ${errorText}`,
        );
      }

      console.log(`✅ Finalized bets for round ${round}`);
      return await response.json();
    } catch (error) {
      console.error(`❌ Error finalizing bets for round ${round}:`, error);
      throw error;
    }
  }

  // Save or update a bet for a specific match - userId extracted from Bearer token on backend
  static async saveBet(round: number, matchNumber: number, bet: string) {
    try {
      const headers = getAuthHeaders() || undefined;

      const response = await fetch(`${API_BASE_URL}/bet`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          round: round,
          matchNumber: matchNumber,
          bet: bet,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save bet: ${errorText}`);
      }

      console.log(`✅ Saved bet for match ${matchNumber}`);
      return await response.json();
    } catch (error) {
      console.error(`❌ Error saving bet:`, error);
      throw error;
    }
  }

  // Finalize round (alias for finalizeBetsForRound for convenience)
  static async finalizeRound(round: number) {
    return this.finalizeBetsForRound(round);
  }

  // Get news for a specific round
  static async getNews(round: number) {
    try {
      const headers = getAuthHeaders();
      if (!headers) return []; // Redirect triggered

      const response = await fetch(`${API_BASE_URL}/news/${round}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch news for round ${round}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching news for round ${round}:`, error);
      throw error;
    }
  }

  // Get current standings by period
  static async getCurrentStandings(
    period: "week" | "month" | "year",
    live: boolean = false,
  ) {
    try {
      const headers = getAuthHeaders();
      if (!headers) return []; // Redirect triggered

      const response = await fetch(
        `${API_BASE_URL}/standings/${period}/current/live/${live}`,
        {
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch current standings for ${period}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching current standings:`, error);
      throw error;
    }
  }

  // Get all active users
  static async getAllActiveUsers(round?: number) {
    try {
      const headers = getAuthHeaders();
      if (!headers) return []; // Redirect triggered

      const response = await fetch(`${API_BASE_URL}/users/all`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch active users");
      }

      let activeUsers = await response.json();

      // If round is provided, enrich with round results
      if (round) {
        const roundResults = await this.getRoundStandings(round);
        activeUsers.forEach((user: any) => {
          const userRoundResult = roundResults.filter(
            (r: any) =>
              r.UserName === user.UserName || r.userName === user.userName,
          );
          user.roundResults =
            userRoundResult.length > 0 ? userRoundResult[0] : null;
        });
      }

      return activeUsers;
    } catch (error) {
      console.error("Error fetching active users:", error);
      throw error;
    }
  }

  // Get standings for a specific round
  static async getRoundStandings(round: number) {
    try {
      const headers = getAuthHeaders();
      if (!headers) return []; // Redirect triggered

      const response = await fetch(`${API_BASE_URL}/standings/${round}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch standings for round ${round}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching round ${round} standings:`, error);
      throw error;
    }
  }

  // Get all rounds
  static async getAllRounds(signal?: AbortSignal) {
    return requestDeduplicator.deduplicate("allRounds", () =>
      retryWithBackoff(async () => {
        const headers = getAuthHeaders();
        if (!headers) return []; // Redirect triggered

        const response = await fetch(`${API_BASE_URL}/rounds/all`, {
          headers,
          signal,
        });

        if (!response.ok) {
          const error: any = new Error("Failed to fetch all rounds");
          error.status = response.status;
          throw error;
        }

        return await response.json();
      }),
    );
  }

  // Get latest round
  static async getLatestRound() {
    try {
      const headers = getAuthHeaders();
      if (!headers) return null; // Redirect triggered

      const response = await fetch(`${API_BASE_URL}/round/latest`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch latest round");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching latest round:", error);
      throw error;
    }
  }

  /**
   * Sync open Svenska Spel draws against the database and return the definitive
   * latest SPRoundNum. Called once when the user navigates to /rounds.
   * Returns null on any error — callers should fall back to the pre-loaded currentRound.
   */
  static async getLatestSyncedRound(): Promise<number | null> {
    try {
      const headers = getAuthHeaders();
      if (!headers) return null; // Redirect already triggered

      const response = await fetch(`${API_BASE_URL}/round/latest-synced`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to sync rounds: ${response.status}`);
      }

      const data: LatestSyncedRound = await response.json();
      console.log(
        `✅ Round sync complete. Latest: ${data.LatestSPRoundNum}, New rounds: ${data.NewRoundsCreated}`,
      );
      return data.LatestSPRoundNum;
    } catch (error) {
      console.error(
        "❌ Round sync failed, falling back to cached latest:",
        error,
      );
      return null;
    }
  }

  // Get matches for a specific round
  static async getMatchesForRound(round: number, signal?: AbortSignal) {
    return requestDeduplicator.deduplicate(`matches-${round}`, () =>
      retryWithBackoff(async () => {
        const headers = getAuthHeaders();
        if (!headers) return []; // Redirect triggered

        const response = await fetch(`${API_BASE_URL}/matches/${round}`, {
          headers,
          signal,
        });

        if (!response.ok) {
          const error: any = new Error(
            `Failed to fetch matches for round ${round}`,
          );
          error.status = response.status;
          throw error;
        }

        return await response.json();
      }),
    );
  }

  // Get results for a specific round
  static async getResults(round: number, getLiveRes: boolean = false) {
    try {
      const headers = getAuthHeaders();
      if (!headers) return []; // Redirect triggered

      const endpoint = getLiveRes
        ? `${API_BASE_URL}/results/${round}/true`
        : `${API_BASE_URL}/results/${round}`;

      const response = await fetch(endpoint, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch results for round ${round}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching results for round ${round}:`, error);
      throw error;
    }
  }

  // Get base statistics for multiple rounds - userId extracted from Bearer token on backend
  static async getBaseStats(rounds: number[]) {
    try {
      const headers = getAuthHeaders();
      if (!headers) return []; // Redirect triggered

      const response = await fetch(`${API_BASE_URL}/basestats`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ rounds: rounds }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch base stats");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching base stats:", error);
      throw error;
    }
  }

  // Get base statistics for all rounds in a specific year
  static async getBaseStatsForYear(year: number) {
    try {
      console.log(`📊 Fetching base stats for year ${year}...`);

      // Get all rounds
      const allRounds = await this.getAllRounds();
      console.log(`📦 Retrieved ${allRounds.length} total rounds`, allRounds);

      // Filter rounds by year
      const roundsForYear = allRounds.filter((round: any) => {
        // Check if round has a year property
        if (round.year) {
          return round.year === year;
        }
        // If round has a date property, extract year from it
        if (round.date) {
          const roundYear = new Date(round.date).getFullYear();
          return roundYear === year;
        }
        // If round has a drawDate property, extract year from it
        if (round.drawDate) {
          const roundYear = new Date(round.drawDate).getFullYear();
          return roundYear === year;
        }
        // If round has startDate property, extract year from it
        if (round.startDate) {
          const roundYear = new Date(round.startDate).getFullYear();
          return roundYear === year;
        }
        // If round has Deadline property, extract year from it
        if (round.Deadline) {
          const roundYear = new Date(round.Deadline).getFullYear();
          return roundYear === year;
        }
        // If round has Year property (capitalize)
        if (round.Year) {
          return round.Year === year;
        }
        return false;
      });

      console.log(
        `✅ Found ${roundsForYear.length} rounds for year ${year}`,
        roundsForYear,
      );

      // Extract round numbers/IDs and filter out invalid values
      const roundIds = roundsForYear
        .map(
          (round: any) =>
            round.roundNumber ||
            round.RoundNumber ||
            round.id ||
            round.Id ||
            round.roundId ||
            round.round,
        )
        .filter((id: any) => id !== undefined && id !== null);

      console.log(`📋 Round IDs to fetch:`, roundIds);

      if (roundIds.length === 0) {
        console.warn(
          `⚠️ No valid round IDs found for year ${year} - returning empty array`,
        );
        return [];
      }

      // Call getBaseStats with the filtered rounds
      console.log(`🔄 Calling getBaseStats with ${roundIds.length} rounds...`);
      const stats = await this.getBaseStats(roundIds);

      console.log(
        `✅ Retrieved base stats for ${roundIds.length} rounds in ${year}`,
        stats,
      );
      return stats;
    } catch (error) {
      console.error(`❌ Error fetching base stats for year ${year}:`, error);
      throw error;
    }
  }

  // Get distribution for a specific round
  static async getDistribution(round: number) {
    try {
      const headers = getAuthHeaders();
      if (!headers) return {}; // Redirect triggered

      const response = await fetch(`${API_BASE_URL}/distribution/${round}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch distribution for round ${round}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching distribution for round ${round}:`, error);
      throw error;
    }
  }

  // Get current round number
  static async getCurrentRoundNumber() {
    try {
      const headers = getAuthHeaders();
      if (!headers) return null; // Redirect triggered

      const response = await fetch(`${API_BASE_URL}/currentroundnumber`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch current round number");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching current round number:", error);
      throw error;
    }
  }

  // Save/update standings with round changes
  static async updateStandings(payload: any) {
    try {
      // Clean up circular references if needed
      if (payload.roundChange) {
        delete payload.$id;
        if (payload.roundChange.$id) delete payload.roundChange.$id;

        if (payload.roundChange.matches) {
          for (let m of payload.roundChange.matches) {
            if (m.$id) delete m.$id;
          }
        }

        if (payload.roundChange.bets) {
          for (let b of payload.roundChange.bets) {
            if (b.$id) delete b.$id;
          }
        }
      }

      const headers = getAuthHeaders() || undefined;

      const response = await fetch(`${API_BASE_URL}/standings`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update standings");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating standings:", error);
      throw error;
    }
  }

  // Logout - clear token and user data
  static logout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      console.log("🔓 User logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  // ==================== SVENSKA SPEL MAPPING & SYNC ====================

  /**
   * Sync a Svenska Spel draw to the database
   * Creates or updates round and matches based on Svenska Spel data
   */
  static async syncSvenskaSpeDrawToDatabase(
    drawNumber: number,
    roundNumber?: number,
  ) {
    try {
      // Fetch Svenska Spel data
      const svenskaSpeData = await this.getSvenskaSpelDrawInfo(drawNumber); // Prepare payload for backend
      const payload = {
        drawNumber: svenskaSpeData.draw.drawNumber, // Will map to SPRoundNum in database
        roundNumber: roundNumber,
        drawComment: svenskaSpeData.draw.drawComment,
        openTime: svenskaSpeData.draw.openTime,
        closeTime: svenskaSpeData.draw.closeTime,
        sport: svenskaSpeData.draw.sport,
        sportId: svenskaSpeData.draw.sportId,
        productId: svenskaSpeData.draw.productId,
        productName: svenskaSpeData.draw.productName,
        events: svenskaSpeData.draw.events.map((event) => ({
          eventNumber: event.eventNumber, // Will map to MatchNumber in database
          sportEventId: event.sportEventId,
          homeTeamName:
            event.participants.find((p) => p.type === "home")?.name ||
            "Unknown",
          awayTeamName:
            event.participants.find((p) => p.type === "away")?.name ||
            "Unknown",
          homeTeamId: event.participants.find((p) => p.type === "home")?.id,
          awayTeamId: event.participants.find((p) => p.type === "away")?.id,
          leagueName: event.league.name,
          leagueId: event.league.id,
          countryName: event.league.country.name,
          countryId: event.league.country.id,
          startTime: event.sportEventStart,
          status: event.sportEventStatus,
          cancelled: event.cancelled,
        })),
      };

      const headers = getAuthHeaders() || undefined;

      const response = await fetch(`${API_BASE_URL}/rounds/sync`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync draw ${drawNumber} to database`);
      }

      const result = await response.json();
      console.log(`✅ Successfully synced draw ${drawNumber} to database`);
      return result;
    } catch (error) {
      console.error(`Error syncing draw ${drawNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get the mapping between a round and Svenska Spel draw
   */
  static async getRoundDrawMapping(roundNumber: number) {
    try {
      const headers = getAuthHeaders();
      if (!headers) return null; // Redirect triggered

      const response = await fetch(
        `${API_BASE_URL}/rounds/${roundNumber}/mapping`,
        {
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch mapping for round ${roundNumber}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching round mapping:`, error);
      throw error;
    }
  }

  /**
   * Update match details from Svenska Spel event
   */
  // static async updateMatchFromSvenskaSpel(matchId: number, eventData: any) {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/matches/${matchId}/sync`, {
  //       method: "PUT",
  //       headers: getAuthHeaders(),
  //       body: JSON.stringify(eventData),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Failed to update match ${matchId}`);
  //     }

  //     return await response.json();
  //   } catch (error) {
  //     console.error(`Error updating match ${matchId}:`, error);
  //     throw error;
  //   }
  // }

  /**
   * Check if a round exists with the given SPRoundNum (drawNumber)
   */
  static async checkRoundExistsBySPRoundNum(
    spRoundNum: number,
  ): Promise<boolean> {
    try {
      const headers = getAuthHeaders();
      if (!headers) return false; // Redirect triggered

      const response = await fetch(
        `${API_BASE_URL}/rounds/check/${spRoundNum}`,
        {
          headers,
        },
      );

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        throw new Error(
          `Failed to check round existence for SPRoundNum ${spRoundNum}`,
        );
      }

      const result = await response.json();
      return result.exists === true;
    } catch (error) {
      console.error(`Error checking round existence:`, error);
      return false;
    }
  }

  /**
   * Helper function to calculate ISO week number from date
   */
  private static getISOWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return weekNumber;
  }

  /**
   * Create a new round from Svenska Spel draw data
   * Calculates Week from the earliest match sportEventStart
   * Sets Deadline on each match to sportEventStart
   */
  static async createRoundFromSvenskaSpelDraw(
    drawNumber: number,
  ): Promise<any> {
    try {
      console.log(`🎰 Creating round from Svenska Spel draw ${drawNumber}...`);

      // Fetch draw data from Svenska Spel
      const drawData = await this.getSvenskaSpelDrawInfo(drawNumber);

      if (!drawData || !drawData.draw) {
        throw new Error(`No draw data found for draw ${drawNumber}`);
      }

      const { draw } = drawData;

      // Find the earliest match start time
      const matchStartTimes = draw.events
        .map((event) => new Date(event.sportEventStart))
        .sort((a, b) => a.getTime() - b.getTime());

      if (matchStartTimes.length === 0) {
        throw new Error(`No matches found in draw ${drawNumber}`);
      }

      const earliestMatchDate = matchStartTimes[0];

      // Calculate year, week, and month from earliest match
      const year = earliestMatchDate.getFullYear();
      const week = this.getISOWeekNumber(earliestMatchDate);
      const month = earliestMatchDate.getMonth() + 1; // JavaScript months are 0-indexed

      // Create matches array
      const matches = draw.events.map((event) => ({
        Id: "", // Will be generated by backend
        RoundId: 0, // Will be set by backend
        MatchNumber: event.eventNumber,
        HomeTeam:
          event.participants.find((p) => p.type === "home")?.name || "Unknown",
        AwayTeam:
          event.participants.find((p) => p.type === "away")?.name || "Unknown",
        GoalsHome: 0,
        GoalsAway: 0,
        Confirmed: false,
        Comment: `${event.league.name} - ${event.league.country.name}`,
        Deadline: event.sportEventStart, // sportEventStart mapped to Deadline
      }));

      // Create round payload
      const roundPayload = {
        Id: "", // Will be generated by backend
        Year: year,
        Week: week,
        Month: month,
        NoRow: "", // Can be set by backend or left empty
        Comment: draw.drawComment,
        Confirmed: false,
        Finished: false,
        SPRoundNum: draw.drawNumber,
        Deadline: draw.closeTime,
        matches: matches,
        bets: [], // Empty array as specified
      };

      console.log(`📊 Round payload:`, {
        SPRoundNum: draw.drawNumber,
        Year: year,
        Week: week,
        Month: month,
        MatchesCount: matches.length,
      });

      // Send to backend
      const headers = getAuthHeaders() || undefined;

      const response = await fetch(`${API_BASE_URL}/rounds/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(roundPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create round from draw ${drawNumber}: ${errorText}`,
        );
      }

      const result = await response.json();
      console.log(
        `✅ Successfully created round from draw ${drawNumber} (Week ${week}, Year ${year})`,
      );
      return result;
    } catch (error) {
      console.error(`❌ Error creating round from draw ${drawNumber}:`, error);
      throw error;
    }
  }

  /**
   * Check if round exists for Svenska Spel draw, create it if it doesn't
   * This should be called after fetching draws at startup
   */
  static async ensureRoundExistsForDraw(drawNumber: number): Promise<any> {
    try {
      console.log(`🔍 Checking if round exists for draw ${drawNumber}...`);

      // Check if round already exists
      const exists = await this.checkRoundExistsBySPRoundNum(drawNumber);

      if (exists) {
        console.log(`✅ Round already exists for draw ${drawNumber}`);
        return { exists: true, created: false };
      }

      console.log(
        `📝 Round does not exist, creating for draw ${drawNumber}...`,
      );

      // Create the round
      const createdRound =
        await this.createRoundFromSvenskaSpelDraw(drawNumber);

      return { exists: false, created: true, round: createdRound };
    } catch (error) {
      console.error(
        `❌ Error ensuring round exists for draw ${drawNumber}:`,
        error,
      );
      throw error;
    }
  }
}
