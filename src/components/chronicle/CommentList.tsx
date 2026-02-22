import {
  makeStyles,
  shorthands,
  Spinner,
  Text,
  tokens,
} from "@fluentui/react-components";
import React from "react";
import type { ChronicleComment } from "../../types/comment";
import { CommentItem } from "./CommentItem";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100px",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  emptyState: {
    textAlign: "center",
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalM),
    color: tokens.colorNeutralForeground3,
  },
});

interface CommentListProps {
  comments: ChronicleComment[];
  isLoading?: boolean;
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  isLoading = false,
}) => {
  const styles = useStyles();

  if (isLoading && comments.length === 0) {
    return (
      <div className={styles.loading}>
        <Spinner size="medium" label="Loading comments..." />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size={400}>No comments yet. Be the first to comment!</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
};
