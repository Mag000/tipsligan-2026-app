import { getAuthHeaders } from "../utils/authHelpers";

const API_BASE_URL = "http://localhost:52259";

export interface NewsArticle {
  Id: string;
  Headline: string;
  Text: string;
  CreatedTime: string;
}

export class NewsService {
  /**
   * Get all news articles
   * @returns Array of all news articles
   */
  static async getAllNews(): Promise<NewsArticle[]> {
    try {
      const headers = getAuthHeaders();
      if (!headers) return []; // Redirect triggered

      const response = await fetch(`${API_BASE_URL}/api/news/all`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch all news: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch all news:", error);
      return [];
    }
  }

  /**
   * Get news by ID
   * @param id News article ID
   * @returns News article
   */
  static async getNewsById(id: string): Promise<NewsArticle | null> {
    try {
      const headers = getAuthHeaders();
      if (!headers) return null; // Redirect triggered

      const response = await fetch(`${API_BASE_URL}/api/news/${id}`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch news: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch news with id ${id}:`, error);
      return null;
    }
  }
}
