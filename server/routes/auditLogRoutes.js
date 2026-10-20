import { Router } from "express";
import { getAuditLogs } from "../controllers/auditLogController.js";
import { protect, protectAdmin, requirePasswordChanged } from "../middleware/auth.js";

const auditLogRouter = Router();
auditLogRouter.get("/", protect, requirePasswordChanged, protectAdmin, getAuditLogs);

export default auditLogRouter;
