import {
  Button,
  Divider,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import React, { useState } from "react";
import { fetchComments } from "../../store/chronicleCommentsSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";

const useStyles = makeStyles({
  container: {
    marginTop: tokens.spacingVerticalXXL,
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalL),
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentCount: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
  loadMoreContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: tokens.spacingVerticalL,
  },
});

interface CommentSectionProps {
  chronicleEntryId: number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  chronicleEntryId,
}) => {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  const comments = useAppSelector(
    (state) =>
      state.chronicleComments.commentsByEntryId[chronicleEntryId] || [],
  );
  const totalCount = useAppSelector(
    (state) =>
      state.chronicleComments.totalCountByEntryId[chronicleEntryId] || 0,
  );
  const hasMore = useAppSelector(
    (state) =>
      state.chronicleComments.hasMoreByEntryId[chronicleEntryId] || false,
  );
  const isLoading = useAppSelector(
    (state) => state.chronicleComments.isLoading,
  );

  // CONSTITUTION COMPLIANT: Only fetch comments on user action (button click)
  const handleExpandComments = () => {
    setIsExpanded(true);
    if (!hasInitiallyLoaded) {
      dispatch(
        fetchComments({ chronicleId: chronicleEntryId, loadMore: false }),
      );
      setHasInitiallyLoaded(true);
    }
  };

  const handleCollapseComments = () => {
    setIsExpanded(false);
  };

  const handleLoadMore = () => {
    dispatch(fetchComments({ chronicleId: chronicleEntryId, loadMore: true }));
  };

  return (
    <div className={styles.container}>
      <Divider />

      <div className={styles.header}>
        <Text size={500} weight="semibold">
          Comments
        </Text>
        {totalCount > 0 && (
          <Text className={styles.commentCount}>
            {totalCount} {totalCount === 1 ? "comment" : "comments"}
          </Text>
        )}
      </div>

      {!isExpanded ? (
        <Button appearance="subtle" onClick={handleExpandComments}>
          Show Comments
        </Button>
      ) : (
        <>
          <Button appearance="subtle" onClick={handleCollapseComments}>
            Hide Comments
          </Button>

          <CommentForm chronicleEntryId={chronicleEntryId} />

          <CommentList
            comments={comments}
            isLoading={isLoading && !hasInitiallyLoaded}
          />

          {hasMore && (
            <div className={styles.loadMoreContainer}>
              <Button
                appearance="subtle"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load More Comments"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
