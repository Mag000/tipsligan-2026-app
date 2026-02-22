import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Warning24Regular } from "@fluentui/react-icons";
import React from "react";
import type { ChronicleEntry } from "../../types/chronicle";

const useStyles = makeStyles({
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  warningContainer: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteRedBackground2,
    borderRadius: tokens.borderRadiusMedium,
    borderLeft: `4px solid ${tokens.colorPaletteRedBorder1}`,
  },
  warningIcon: {
    color: tokens.colorPaletteRedForeground1,
  },
  warningText: {
    color: tokens.colorPaletteRedForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  commentWarning: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

interface ChronicleDeleteDialogProps {
  open: boolean;
  entry: ChronicleEntry;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const ChronicleDeleteDialog: React.FC<ChronicleDeleteDialogProps> = ({
  open,
  entry,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  const styles = useStyles();

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onCancel()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Delete Chronicle Entry</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            <div className={styles.warningContainer}>
              <Warning24Regular className={styles.warningIcon} />
              <Text className={styles.warningText}>
                This action cannot be undone
              </Text>
            </div>

            <Text>
              Are you sure you want to delete <strong>"{entry.title}"</strong>?
            </Text>

            {entry.commentCount && entry.commentCount > 0 && (
              <Text className={styles.commentWarning}>
                This will also delete {entry.commentCount}{" "}
                {entry.commentCount === 1 ? "comment" : "comments"} associated
                with this entry.
              </Text>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              appearance="secondary"
              onClick={onCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={onConfirm}
              disabled={isDeleting}
              style={{
                backgroundColor: tokens.colorPaletteRedBackground3,
                color: tokens.colorNeutralForegroundOnBrand,
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
