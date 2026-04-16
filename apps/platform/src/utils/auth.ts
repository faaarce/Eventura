import { logoutApi } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ORGANIZER";
  referralCode: string;
  profileImage?: string | null;
}

const STORAGE_KEY = "eventura-user";

/**
 * Baca user langsung dari localStorage.
 * Dipake di TanStack Router `beforeLoad` karena jalan sebelum React mount
 * (Jotai belum ke-hydrate).
 *
 * Di dalam React component, prefer pakai:
 *   const user = useAtomValue(userAtom)
 */
export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    // Jotai atomWithStorage wrap value dalam JSON.stringify
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Logout flow:
 * 1. Call backend → clear httpOnly cookies
 * 2. Clear localStorage
 *
 * NOTE: Di component React, setelah panggil logout() ini,
 * panggil juga `setUser(null)` dari Jotai biar state langsung update.
 * Contoh:
 *   const setUser = useSetAtom(userAtom);
 *   await logout();
 *   setUser(null);
 */
export async function logout(): Promise<void> {
  try {
    await logoutApi();
  } catch {
    // Ignore — backend mungkin udah expire
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}