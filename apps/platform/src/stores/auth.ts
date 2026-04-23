import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ORGANIZER";
  referralCode: string;
  profileImage?: string | null;
}

/**
 * Persist user ke localStorage (key: "eventura-user")
 * Kenapa persist? Biar refresh page user masih login.
 * Token tetap di httpOnly cookie — ini cuma buat UI state.
 */
export const userAtom = atomWithStorage<AuthUser | null>(
  "eventura-user",
  null,
);

/**
 * Derived atom — true kalau user ada
 * Pake: const isLoggedIn = useAtomValue(isAuthenticatedAtom)
 */
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);

/**
 * Derived atom — cek role organizer
 */
export const isOrganizerAtom = atom(
  (get) => get(userAtom)?.role === "ORGANIZER",
);