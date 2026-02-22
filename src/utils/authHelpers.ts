/**
 * Shared Authentication Helpers
 *
 * Provides common authentication utilities used across all API services.
 */

// Flag to prevent multiple redirect attempts (no longer used for actual redirects)
let isRedirecting = false;

/**
 * Reset the redirect flag (call after successful login or when on login page)
 */
export const resetRedirectFlag = () => {
  isRedirecting = false;
};

/**
 * Helper to log when redirect would happen - actual redirect is handled by React Router
 * Returns true to indicate the caller should abort the API call
 */
export const redirectToLogin = (): boolean => {
  // Just log a warning - don't actually redirect
  // React Router's ProtectedRoute component handles the actual redirect
  if (!isRedirecting) {
    console.warn("🔐 No authentication token found - API call aborted");
    isRedirecting = true; // Prevent spam logging
  }
  return true; // Tell caller to abort
};

/**
 * Get the authentication token from localStorage
 * Validates token format and clears invalid tokens
 */
export const getToken = (): string | null => {
  const token = localStorage.getItem("token");

  if (!token) return null;

  // Check if token starts with '{' - this means it's the old JSON format
  if (token.startsWith("{")) {
    console.warn("🔐 Invalid token format detected - clearing localStorage");
    localStorage.clear();
    return null;
  }

  return token;
};

/**
 * Get authentication headers for API requests
 * Returns null if no token is available (and triggers redirect warning)
 */
export const getAuthHeaders = (
  requireAuth: boolean = true,
): Record<string, string> | null => {
  const token = getToken();

  // If authentication is required but no token exists, redirect to login
  if (requireAuth && !token) {
    redirectToLogin();
    return null;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Check if user is authenticated (has valid token in localStorage)
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("token");
  return !!token;
};

/**
 * Clear authentication token from localStorage and reset redirect flag
 *
 * Call this when user logs out to ensure clean session termination.
 * This function only removes the authentication token, preserving any
 * other data stored in localStorage (unlike localStorage.clear()).
 *
 * @example
 * ```typescript
 * const handleLogout = () => {
 *   clearAuthToken();
 *   navigate("/login");
 * };
 * ```
 */
export const clearAuthToken = (): void => {
  console.log("🚪 Clearing authentication token...");
  localStorage.removeItem("token");
  resetRedirectFlag();
};
