import { Router } from "express";
import { chatWithHrAssistant, draftLeaveReason } from "../controllers/hrAssistantController.js";
import { protect, protectEmployee, requirePasswordChanged } from "../middleware/auth.js";
import { hrAssistantLimiter } from "../middleware/hrAssistantLimiter.js";

const hrAssistantRouter = Router();

hrAssistantRouter.post("/chat", protect, requirePasswordChanged, protectEmployee, hrAssistantLimiter, chatWithHrAssistant);
hrAssistantRouter.post("/leave-draft", protect, requirePasswordChanged, protectEmployee, hrAssistantLimiter, draftLeaveReason);

export default hrAssistantRouter;
