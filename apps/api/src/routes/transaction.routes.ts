import { Router } from "express";
import {
  create,
  findAll,
  findById,
  uploadPaymentProof,
  cancel,
  accept,
  reject,
  getOrganizerTransactions,
} from "../controllers/transaction.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/organizer",
  authenticate,
  authorize("ORGANIZER"),
  getOrganizerTransactions,
);
router.patch("/:id/accept", authenticate, authorize("ORGANIZER"), accept);
router.patch("/:id/reject", authenticate, authorize("ORGANIZER"), reject);
router.post("/", authenticate, authorize("CUSTOMER"), create);
router.get("/", authenticate, findAll);
router.get("/:id", authenticate, findById);
router.patch(
  "/:id/payment-proof",
  authenticate,
  authorize("CUSTOMER"),
  uploadPaymentProof,
);
router.patch("/:id/cancel", authenticate, authorize("CUSTOMER"), cancel);

export { router as transactionRouter };
