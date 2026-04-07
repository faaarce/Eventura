import { Router } from "express";
import { getStatistics, getEvents, getAttendees } from "../controllers/dashboard.controller.js";
import { getOrganizerTransactions, accept, reject } from "../controllers/transaction.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate, authorize("ORGANIZER"));

router.get("/statistics", getStatistics);
router.get("/events", getEvents);
router.get("/events/:eventId/attendees", getAttendees);
router.get("/transactions", getOrganizerTransactions);
router.patch("/transactions/:id/accept", accept);
router.patch("/transactions/:id/reject", reject);

export { router as dashboardRouter };