/**
 * MatchMappingService
 *
 * Service for mapping between Svenska Spel API data and database entities.
 * Handles the connection between:
 * - Svenska Spel draws <-> Database rounds
 * - Svenska Spel events <-> Database matches
 */

import { DrawEvent, DrawInfo } from "../types/svenskaspel";

export interface DatabaseRound {
  id: number;
  roundNumber: number;
  SPRoundNum: number; // Svenska Spel draw number (database field: SPRoundNum)
  year: number;
  weekNumber: number;
  drawComment: string;
  openTime: string;
  closeTime: string;
  sport: string;
  sportId: number;
  productId: number;
  productName: string;
}

export interface DatabaseMatch {
  id: number;
  roundId: number;
  MatchNumber: number; // Svenska Spel event number (1-13) - database field: MatchNumber
  sportEventId: number; // Svenska Spel unique sport event ID
  homeTeamId?: number;
  awayTeamId?: number;
  homeTeamName: string;
  awayTeamName: string;
  leagueName: string;
  leagueId: number;
  countryName: string;
  countryId: number;
  startTime: string;
  status: string;
  cancelled: boolean;
}

export interface RoundMatchMapping {
  round: DatabaseRound;
  matches: DatabaseMatch[];
  svenskaSpeDrawNumber: number;
  totalEvents: number;
}

export class MatchMappingService {
  /**
   * Creates a round entity from Svenska Spel draw info
   */
  static mapDrawToRound(
    drawInfo: DrawInfo,
    roundNumber: number
  ): DatabaseRound {
    // Extract year and week from drawComment (e.g., "Stryktipset v. 2026-01")
    let year = new Date().getFullYear();
    let weekNumber = 1;

    const weekMatch = drawInfo.drawComment.match(/v\.\s*(\d{4})-(\d+)/);
    if (weekMatch) {
      year = parseInt(weekMatch[1], 10);
      weekNumber = parseInt(weekMatch[2], 10);
    }
    return {
      id: 0, // Will be set by database
      roundNumber: roundNumber,
      SPRoundNum: drawInfo.drawNumber, // Map Svenska Spel draw number to SPRoundNum
      year: year,
      weekNumber: weekNumber,
      drawComment: drawInfo.drawComment,
      openTime: drawInfo.openTime,
      closeTime: drawInfo.closeTime,
      sport: drawInfo.sport,
      sportId: drawInfo.sportId,
      productId: drawInfo.productId,
      productName: drawInfo.productName,
    };
  }

  /**
   * Creates a match entity from Svenska Spel event
   */
  static mapEventToMatch(event: DrawEvent, roundId: number): DatabaseMatch {
    const homeParticipant = event.participants.find((p) => p.type === "home");
    const awayParticipant = event.participants.find((p) => p.type === "away");
    return {
      id: 0, // Will be set by database
      roundId: roundId,
      MatchNumber: event.eventNumber, // Map Svenska Spel event number to MatchNumber
      sportEventId: event.sportEventId,
      homeTeamName: homeParticipant?.name || "Unknown",
      awayTeamName: awayParticipant?.name || "Unknown",
      homeTeamId: homeParticipant?.id,
      awayTeamId: awayParticipant?.id,
      leagueName: event.league.name,
      leagueId: event.league.id,
      countryName: event.league.country.name,
      countryId: event.league.country.id,
      startTime: event.sportEventStart,
      status: event.sportEventStatus,
      cancelled: event.cancelled,
    };
  }

