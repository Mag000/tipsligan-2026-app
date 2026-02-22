/**
 * Retry Logic with Exponential Backoff
 *
 * Implements Constitution Principle VI: API Request Management
 * Provides intelligent retry mechanism for failed requests
 */

/**
 * Error type for failed requests
 */
export interface RequestError {
  name?: string;
  message?: string;
  status?: number;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: RequestError) => boolean;
  onRetry?: (attempt: number, error: RequestError) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  shouldRetry: (error: RequestError) => {
    // Retry on network errors or 5xx server errors
    if (
      error?.name === "TypeError" ||
      error?.message?.includes("Failed to fetch")
    ) {
      return true; // Network error
    }
    if (error?.status && error.status >= 500 && error.status < 600) {
      return true; // Server error
    }
    return false; // Don't retry client errors (4xx) or other errors
  },
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise with the result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: RequestError | unknown;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorObj = error as RequestError;

      // Check if we should retry this error
      if (!config.shouldRetry(errorObj)) {
        console.warn(
          `❌ Retry: Error not retryable, throwing immediately`,
          error,
        );
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === config.maxRetries - 1) {
        console.error(
          `❌ Retry: Max retries (${config.maxRetries}) reached, giving up`,
          error,
        );
        throw error;
      }

      // Calculate delay with exponential backoff
      const exponentialDelay = config.baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * exponentialDelay; // Add 0-30% jitter
      const delay = Math.min(exponentialDelay + jitter, config.maxDelay);

      console.warn(
        `⚠️ Retry: Attempt ${attempt + 1}/${config.maxRetries} failed, retrying in ${Math.round(delay)}ms...`,
        error,
      );

      // Call onRetry callback
      config.onRetry(attempt + 1, error);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Create a retry wrapper for a function with specific options
 * Useful for creating reusable retry configurations
 */
export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {},
): T {
  return ((...args: Parameters<T>) => {
    return retryWithBackoff(() => fn(...args), options);
  }) as T;
}
