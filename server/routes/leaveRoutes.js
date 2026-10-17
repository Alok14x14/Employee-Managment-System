import { Router } from "express";
import { protect, protectAdmin, requirePasswordChanged } from "../middleware/auth.js";
import {
  createLeave,
  getLeaves,
  getLeaveBalance,
  updateLeaveStatus,
} from "../controllers/leaveController.js";

const leaveRouter = Router();

leaveRouter.post("/", protect, requirePasswordChanged, createLeave);
leaveRouter.get("/balance", protect, requirePasswordChanged, getLeaveBalance);
leaveRouter.get("/", protect, requirePasswordChanged, getLeaves);
leaveRouter.patch("/:id", protect, requirePasswordChanged, protectAdmin, updateLeaveStatus);

export default leaveRouter;