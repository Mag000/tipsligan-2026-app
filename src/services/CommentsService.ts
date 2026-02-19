import { getAuthHeaders } from "../utils/authHelpers";

const API_BASE_URL = "http://localhost:52259";

export interface NewsComment {
  Id: number;
  Text: string;
  CreatedTime: string;
  CreatedBy: string;
  NewsId: number;
}

export class CommentsService {
  /**
   * Fetches all comments from the API
   */
  static async getAllComments(): Promise<NewsComment[]> {
    try {
      const headers = getAuthHeaders();
      if (!headers) return []; // Redirect triggered

      const url = `${API_BASE_URL}/api/comments/all`;
      console.log("📡 Fetching comments from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      console.log("📥 Response status:", response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 404) {
          console.log("⚠️ Comments endpoint returned 404");
          return [];
        }
        throw new Error(`Failed to fetch comments: ${response.statusText}`);
      }

      const data: NewsComment[] = await response.json();
      console.log("📦 Raw comments data:", data);
      console.log("✅ Comments loaded:", data.length);

      return data;
    } catch (error) {
      console.error("❌ Error fetching comments:", error);
      return [];
    }
  }

  /**
   * Fetches comments for a specific news article
   */
  static async getCommentsByNewsId(newsId: string): Promise<NewsComment[]> {
    try {
      const headers = getAuthHeaders();
      if (!headers) return []; // Redirect triggered

      const response = await fetch(`${API_BASE_URL}/api/comments/${newsId}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch comments: ${response.statusText}`);
      }

      const comments = await response.json();
      return comments;
    } catch (error) {
      console.error("Error fetching comments for news:", error);
      throw error;
    }
  }

  /**
   * Creates a new comment - username extracted from auth token on backend
   */
  static async createComment(
    newsId: number,
    text: string,
  ): Promise<NewsComment> {
    try {
      const headers = getAuthHeaders();
      if (!headers) throw new Error("Not authenticated");

      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ newsId, text }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create comment";
        try {
          const error = await response.json();
          errorMessage = error.message || error.Message || errorMessage;
        } catch {
          // Response is not JSON, use statusText
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  }

  /**
   * Updates a comment - backend verifies user is the creator
   */
  static async updateComment(
    commentId: number,
    newText: string,
  ): Promise<void> {
    try {
      const headers = getAuthHeaders();
      if (!headers) throw new Error("Not authenticated");

      const response = await fetch(
        `${API_BASE_URL}/api/comments/${commentId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ text: newText }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update comment");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
  }

  /**
   * Deletes a comment - backend verifies user is the creator
   */
  static async deleteComment(commentId: number): Promise<void> {
    try {
      const headers = getAuthHeaders();
      if (!headers) throw new Error("Not authenticated");

      const response = await fetch(
        `${API_BASE_URL}/api/comments/${commentId}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }
}
