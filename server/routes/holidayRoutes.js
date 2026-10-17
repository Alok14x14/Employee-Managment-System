import { Router } from "express";
import { protect, protectAdmin, requirePasswordChanged } from "../middleware/auth.js";
import {
  getHolidays,
  createHoliday,
  deleteHoliday,
} from "../controllers/holidayController.js";

const holidayRouter = Router();

holidayRouter.get("/", protect, requirePasswordChanged, getHolidays);
holidayRouter.post("/", protect, requirePasswordChanged, protectAdmin, createHoliday);
holidayRouter.delete("/:id", protect, requirePasswordChanged, protectAdmin, deleteHoliday);

export default holidayRouter;
