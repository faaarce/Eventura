import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller.js";
import { TransactionController } from "../controllers/transaction.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();
const dashboardController = new DashboardController();
const transactionController = new TransactionController();

// All dashboard routes require ORGANIZER role
router.use(authenticate, authorize("ORGANIZER"));

// Statistics (filterable by ?year=2026&month=4&day=1)
router.get("/statistics", dashboardController.getStatistics);

// Organizer's events (with ticket counts, transaction counts)
router.get("/events", dashboardController.getEvents);

// Attendee list for a specific event
router.get("/events/:eventId/attendees", dashboardController.getAttendees);

// Transaction management (list, accept, reject)
router.get("/transactions", transactionController.getOrganizerTransactions);
router.patch("/transactions/:id/accept", transactionController.accept);
router.patch("/transactions/:id/reject", transactionController.reject);

export { router as dashboardRouter };
