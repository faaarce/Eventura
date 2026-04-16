// ============================================================
// CHANGES DI apps/api/src/routes/auth.routes.ts
// ============================================================
//
// 1. Import `authenticateResetToken` middleware
// 2. Apply ke route `/reset-password`
// ============================================================

// File full-nya jadi kayak gini:

import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getOrganizerPublicProfile,
  refreshToken,
  logoutUser,
} from "../controllers/auth.controller.js";
import {
  authenticate,
  authenticateResetToken, // ← TAMBAHIN IMPORT INI
} from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);

// ← GANTI route reset-password, tambahin middleware:
router.post("/reset-password", authenticateResetToken, resetPassword);

router.get("/profile", authenticate, getProfile);
router.patch(
  "/profile",
  authenticate,
  upload().single("profileImage"),
  updateProfile,
);
router.patch("/change-password", authenticate, changePassword);
router.get("/organizer/:id", getOrganizerPublicProfile);

export { router as authRouter };