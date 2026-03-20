import {
  Body1,
  Button,
  Card,
  Dropdown,
  makeStyles,
  Option,
  OptionGroup,
  shorthands,
  Spinner,
  Textarea,
  Title1,
  tokens,
} from "@fluentui/react-components";
import {
  ChevronDownRegular,
  ChevronRightRegular,
  DeleteRegular,
  EditRegular,
  News24Regular,
} from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "../components/PageContainer";
import { useLanguage } from "../contexts/LanguageContext";
import { CommentsService, NewsComment } from "../services/CommentsService";
import { NewsArticle, NewsService } from "../services/NewsService";
import { getStoredAuthToken, getUsernameFromJwt } from "../utils/authToken";

const useStyles = makeStyles({
  header: {
    marginBottom: "32px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `3px solid ${tokens.colorBrandStroke1}`,
    ...shorthands.padding("20px", "0"),
    ...shorthands.margin("0", "-20px"),
    paddingLeft: "20px",
    paddingRight: "20px",
  },
  roundDropdown: {
    minWidth: "300px",
    // Style the year group headers
    "& .fui-OptionGroup": {
      backgroundColor: tokens.colorBrandBackground2,
      color: tokens.colorBrandForeground1,
      fontWeight: tokens.fontWeightBold,
      fontSize: tokens.fontSizeBase400,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      ...shorthands.padding("12px", "16px"),
      ...shorthands.margin("8px", "4px", "4px", "4px"),
      ...shorthands.borderRadius(tokens.borderRadiusMedium),
      position: "sticky",
      top: "0",
      zIndex: 1,
    },
  },
  newsDropdownListbox: {
    maxHeight: "400px",
  },
  chronicleCard: {
    ...shorthands.padding("24px"),
    marginBottom: "24px",
  },
  chronicleHeader: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    marginBottom: "16px",
  },
  chronicleIcon: {
    fontSize: "24px",
    color: tokens.colorBrandForeground1,
  },
  chronicleTitle: {
    marginBottom: "12px",
  },
  chronicleContent: {
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
    color: tokens.colorNeutralForeground1,
  },
  chronicleMetadata: {
    marginTop: "16px",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    display: "flex",
    ...shorthands.gap("16px"),
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
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    ...shorthands.gap("20px"),
  },
  card: {
    ...shorthands.padding("24px"),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    ...shorthands.gap("16px"),
    textAlign: "center",
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  icon: {
    fontSize: "48px",
    color: tokens.colorBrandForeground1,
  },
  commentsSection: {
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: `2px solid ${tokens.colorNeutralStroke1}`,
  },
  commentsHeader: {
    marginBottom: "16px",
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  commentsList: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
  },
  commentCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.padding("12px", "16px"),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    position: "relative",
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
  },
  commentText: {
    marginBottom: "8px",
    lineHeight: "1.5",
    color: tokens.colorNeutralForeground1,
    paddingRight: "80px", // Make room for action buttons
  },
  commentMeta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    display: "flex",
    ...shorthands.gap("12px"),
  },
  commentActions: {
    position: "absolute",
    top: "12px",
    right: "12px",
    display: "flex",
    ...shorthands.gap("8px"),
  },
  noComments: {
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
    ...shorthands.padding("20px"),
  },
});

