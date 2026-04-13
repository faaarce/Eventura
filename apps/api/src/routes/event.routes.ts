import { Router } from "express";
import { create, findAll, findById, update, remove, getMyEvents } from "../controllers/event.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
 
const router = Router();
 
router.get("/organizer/my-events", authenticate, authorize("ORGANIZER"), getMyEvents);
router.post("/", authenticate, authorize("ORGANIZER"), upload(5).single("image"), create);
router.put("/:id", authenticate, authorize("ORGANIZER"), upload(5).single("image"), update);
router.delete("/:id", authenticate, authorize("ORGANIZER"), remove);
router.get("/", findAll);
router.get("/:id", findById);
 
export { router as eventRouter };