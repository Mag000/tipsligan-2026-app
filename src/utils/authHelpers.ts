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

interface User {
  userId: number;
  username: string;
  token: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

/**
 * Get the current user's username from localStorage
 */
export const getCurrentUsername = (): string | null => {
  try {
    const userData = localStorage.getItem("token");
    if (userData) {
      const parsed = JSON.parse(atob(userData));
      return parsed.username || null;
    }
  } catch (error) {
    console.error("Failed to get username:", error);
  }
  return null;
};
