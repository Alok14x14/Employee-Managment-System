import AuditLog from "../models/AuditLog.js";
import Employee from "../models/Employee.js";
import Payslip from "../models/Payslip.js";
import Holiday from "../models/Holiday.js";
import Announcement from "../models/Announcement.js";
import EmployeeDocument from "../models/EmployeeDocument.js";
import User from "../models/User.js";
import { createHash } from "crypto";

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
    profile: "profile",
    auth: "account security",
};

const cleanText = (value, maxLength = 160) => typeof value === "string" ? value.trim().slice(0, maxLength) : "";
const employeeSummary = (employee) => employee ? {
    name: `${cleanText(employee.firstName, 80)} ${cleanText(employee.lastName, 80)}`.trim(),
    email: cleanText(employee.email, 160),
} : null;
const EMPLOYEE_FIELD_LABELS = {
    firstName: "First name", lastName: "Last name", email: "Email", phone: "Phone", position: "Position",
    department: "Department", basicSalary: "Basic salary", allowances: "Allowances", deductions: "Deductions",
    joinDate: "Join date", employmentStatus: "Employment status", bio: "Bio", role: "Role",
};
const normalizeEmployeeValue = (field, value) => {
    if (value == null) return null;
    if (["basicSalary", "allowances", "deductions"].includes(field)) return Number(value);
    if (field === "joinDate") {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
    }
    if (field === "email") return String(value).trim().toLowerCase();
    return String(value).trim();
};

const captureMeta = async ({ resource, resourceId, resourceKey, method, body }) => {
    if (resource === "employee") {
        const employee = resourceId ? await Employee.findById(resourceId).select("firstName lastName email phone position department basicSalary allowances deductions employmentStatus isDeleted joinDate bio userId").populate("userId", "role").lean() : null;
        const person = employeeSummary(employee) || (method === "POST" ? employeeSummary(body) : null);
        const fieldSnapshot = employee ? {
            firstName: employee.firstName, lastName: employee.lastName, email: employee.email, phone: employee.phone,
            position: employee.position, department: employee.department, basicSalary: employee.basicSalary,
            allowances: employee.allowances, deductions: employee.deductions, joinDate: employee.joinDate,
            employmentStatus: employee.employmentStatus, bio: employee.bio, role: employee.userId?.role,
        } : null;
        const sensitiveSnapshot = employee ? {
            basicSalary: employee.basicSalary ?? null,
            allowances: employee.allowances ?? null,
            deductions: employee.deductions ?? null,
            employmentStatus: employee.employmentStatus ?? null,
            role: employee.userId?.role ?? null,
            isDeleted: Boolean(employee.isDeleted),
        } : method === "POST" ? {
            basicSalary: body?.basicSalary == null ? null : Number(body.basicSalary),
            allowances: body?.allowances == null ? null : Number(body.allowances),
            deductions: body?.deductions == null ? null : Number(body.deductions),
            employmentStatus: body?.employmentStatus || "ACTIVE",
            role: body?.role || "EMPLOYEE",
            isDeleted: false,
        } : null;
        return { employee: person, fieldSnapshot, sensitiveSnapshot };
    }

    if (resource === "payslip") {
        const payslip = resourceId ? await Payslip.findById(resourceId).select("employeeId month year").populate("employeeId", "firstName lastName email").lean() : null;
        const employee = payslip?.employeeId || (body?.employeeId ? await Employee.findById(body.employeeId).select("firstName lastName email").lean() : null);
        const month = payslip?.month ?? Number(body?.month);
        const year = payslip?.year ?? Number(body?.year);
        return {
            employee: employeeSummary(employee),
            period: Number.isInteger(month) && month >= 1 && month <= 12 && Number.isInteger(year) ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1))) : "",
        };
    }

    if (resource === "holiday") {
        const holiday = resourceId ? await Holiday.findById(resourceId).lean() : null;
        return { title: holiday?.name || cleanText(body?.name, 100), date: holiday?.date || cleanText(body?.date, 20) };
    }

    if (resource === "announcement") {
        const announcement = resourceId ? await Announcement.findById(resourceId).select("title expiresAt").lean() : null;
        return { title: announcement?.title || cleanText(body?.title, 140), expiresAt: announcement?.expiresAt || body?.expiresAt || null };
    }

    if (resource === "employee document") {
        const document = resourceId ? await EmployeeDocument.findById(resourceId).select("title category audience employeeId").populate("employeeId", "firstName lastName email").lean() : null;
        const employee = document?.employeeId || (body?.employeeId && body.employeeId !== "ALL" ? await Employee.findById(body.employeeId).select("firstName lastName email").lean() : null);
        return {
            title: document?.title || cleanText(body?.title, 120),
            category: document?.category || cleanText(body?.category, 40),
            audience: document?.audience || (body?.employeeId === "ALL" ? "ALL" : "EMPLOYEE"),
            employee: employeeSummary(employee),
        };
    }

    if (resource === "profile") return { changes: Object.keys(body || {}).filter((key) => key !== "password").slice(0, 20) };
    if (resourceKey === "auth" && method === "POST") return { reason: "The administrator changed their own account password." };
    return {};
};