  /**
   * Creates a complete round with matches from Svenska Spel draw
   */
  static mapDrawToRoundWithMatches(
    drawInfo: DrawInfo,
    roundNumber: number
  ): RoundMatchMapping {
    const round = this.mapDrawToRound(drawInfo, roundNumber);

    // For database insertion, roundId will need to be set after round is created
    const matches = drawInfo.events.map(
      (event) => this.mapEventToMatch(event, 0) // roundId will be updated after round creation
    );

    return {
      round: round,
      matches: matches,
      svenskaSpeDrawNumber: drawInfo.drawNumber,
      totalEvents: drawInfo.events.length,
    };
  }
  /**
   * Finds a match by Svenska Spel eventNumber
   * eventNumber maps to MatchNumber in database
   */
  static findMatchByEventNumber(
    matches: DatabaseMatch[],
    eventNumber: number
  ): DatabaseMatch | undefined {
    return matches.find((m) => m.MatchNumber === eventNumber);
  }

  /**
   * Finds a match by Svenska Spel sportEventId (more unique identifier)
   */
  static findMatchBySportEventId(
    matches: DatabaseMatch[],
    sportEventId: number
  ): DatabaseMatch | undefined {
    return matches.find((m) => m.sportEventId === sportEventId);
  }
  /**
   * Finds a round by Svenska Spel drawNumber
   * drawNumber maps to SPRoundNum in database
   */
  static findRoundByDrawNumber(
    rounds: DatabaseRound[],
    drawNumber: number
  ): DatabaseRound | undefined {
    return rounds.find((r) => r.SPRoundNum === drawNumber);
  }

