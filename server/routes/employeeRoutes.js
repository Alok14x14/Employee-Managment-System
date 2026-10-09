import { Router } from "express";
import { createEmployee, deleteEmployee, getEmployees, updateEmployee } from "../controllers/employeeController.js";
import { protect, protectAdmin, requirePasswordChanged } from "../middleware/auth.js";

const employeesRouter = Router();

employeesRouter.get("/", protect, requirePasswordChanged, protectAdmin, getEmployees);
employeesRouter.post("/", protect, requirePasswordChanged, protectAdmin, createEmployee);
employeesRouter.put("/:id", protect, requirePasswordChanged, protectAdmin, updateEmployee);
employeesRouter.delete("/:id", protect, requirePasswordChanged, protectAdmin, deleteEmployee);

export default employeesRouter;