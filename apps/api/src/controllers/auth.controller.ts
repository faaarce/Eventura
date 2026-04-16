import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import z from "zod";
import { cookieOptions } from "../config/cookie.js";
import { ApiError } from "../utils/helpers.js";

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

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password minimal 6 karakter"),
});

const googleLoginSchema = z.object({
  accessToken: z.string().min(1, "Google access token is required"),
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

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
    });

    // Response body cuma user info (gak ada token!)
    res.status(201).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.login(data);

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

export async function googleLogin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = googleLoginSchema.parse(req.body);
    const result = await authService.googleLogin(data.accessToken);
    res.json({ success: true, data: result });
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
    const file = req.file;
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
    const userId = req.user!.userId;
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    if (!token) {
      throw new ApiError(401, "Reset token tidak ada");
    }
    const result = await authService.resetPassword(
      userId,
      data.newPassword,
      token,
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

    // Set access token baru di cookie — frontend gak perlu handle
    res.cookie("accessToken", result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Refresh success",
    });
  } catch (err) {
    next(err);
  }
}

export async function logoutUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.refreshToken;
    const result = await authService.logout(token);

    // Clear BOTH cookies
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