  /**
   * Finds a round by year and week number
   */
  static findRoundByYearAndWeek(
    rounds: DatabaseRound[],
    year: number,
    weekNumber: number
  ): DatabaseRound | undefined {
    return rounds.find((r) => r.year === year && r.weekNumber === weekNumber);
  }
  /**
   * Validates if a draw matches an existing round
   */
  static validateDrawMatchesRound(
    drawInfo: DrawInfo,
    round: DatabaseRound
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (drawInfo.drawNumber !== round.SPRoundNum) {
      errors.push(
        `Draw number mismatch: Expected ${round.SPRoundNum}, got ${drawInfo.drawNumber}`
      );
    }

    if (drawInfo.productId !== round.productId) {
      errors.push(
        `Product ID mismatch: Expected ${round.productId}, got ${drawInfo.productId}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
  /**
   * Creates a lookup map for quick event -> match mapping
   * Uses MatchNumber field from database
   */
  static createEventNumberToMatchMap(
    matches: DatabaseMatch[]
  ): Map<number, DatabaseMatch> {
    const map = new Map<number, DatabaseMatch>();
    matches.forEach((match) => {
      map.set(match.MatchNumber, match);
    });
    return map;
  }

  /**
   * Creates a lookup map for quick sportEventId -> match mapping
   */
  static createSportEventIdToMatchMap(
    matches: DatabaseMatch[]
  ): Map<number, DatabaseMatch> {
    const map = new Map<number, DatabaseMatch>();
    matches.forEach((match) => {
      map.set(match.sportEventId, match);
    });
    return map;
  }

  /**
   * Syncs Svenska Spel events with database matches
   * Returns information about matches that need to be created/updated
   */
  static syncEventsWithMatches(
    events: DrawEvent[],
    existingMatches: DatabaseMatch[],
    roundId: number
  ): {
    toCreate: DatabaseMatch[];
    toUpdate: DatabaseMatch[];
    existing: DatabaseMatch[];
  } {
    const sportEventMap = this.createSportEventIdToMatchMap(existingMatches);
    const eventNumberMap = this.createEventNumberToMatchMap(existingMatches);

    const toCreate: DatabaseMatch[] = [];
    const toUpdate: DatabaseMatch[] = [];
    const existing: DatabaseMatch[] = [];

    events.forEach((event) => {
      // First try to find by sportEventId (most reliable)
      let existingMatch = sportEventMap.get(event.sportEventId);

      // Fallback to eventNumber
      if (!existingMatch) {
        existingMatch = eventNumberMap.get(event.eventNumber);
      }

      if (existingMatch) {
        // Check if match needs updating
        const needsUpdate =
          existingMatch.status !== event.sportEventStatus ||
          existingMatch.cancelled !== event.cancelled ||
          existingMatch.startTime !== event.sportEventStart;

        if (needsUpdate) {
          toUpdate.push({
            ...existingMatch,
            status: event.sportEventStatus,
            cancelled: event.cancelled,
            startTime: event.sportEventStart,
          });
        } else {
          existing.push(existingMatch);
        }
      } else {
        // Match doesn't exist, needs to be created
        toCreate.push(this.mapEventToMatch(event, roundId));
      }
    });

    return { toCreate, toUpdate, existing };
  }

  /**
   * Generates a unique key for caching/identifying a match
   */
  static generateMatchKey(drawNumber: number, eventNumber: number): string {
    return `draw-${drawNumber}-event-${eventNumber}`;
  }

  /**
   * Generates a unique key for caching/identifying a round
   */
  static generateRoundKey(year: number, weekNumber: number): string {
    return `round-${year}-w${weekNumber}`;
  }
  /**
   * Helper to extract bet mapping from user bets
   * Maps eventNumber to bet value
   */
  static mapUserBetsByEventNumber(
    userBets: any[]
  ): Map<number, { bet: string; isSafe: boolean }> {
    const map = new Map<number, { bet: string; isSafe: boolean }>();

    console.log(`🔍 Mapping ${userBets.length} user bets...`);

    userBets.forEach((bet, index) => {
      // Log all available keys for debugging
      console.log(`   Bet ${index + 1} keys:`, Object.keys(bet));

      // Try to find event number from various possible field names
      const eventNum =
        bet.EventNumber ||
        bet.eventNumber ||
        bet.MatchNumber ||
        bet.matchNumber ||
        bet.EventId ||
        bet.eventId ||
        bet.Match ||
        bet.match;

      // Try to find bet value from various possible field names
      const betValue =
        bet.Bet ||
        bet.bet ||
        bet.Tip ||
        bet.tip ||
        bet.Prediction ||
        bet.prediction ||
        bet.Sign ||
        bet.sign;

      // Try to find safe flag from various possible field names
      const isSafe =
        bet.Safe ||
        bet.safe ||
        bet.IsSafe ||
        bet.isSafe ||
        bet.SafeBet ||
        bet.safeBet ||
        false;

      console.log(
        `   Bet ${
          index + 1
        } extracted: eventNum=${eventNum}, betValue=${betValue}, isSafe=${isSafe}`
      );

      if (eventNum && betValue) {
        map.set(eventNum, { bet: betValue, isSafe: isSafe });
        console.log(
          `   ✅ Added to map: Event ${eventNum} -> ${betValue} (safe: ${isSafe})`
        );
      } else {
        console.warn(
          `   ⚠️ Skipped bet ${
            index + 1
          }: missing eventNum (${eventNum}) or betValue (${betValue})`
        );
      }
    });

    console.log(`✅ Final bet map has ${map.size} entries`);
    return map;
  }

  /**
   * Logs mapping information for debugging
   */
  static logMappingInfo(mapping: RoundMatchMapping): void {
    console.group("🔗 Round-Match Mapping Info");
    console.log("📊 Round Details:");
    console.table({
      "Round Number": mapping.round.roundNumber,
      "Draw Number": mapping.svenskaSpeDrawNumber,
      Year: mapping.round.year,
      Week: mapping.round.weekNumber,
      Product: mapping.round.productName,
      Sport: mapping.round.sport,
    });
    console.log(`📋 Total Events: ${mapping.totalEvents}`);
    console.log(`📋 Total Matches: ${mapping.matches.length}`);
    console.log("🎯 Matches:");
    console.table(
      mapping.matches.map((m) => ({
        Event: m.MatchNumber,
        SportEventId: m.sportEventId,
        Home: m.homeTeamName,
        Away: m.awayTeamName,
        League: m.leagueName,
        Country: m.countryName,
        Status: m.status,
      }))
    );
    console.groupEnd();
  }
}