export default function Home() {
  const styles = useStyles();
  const { t } = useLanguage();
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [allNews, setAllNews] = useState<NewsArticle[]>([]);
  const [selectedChronicle, setSelectedChronicle] =
    useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [allComments, setAllComments] = useState<NewsComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newsSelectorOpen, setNewsSelectorOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [newCommentText, setNewCommentText] = useState("");

  // Derive current user's username from the stored JWT (no API call needed)
  const currentUsername = useMemo(() => {
    const token = getStoredAuthToken();
    return token ? getUsernameFromJwt(token) : null;
  }, []);

  // Load all news and comments on mount
  useEffect(() => {
    const loadData = async () => {
      // 1. Load news first — clears the spinner and shows the chronicle ASAP.
      setLoading(true);
      try {
        const news = await NewsService.getAllNews();
        setAllNews(news);

        if (news.length > 0) {
          const sortedNews = [...news].sort(
            (a, b) =>
              new Date(b.CreatedTime).getTime() -
              new Date(a.CreatedTime).getTime(),
          );
          setSelectedNewsId(sortedNews[0].Id);
          setSelectedChronicle(sortedNews[0]);
        }
      } catch (error) {
        console.error("❌ Failed to load news:", error);
      } finally {
        setLoading(false);
      }

      // 2. Only start loading comments once the chronicle is visible.
      setCommentsLoading(true);
      try {
        const comments = await CommentsService.getAllComments();
        setAllComments(comments);
      } catch (error) {
        console.error("❌ Failed to load comments:", error);
      } finally {
        setCommentsLoading(false);
      }
    };

    loadData();
  }, []);
  // Group news by year
  const newsGroupedByYear = useMemo(() => {
    const grouped = allNews.reduce(
      (acc, news) => {
        const year = new Date(news.CreatedTime).getFullYear();
        if (!acc[year]) {
          acc[year] = [];
        }
        acc[year].push({
          key: news.Id,
          value: news.Id,
          text: news.Headline,
          createdTime: news.CreatedTime,
        });
        return acc;
      },
      {} as Record<
        number,
        Array<{ key: string; value: string; text: string; createdTime: string }>
      >,
    );

    // Sort years descending (latest first) and sort news within each year
    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a)
      .map((year) => ({
        year,
        news: grouped[year].sort(
          (a, b) =>
            new Date(b.createdTime).getTime() -
            new Date(a.createdTime).getTime(),
        ),
      }));
  }, [allNews]); // Get comments for the selected chronicle
  const chronicleComments = useMemo(() => {
    console.log("🔍 Filtering comments for newsId:", selectedNewsId);
    console.log("🔍 Total comments available:", allComments.length);
    if (!selectedNewsId) return [];

    // Convert string newsId to number for comparison
    const newsIdAsNumber = parseInt(selectedNewsId, 10);
    console.log("🔢 Converted newsId to number:", newsIdAsNumber);

    const filtered = allComments.filter((comment) => {
      console.log(
        `  Comment NewsId: ${comment.NewsId} === ${newsIdAsNumber}?`,
        comment.NewsId === newsIdAsNumber,
      );
      return comment.NewsId === newsIdAsNumber;
    });

    const sorted = filtered.sort(
      (a, b) =>
        new Date(a.CreatedTime).getTime() - new Date(b.CreatedTime).getTime(),
    );

    console.log("✅ Filtered comments:", sorted.length, sorted);
    return sorted;
  }, [allComments, selectedNewsId]);

  // Handle news selection
  const handleNewsSelect = (_: any, data: any) => {
    const selectedId = data.optionValue as string;
    if (selectedId && selectedId !== selectedNewsId) {
      const selected = allNews.find((news) => news.Id === selectedId);
      setSelectedNewsId(selectedId);
      setSelectedChronicle(selected || null);
      setNewsSelectorOpen(false);
    }
  };

  // Handle comment edit
  const handleEditComment = (commentId: number, currentText: string) => {
    setEditingCommentId(commentId);
    setEditText(currentText);
  };

  // Handle comment update
  const handleUpdateComment = async (commentId: number) => {
    try {
      await CommentsService.updateComment(commentId, editText);
      // Refresh comments
      const comments = await CommentsService.getAllComments();
      setAllComments(comments);
      setEditingCommentId(null);
      setEditText("");
    } catch (error) {
      console.error("Failed to update comment:", error);
      alert(t("home.errorUpdateComment"));
    }
  };

  // Handle comment delete
  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm(t("home.confirmDeleteComment"))) {
      return;
    }

    try {
      await CommentsService.deleteComment(commentId);
      // Refresh comments
      const comments = await CommentsService.getAllComments();
      setAllComments(comments);
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert(t("home.errorDeleteComment"));
    }
  };

  // Handle create comment
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateComment = async () => {
    if (isSubmitting) return; // Prevent duplicate submissions

    if (!newCommentText.trim()) {
      return;
    }

    if (!selectedNewsId) {
      alert(t("home.errorNoChronicle"));
      return;
    }

    setIsSubmitting(true);
    try {
      await CommentsService.createComment(
        parseInt(selectedNewsId),
        newCommentText,
      );
      // Refresh comments
      const comments = await CommentsService.getAllComments();
      setAllComments(comments);
      setNewCommentText("");
    } catch (error) {
      console.error("Failed to create comment:", error);
      alert(t("home.errorCreateComment"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      {/* News Selector */}
      <div className={styles.header}>
        <Title1
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            marginBottom: "12px",
          }}
          onClick={() => setNewsSelectorOpen(!newsSelectorOpen)}
        >
          <News24Regular />
          {selectedChronicle?.Headline || ""}
          {newsSelectorOpen ? <ChevronDownRegular /> : <ChevronRightRegular />}
        </Title1>
        {newsSelectorOpen && (
          <Dropdown
            open={newsSelectorOpen}
            onOpenChange={(_e: any, data: any) =>
              setNewsSelectorOpen(data.open)
            }
            selectedOptions={selectedNewsId ? [selectedNewsId] : []}
            onOptionSelect={handleNewsSelect}
          >
            {newsGroupedByYear.map((yearGroup) => (
              <OptionGroup
                key={yearGroup.year}
                label={yearGroup.year.toString()}
              >
                {yearGroup.news.map((option) => (
                  <Option key={option.key} value={option.value}>
                    {option.text}
                  </Option>
                ))}
              </OptionGroup>
            ))}
          </Dropdown>
        )}
      </div>
      {/* Chronicle Section */}
      {loading ? (
        <Card className={styles.chronicleCard}>
          <div className={styles.loading}>
            <Spinner size="medium" />
            <Body1>{t("home.loadingChronicle")}</Body1>
          </div>
        </Card>
      ) : selectedChronicle ? (
        <Card className={styles.chronicleCard}>
          <div className={styles.chronicleContent}>
            {selectedChronicle.Text}
          </div>{" "}
          <div className={styles.chronicleMetadata}>
            <span>
              {t("home.published")}{" "}
              {new Date(selectedChronicle.CreatedTime).toLocaleDateString(
                "sv-SE",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}
            </span>
          </div>
          {/* Comments Section */}
          <div className={styles.commentsSection}>
            <div className={styles.commentsHeader}>
              {t("home.comments", { count: chronicleComments.length })}
            </div>
            {/* New Comment Input */}
            <div style={{ marginBottom: "16px" }}>
              <Textarea
                placeholder={t("home.writeComment")}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={3}
                style={{ marginBottom: "8px" }}
              />
              <Button
                appearance="primary"
                onClick={handleCreateComment}
                disabled={!newCommentText.trim() || isSubmitting}
              >
                {isSubmitting ? t("home.sending") : t("home.sendComment")}
              </Button>
            </div>
            {commentsLoading ? (
              <div className={styles.loading}>
                <Spinner size="small" />
                <Body1>{t("home.loadingComments")}</Body1>
              </div>
            ) : chronicleComments.length > 0 ? (
              <div className={styles.commentsList}>
                {chronicleComments.map((comment) => {
                  const isEditing = editingCommentId === comment.Id;

                  return (
                    <div key={comment.Id} className={styles.commentCard}>
                      {isEditing ? (
                        <>
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            style={{ marginBottom: "8px", width: "100%" }}
                            rows={3}
                          />
                          <div style={{ display: "flex", gap: "8px" }}>
                            <Button
                              size="small"
                              appearance="primary"
                              onClick={() => handleUpdateComment(comment.Id)}
                            >
                              {t("common.save")}
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditText("");
                              }}
                            >
                              {t("common.cancel")}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={styles.commentText}>
                            {comment.Text}
                          </div>
                          <div className={styles.commentMeta}>
                            <span>
                              <strong>{comment.CreatedBy}</strong>
                            </span>
                            <span>
                              {new Date(comment.CreatedTime).toLocaleDateString(
                                "sv-SE",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>

                          {currentUsername &&
                            comment.CreatedBy.toLowerCase() ===
                              currentUsername.toLowerCase() && (
                              <div className={styles.commentActions}>
                                <Button
                                  size="small"
                                  appearance="subtle"
                                  icon={<EditRegular />}
                                  onClick={() =>
                                    handleEditComment(comment.Id, comment.Text)
                                  }
                                />
                                <Button
                                  size="small"
                                  appearance="subtle"
                                  icon={<DeleteRegular />}
                                  onClick={() =>
                                    handleDeleteComment(comment.Id)
                                  }
                                />
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.noComments}>{t("home.noComments")}</div>
            )}
          </div>
        </Card>
      ) : (
        <Card className={styles.chronicleCard}>
          <div className={styles.emptyState}>
            <Body1>{t("home.noChronicle")}</Body1>
          </div>
        </Card>
      )}
      {/* Stats Cards */}
    </PageContainer>
  );
}
