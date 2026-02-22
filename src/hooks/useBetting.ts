/**
 * Custom hook for betting logic and Redux integration
 * Feature: 002-weekly-betting
 * Encapsulates betting state management and API interactions
 */

import { setSelection, submitBet } from "../store/bettingSlice";
import { useAppDispatch, useAppSelector } from "../store/store";
import type { Outcome } from "../types/betting";

/**
 * Hook providing betting functionality and state access
 * @returns Betting state and action methods
 */
export const useBetting = () => {
  const dispatch = useAppDispatch();
  const bettingState = useAppSelector((state) => state.betting);

  /**
   * Set user's prediction for a match
   * @param matchNumber - Match number (1-13)
   * @param outcome - Selected outcome ('1', 'X', or '2')
   */
  const selectOutcome = (matchNumber: number, outcome: Outcome) => {
    dispatch(setSelection({ matchNumber, outcome }));
  };

  /**
   * Submit user's bet for the current round
   * @param roundNumber - Round number to submit bet for
   * @returns Promise resolving to Redux action result
   */
  const submitUserBet = async (roundNumber: number) => {
    return dispatch(
      submitBet({ roundNumber, selections: bettingState.draftSelections }),
    );
  };

  /**
   * Check if all 13 matches have selections
   * @returns true if bet is complete
   */
  const isComplete = (): boolean => {
    return Object.keys(bettingState.draftSelections).length === 13;
  };

  /**
   * Get user's selection for a specific match
   * @param matchNumber - Match number (1-13)
   * @returns Selected outcome or undefined
   */
  const getSelection = (matchNumber: number): Outcome | undefined => {
    return bettingState.draftSelections[matchNumber];
  };

  /**
   * Count how many matches have been selected
   * @returns Number of matches with selections
   */
  const getSelectionCount = (): number => {
    return Object.keys(bettingState.draftSelections).length;
  };

  return {
    // State
    currentRound: bettingState.currentRound,
    currentRoundLoading: bettingState.currentRoundLoading,
    currentRoundError: bettingState.currentRoundError,
    draftSelections: bettingState.draftSelections,
    submittedBet: bettingState.submittedBet,
    isSubmitting: bettingState.isSubmitting,
    submitError: bettingState.submitError,
    submitSuccess: bettingState.submitSuccess,

    // Actions
    selectOutcome,
    submitUserBet,
    isComplete,
    getSelection,
    getSelectionCount,
  };
};
