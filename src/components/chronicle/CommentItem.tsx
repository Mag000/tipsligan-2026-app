import {
  Button,
  Card,
  Text,
  Textarea,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import { Edit24Regular } from "@fluentui/react-icons";
import React, { useState } from "react";
import { updateComment } from "../../store/chronicleCommentsSlice";
import { useAppDispatch } from "../../store/store";
import type { ChronicleComment } from "../../types/comment";
import { formatAbsoluteTimestamp } from "../../utils/formatTimestamp";
import { sanitizeCommentText } from "../../utils/sanitizeHtml";
import { getCurrentUserId, isCurrentUserAdmin } from "../../utils/userRoles";

const useStyles = makeStyles({
  card: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    backgroundColor: tokens.colorNeutralBackground2,
    position: "relative",
    "&:hover .edit-button": {
      opacity: 1,
    },
  },
  editButton: {
    position: "absolute",
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalM,
    opacity: 0,
    transition: "opacity 0.2s ease",
  },
  header: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap(tokens.spacingHorizontalS),
    marginBottom: tokens.spacingVerticalS,
    flexWrap: "wrap",
  },
  author: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
  },
  metaSeparator: {
    color: tokens.colorNeutralForeground4,
  },
  timestamp: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  editIndicator: {
    fontSize: tokens.fontSizeBase200,
    fontStyle: "italic",
    color: tokens.colorNeutralForeground3,
  },
  text: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  editForm: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  textarea: {
    width: "100%",
    minHeight: "80px",
  },
  formFooter: {
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
  buttonGroup: {
    display: "flex",
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
});

interface CommentItemProps {
  comment: ChronicleComment;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isSaving, setIsSaving] = useState(false);

  const currentUserId = getCurrentUserId();
  const isAdmin = isCurrentUserAdmin();
  const isOwnComment = currentUserId === comment.authorId;
  const canEdit = isOwnComment || isAdmin;

  // Check if comment was edited by different user (admin moderation)
  const wasEditedByAdmin =
    comment.lastEditedDate &&
    comment.editedById &&
    comment.editedById !== comment.authorId;

  // Sanitize comment text (strips all HTML)
  const sanitizedText = sanitizeCommentText(comment.text);

  const charCount = editText.length;
  const isValid = charCount >= 1 && charCount <= 500;

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(comment.text);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText(comment.text);
  };

  const handleSave = async () => {
    if (!isValid) return;

    setIsSaving(true);
    try {
      await dispatch(
        updateComment({
          chronicleId: comment.chronicleEntryId,
          commentId: comment.id,
          text: editText,
        }),
      ).unwrap();
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update comment:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={styles.card}>
      {canEdit && !isEditing && (
        <div className={`${styles.editButton} edit-button`}>
          <Button
            appearance="subtle"
            icon={<Edit24Regular />}
            onClick={handleEdit}
            aria-label="Edit comment"
          />
        </div>
      )}

      <div className={styles.header}>
        <Text className={styles.author}>{comment.authorAlias}</Text>
        <span className={styles.metaSeparator}>•</span>
        <Text className={styles.timestamp}>
          {formatAbsoluteTimestamp(comment.createdDate)}
        </Text>
        {comment.lastEditedDate && (
          <>
            <span className={styles.metaSeparator}>•</span>
            <Text className={styles.editIndicator}>
              Edited {formatAbsoluteTimestamp(comment.lastEditedDate)}
              {wasEditedByAdmin && comment.editedByAlias && (
                <> by {comment.editedByAlias}</>
              )}
            </Text>
          </>
        )}
      </div>

      {isEditing ? (
        <div className={styles.editForm}>
          <Textarea
            className={styles.textarea}
            value={editText}
            onChange={(_, data) => setEditText(data.value)}
            disabled={isSaving}
            resize="vertical"
            maxLength={500}
          />
          <div className={styles.formFooter}>
            <Text
              className={
                charCount > 500
                  ? `${styles.charCount} ${styles.charCountError}`
                  : styles.charCount
              }
            >
              {charCount} / 500 characters
            </Text>
            <div className={styles.buttonGroup}>
              <Button
                appearance="secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleSave}
                disabled={!isValid || isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Text className={styles.text}>{sanitizedText}</Text>
      )}
    </Card>
  );
};
