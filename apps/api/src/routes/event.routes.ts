import { Router } from "express";
import { EventController } from "../controllers/event.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();
const controller = new EventController();

// Organizer-only routes (must be before /:id)
router.get(
  "/organizer/my-events",
  authenticate,
  authorize("ORGANIZER"),
  controller.getMyEvents
);

router.post(
  "/",
  authenticate,
  authorize("ORGANIZER"),
  controller.create
);

router.put(
  "/:id",
  authenticate,
  authorize("ORGANIZER"),
  controller.update
);

router.delete(
  "/:id",
  authenticate,
  authorize("ORGANIZER"),
  controller.delete
);

// Public routes
router.get("/", controller.findAll);
router.get("/:id", controller.findById);

export { router as eventRouter };
