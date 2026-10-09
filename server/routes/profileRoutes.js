import { Router } from "express";
import { protect, requirePasswordChanged } from "../middleware/auth.js";
import { getProfile, updateProfile } from "../controllers/profileController.js";

const profileRouter = Router();

profileRouter.get("/", protect, requirePasswordChanged, getProfile);
profileRouter.post("/", protect, requirePasswordChanged, updateProfile);

export default profileRouter;