import {
  Button,
  MessageBar,
  MessageBarBody,
  Text,
  Textarea,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import React, { useState } from "react";
import { createComment } from "../../store/chronicleCommentsSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { getToken } from "../../utils/authHelpers";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  textarea: {
    width: "100%",
    minHeight: "80px",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  charCount: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  charCountError: {
    color: tokens.colorPaletteRedForeground1,
  },
  notAuthenticatedMessage: {
    textAlign: "center",
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalM),
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
  },
});

interface CommentFormProps {
  chronicleEntryId: number;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  chronicleEntryId,
}) => {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAuthenticated = !!getToken();

  const error = useAppSelector((state) => state.chronicleComments.error);

  const charCount = text.length;
  const isValid = charCount >= 1 && charCount <= 500;
  const isDisabled = !isValid || isSubmitting;

  const handleSubmit = async () => {
    if (!isAuthenticated || !isValid) return;

    setIsSubmitting(true);
    try {
      await dispatch(
        createComment({ chronicleId: chronicleEntryId, text }),
      ).unwrap();
      setText(""); // Clear form on success
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.notAuthenticatedMessage}>
        <Text>Log in to comment</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <Textarea
        className={styles.textarea}
        placeholder="Write your comment..."
        value={text}
        onChange={(_, data) => setText(data.value)}
        disabled={isSubmitting}
        resize="vertical"
        maxLength={500}
      />

      <div className={styles.footer}>
        <Text
          className={
            charCount > 500
              ? `${styles.charCount} ${styles.charCountError}`
              : styles.charCount
          }
        >
          {charCount} / 500 characters
        </Text>
        <Button
          appearance="primary"
          onClick={handleSubmit}
          disabled={isDisabled}
        >
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </div>
  );
};
