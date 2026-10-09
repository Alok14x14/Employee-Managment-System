import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // 5 requests per windowMs
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests, please try again after 15 minutes" },
});
