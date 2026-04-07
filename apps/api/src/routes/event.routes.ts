import { Router } from "express";
import { create, findAll, findById, update, remove, getMyEvents } from "../controllers/event.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/organizer/my-events", authenticate, authorize("ORGANIZER"), getMyEvents);
router.post("/", authenticate, authorize("ORGANIZER"), create);
router.put("/:id", authenticate, authorize("ORGANIZER"), update);
router.delete("/:id", authenticate, authorize("ORGANIZER"), remove);
router.get("/", findAll);
router.get("/:id", findById);

export { router as eventRouter };