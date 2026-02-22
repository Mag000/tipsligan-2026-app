/**
 * BettingPage - Main betting page container
 * Feature: 002-weekly-betting
 * T010: Layout container for all betting components
 * T024-T028: Wired with BettingForm, BetSummary, and full betting functionality
 * T040-T041: Support for viewing historical rounds with results
 */

import {
  Dropdown,
  makeStyles,
  MessageBar,
  MessageBarBody,
  Option,
  shorthands,
} from "@fluentui/react-components";
import React, { useEffect, useState } from "react";
import { useBetting } from "../../hooks/useBetting";
import {
  fetchCurrentRound,
  fetchRoundResults,
  resetSubmitSuccess,
} from "../../store/bettingSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import type { Outcome } from "../../types/betting";
import { isDeadlinePassed } from "../../utils/bettingValidation";
import BetSummary from "./BetSummary";
import BettingForm from "./BettingForm";
import DeadlineCountdown from "./DeadlineCountdown";
import MatchCard from "./MatchCard";
import MatchCardSkeleton from "./MatchCardSkeleton";

const useStyles = makeStyles({
  container: {
    ...shorthands.padding("20px"),
    maxWidth: "1200px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  header: {
    marginBottom: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    marginBottom: "8px",
  },
  // T041: Round selector styles
  roundSelector: {
    marginBottom: "16px",
    maxWidth: "300px",
  },
  viewModeIndicator: {
    ...shorthands.padding("8px", "12px"),
    backgroundColor: "#fff4ce",
    ...shorthands.borderRadius("4px"),
    marginBottom: "16px",
    fontSize: "14px",
    fontWeight: 600,
  },
  matchesContainer: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "400px",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  errorContainer: {
    marginTop: "20px",
  },
});

// TODO: Get the current draw number from context or props
const CURRENT_DRAW_NUMBER = 1; // Placeholder - will be dynamic in production