const responseResourceId = (chunk) => {
    try {
        const response = JSON.parse(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk || ""));
        const candidates = [response?.employee, response?.data, response?.data?.employee, response?.data?.data];
        for (const value of candidates) {
            const id = value?._id || value?.id;
            if (typeof id === "string" && /^[a-f\d]{24}$/i.test(id)) return id;
        }
    } catch { /* Response body is only inspected for a record id; it is never stored. */ }
    return null;
};

const resolveSecurityActor = async (req, pathname) => {
    const normalizeEmail = (value) => typeof value === "string" ? value.trim().toLowerCase().slice(0, 160) : "";
    if (pathname === "/api/auth/login" && req.body?.role_type === "admin") {
        const attemptedEmail = normalizeEmail(req.body.email);
        const user = attemptedEmail ? await User.findOne({ email: attemptedEmail }).select("_id role").lean() : null;
        return { type: "login", actorId: user?.role === "ADMIN" ? user._id : null, attemptedEmail: user?.role === "ADMIN" ? null : attemptedEmail };
    }
    if (pathname === "/api/auth/forgot-password") {
        const email = normalizeEmail(req.body?.email);
        const user = email ? await User.findOne({ email, role: "ADMIN" }).select("_id").lean() : null;
        return user ? { type: "forgot", actorId: user._id } : null;
    }
    if (pathname === "/api/auth/reset-password" && typeof req.body?.token === "string") {
        const tokenHash = createHash("sha256").update(req.body.token).digest("hex");
        const user = await User.findOne({ passwordResetToken: tokenHash, role: "ADMIN" }).select("_id").lean();
        return user ? { type: "reset", actorId: user._id } : null;
    }
    return null;
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

    let verb = method === "POST" ? (resourceKey === "profile" ? "Updated" : "Created") : method === "PUT" ? "Updated" : method === "PATCH" ? "Changed" : "Deleted";
    if (lowerPath.includes("/archive") || (resourceKey === "employees" && method === "DELETE")) verb = "Archived";
    else if (lowerPath.includes("review") || lowerPath.includes("corrections")) verb = method === "POST" ? "Submitted" : "Reviewed";
    else if (lowerPath.includes("status") || (resourceKey === "leave" && method === "PATCH")) verb = "Reviewed";
    else if (resourceKey === "payslips" && method === "POST") verb = "Issued";

    return { action: `${verb} ${resource}`, resource, resourceId };
};

