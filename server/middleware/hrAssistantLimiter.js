import rateLimit from "express-rate-limit";

export const hrAssistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "You are sending messages too quickly. Please wait a minute and try again." },
});