const BettingPage: React.FC = () => {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const {
    currentRound,
    currentRoundLoading,
    currentRoundError,
    historicalRounds,
    historicalBets,
  } = useAppSelector((state) => state.betting);

  // T041: State for selected round (current or historical)
  const [selectedRoundNumber, setSelectedRoundNumber] =
    useState<number>(CURRENT_DRAW_NUMBER);
  const [viewMode, setViewMode] = useState<"current" | "historical">("current");

  // T024: Use betting hook for state and actions
  const {
    selectOutcome,
    submitUserBet,
    getSelection,
    getSelectionCount,
    isComplete,
    isSubmitting,
    submitError,
    submitSuccess,
  } = useBetting();

  // Fetch current round on mount
  useEffect(() => {
    dispatch(fetchCurrentRound(CURRENT_DRAW_NUMBER));
  }, [dispatch]);

  // T040: Fetch historical round results when viewing history
  useEffect(() => {
    if (
      viewMode === "historical" &&
      selectedRoundNumber !== CURRENT_DRAW_NUMBER
    ) {
      // Fetch round results if not already loaded
      if (!historicalRounds[selectedRoundNumber]) {
        dispatch(fetchRoundResults(selectedRoundNumber));
      }
    }
  }, [viewMode, selectedRoundNumber, dispatch, historicalRounds]);

  // T026: Reset success message after 5 seconds
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        dispatch(resetSubmitSuccess());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess, dispatch]);

  // T025: Handle bet submission
  const handleSubmit = () => {
    if (currentRound) {
      submitUserBet(currentRound.drawNumber);
    }
  };

  // T041: Handle round selection change
  const handleRoundChange = (_: any, data: any) => {
    const roundNumber = parseInt(data.value, 10);
    setSelectedRoundNumber(roundNumber);
    setViewMode(roundNumber === CURRENT_DRAW_NUMBER ? "current" : "historical");
  };

  // Determine which round to display
  const displayRound =
    viewMode === "current"
      ? currentRound
      : historicalRounds[selectedRoundNumber];

  // T040: Get user's bet for historical rounds
  const userBet =
    viewMode === "historical" ? historicalBets[selectedRoundNumber] : null;

  // T038: Calculate correct count for historical rounds
  const calculateCorrectCount = (): number | undefined => {
    if (viewMode !== "historical" || !displayRound || !userBet) {
      return undefined;
    }

    let correctCount = 0;
    displayRound.matches.forEach((match) => {
      const userSelection = userBet.selections.find(
        (s) => s.matchNumber === match.eventNumber,
      );
      if (
        userSelection &&
        match.result &&
        userSelection.outcome === match.result
      ) {
        correctCount++;
      }
    });

    return correctCount;
  };

  // T028: Check if deadline has passed
  const deadlinePassed = displayRound
    ? isDeadlinePassed(displayRound.closeTime)
    : false;
  const isHistoricalView = viewMode === "historical";

  // T014: Loading state with skeleton screens (T047)
  if (currentRoundLoading && viewMode === "current") {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Loading Betting Round...</h1>
        </div>
        <BetSummary selectedCount={0} totalMatches={13} />
        <div className={styles.matchesContainer}>
          {Array.from({ length: 13 }).map((_, index) => (
            <MatchCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // T015: Error handling with retry button (T048)
  if (currentRoundError && viewMode === "current") {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <MessageBar intent="error">
            <MessageBarBody>
              <strong>Error loading betting round:</strong> {currentRoundError}
              <div style={{ marginTop: "12px" }}>
                <button
                  onClick={() =>
                    dispatch(fetchCurrentRound(CURRENT_DRAW_NUMBER))
                  }
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#0078d4",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  🔄 Retry
                </button>
              </div>
            </MessageBarBody>
          </MessageBar>
        </div>
      </div>
    );
  }

  // No round data yet
  if (!displayRound) {
    return (
      <div className={styles.container}>
        {/* T041: Round selector even when no data */}
        <div className={styles.roundSelector}>
          <Dropdown
            placeholder="Select round"
            value={selectedRoundNumber.toString()}
            selectedOptions={[selectedRoundNumber.toString()]}
            onOptionSelect={handleRoundChange}
          >
            <Option
              value={CURRENT_DRAW_NUMBER.toString()}
              text={`Current Round (${CURRENT_DRAW_NUMBER})`}
            >
              Current Round ({CURRENT_DRAW_NUMBER})
            </Option>
            {/* Additional rounds could be added here */}
          </Dropdown>
        </div>
        <MessageBar intent="info">
          <MessageBarBody>
            {viewMode === "historical"
              ? "Loading historical round..."
              : "No active betting round found."}
          </MessageBarBody>
        </MessageBar>
      </div>
    );
  }

  // Get user prediction for match (for historical view)
  const getUserPrediction = (matchNumber: number): Outcome | undefined => {
    if (!userBet) return undefined;
    const selection = userBet.selections.find(
      (s) => s.matchNumber === matchNumber,
    );
    return selection?.outcome;
  };

  const correctCount = calculateCorrectCount();

  return (
    <div className={styles.container}>
      {/* T041: Round selector dropdown */}
      <div className={styles.roundSelector}>
        <Dropdown
          placeholder="Select round"
          value={selectedRoundNumber.toString()}
          selectedOptions={[selectedRoundNumber.toString()]}
          onOptionSelect={handleRoundChange}
        >
          <Option
            value={CURRENT_DRAW_NUMBER.toString()}
            text={`Current Round (${CURRENT_DRAW_NUMBER})`}
          >
            Current Round ({CURRENT_DRAW_NUMBER})
          </Option>
          {/* Additional historical rounds can be added here dynamically */}
          <Option value="0" text="Historical Round (Demo)">
            Historical Round (Demo)
          </Option>
        </Dropdown>
      </div>

      {/* T040: View mode indicator for historical rounds */}
      {isHistoricalView && (
        <div className={styles.viewModeIndicator}>
          📊 Viewing Historical Round - Results Mode
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>{displayRound.drawComment}</h1>
        {viewMode === "current" && (
          <DeadlineCountdown closeTime={displayRound.closeTime} />
        )}
      </div>

      {/* T039: Bet summary with correct count for historical rounds */}
      <BetSummary
        selectedCount={
          viewMode === "current"
            ? getSelectionCount()
            : userBet?.selections.length || 0
        }
        totalMatches={13}
        correctCount={correctCount}
      />

      {/* T023-T024: BettingForm (only for current round) */}
      {viewMode === "current" ? (
        <BettingForm
          onSubmit={handleSubmit}
          isComplete={isComplete()}
          isSubmitting={isSubmitting}
          disabled={deadlinePassed}
          errorMessage={submitError || undefined}
          successMessage={
            submitSuccess ? "✅ Bet submitted successfully!" : undefined
          }
        >
          <div className={styles.matchesContainer}>
            {displayRound.matches.map((match) => (
              <MatchCard
                key={match.eventNumber}
                match={match}
                selectedOutcome={getSelection(match.eventNumber)}
                onSelect={(outcome) =>
                  selectOutcome(match.eventNumber, outcome)
                }
                readonly={deadlinePassed}
              />
            ))}
          </div>
        </BettingForm>
      ) : (
        /* T040: Historical view - read-only with results */
        <div className={styles.matchesContainer}>
          {displayRound.matches.map((match) => (
            <MatchCard
              key={match.eventNumber}
              match={match}
              selectedOutcome={getUserPrediction(match.eventNumber)}
              readonly={true}
              userPrediction={getUserPrediction(match.eventNumber)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BettingPage;
