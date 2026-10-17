import { Router } from "express";
import rateLimit from "express-rate-limit";
import { changePassword, forgotPassword, login, resetPassword, session } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const authRouter = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: 429,
    message: { error: "Too many login attempts, please try again after 15 minutes" },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({ error: options.message?.error || options.message });
    },
});

const changePasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: 429,
    message: { error: "Too many password change attempts, please try again later" },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({ error: options.message?.error || options.message });
    },
});

authRouter.post("/login", loginLimiter, login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.get("/session", protect, session);
authRouter.post("/change-password", changePasswordLimiter, protect, changePassword);

export default authRouter;
