/**
 * Betting validation utilities
 * Feature: 002-weekly-betting
 * T022: Validation helpers for betting feature
 */

import type { BetSelection, Outcome } from "../types/betting";

/**
 * Validates that all 13 matches have selections
 * @param selections - Record of match number to outcome
 * @returns Object with isValid flag and array of missing match numbers
 */
export const validateCompleteBet = (
  selections: Record<number, Outcome>,
): { isValid: boolean; missingMatches: number[] } => {
  const missingMatches: number[] = [];

  // Check that matches 1-13 all have selections
  for (let i = 1; i <= 13; i++) {
    if (!selections[i]) {
      missingMatches.push(i);
    }
  }

  return {
    isValid: missingMatches.length === 0,
    missingMatches,
  };
};

/**
 * Converts draft selections Record to BetSelection array
 * @param selections - Record of match number to outcome
 * @returns Array of BetSelection objects
 */
export const convertSelectionsToArray = (
  selections: Record<number, Outcome>,
): BetSelection[] => {
  return Object.entries(selections).map(([matchNumber, outcome]) => ({
    matchNumber: parseInt(matchNumber, 10),
    outcome,
  }));
};

/**
 * Checks if betting deadline has passed
 * @param closeTime - ISO 8601 close time string
 * @returns true if deadline has passed
 */
export const isDeadlinePassed = (closeTime: string): boolean => {
  const now = Date.now();
  const deadline = new Date(closeTime).getTime();
  return now >= deadline;
};
