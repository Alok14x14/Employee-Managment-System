import { Router } from "express";
import { protect, protectAdmin, requirePasswordChanged } from "../middleware/auth.js";
import { clockInOut, getAttendance, getTodayAttendanceAdmin } from "../controllers/attendanceController.js";

const attendanceRouter = Router();

attendanceRouter.get('/admin/today', protect, requirePasswordChanged, protectAdmin, getTodayAttendanceAdmin);
attendanceRouter.post('/', protect, requirePasswordChanged, clockInOut);
attendanceRouter.get('/', protect, requirePasswordChanged, getAttendance);

export default attendanceRouter;