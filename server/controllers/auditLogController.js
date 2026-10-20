import AuditLog from "../models/AuditLog.js";
import AttendanceCorrection from "../models/AttendanceCorrection.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Employee from "../models/Employee.js";

export const getAuditLogs = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
        const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
        const filter = search ? {
            $or: [
                { actorEmail: { $regex: search, $options: "i" } },
                { action: { $regex: search, $options: "i" } },
                { resource: { $regex: search, $options: "i" } },
                { path: { $regex: search, $options: "i" } },
            ],
        } : {};

        const [records, total] = await Promise.all([
            AuditLog.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
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
                if (!employee && !record.resourceId && record.method === "POST" && record.path === "/api/employees") {
                    const candidates = await Employee.find({
                        createdAt: { $gte: new Date(new Date(record.createdAt).getTime() - 60_000), $lte: new Date(new Date(record.createdAt).getTime() + 5_000) },
                    }).select("firstName lastName email").limit(2).lean();
                    if (candidates.length === 1) employee = candidates[0];
                }
                if (!employee) return record;
                const person = personDetails(employee);
                return { ...record, details: {
                    ...(record.method === "POST" ? { createdEmployee: person } : {}),
                    ...(record.action === "Changed employee password" ? { changedEmployee: person } : {}),
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

        return res.json({ data, total, page, limit });
    } catch (error) {
        console.error("Audit log fetch error:", error);
        return res.status(500).json({ error: "Failed to load activity log" });
    }
};
