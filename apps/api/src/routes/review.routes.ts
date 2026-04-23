import { Router } from "express";
import { create, listByEvent, getOrganizerReviews } from "../controllers/review.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/organizer", authenticate, authorize("ORGANIZER"), getOrganizerReviews);
router.post("/events/:eventId", authenticate, authorize("CUSTOMER"), create);
router.get("/events/:eventId", listByEvent);

export { router as reviewRouter };