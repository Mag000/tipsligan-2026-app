/**
 * BetSummary - Summary of user's selections
 * Feature: 002-weekly-betting
 * T021: Shows selection count and completion status
 */

import { makeStyles, shorthands, Text } from "@fluentui/react-components";
import React from "react";

interface BetSummaryProps {
  selectedCount: number;
  totalMatches: number;
  correctCount?: number; // For completed rounds
}

const useStyles = makeStyles({
  container: {
    ...shorthands.padding("12px", "16px"),
    backgroundColor: "#f3f2f1",
    ...shorthands.borderRadius("4px"),
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  complete: {
    backgroundColor: "#dff6dd",
    ...shorthands.border("1px", "solid", "#107c10"),
  },
  text: {
    fontWeight: 600,
  },
  icon: {
    marginRight: "8px",
  },
});

const BetSummary: React.FC<BetSummaryProps> = ({
  selectedCount,
  totalMatches,
  correctCount,
}) => {
  const styles = useStyles();
  const isComplete = selectedCount === totalMatches;

  return (
    <div className={`${styles.container} ${isComplete ? styles.complete : ""}`}>
      <Text className={styles.text}>
        <span className={styles.icon}>{isComplete ? "✅" : "📝"}</span>
        {correctCount !== undefined
          ? `Correct: ${correctCount} of ${totalMatches}`
          : `Selected: ${selectedCount} of ${totalMatches}`}
      </Text>
      {!isComplete && correctCount === undefined && (
        <Text style={{ fontSize: "12px", color: "#605e5c" }}>
          {totalMatches - selectedCount} remaining
        </Text>
      )}
    </div>
  );
};

export default BetSummary;
