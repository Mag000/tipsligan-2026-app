import {
  makeStyles,
  MessageBar,
  MessageBarBody,
  shorthands,
  Spinner,
  Text,
  tokens,
} from "@fluentui/react-components";
import React, { useEffect, useState } from "react";
import {
  clearError,
  createChronicleEntry,
  fetchChronicleEntries,
} from "../../store/chronicleSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { isCurrentUserAdmin } from "../../utils/userRoles";
import { ChronicleCard } from "./ChronicleCard";
import { ChronicleEditor } from "./ChronicleEditor";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacingVerticalM,
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "200px",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  emptyState: {
    textAlign: "center",
    ...shorthands.padding("40px", "20px"),
    color: tokens.colorNeutralForeground3,
  },
});

export const ChronicleList: React.FC = () => {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const { entries, isLoading, error } = useAppSelector(
    (state) => state.chronicle,
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const isAdmin = isCurrentUserAdmin();

  useEffect(() => {
    // Clear any stale errors before fetching
    dispatch(clearError());
    dispatch(fetchChronicleEntries(false)).finally(() => {
      setHasFetched(true);
    });
  }, [dispatch]);

  const handleCreate = async (title: string, content: string) => {
    setIsSaving(true);
    try {
      await dispatch(createChronicleEntry({ title, content })).unwrap();
      setIsEditorOpen(false);
      dispatch(fetchChronicleEntries(true)); // Refresh list
    } catch (err) {
      console.error("Failed to create chronicle entry:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading on initial fetch
  if (isLoading && entries.length === 0) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" label="Loading chronicle..." />
      </div>
    );
  }

  // Only show error after we've attempted to fetch
  if (error && !isLoading && hasFetched) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>Failed to load chronicle: {error}</MessageBarBody>
      </MessageBar>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size={500}>No announcements yet</Text>
      </div>
    );
  }

  // Sort entries by createdDate descending (newest first)
  const sortedEntries = [...entries].sort(
    (a, b) =>
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
  );

  // CONSTITUTION COMPLIANT: Show only the latest chronicle entry to prevent
  // multiple API calls on page load (Principle VI)
  const latestEntry = sortedEntries[0];

  return (
    <>
      {isEditorOpen && (
        <ChronicleEditor
          mode="create"
          onSave={handleCreate}
          onCancel={() => setIsEditorOpen(false)}
          isSaving={isSaving}
        />
      )}

      {!isEditorOpen && (
        <div className={styles.container}>
          {/* TEMPORARY: Comment out until /api/chronicle endpoints are implemented
          {isAdmin && (
            <div className={styles.header}>
              <Button
                appearance="primary"
                icon={<Add24Regular />}
                onClick={() => setIsEditorOpen(true)}
              >
                Add Chronicle Entry
              </Button>
            </div>
          )}
          */}

          {/* Show only the latest entry to comply with Constitution Principle VI */}
          {latestEntry && (
            <ChronicleCard key={latestEntry.id} entry={latestEntry} />
          )}
        </div>
      )}
    </>
  );
};
