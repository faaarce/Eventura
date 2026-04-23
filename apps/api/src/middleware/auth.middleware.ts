import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/helpers.js";

export interface AuthPayload {
  userId: string;
  email: string;
  role: "CUSTOMER" | "ORGANIZER";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    // Utamakan cookie (httpOnly) — lebih aman
    const tokenFromCookie = req.cookies?.accessToken;

    // Fallback ke Authorization header (backward compat)
    const tokenFromHeader = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(new ApiError(401, "Invalid or expired token"));
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You do not have permission to perform this action"),
      );
    }
    next();
  };
}

export function authenticateResetToken(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    if (!token) {
      throw new ApiError(401, "Reset token required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_RESET!) as {
      id: string;
      role: string;
    };

    // Set req.user biar controller bisa akses userId
    req.user = {
      userId: decoded.id,
      email: "", 
      role: decoded.role as "CUSTOMER" | "ORGANIZER",
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(
        new ApiError(
          401,
          "Reset token expired. Silakan request reset password baru.",
        ),
      );
    }
    if (err instanceof ApiError) return next(err);
    next(new ApiError(401, "Reset token tidak valid"));
  }
}
