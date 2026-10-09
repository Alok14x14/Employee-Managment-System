import { Router } from "express";
import { protect, protectAdmin, requirePasswordChanged } from "../middleware/auth.js";
import { createPayslip, getPayslipById, getPayslips } from "../controllers/payslipController.js";

const payslipRouter = Router();

payslipRouter.post("/", protect, requirePasswordChanged, protectAdmin, createPayslip);
payslipRouter.get("/", protect, requirePasswordChanged, getPayslips);
payslipRouter.get("/:id", protect, requirePasswordChanged, getPayslipById);

export default payslipRouter;