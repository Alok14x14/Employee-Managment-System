import { Router } from "express";
import { protect, requirePasswordChanged } from "../middleware/auth.js";
import { getDashboard } from "../controllers/dashboardController.js";

const dashboardRouter = Router();

dashboardRouter.get('/', protect, requirePasswordChanged, getDashboard);

export default dashboardRouter;