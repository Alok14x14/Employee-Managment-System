import { Router } from "express";
import { changePassword, forgotPassword, login, resetPassword, session } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/forgot-password", authLimiter, forgotPassword);
authRouter.post("/reset-password", authLimiter, resetPassword);
authRouter.get("/session", protect, session);
authRouter.post("/change-password", protect, changePassword);

export default authRouter;
