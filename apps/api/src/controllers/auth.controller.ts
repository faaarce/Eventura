import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import z from "zod";
import { cookieOptions } from "../config/cookie.js";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CUSTOMER", "ORGANIZER"]),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  profileImage: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = registerSchema.parse(req.body);
    const { user, accessToken, refreshToken } =
      await authService.register(data);

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: { user, token: accessToken },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.login(data);

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { user, token: accessToken },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await authService.getProfile(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const file = req.file; // optional profile image
    const result = await authService.updateProfile(
      req.user!.userId,
      data,
      file,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = changePasswordSchema.parse(req.body);
    const result = await authService.changePassword(req.user!.userId, data);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "Password minimal 6 karakter"),
});

// 2. Tambah handler functions:
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(data.email);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(
      data.token,
      data.newPassword,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getOrganizerPublicProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await authService.getOrganizerPublicProfile(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.refreshToken;
    const result = await authService.refresh(token);

    res.json({
      success: true,
      data: { token: result.accessToken },
    });
  } catch (err) {
    next(err);
  }
}

// TAMBAH function logout:
export async function logoutUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.refreshToken;
    const result = await authService.logout(token);

    res.clearCookie("refreshToken", cookieOptions);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
