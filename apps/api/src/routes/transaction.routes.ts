import { Router } from "express";
import { TransactionController } from "../controllers/transaction.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();
const controller = new TransactionController();

// Organizer: list transactions for their events
router.get(
  "/organizer",
  authenticate,
  authorize("ORGANIZER"),
  controller.getOrganizerTransactions
);

// Organizer: accept transaction
router.patch(
  "/:id/accept",
  authenticate,
  authorize("ORGANIZER"),
  controller.accept
);

// Organizer: reject transaction
router.patch(
  "/:id/reject",
  authenticate,
  authorize("ORGANIZER"),
  controller.reject
);

// Customer: create transaction
router.post(
  "/",
  authenticate,
  authorize("CUSTOMER"),
  controller.create
);

// Customer: list own transactions
router.get(
  "/",
  authenticate,
  controller.findAll
);

// Customer: get transaction detail
router.get(
  "/:id",
  authenticate,
  controller.findById
);

// Customer: upload payment proof
router.patch(
  "/:id/payment-proof",
  authenticate,
  authorize("CUSTOMER"),
  controller.uploadPaymentProof
);

// Customer: cancel own transaction
router.patch(
  "/:id/cancel",
  authenticate,
  authorize("CUSTOMER"),
  controller.cancel
);

export { router as transactionRouter };
