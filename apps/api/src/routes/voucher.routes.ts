import { Router } from "express";
import { VoucherController } from "../controllers/voucher.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true }); // mergeParams to access :eventId
const controller = new VoucherController();

// Organizer: create voucher for event
router.post(
  "/",
  authenticate,
  authorize("ORGANIZER"),
  controller.create
);

// Organizer: list vouchers for event
router.get(
  "/",
  authenticate,
  authorize("ORGANIZER"),
  controller.listByEvent
);

// Customer: verify voucher code
router.get(
  "/verify/:code",
  authenticate,
  controller.verifyCode
);

export { router as voucherRouter };
