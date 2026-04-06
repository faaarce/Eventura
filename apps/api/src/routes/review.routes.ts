import { Router } from "express";
import { ReviewController } from "../controllers/review.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();
const controller = new ReviewController();

// Organizer: get own review summary
router.get(
  "/organizer",
  authenticate,
  authorize("ORGANIZER"),
  controller.getOrganizerReviews
);

// Customer: create review for event
router.post(
  "/events/:eventId",
  authenticate,
  authorize("CUSTOMER"),
  controller.create
);

// Public: list reviews for event
router.get(
  "/events/:eventId",
  controller.listByEvent
);

export { router as reviewRouter };
