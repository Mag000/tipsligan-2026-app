/**
 * DeadlineCountdown - Countdown timer component
 * Feature: 002-weekly-betting
 * T009: Displays time remaining until betting deadline
 * See: specs/002-weekly-betting/research.md Decision 4
 */

import { makeStyles, shorthands, Text } from "@fluentui/react-components";
import React, { useEffect, useState } from "react";

interface DeadlineCountdownProps {
  closeTime: string; // ISO 8601
}

const useStyles = makeStyles({
  container: {
    ...shorthands.padding("12px", "16px"),
    backgroundColor: "#f3f2f1",
    ...shorthands.borderRadius("4px"),
    marginBottom: "16px",
  },
  urgent: {
    backgroundColor: "#fef6f6",
    ...shorthands.border("1px", "solid", "#d13438"),
  },
  text: {
    fontWeight: 600,
  },
  expired: {
    color: "#a4252c",
  },
});

const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({ closeTime }) => {
  const styles = useStyles();
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const deadline = new Date(closeTime).getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining("Betting closed");
        return;
      }

      // Check if less than 1 hour remaining
      const oneHour = 60 * 60 * 1000;
      setIsUrgent(diff < oneHour);

      // Calculate days, hours, minutes, seconds
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    // Initial calculation
    calculateTimeRemaining();

    // Update every second if <1 hour, every minute otherwise
    const interval = setInterval(
      calculateTimeRemaining,
      isUrgent ? 1000 : 60000,
    );

    return () => clearInterval(interval);
  }, [closeTime, isUrgent]);

  return (
    <div className={`${styles.container} ${isUrgent ? styles.urgent : ""}`}>
      <Text className={`${styles.text} ${isExpired ? styles.expired : ""}`}>
        {isExpired ? "⏰ " : "🕐 "}
        {isExpired ? "Betting Closed" : `Time remaining: ${timeRemaining}`}
      </Text>
    </div>
  );
};

export default DeadlineCountdown;