export const auditAdminActions = (req, res, next) => {
    if (!MUTATING_METHODS.has(req.method) || req.originalUrl.startsWith("/api/audit-logs")) return next();

    const pathname = req.originalUrl.split("?")[0];
    const isSecurityPath = ["/api/auth/login", "/api/auth/forgot-password", "/api/auth/reset-password"].includes(pathname);
    const securityActorPromise = isSecurityPath
        ? resolveSecurityActor(req, pathname).catch((error) => {
            console.error("Failed to resolve authentication audit actor:", error.message);
            return null;
        })
        : Promise.resolve(null);
    const parts = pathname.split("/").filter(Boolean);
    const apiIndex = parts.indexOf("api");
    const resourceKey = parts[apiIndex + 1] || "record";
    const resource = parts.slice(apiIndex + 2).map((part) => RESOURCE_NAMES[part]).find(Boolean) || RESOURCE_NAMES[resourceKey] || "record";
    const resourceId = parts.slice(apiIndex + 2).find((part) => /^[a-f\d]{24}$/i.test(part)) || null;
    // Read current values before destructive updates/deletes so the audit snapshot survives record removal.
    const preMutationMeta = ["PUT", "PATCH", "DELETE"].includes(req.method)
        ? captureMeta({ resource, resourceId, resourceKey, method: req.method, body: req.body || {} }).catch((error) => {
            console.error("Failed to capture admin audit context:", error.message);
            return {};
        })
        : null;
    const originalEnd = res.end;
    let ended = false;
    res.end = function (...args) {
        if (ended) return originalEnd.apply(this, args);
        ended = true;

        const session = req.session;
        const responseThis = this;

        const chunk = args[0];
        const createdId = req.method === "POST" ? responseResourceId(chunk) : null;
        const finalResourceId = resourceId || createdId;
        const { action } = describeAction(req.method, req.originalUrl);
        const metaPromise = preMutationMeta || captureMeta({ resource, resourceId: finalResourceId, resourceKey, method: req.method, body: req.body || {} });
        const outcome = res.statusCode >= 200 && res.statusCode < 300 ? "SUCCESS" : "FAILED";
        const statusLabel = req.body?.status === "APPROVED" ? "Accepted" : req.body?.status === "REJECTED" ? "Rejected" : null;

        const recordPromise = Promise.all([metaPromise, securityActorPromise]).then(async ([beforeMeta, securityActor]) => {
            const sessionIsAdmin = session?.role === "ADMIN";
            if (!sessionIsAdmin && !securityActor) return;
            const actorId = sessionIsAdmin ? session.userId : securityActor.actorId;
            const finalMeta = { ...(beforeMeta || {}), ...(statusLabel ? { requestedOutcome: statusLabel } : {}) };
            let changeLabels = [];
            let finalAction = action;

            if (resource === "employee") {
                const afterMeta = outcome === "SUCCESS"
                    ? await captureMeta({ resource, resourceId: finalResourceId, resourceKey, method: "PUT", body: {} })
                    : beforeMeta;
                if (req.method === "PUT" && outcome === "SUCCESS") {
                    changeLabels = Object.keys(req.body || {})
                        .filter((field) => Object.hasOwn(EMPLOYEE_FIELD_LABELS, field))
                        .filter((field) => normalizeEmployeeValue(field, beforeMeta?.fieldSnapshot?.[field]) !== normalizeEmployeeValue(field, afterMeta?.fieldSnapshot?.[field]))
                        .map((field) => EMPLOYEE_FIELD_LABELS[field])
                        .slice(0, 20);
                }
                const includesPasswordChange = req.method === "PUT" && outcome === "SUCCESS" && typeof req.body?.password === "string" && req.body.password.length >= 8;
                if (includesPasswordChange) changeLabels.push("Password");
                if (includesPasswordChange) {
                    finalAction = changeLabels.some((label) => label !== "Password")
                        ? "Updated employee and changed password"
                        : "Changed employee password";
                }
                const before = beforeMeta?.sensitiveSnapshot || null;
                const after = afterMeta?.sensitiveSnapshot || null;
                const sensitiveFields = [
                    ["basicSalary", "Basic salary"], ["allowances", "Allowances"], ["deductions", "Deductions"],
                    ["employmentStatus", "Employment status"], ["role", "Account role"], ["isDeleted", "Archived status"],
                ];
                finalMeta.before = before;
                finalMeta.after = after;
                finalMeta.sensitiveChanges = sensitiveFields
                    .filter(([field]) => JSON.stringify(before?.[field] ?? null) !== JSON.stringify(after?.[field] ?? null))
                    .map(([field, label]) => ({ field: label, before: before?.[field] ?? null, after: after?.[field] ?? null }));
                delete finalMeta.sensitiveSnapshot;
                delete finalMeta.fieldSnapshot;
                if (finalMeta.after) delete finalMeta.after.isDeleted;
                if (finalMeta.before) delete finalMeta.before.isDeleted;
            }

            if (securityActor) {
                const securityActions = {
                    login: outcome === "SUCCESS" ? "Admin login succeeded" : "Failed admin login",
                    forgot: outcome === "SUCCESS" ? "Requested admin password reset" : "Failed admin password reset request",
                    reset: outcome === "SUCCESS" ? "Reset admin password" : "Failed admin password reset",
                };
                finalAction = securityActions[securityActor.type];
            }

            return AuditLog.create({
                actorId: actorId || null,
                attemptedEmail: securityActor?.attemptedEmail || null,
                action: finalAction,
                resource: securityActor ? "authentication" : resource,
                resourceId: securityActor ? null : finalResourceId,
                meta: securityActor ? {} : resource === "employee" ? { ...finalMeta, changes: changeLabels } : finalMeta,
                outcome,
                statusCode: res.statusCode,
                ip: String(req.ip || "").slice(0, 100),
                userAgent: String(req.get("user-agent") || "").slice(0, 500),
                method: req.method,
                path: pathname,
            });
        }).catch((error) => console.error("Failed to record admin audit log:", error.message));

        recordPromise.finally(() => originalEnd.apply(responseThis, args));
        return responseThis;
    };

    next();
};
