import { Router } from "express";
import { create, listByEvent, verifyCode } from "../controllers/voucher.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true });

router.post("/", authenticate, authorize("ORGANIZER"), create);
router.get("/", authenticate, authorize("ORGANIZER"), listByEvent);
router.get("/verify/:code", authenticate, verifyCode);

export { router as voucherRouter };