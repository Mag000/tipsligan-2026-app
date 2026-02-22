/**
 * MatchCard - Individual match card with 1/X/2 buttons
 * Feature: 002-weekly-betting
 * T011: Displays single match details and prediction buttons
 * T037: Shows result mode with final score when finished
 * T038: Shows correct/incorrect indicator comparing user prediction to result
 * Mobile-first responsive design with touch-friendly targets
 */

import { Card, makeStyles, shorthands, Text } from "@fluentui/react-components";
import React from "react";
import type { BettingMatch, Outcome } from "../../types/betting";

interface MatchCardProps {
  match: BettingMatch;
  selectedOutcome?: Outcome;
  onSelect?: (outcome: Outcome) => void;
  readonly?: boolean;
  userPrediction?: Outcome; // T038: For showing correct/incorrect indicator
}

const useStyles = makeStyles({
  card: {
    ...shorthands.padding("16px"),
    backgroundColor: "#ffffff",
    ...shorthands.border("1px", "solid", "#e1dfdd"),
    ...shorthands.borderRadius("8px"),
  },
  matchHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  matchNumber: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#605e5c",
  },
  league: {
    fontSize: "12px",
    color: "#8a8886",
  },
  teams: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    marginBottom: "12px",
  },
  team: {
    fontSize: "16px",
    fontWeight: 500,
  },
  kickoff: {
    fontSize: "12px",
    color: "#8a8886",
    marginBottom: "12px",
  },
  // T037: Result display styles
  resultContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...shorthands.padding("12px"),
    backgroundColor: "#f3f2f1",
    ...shorthands.borderRadius("4px"),
    marginBottom: "12px",
  },
  score: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#323130",
  },
  outcome: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#0078d4",
  },
  // T038: Correct/incorrect indicator styles
  indicator: {
    fontSize: "24px",
    fontWeight: 700,
  },
  correct: {
    color: "#107c10",
  },
  incorrect: {
    color: "#d13438",
  },
  buttonContainer: {
    display: "flex",
    ...shorthands.gap("8px"),
    justifyContent: "space-between",
  },
  outcomeButton: {
    flex: 1,
    minHeight: "44px",
    minWidth: "44px",
    fontSize: "16px",
    fontWeight: 600,
    ...shorthands.border("2px", "solid", "#e1dfdd"),
    ...shorthands.borderRadius("4px"),
    backgroundColor: "#ffffff",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#f3f2f1",
      ...shorthands.border("2px", "solid", "#0078d4"),
    },
    "&:active": {
      transform: "scale(0.98)",
    },
  },
  selected: {
    backgroundColor: "#0078d4",
    color: "#ffffff",
    ...shorthands.border("2px", "solid", "#0078d4"),
    "&:hover": {
      backgroundColor: "#106ebe",
    },
  },
  readonly: {
    cursor: "not-allowed",
    opacity: 0.6,
    "&:hover": {
      backgroundColor: "#ffffff",
      ...shorthands.border("2px", "solid", "#e1dfdd"),
    },
  },
  // T038: Style for buttons showing actual result
  resultOutcome: {
    backgroundColor: "#eff6fc",
    ...shorthands.border("2px", "solid", "#0078d4"),
    fontWeight: 700,
  },
  userPrediction: {
    position: "relative",
    "&::after": {
      content: '"★"',
      position: "absolute",
      top: "-8px",
      right: "-8px",
      fontSize: "16px",
      color: "#ffd700",
    },
  },
});

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  selectedOutcome,
  onSelect,
  readonly = false,
  userPrediction,
}) => {
  const styles = useStyles();

  const formatKickoffTime = (isoTime: string): string => {
    const date = new Date(isoTime);
    return date.toLocaleString("sv-SE", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleButtonClick = (outcome: Outcome) => {
    if (!readonly && onSelect) {
      onSelect(outcome);
    }
  };

  // T037: Check if match is finished and has results
  const hasResult = match.result !== undefined && match.score !== undefined;

  // T038: Determine if user's prediction was correct
  const isCorrect = hasResult && userPrediction === match.result;

  return (
    <Card className={styles.card}>
      <div className={styles.matchHeader}>
        <Text className={styles.matchNumber}>Match {match.eventNumber}</Text>
        <Text className={styles.league}>{match.league}</Text>
      </div>

      <div className={styles.teams}>
        <Text className={styles.team}>{match.homeTeam}</Text>
        <Text className={styles.team}>{match.awayTeam}</Text>
      </div>

      <Text className={styles.kickoff}>
        🕐 {formatKickoffTime(match.kickoffTime)}
      </Text>

      {/* T037: Show result container when match is finished */}
      {hasResult && (
        <div className={styles.resultContainer}>
          <div>
            <Text className={styles.score}>{match.score}</Text>
            <Text className={styles.outcome}> (Result: {match.result})</Text>
          </div>
          {/* T038: Show correct/incorrect indicator */}
          {userPrediction && (
            <Text
              className={`${styles.indicator} ${isCorrect ? styles.correct : styles.incorrect}`}
            >
              {isCorrect ? "✓" : "✗"}
            </Text>
          )}
        </div>
      )}

      <div className={styles.buttonContainer}>
        <button
          className={`${styles.outcomeButton} ${
            selectedOutcome === "1" ? styles.selected : ""
          } ${readonly ? styles.readonly : ""} ${
            hasResult && match.result === "1" ? styles.resultOutcome : ""
          } ${userPrediction === "1" && hasResult ? styles.userPrediction : ""}`}
          onClick={() => handleButtonClick("1")}
          disabled={readonly}
          aria-label={`Home win for match ${match.eventNumber}`}
        >
          1
        </button>
        <button
          className={`${styles.outcomeButton} ${
            selectedOutcome === "X" ? styles.selected : ""
          } ${readonly ? styles.readonly : ""} ${
            hasResult && match.result === "X" ? styles.resultOutcome : ""
          } ${userPrediction === "X" && hasResult ? styles.userPrediction : ""}`}
          onClick={() => handleButtonClick("X")}
          disabled={readonly}
          aria-label={`Draw for match ${match.eventNumber}`}
        >
          X
        </button>
        <button
          className={`${styles.outcomeButton} ${
            selectedOutcome === "2" ? styles.selected : ""
          } ${readonly ? styles.readonly : ""} ${
            hasResult && match.result === "2" ? styles.resultOutcome : ""
          } ${userPrediction === "2" && hasResult ? styles.userPrediction : ""}`}
          onClick={() => handleButtonClick("2")}
          disabled={readonly}
          aria-label={`Away win for match ${match.eventNumber}`}
        >
          2
        </button>
      </div>
    </Card>
  );
};

export default MatchCard;
