import AuditLog from "../models/AuditLog.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const RESOURCE_NAMES = {
    employees: "employee",
    attendance: "attendance",
    corrections: "attendance correction",
    leave: "leave request",
    payslips: "payslip",
    holidays: "holiday",
    announcements: "announcement",
    documents: "employee document",
};

const describeAction = (method, path) => {
    const parts = path.split("?")[0].split("/").filter(Boolean);
    const apiIndex = parts.indexOf("api");
    const resourceKey = parts[apiIndex + 1] || "record";
    const tail = parts.slice(apiIndex + 2);
    const resource = tail.map((part) => RESOURCE_NAMES[part]).find(Boolean) || RESOURCE_NAMES[resourceKey] || "record";
    const resourceId = tail.find((part) => /^[a-f\d]{24}$/i.test(part)) || null;
    const lowerPath = path.toLowerCase();

    if (resourceKey === "auth" && lowerPath.includes("change-password")) {
        return { action: "Changed password", resource: "account security", resourceId: null };
    }

    let verb = method === "POST" ? "Created" : method === "PUT" ? "Updated" : method === "PATCH" ? "Changed" : "Deleted";
    if (lowerPath.includes("/archive") || (resourceKey === "employees" && method === "DELETE")) verb = "Archived";
    else if (lowerPath.includes("review") || lowerPath.includes("corrections")) verb = method === "POST" ? "Submitted" : "Reviewed";
    else if (lowerPath.includes("status") || resourceKey === "leave" && method === "PATCH") verb = "Reviewed";
    else if (resourceKey === "payslips" && method === "POST") verb = "Issued";

    return { action: `${verb} ${resource}`, resource, resourceId };
};

export const auditAdminActions = (req, res, next) => {
    if (!MUTATING_METHODS.has(req.method) || req.originalUrl.startsWith("/api/audit-logs")) return next();

    const originalEnd = res.end;
    let ended = false;
    res.end = function (...args) {
        if (ended) return originalEnd.apply(this, args);
        ended = true;

        const session = req.session;
        if (session?.role !== "ADMIN" || res.statusCode < 200 || res.statusCode >= 300) {
            return originalEnd.apply(this, args);
        }

        let { action, resource, resourceId } = describeAction(req.method, req.originalUrl);
        if (req.method === "PUT" && resource === "employee" && typeof req.body?.password === "string" && req.body.password.length >= 8) {
            action = "Changed employee password";
        }
        let createdResourceId = resourceId;
        if (!createdResourceId && req.method === "POST" && req.originalUrl.split("?")[0] === "/api/employees") {
            try {
                const chunk = args[0];
                const response = JSON.parse(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk || ""));
                const id = response?.employee?._id || response?.employee?.id;
                if (typeof id === "string" && /^[a-f\d]{24}$/i.test(id)) createdResourceId = id;
            } catch {
                // Do not store response contents; the employee id is optional metadata only.
            }
        }
        const log = AuditLog.create({
            actorId: session.userId,
            actorEmail: session.email,
            action,
            resource,
            resourceId: createdResourceId,
            method: req.method,
            path: req.originalUrl.split("?")[0],
        });

        return log.catch((error) => {
            console.error("Failed to record admin audit log:", error.message);
        }).finally(() => originalEnd.apply(this, args));
    };

    next();
};
