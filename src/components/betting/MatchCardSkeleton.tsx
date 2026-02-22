/**
 * MatchCardSkeleton - Skeleton loading state for MatchCard
 * Feature: 002-weekly-betting
 * T047: Provides visual feedback during initial load
 */

import {
  Card,
  makeStyles,
  shorthands,
  Skeleton,
  SkeletonItem,
} from "@fluentui/react-components";
import React from "react";

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
  teams: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    marginBottom: "12px",
  },
  buttonContainer: {
    display: "flex",
    ...shorthands.gap("8px"),
    justifyContent: "space-between",
    marginTop: "12px",
  },
  buttonSkeleton: {
    flex: 1,
    height: "44px",
  },
});

/**
 * Skeleton component displayed while MatchCard data is loading
 */
const MatchCardSkeleton: React.FC = () => {
  const styles = useStyles();

  return (
    <Card className={styles.card}>
      <div className={styles.matchHeader}>
        <Skeleton>
          <SkeletonItem size={16} style={{ width: "60px" }} />
        </Skeleton>
        <Skeleton>
          <SkeletonItem size={12} style={{ width: "80px" }} />
        </Skeleton>
      </div>

      <div className={styles.teams}>
        <Skeleton>
          <SkeletonItem size={16} style={{ width: "150px" }} />
        </Skeleton>
        <Skeleton>
          <SkeletonItem size={16} style={{ width: "140px" }} />
        </Skeleton>
      </div>

      <Skeleton>
        <SkeletonItem
          size={12}
          style={{ width: "120px", marginBottom: "12px" }}
        />
      </Skeleton>

      <div className={styles.buttonContainer}>
        <div className={styles.buttonSkeleton}>
          <Skeleton>
            <SkeletonItem style={{ height: "44px" }} />
          </Skeleton>
        </div>
        <div className={styles.buttonSkeleton}>
          <Skeleton>
            <SkeletonItem style={{ height: "44px" }} />
          </Skeleton>
        </div>
        <div className={styles.buttonSkeleton}>
          <Skeleton>
            <SkeletonItem style={{ height: "44px" }} />
          </Skeleton>
        </div>
      </div>
    </Card>
  );
};

export default MatchCardSkeleton;
