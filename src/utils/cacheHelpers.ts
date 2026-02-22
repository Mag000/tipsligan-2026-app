/**
 * Cache management utilities for Redux state
 *
 * These utilities enforce Constitution Principle VI (API Request Management)
 * by providing TTL-based cache validation and cleanup mechanisms.
 */

import { RoundData } from "../store/roundsSlice";

/**
 * Checks if cached data is still valid based on TTL (Time To Live)
 *
 * @param lastFetched - Timestamp when data was last fetched (milliseconds since epoch)
 * @param ttl - Time to live in milliseconds (e.g., 5 * 60 * 1000 for 5 minutes)
 * @returns true if cache is valid (within TTL), false if expired or never fetched
 *
 * @example
 * ```typescript
 * const isValid = isCacheValid(existingData?.lastFetched, 5 * 60 * 1000);
 * if (isValid) {
 *   // Use cached data
 *   return existingData;
 * }
 * ```
 */
export function isCacheValid(lastFetched: number | null, ttl: number): boolean {
  if (lastFetched === null) {
    return false;
  }

  const age = Date.now() - lastFetched;
  return age < ttl;
}

/**
 * Determines whether data should be fetched based on cache state and force flag
 *
 * @param roundData - Existing cached round data (may be undefined)
 * @param force - If true, always fetch regardless of cache validity
 * @param ttl - Time to live in milliseconds
 * @returns true if data should be fetched, false if cache can be used
 *
 * @example
 * ```typescript
 * if (shouldFetchData(existingData, force, 5 * 60 * 1000)) {
 *   // Fetch from API
 *   const data = await fetchFromAPI();
 * } else {
 *   // Use cached data
 *   return existingData;
 * }
 * ```
 */
export function shouldFetchData(
  roundData: RoundData | undefined,
  force: boolean,
  ttl: number,
): boolean {
  // Force flag always triggers fetch (user-initiated refresh)
  if (force) {
    return true;
  }

  // No existing data means we must fetch
  if (!roundData) {
    return true;
  }

  // Check if cache is expired
  return !isCacheValid(roundData.lastFetched, ttl);
}

/**
 * Removes oldest cache entries to keep only the most recent rounds
 *
 * This prevents unbounded cache growth by retaining only the N most recent rounds
 * based on round number (higher numbers = more recent).
 *
 * @param roundsData - Current cache of all rounds
 * @param maxEntries - Maximum number of rounds to keep (default: 10)
 * @returns Cleaned cache with only maxEntries most recent rounds
 *
 * @example
 * ```typescript
 * // In Redux reducer after successful fetch:
 * state.roundsData = cleanupOldCache(state.roundsData, 10);
 * ```
 */
export function cleanupOldCache(
  roundsData: Record<number, RoundData>,
  maxEntries: number = 10,
): Record<number, RoundData> {
  const roundNumbers = Object.keys(roundsData).map(Number);

  // If under limit, no cleanup needed
  if (roundNumbers.length <= maxEntries) {
    return roundsData;
  }

  // Sort round numbers descending (most recent first)
  const sortedRounds = roundNumbers.sort((a, b) => b - a);

  // Keep only the most recent maxEntries rounds
  const roundsToKeep = sortedRounds.slice(0, maxEntries);

  // Build new cache with only retained rounds
  const cleanedCache: Record<number, RoundData> = {};
  roundsToKeep.forEach((round) => {
    cleanedCache[round] = roundsData[round];
  });

  return cleanedCache;
}
