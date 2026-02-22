import {
  Button,
  Input,
  Label,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode } from "@lexical/rich-text";
import { $getRoot, $insertNodes, EditorState, LexicalEditor } from "lexical";
import React, { useState } from "react";
import type { ChronicleEntry } from "../../types/chronicle";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalXL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
  },
  titleField: {
    width: "100%",
  },
  editorContainer: {
    position: "relative",
    minHeight: "300px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  editorContentEditable: {
    minHeight: "300px",
    padding: tokens.spacingVerticalL,
    outline: "none",
    "& p": {
      marginTop: 0,
      marginBottom: tokens.spacingVerticalS,
    },
    "& h1": {
      fontSize: tokens.fontSizeHero700,
      fontWeight: tokens.fontWeightSemibold,
      marginTop: tokens.spacingVerticalL,
      marginBottom: tokens.spacingVerticalM,
    },
    "& h2": {
      fontSize: tokens.fontSizeHero800,
      fontWeight: tokens.fontWeightSemibold,
      marginTop: tokens.spacingVerticalM,
      marginBottom: tokens.spacingVerticalS,
    },
    "& h3": {
      fontSize: tokens.fontSizeBase500,
      fontWeight: tokens.fontWeightSemibold,
      marginTop: tokens.spacingVerticalM,
      marginBottom: tokens.spacingVerticalS,
    },
    "& ul, & ol": {
      paddingLeft: tokens.spacingHorizontalXXL,
      marginTop: tokens.spacingVerticalS,
      marginBottom: tokens.spacingVerticalS,
    },
    "& a": {
      color: tokens.colorBrandForeground1,
      textDecoration: "underline",
    },
  },
  editorPlaceholder: {
    position: "absolute",
    top: tokens.spacingVerticalL,
    left: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground4,
    pointerEvents: "none",
  },
  buttonRow: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    justifyContent: "flex-end",
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  charCount: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

interface ChronicleEditorProps {
  mode: "create" | "edit";
  entry?: ChronicleEntry;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const ChronicleEditor: React.FC<ChronicleEditorProps> = ({
  mode,
  entry,
  onSave,
  onCancel,
  isSaving = false,
}) => {
  const styles = useStyles();
  const [title, setTitle] = useState(entry?.title || "");
  const [contentHtml, setContentHtml] = useState(entry?.content || "");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  const editorConfig = {
    namespace: "ChronicleEditor",
    theme: {
      paragraph: styles.editorContentEditable,
      heading: {
        h1: styles.editorContentEditable,
        h2: styles.editorContentEditable,
        h3: styles.editorContentEditable,
      },
      list: {
        ul: styles.editorContentEditable,
        ol: styles.editorContentEditable,
      },
      link: styles.editorContentEditable,
    },
    nodes: [HeadingNode, ListNode, ListItemNode, LinkNode],
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
    editorState: (editor: LexicalEditor) => {
      if (mode === "edit" && entry?.content) {
        editor.update(() => {
          const parser = new DOMParser();
          const dom = parser.parseFromString(entry.content, "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          $getRoot().select();
          $insertNodes(nodes);
        });
      }
    },
  };

  const handleEditorChange = (
    editorState: EditorState,
    editor: LexicalEditor,
  ) => {
    editorState.read(() => {
      const html = $generateHtmlFromNodes(editor);
      setContentHtml(html);

      // Validate content length (rough estimate: strip HTML tags)
      const textContent = html.replace(/<[^>]*>/g, "");
      if (textContent.length > 5000) {
        setContentError("Content exceeds 5000 characters");
      } else {
        setContentError(null);
      }
    });
  };

  const handleTitleChange = (
    _event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    data: { value: string },
  ) => {
    setTitle(data.value);
    if (data.value.length > 200) {
      setTitleError("Title exceeds 200 characters");
    } else if (data.value.trim().length === 0) {
      setTitleError("Title is required");
    } else {
      setTitleError(null);
    }
  };

  const handleSave = () => {
    // Validate before save
    let hasError = false;

    if (title.trim().length === 0) {
      setTitleError("Title is required");
      hasError = true;
    } else if (title.length > 200) {
      setTitleError("Title exceeds 200 characters");
      hasError = true;
    }

    const textContent = contentHtml.replace(/<[^>]*>/g, "");
    if (textContent.trim().length === 0) {
      setContentError("Content is required");
      hasError = true;
    } else if (textContent.length > 5000) {
      setContentError("Content exceeds 5000 characters");
      hasError = true;
    }

    if (!hasError) {
      onSave(title, contentHtml);
    }
  };

  return (
    <div className={styles.container}>
      <Text size={500} weight="semibold">
        {mode === "create"
          ? "Create New Chronicle Entry"
          : "Edit Chronicle Entry"}
      </Text>

      <div>
        <Label htmlFor="chronicle-title" required>
          Title
        </Label>
        <Input
          id="chronicle-title"
          value={title}
          onChange={handleTitleChange}
          className={styles.titleField}
          maxLength={200}
        />
        {titleError && <Text className={styles.errorText}>{titleError}</Text>}
        <Text className={styles.charCount}>
          {title.length} / 200 characters
        </Text>
      </div>

      <div>
        <Text weight="semibold">Content</Text>
        <LexicalComposer initialConfig={editorConfig}>
          <div className={styles.editorContainer}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable className={styles.editorContentEditable} />
              }
              placeholder={
                <div className={styles.editorPlaceholder}>
                  Enter chronicle content... (supports bold, italic, links,
                  lists, headers H1-H3)
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <OnChangePlugin onChange={handleEditorChange} />
            <ListPlugin />
            <LinkPlugin />
          </div>
        </LexicalComposer>
        {contentError && (
          <Text className={styles.errorText}>{contentError}</Text>
        )}
        <Text className={styles.charCount}>
          ~{contentHtml.replace(/<[^>]*>/g, "").length} / 5000 characters
        </Text>
      </div>

      <div className={styles.buttonRow}>
        <Button appearance="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          appearance="primary"
          onClick={handleSave}
          disabled={isSaving || !!titleError || !!contentError}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
