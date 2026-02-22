import type { ChronicleEntry } from "../types/chronicle";
import { requestDeduplicator } from "../utils/requestDeduplication";
import { retryWithBackoff } from "../utils/retryWithBackoff";
import { axiosInstance } from "./axiosConfig";

/**
 * NewsArticle from backend (temporary until /api/chronicle is implemented)
 */
interface NewsArticle {
  Id: string;
  Headline: string;
  Text: string;
  CreatedTime: string;
}

/**
 * Transform NewsArticle to ChronicleEntry
 */
function newsToChronicle(news: NewsArticle): ChronicleEntry {
  return {
    id: parseInt(news.Id, 10),
    title: news.Headline,
    content: news.Text,
    authorId: 0, // Not available in news
    authorAlias: "Admin",
    createdDate: news.CreatedTime,
  };
}

/**
 * Determine if an axios error should be retried
 */
function shouldRetryAxiosError(error: any): boolean {
  if (!error.isAxiosError) return false;
  if (!error.response) return true; // Network error
  const status = error.response?.status;
  return status >= 500 || status === 408 || status === 429;
}

/**
 * Chronicle Service - API client for chronicle entries
 */
export class ChronicleService {
  /**
   * Fetch all chronicle entries (with deduplication and retry)
   * TEMPORARY: Uses /news/all endpoint until /chronicle is implemented
   */
  static async getAllEntries(signal?: AbortSignal): Promise<ChronicleEntry[]> {
    return requestDeduplicator.deduplicate("chronicle-all", () =>
      retryWithBackoff(
        async () => {
          // TEMPORARY: Fetch from /news/all instead of /chronicle
          const response = await axiosInstance.get<NewsArticle[]>("/news/all", {
            signal,
          });
          // Transform NewsArticle[] to ChronicleEntry[]
          return response.data.map(newsToChronicle);
        },
        { maxRetries: 3, baseDelay: 1000, shouldRetry: shouldRetryAxiosError },
      ),
    );
  }

  /**
   * Create a new chronicle entry (admin only)
   * TEMPORARY: Not implemented - requires /chronicle endpoint
   */
  static async createEntry(data: {
    title: string;
    content: string;
  }): Promise<ChronicleEntry> {
    throw new Error(
      "Chronicle create not yet implemented - backend endpoint missing",
    );
  }

  /**
   * Update an existing chronicle entry (admin only)
   * TEMPORARY: Not implemented - requires /chronicle endpoint
   */
  static async updateEntry(
    id: number,
    data: { title: string; content: string },
  ): Promise<ChronicleEntry> {
    throw new Error(
      "Chronicle update not yet implemented - backend endpoint missing",
    );
  }

  /**
   * Delete a chronicle entry (admin only)
   * TEMPORARY: Not implemented - requires /chronicle endpoint
   */
  static async deleteEntry(id: number): Promise<void> {
    throw new Error(
      "Chronicle delete not yet implemented - backend endpoint missing",
    );
  }
}
