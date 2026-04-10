import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import z from "zod";

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

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.getProfile(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const result = await authService.updateProfile(req.user!.userId, data);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const data = changePasswordSchema.parse(req.body);
    const result = await authService.changePassword(req.user!.userId, data);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}