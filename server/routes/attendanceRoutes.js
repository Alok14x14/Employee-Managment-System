import { Router } from "express";
import { protect, protectAdmin, requirePasswordChanged } from "../middleware/auth.js";
import { clockInOut, getAttendance, getTodayAttendanceAdmin } from "../controllers/attendanceController.js";
import { createCorrectionRequest, getCorrectionRequests, reviewCorrectionRequest } from "../controllers/attendanceCorrectionController.js";

const attendanceRouter = Router();

attendanceRouter.get('/admin/today', protect, requirePasswordChanged, protectAdmin, getTodayAttendanceAdmin);
attendanceRouter.get('/corrections', protect, requirePasswordChanged, getCorrectionRequests);
attendanceRouter.post('/corrections', protect, requirePasswordChanged, createCorrectionRequest);
attendanceRouter.patch('/corrections/:id', protect, requirePasswordChanged, protectAdmin, reviewCorrectionRequest);
attendanceRouter.post('/', protect, requirePasswordChanged, clockInOut);
attendanceRouter.get('/', protect, requirePasswordChanged, getAttendance);

export default attendanceRouter;
