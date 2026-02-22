import { isAxiosError } from "axios";
import type {
  ChronicleComment,
  ChronicleCommentsResponse,
  CreateCommentRequest,
} from "../types/comment";
import { requestDeduplicator } from "../utils/requestDeduplication";
import { retryWithBackoff } from "../utils/retryWithBackoff";
import { axiosInstance } from "./axiosConfig";

const shouldRetryAxiosError = (error: unknown): boolean => {
  if (!isAxiosError(error)) return false;
  if (!error.response) return true; // Network error
  const status = error.response.status;
  return status >= 500 || status === 408 || status === 429;
};

/**
 * Chronicle Comments Service - API client for comments
 */
export class ChronicleCommentsService {
  /**
   * Fetch comments for a chronicle entry (with deduplication and pagination)
   */
  static async getComments(
    chronicleId: number,
    skip: number = 0,
    take: number = 20,
    signal?: AbortSignal,
  ): Promise<ChronicleCommentsResponse> {
    const cacheKey = `chronicle-${chronicleId}-comments-${skip}-${take}`;
    return requestDeduplicator.deduplicate(cacheKey, () =>
      retryWithBackoff(
        async () => {
          const response = await axiosInstance.get<ChronicleCommentsResponse>(
            `/chronicle/${chronicleId}/comments`,
            {
              params: { skip, take },
              signal,
            },
          );
          return response.data;
        },
        { maxRetries: 3, baseDelay: 1000, shouldRetry: shouldRetryAxiosError },
      ),
    );
  }

  /**
   * Create a new comment on a chronicle entry
   */
  static async createComment(
    chronicleId: number,
    data: CreateCommentRequest,
  ): Promise<ChronicleComment> {
    const response = await axiosInstance.post<ChronicleComment>(
      `/chronicle/${chronicleId}/comments`,
      data,
    );
    return response.data;
  }

  /**
   * Update an existing comment (user can edit own comment, admin can edit any)
   */
  static async updateComment(
    chronicleId: number,
    commentId: number,
    data: { text: string },
  ): Promise<ChronicleComment> {
    const response = await axiosInstance.put<ChronicleComment>(
      `/chronicle/${chronicleId}/comments/${commentId}`,
      data,
    );
    return response.data;
  }
}
