import { Router } from "express";
import { createAnnouncement, deleteAnnouncement, listAnnouncements } from "../controllers/announcementController.js";
import { protect, protectAdmin, requirePasswordChanged } from "../middleware/auth.js";

const router = Router();
router.get("/", protect, requirePasswordChanged, listAnnouncements);
router.post("/", protect, requirePasswordChanged, protectAdmin, createAnnouncement);
router.delete("/:id", protect, requirePasswordChanged, protectAdmin, deleteAnnouncement);

export default router;
