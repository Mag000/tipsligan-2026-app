/**
 * BettingForm - Form wrapper with submit button
 * Feature: 002-weekly-betting
 * T023: Handles form submission and validation
 */

import {
  Button,
  makeStyles,
  MessageBar,
  MessageBarBody,
  shorthands,
} from "@fluentui/react-components";
import React from "react";

interface BettingFormProps {
  children: React.ReactNode;
  onSubmit: () => void;
  isComplete: boolean;
  isSubmitting: boolean;
  disabled?: boolean;
  errorMessage?: string;
  successMessage?: string;
}

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  submitContainer: {
    ...shorthands.padding("16px"),
    backgroundColor: "#f3f2f1",
    ...shorthands.borderRadius("4px"),
    marginTop: "16px",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
  },
  submitButton: {
    width: "100%",
    minHeight: "44px",
    fontSize: "16px",
    fontWeight: 600,
  },
  messageBar: {
    marginBottom: "12px",
  },
});

const BettingForm: React.FC<BettingFormProps> = ({
  children,
  onSubmit,
  isComplete,
  isSubmitting,
  disabled = false,
  errorMessage,
  successMessage,
}) => {
  const styles = useStyles();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isComplete && !disabled && !isSubmitting) {
      onSubmit();
    }
  };

  const buttonDisabled = !isComplete || disabled || isSubmitting;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {children}

      <div className={styles.submitContainer}>
        {errorMessage && (
          <MessageBar className={styles.messageBar} intent="error">
            <MessageBarBody>{errorMessage}</MessageBarBody>
          </MessageBar>
        )}

        {successMessage && (
          <MessageBar className={styles.messageBar} intent="success">
            <MessageBarBody>{successMessage}</MessageBarBody>
          </MessageBar>
        )}

        <Button
          className={styles.submitButton}
          appearance="primary"
          type="submit"
          disabled={buttonDisabled}
        >
          {isSubmitting ? "Submitting..." : "Submit Bet"}
        </Button>

        {!isComplete && !disabled && (
          <p
            style={{
              fontSize: "12px",
              color: "#605e5c",
              margin: 0,
              textAlign: "center",
            }}
          >
            Please select predictions for all 13 matches before submitting
          </p>
        )}

        {disabled && (
          <p
            style={{
              fontSize: "12px",
              color: "#a4252c",
              margin: 0,
              textAlign: "center",
            }}
          >
            ⏰ Betting is closed for this round
          </p>
        )}
      </div>
    </form>
  );
};

export default BettingForm;
