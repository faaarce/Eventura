import type { CookieOptions } from "express";

const useHttps = process.env.BASE_URL?.startsWith("https://") ?? false;

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: useHttps,
  sameSite: useHttps ? "none" : "lax",
  path: "/",
};