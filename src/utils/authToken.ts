/**
 * Authentication Token Utilities
 *
 * DEPRECATED: This file is no longer needed since we use the backend's token directly.
 * Kept for reference only.
 */

export interface AuthTokenPayload {
  userId: string;
  username: string;
  timestamp: number;
  sessionId?: string;
}

/**
 * Creates a base64-encoded auth token from user data
 */
export function createAuthToken(
  userId: string | number,
  username: string,
): string {
  const payload: AuthTokenPayload = {
    userId: String(userId),
    username: username,
    timestamp: Date.now(),
    sessionId: generateSessionId(),
  };

  const jsonString = JSON.stringify(payload);
  return btoa(jsonString);
}

/**
 * Decodes and parses an auth token
 */
export function decodeAuthToken(token: string): AuthTokenPayload | null {
  try {
    const jsonString = atob(token);
    return JSON.parse(jsonString) as AuthTokenPayload;
  } catch (error) {
    console.error("Failed to decode auth token:", error);
    return null;
  }
}

/**
 * Extracts userId from an auth token
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeAuthToken(token);
  return payload?.userId ?? null;
}

/**
 * Generates a simple session ID for tracking
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Validates that an auth token is properly formatted and not expired
 * Tokens older than 24 hours are considered expired
 */
export function isTokenValid(token: string): boolean {
  const payload = decodeAuthToken(token);
  if (!payload) return false;

  const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const isNotExpired = Date.now() - payload.timestamp < maxAge;
  const hasRequiredFields = !!payload.userId && !!payload.username;

  return isNotExpired && hasRequiredFields;
}

/**
 * Gets the auth token from localStorage
 */
export function getStoredAuthToken(): string | null {
  try {
    const token = localStorage.getItem("token");
    return token ?? null;
  } catch (error) {
    console.error("Failed to get stored auth token:", error);
    return null;
  }
}

/**
 * Gets the userId from the stored auth token
 */
export function getStoredUserId(): string | null {
  const authToken = getStoredAuthToken();
  if (!authToken) return null;
  return getUserIdFromToken(authToken);
}
