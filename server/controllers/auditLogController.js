import AuditLog from "../models/AuditLog.js";
import AttendanceCorrection from "../models/AttendanceCorrection.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";

export const getAuditLogs = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
        const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const [emailMatches, employeeMatches] = search ? await Promise.all([
            User.find({ email: { $regex: escapedSearch, $options: "i" } }).select("_id").limit(100).lean(),
            Employee.find({ $or: [
                { firstName: { $regex: escapedSearch, $options: "i" } },
                { lastName: { $regex: escapedSearch, $options: "i" } },
                { email: { $regex: escapedSearch, $options: "i" } },
            ] }).select("_id").limit(100).lean(),
        ]) : [[], []];
        const outcomeMatches = /accepted|approved/i.test(search) ? "Accepted" : /rejected|declined/i.test(search) ? "Rejected" : null;
        const matchedEmployeeIds = employeeMatches.map((employee) => employee._id);
        const [matchingLeaves, matchingCorrections] = search && (matchedEmployeeIds.length || outcomeMatches) ? await Promise.all([
            LeaveApplication.find({ $or: [
                ...(matchedEmployeeIds.length ? [{ employeeId: { $in: matchedEmployeeIds } }] : []),
                ...(outcomeMatches ? [{ status: outcomeMatches === "Accepted" ? "APPROVED" : "REJECTED" }] : []),
            ] }).select("_id").limit(500).lean(),
            AttendanceCorrection.find({ $or: [
                ...(matchedEmployeeIds.length ? [{ employeeId: { $in: matchedEmployeeIds } }] : []),
                ...(outcomeMatches ? [{ status: outcomeMatches === "Accepted" ? "APPROVED" : "REJECTED" }] : []),
            ] }).select("_id").limit(500).lean(),
        ]) : [[], []];
        const relatedResourceIds = [...matchedEmployeeIds, ...matchingLeaves.map((item) => item._id), ...matchingCorrections.map((item) => item._id)];
        const filter = search ? {
            $or: [
                { actorEmail: { $regex: escapedSearch, $options: "i" } },
                { attemptedEmail: { $regex: escapedSearch, $options: "i" } },
                ...(emailMatches.length ? [{ actorId: { $in: emailMatches.map((user) => user._id) } }] : []),
                ...(relatedResourceIds.length ? [{ resourceId: { $in: relatedResourceIds.map((id) => id.toString()) } }] : []),
                { action: { $regex: escapedSearch, $options: "i" } },
                { resource: { $regex: escapedSearch, $options: "i" } },
                { path: { $regex: escapedSearch, $options: "i" } },
                { ip: { $regex: escapedSearch, $options: "i" } },
                { userAgent: { $regex: escapedSearch, $options: "i" } },
                { "meta.employee.name": { $regex: escapedSearch, $options: "i" } },
                { "meta.employee.email": { $regex: escapedSearch, $options: "i" } },
                { "meta.applicant.name": { $regex: escapedSearch, $options: "i" } },
                { "meta.applicant.email": { $regex: escapedSearch, $options: "i" } },
                { "meta.title": { $regex: escapedSearch, $options: "i" } },
                { "meta.category": { $regex: escapedSearch, $options: "i" } },
                { "meta.period": { $regex: escapedSearch, $options: "i" } },
                { "meta.requestedOutcome": { $regex: escapedSearch, $options: "i" } },
                { "meta.changes": { $regex: escapedSearch, $options: "i" } },
                { "meta.sensitiveChanges.field": { $regex: escapedSearch, $options: "i" } },
                { "details.reason": { $regex: escapedSearch, $options: "i" } },
                { "details.field": { $regex: escapedSearch, $options: "i" } },
                { outcome: { $regex: escapedSearch, $options: "i" } },
                ...(outcomeMatches ? [{ "meta.requestedOutcome": outcomeMatches }] : []),
            ],
        } : {};

        const [records, total] = await Promise.all([
            AuditLog.find(filter).populate("actorId", "email").sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            AuditLog.countDocuments(filter),
        ]);

        const correctionIds = records.filter((record) => record.resource === "attendance correction" && record.resourceId).map((record) => record.resourceId);
        const leaveIds = records.filter((record) => record.resource === "leave request" && record.resourceId).map((record) => record.resourceId);
        const employeeIds = records.filter((record) => record.resource === "employee" && record.resourceId).map((record) => record.resourceId);
        const [corrections, leaveRequests, employees] = await Promise.all([
            correctionIds.length ? AttendanceCorrection.find({ _id: { $in: correctionIds } }).populate("employeeId", "firstName lastName email").populate("attendanceId", "date").lean() : [],
            leaveIds.length ? LeaveApplication.find({ _id: { $in: leaveIds } }).populate("employeeId", "firstName lastName email").lean() : [],
            employeeIds.length ? Employee.find({ _id: { $in: employeeIds } }).select("firstName lastName email").lean() : [],
        ]);
        const correctionsById = new Map(corrections.map((item) => [item._id.toString(), item]));
        const leavesById = new Map(leaveRequests.map((item) => [item._id.toString(), item]));
        const employeesById = new Map(employees.map((item) => [item._id.toString(), item]));
        const personDetails = (employee) => employee ? { name: `${employee.firstName} ${employee.lastName}`.trim(), email: employee.email } : null;
        const data = await Promise.all(records.map(async (record) => {
            if (record.path === "/api/auth/change-password") {
                return { ...record, action: "Changed password", resource: "account security", details: { changedAccount: record.actorEmail, reason: "The administrator changed their own account password." } };
            }
            if (record.resource === "employee") {
                let employee = record.resourceId ? employeesById.get(record.resourceId) : null;
                // Older employee-created events did not retain the returned employee id. Recover a name only when exactly one profile matches the audit timestamp closely.
                if (!employee && !record.resourceId && !record.expiresAt && record.method === "POST" && record.path === "/api/employees") {
                    const candidates = await Employee.find({
                        createdAt: { $gte: new Date(new Date(record.createdAt).getTime() - 60_000), $lte: new Date(new Date(record.createdAt).getTime() + 5_000) },
                    }).select("firstName lastName email").limit(2).lean();
                    if (candidates.length === 1) employee = candidates[0];
                }
                if (!employee) return record;
                const person = personDetails(employee);
                return { ...record, details: {
                    employee: person,
                    ...(record.method === "POST" ? { createdEmployee: person } : {}),
                    ...(record.action.includes("password") ? { changedEmployee: person } : {}),
                } };
            }
            if (record.resource === "attendance correction") {
                const item = correctionsById.get(record.resourceId);
                if (!item) return record;
                return { ...record, details: { applicant: personDetails(item.employeeId), field: item.field, requestedTime: item.requestedTime, attendanceDate: item.attendanceId?.date || null, reason: item.reason, status: item.status, reviewNote: item.reviewNote } };
            }
            if (record.resource === "leave request") {
                const item = leavesById.get(record.resourceId);
                if (!item) return record;
                return { ...record, details: { applicant: personDetails(item.employeeId), leaveType: item.type, startDate: item.startDate, endDate: item.endDate, reason: item.reason, status: item.status, reviewNote: item.rejectReason } };
            }
            return record;
        }));

        const result = data.map((record) => ({
            ...record,
            actorEmail: record.actorId?.email || record.attemptedEmail || record.actorEmail || "Unknown administrator",
            actorId: record.actorId?._id || record.actorId || null,
        }));
        return res.json({ data: result, total, page, limit });
    } catch (error) {
        console.error("Audit log fetch error:", error);
        return res.status(500).json({ error: "Failed to load activity log" });
    }
};
