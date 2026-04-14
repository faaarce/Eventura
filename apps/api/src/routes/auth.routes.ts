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
import { authenticate } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
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
