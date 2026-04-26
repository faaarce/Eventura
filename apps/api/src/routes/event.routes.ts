// ============================================================
// REPLACE apps/api/src/routes/event.routes.ts
// ============================================================
//
// Tambahin route baru `/slug/:slug`.
//
// ⚠️ URUTAN PENTING!
//    Route `/slug/:slug` HARUS di ATAS `/:id`.
//    Kalau kebalik, Express bakal match `/:id` dulu dan
//    nganggep "slug" sebagai UUID → error.
// ============================================================

import { Router } from "express";
import {
  create,
  findAll,
  findById,
  findBySlug, // ← TAMBAH IMPORT
  update,
  remove,
  getMyEvents,
} from "../controllers/event.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();


router.get(
  "/organizer/my-events",
  authenticate,
  authorize("ORGANIZER"),
  getMyEvents,
);

// Mutations
router.post(
  "/",
  authenticate,
  authorize("ORGANIZER"),
  upload(5).single("image"),
  create,
);
router.put(
  "/:id",
  authenticate,
  authorize("ORGANIZER"),
  upload(5).single("image"),
  update,
);
router.delete("/:id", authenticate, authorize("ORGANIZER"), remove);

// Public reads
router.get("/", findAll);
router.get("/slug/:slug", findBySlug); 
router.get("/:id", findById); 
export { router as eventRouter };