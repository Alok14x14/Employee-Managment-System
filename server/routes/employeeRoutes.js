import { Router } from "express";
import { createEmployee, deleteEmployee, getEmployeeDetails, getEmployeeDirectory, getEmployees, updateEmployee } from "../controllers/employeeController.js";
import { protect, protectAdmin, protectEmployee, requirePasswordChanged } from "../middleware/auth.js";

const employeesRouter = Router();

employeesRouter.get("/directory", protect, requirePasswordChanged, protectEmployee, getEmployeeDirectory);
employeesRouter.get("/", protect, requirePasswordChanged, protectAdmin, getEmployees);
employeesRouter.get("/:id/details", protect, requirePasswordChanged, protectAdmin, getEmployeeDetails);
employeesRouter.post("/", protect, requirePasswordChanged, protectAdmin, createEmployee);
employeesRouter.put("/:id", protect, requirePasswordChanged, protectAdmin, updateEmployee);
employeesRouter.delete("/:id", protect, requirePasswordChanged, protectAdmin, deleteEmployee);

export default employeesRouter;
