import {
  Card,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import React, { useState } from "react";
import {
  deleteChronicleEntry,
  fetchChronicleEntries,
  updateChronicleEntry,
} from "../../store/chronicleSlice";
import { useAppDispatch } from "../../store/store";
import type { ChronicleEntry } from "../../types/chronicle";
import { formatAbsoluteTimestamp } from "../../utils/formatTimestamp";
import { sanitizeChronicleHtml } from "../../utils/sanitizeHtml";
import { isCurrentUserAdmin } from "../../utils/userRoles";
import { ChronicleDeleteDialog } from "./ChronicleDeleteDialog";
import { ChronicleEditor } from "./ChronicleEditor";
import { CommentSection } from "./CommentSection";

const useStyles = makeStyles({
  card: {
    ...shorthands.padding("24px"),
    position: "relative",
    "&:hover .admin-actions": {
      opacity: 1,
    },
  },
  adminActions: {
    position: "absolute",
    top: tokens.spacingVerticalM,
    right: tokens.spacingHorizontalM,
    display: "flex",
    ...shorthands.gap(tokens.spacingHorizontalS),
    opacity: 0,
    transition: "opacity 0.2s ease",
  },
  title: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: "12px",
    color: tokens.colorNeutralForeground1,
  },
  meta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginBottom: "16px",
    display: "flex",
    ...shorthands.gap("8px"),
    flexWrap: "wrap",
  },
  metaSeparator: {
    color: tokens.colorNeutralForeground4,
  },
  editIndicator: {
    fontStyle: "italic",
    color: tokens.colorNeutralForeground3,
  },
  content: {
    lineHeight: "1.6",
    color: tokens.colorNeutralForeground2,
    "& p": {
      marginBottom: "12px",
      marginTop: "0",
    },
    "& ul, & ol": {
      paddingLeft: "24px",
      marginBottom: "12px",
    },
    "& li": {
      marginBottom: "4px",
    },
    "& a": {
      color: tokens.colorBrandForeground1,
      textDecoration: "none",
      "&:hover": {
        textDecoration: "underline",
      },
    },
    "& h1, & h2, & h3": {
      marginTop: "16px",
      marginBottom: "8px",
      fontWeight: tokens.fontWeightSemibold,
    },
    "& h1": {
      fontSize: tokens.fontSizeBase600,
    },
    "& h2": {
      fontSize: tokens.fontSizeBase500,
    },
    "& h3": {
      fontSize: tokens.fontSizeBase400,
    },
    "& strong, & b": {
      fontWeight: tokens.fontWeightSemibold,
    },
    "& em, & i": {
      fontStyle: "italic",
    },
  },
});

interface Props {
  entry: ChronicleEntry;
}

export const ChronicleCard: React.FC<Props> = ({ entry }) => {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const isAdmin = isCurrentUserAdmin();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sanitize HTML content before rendering
  const sanitizedContent = sanitizeChronicleHtml(entry.content);

  const handleUpdate = async (title: string, content: string) => {
    setIsSaving(true);
    try {
      await dispatch(
        updateChronicleEntry({ id: entry.id, data: { title, content } }),
      ).unwrap();
      setIsEditorOpen(false);
      dispatch(fetchChronicleEntries(true)); // Refresh list
    } catch (err) {
      console.error("Failed to update chronicle entry:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteChronicleEntry(entry.id)).unwrap();
      setIsDeleteDialogOpen(false);
      dispatch(fetchChronicleEntries(true)); // Refresh list
    } catch (err) {
      console.error("Failed to delete chronicle entry:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isEditorOpen) {
    return (
      <ChronicleEditor
        mode="edit"
        entry={entry}
        onSave={handleUpdate}
        onCancel={() => setIsEditorOpen(false)}
        isSaving={isSaving}
      />
    );
  }

  return (
    <>
      <Card className={styles.card}>
        {/* TEMPORARY: Admin actions disabled until /api/chronicle endpoints are implemented
        {isAdmin && (
          <div className={`${styles.adminActions} admin-actions`}>
            <Button
              appearance="subtle"
              icon={<Edit24Regular />}
              onClick={() => setIsEditorOpen(true)}
              aria-label="Edit entry"
            />
            <Button
              appearance="subtle"
              icon={<Delete24Regular />}
              onClick={() => setIsDeleteDialogOpen(true)}
              aria-label="Delete entry"
            />
          </div>
        )}
        */}

        <Text className={styles.title}>{entry.title}</Text>

        <div className={styles.meta}>
          <Text>By {entry.authorAlias}</Text>
          <span className={styles.metaSeparator}>•</span>
          <Text>{formatAbsoluteTimestamp(entry.createdDate)}</Text>

          {entry.lastEditedDate && (
            <>
              <span className={styles.metaSeparator}>•</span>
              <Text className={styles.editIndicator}>
                Edited {formatAbsoluteTimestamp(entry.lastEditedDate)}
                {entry.editedByAlias && ` by ${entry.editedByAlias}`}
              </Text>
            </>
          )}
        </div>

        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        <CommentSection chronicleEntryId={entry.id} />
      </Card>

      {isDeleteDialogOpen && (
        <ChronicleDeleteDialog
          open={isDeleteDialogOpen}
          entry={entry}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteDialogOpen(false)}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};
