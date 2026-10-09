import { Router } from "express";
import { protect, requirePasswordChanged } from "../middleware/auth.js";
import { clockInOut, getAttendance } from "../controllers/attendanceController.js";

const attendanceRouter = Router();

attendanceRouter.post('/', protect, requirePasswordChanged, clockInOut);
attendanceRouter.get('/', protect, requirePasswordChanged, getAttendance);

export default attendanceRouter;