import express from "express";
import cors from "cors";
import "dotenv/config";
import multer from "multer";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import employeesRouter from "./routes/employeeRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import attendanceRouter from "./routes/attendanceRoutes.js";
import leaveRouter from "./routes/leaveRoutes.js";
import payslipRouter from "./routes/payslipsRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import metaRouter from "./routes/metaRoutes.js";
import holidayRouter from "./routes/holidayRoutes.js";
import hrAssistantRouter from "./routes/hrAssistantRoutes.js";
import employeeDocumentRouter from "./routes/employeeDocumentRoutes.js";
import announcementRouter from "./routes/announcementRoutes.js";

import dns from "dns"
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"

import helmet from "helmet";

dns.setServers(['8.8.8.8', '1.1.1.1']); // Force DNS to Google's servers.

const app = express()
const PORT = process.env.PORT || 4000;

app.set("trust proxy", 1);

app.use(helmet());

// Expose time spent inside this Express request. Compare this with browser TTFB
// to separate API/database latency from hosting/network startup delay.
app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint();
    const originalEnd = res.end;

    res.end = function (...args) {
        if (!res.headersSent) {
            const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
            res.setHeader("Server-Timing", `app;dur=${durationMs.toFixed(1)}`);
        }
        return originalEnd.apply(this, args);
    };

    next();
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL?.split(",") || true }))
app.use(express.json())

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        next(err);
    }
});

// Routes
app.get("/", (req, res)=> res.send("Server is running"));
app.use("/api/documents", employeeDocumentRouter)
app.use("/api/announcements", announcementRouter)
app.use(multer().none())
app.use("/api/auth", authRouter)
app.use("/api/employees", employeesRouter)
app.use("/api/profile", profileRouter)
app.use("/api/attendance", attendanceRouter)
app.use("/api/leave", leaveRouter)
app.use("/api/payslips", payslipRouter)
app.use("/api/dashboard", dashboardRouter)
app.use("/api/meta", metaRouter)
app.use("/api/holidays", holidayRouter)
app.use("/api/hr-assistant", hrAssistantRouter)

app.use("/api/inngest", serve({ client: inngest, functions }));

if (!process.env.VERCEL) {
    connectDB().catch((err) => console.error("Database connection error:", err));
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
