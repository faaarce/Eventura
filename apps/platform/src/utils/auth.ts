import Cookies from "js-cookie";

export interface AuthUser {
  userId: string;
  email: string;
  role: "CUSTOMER" | "ORGANIZER";
}

export function decodeToken(token: string): AuthUser | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const token = Cookies.get("token");
  if (!token) return null;
  return decodeToken(token);
}


export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function logout(): void {
  Cookies.remove("token");
}