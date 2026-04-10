import { Router } from "express";
import { register, login, getProfile, updateProfile, changePassword } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, updateProfile);
router.patch("/change-password", authenticate, changePassword);

export { router as authRouter };