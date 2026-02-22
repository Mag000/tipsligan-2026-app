import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  userId: number;
  username: string;
  role?: string;
  isAdmin?: boolean;
}

/**
 * Check if current user is admin
 */
export function isCurrentUserAdmin(): boolean {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = jwtDecode<TokenPayload>(token);
    return payload.role === "admin" || payload.isAdmin === true;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return false;
  }
}

/**
 * Get current user role
 */
export function getCurrentUserRole(): "admin" | "user" | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = jwtDecode<TokenPayload>(token);
    if (payload.role === "admin" || payload.isAdmin === true) {
      return "admin";
    }
    return "user";
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

/**
 * Get current user ID from JWT token
 */
export function getCurrentUserId(): number | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = jwtDecode<TokenPayload>(token);
    return payload.userId;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}
