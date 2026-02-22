/**
 * Request Deduplication Utility
 *
 * Prevents duplicate concurrent API requests to the same endpoint.
 * Implements Constitution Principle VI: API Request Management
 */

export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<unknown>>();

  /**
   * Deduplicate requests by key. If a request with the same key is already
   * in-flight, returns the existing promise instead of making a new request.
   *
   * @param key - Unique identifier for the request (e.g., "drawInfo-123")
   * @param fn - Function that performs the actual API request
   * @returns Promise with the request result
   */
  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if request already in-flight
    if (this.pendingRequests.has(key)) {
      console.log(
        `🔄 Request deduplication: Reusing in-flight request for key "${key}"`,
      );
      return this.pendingRequests.get(key) as Promise<T>;
    }

    console.log(
      `🚀 Request deduplication: Starting new request for key "${key}"`,
    );

    // Create new request
    const promise = fn();
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } catch (error) {
      // Re-throw error but still clean up
      throw error;
    } finally {
      // Clean up after request completes (success or failure)
      this.pendingRequests.delete(key);
      console.log(
        `✅ Request deduplication: Completed request for key "${key}"`,
      );
    }
  }

  /**
   * Check if a request is currently in-flight
   */
  isRequestPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  /**
   * Cancel all pending requests (useful for cleanup on logout)
   */
  clear(): void {
    this.pendingRequests.clear();
    console.log("🧹 Request deduplication: Cleared all pending requests");
  }

  /**
   * Get count of pending requests (useful for debugging)
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator();
