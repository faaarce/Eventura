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

export const userAtom = atomWithStorage<AuthUser | null>(
  "eventura-user",
  null,
);


export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);


export const isOrganizerAtom = atom(
  (get) => get(userAtom)?.role === "ORGANIZER",
);