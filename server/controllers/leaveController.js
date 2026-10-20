import { inngest } from "../inngest/index.js";
import { LEAVE_QUOTAS } from "../constants/leaveQuotas.js";
import Employee from "../models/Employee.js";
import mongoose from "mongoose";
import LeaveApplication from "../models/LeaveApplication.js";
import { sendLeaveStatusEmail } from "../utils/emailService.js";
import { loadHolidaySet } from "../utils/holidays.js";
import { countWorkingDays, splitDaysByYear } from "../utils/leaveDays.js";
import { istDayStart, istParts } from "../utils/time.js";
import { isValidObjectId, parseDate } from "../utils/validate.js";
import { autoRejectExpiredLeaves, isLeavePassed } from "../utils/leaveAutoReject.js";

// Create leave
// POST /api/leave
export const createLeave = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId });
        if (!employee) return res.status(404).json({ error: "Employee not found" });
        if (employee.isDeleted) {
            return res.status(403).json({
                error: "Your account is deactivated. You cannot apply for leave.",
            });
        }

        const { type, startDate, endDate, reason } = req.body;

        if (!type || !startDate || !endDate || !reason) {
            return res.status(400).json({ error: "Missing fields" });
        }

        if (!["SICK", "CASUAL", "ANNUAL"].includes(type)) {
            return res.status(400).json({ error: "Invalid leave type" });
        }

        const rawStart = parseDate(startDate);
        const rawEnd = parseDate(endDate);
        if (!rawStart || !rawEnd) {
            return res.status(400).json({ error: "Valid start and end dates are required" });
        }

        const parsedStart = istDayStart(rawStart);
        const parsedEnd = istDayStart(rawEnd);
        const today = istDayStart();

        // Start date must not be in the past (allow today in IST)
        if (parsedStart < today || parsedEnd < today) {
            return res.status(400).json({ error: "Leave dates cannot be in the past" });
        }

        if (parsedEnd < parsedStart) {
            return res.status(400).json({ error: "End date cannot be before start date" });
        }

        const trimmedReason = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
        if (!trimmedReason) {
            return res.status(400).json({ error: "Reason is required" });
        }

        // Load holidays for the requested range
        const holidaySet = await loadHolidaySet(parsedStart, parsedEnd);
        const workingDays = countWorkingDays(parsedStart, parsedEnd, holidaySet);

        // Reject if zero working days
        if (workingDays === 0) {
            return res.status(400).json({ error: "Selected dates fall on weekends/holidays" });
        }

        // Overlap check: existing PENDING or APPROVED leave where existing.startDate <= newEnd AND existing.endDate >= newStart
        const conflict = await LeaveApplication.findOne({
            employeeId: employee._id,
            status: { $in: ["PENDING", "APPROVED"] },
            startDate: { $lte: parsedEnd },
            endDate: { $gte: parsedStart },
        });

        if (conflict) {
            const { year: sy, month: sm, day: sd } = istParts(conflict.startDate);
            const { year: ey, month: em, day: ed } = istParts(conflict.endDate);
            return res.status(409).json({
                error: `Leave request conflicts with an existing ${conflict.status.toLowerCase()} leave from ${sy}-${sm}-${sd} to ${ey}-${em}-${ed}`,
            });
        }

        // Balance check for each year spanned by the leave
        const requestedByYear = splitDaysByYear(parsedStart, parsedEnd, holidaySet);
        const quota = LEAVE_QUOTAS[type] || 0;

        for (const y of Object.keys(requestedByYear)) {
            const yStart = new Date(`${y}-01-01T00:00:00+05:30`);
            const yEnd = new Date(`${y}-12-31T23:59:59.999+05:30`);
            const yHolidays = await loadHolidaySet(yStart, yEnd);

            const existingLeaves = await LeaveApplication.find({
                employeeId: employee._id,
                type,
                status: { $in: ["PENDING", "APPROVED"] },
                startDate: { $lte: yEnd },
                endDate: { $gte: yStart },
            }).lean();

            let usedAndPending = 0;
            for (const l of existingLeaves) {
                const dByYear = splitDaysByYear(l.startDate, l.endDate, yHolidays);
                usedAndPending += dByYear[y] || 0;
            }

            const remaining = quota - usedAndPending;
            const requestedDays = requestedByYear[y];

            if (requestedDays > remaining) {
                return res.status(400).json({
                    error: `Requested ${requestedDays} days, only ${remaining} remaining for ${type}`,
                });
            }
        }

        const leave = await LeaveApplication.create({
            employeeId: employee._id,
            type,
            startDate: parsedStart,
            endDate: parsedEnd,
            reason: trimmedReason,
            status: "PENDING",
            workingDays,
        });

        try {
            await inngest.send({
                name: "leave/pending",
                data: { leaveApplicationId: leave._id },
            });
        } catch (e) {
            console.error("inngest send failed", e);
        }

        return res.json({ success: true, data: leave });
    } catch (error) {
        console.error("createLeave error:", error);
        return res.status(500).json({ error: "Failed to apply for leave" });
    }
};

// Get leave balance
// GET /api/leave/balance?year=YYYY
export const getLeaveBalance = async (req, res) => {
    try {
        const session = req.session;
        if (session.role === "ADMIN") {
            return res.status(403).json({ error: "Leave balance is only applicable for employees" });
        }

        const employee = await Employee.findOne({ userId: session.userId });
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        // Auto-reject any expired pending leaves for this employee before computing balance
        await autoRejectExpiredLeaves(employee._id);

        const rawYear = req.query.year;
        let year = parseInt(rawYear, 10);
        if (isNaN(year) || year < 1970 || year > 2100) {
            year = parseInt(istParts().year, 10);
        }

        const yearStart = new Date(`${year}-01-01T00:00:00+05:30`);
        const yearEnd = new Date(`${year}-12-31T23:59:59.999+05:30`);

        const leaves = await LeaveApplication.find({
            employeeId: employee._id,
            status: { $in: ["PENDING", "APPROVED"] },
            startDate: { $lte: yearEnd },
            endDate: { $gte: yearStart },
        }).lean();

        const holidaySet = await loadHolidaySet(yearStart, yearEnd);

        const used = { SICK: 0, CASUAL: 0, ANNUAL: 0 };
        const pending = { SICK: 0, CASUAL: 0, ANNUAL: 0 };

        for (const leave of leaves) {
            const daysByYear = splitDaysByYear(leave.startDate, leave.endDate, holidaySet);
            const daysInYear = daysByYear[year] || 0;
            if (leave.status === "APPROVED") {
                used[leave.type] = (used[leave.type] || 0) + daysInYear;
            } else if (leave.status === "PENDING") {
                pending[leave.type] = (pending[leave.type] || 0) + daysInYear;
            }
        }

        const balanceData = ["SICK", "CASUAL", "ANNUAL"].map((type) => {
            const quota = LEAVE_QUOTAS[type] || 0;
            const u = used[type] || 0;
            const p = pending[type] || 0;
            const remaining = quota - u - p;
            return {
                type,
                quota,
                used: u,
                pending: p,
                remaining,
            };
        });

        return res.json({ success: true, year, data: balanceData });
    } catch (error) {
        console.error("getLeaveBalance error:", error);
        return res.status(500).json({ error: "Failed to fetch leave balance" });
    }
};

// Get leaves
// GET /api/leave
export const getLeaves = async (req, res) => {
    try {
        const session = req.session;
        const isAdmin = session.role === "ADMIN";

        // Auto-reject any expired pending leaves before returning
        await autoRejectExpiredLeaves();

        if (isAdmin) {
            const status = req.query.status;
            const where = status ? { status } : {};
            const paginated = req.query.page !== undefined || req.query.limit !== undefined;
            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
            const total = paginated ? await LeaveApplication.countDocuments(where) : null;
            let query = LeaveApplication.find(where).sort({ createdAt: -1 });
            if (paginated) query = query.skip((page - 1) * limit).limit(limit);
            const leaves = await query.populate("employeeId");
            const data = leaves.map((l) => {
                const obj = l.toObject();
                return {
                    ...obj,
                    id: obj._id.toString(),
                    employee: obj.employeeId,
                    employeeId: obj.employeeId?._id?.toString(),
                    workingDays: obj.workingDays,
                    autoRejected: obj.autoRejected ?? false,
                };
            });
            return res.json(paginated ? { data, total, page, limit, totalPages: Math.ceil(total / limit) } : { data });
        } else {
            const employee = await Employee.findOne({
                userId: session.userId,
            }).lean();
            if (!employee) return res.status(404).json({ error: "Not found" });
            const where = {
                employeeId: employee._id,
            };
            const paginated = req.query.page !== undefined || req.query.limit !== undefined;
            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
            const total = paginated ? await LeaveApplication.countDocuments(where) : null;
            let query = LeaveApplication.find(where).sort({ createdAt: -1 });
            if (paginated) query = query.skip((page - 1) * limit).limit(limit);
            const leaves = await query;
            return res.json(paginated ? {
                data: leaves,
                employee: { ...employee, id: employee._id.toString() },
                total, page, limit, totalPages: Math.ceil(total / limit),
            } : {
                data: leaves,
                employee: { ...employee, id: employee._id.toString() },
            });
        }
    } catch (error) {
        console.error("getLeaves error:", error);
        return res.status(500).json({ error: "Failed" });
    }
};

// Update leave status
// PATCH /api/leave/:id
export const updateLeaveStatus = async (req, res) => {
    let session;
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }
        const { status, rejectReason } = req.body;
        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }
        if (status === "REJECTED" && !rejectReason) {
            return res.status(400).json({ error: "Rejection reason is required" });
        }

        session = await mongoose.startSession();
        let transactionResult;
        await session.withTransaction(async () => {
            const leave = await LeaveApplication.findById(id).session(session);
            if (!leave) {
                transactionResult = { httpStatus: 404, error: "Leave not found" };
                return;
            }
            if (leave.status !== "PENDING") {
                transactionResult = { httpStatus: 409, error: "Leave was already processed" };
                return;
            }

            // All approvals for one employee write the same employee document in
            // this transaction. MongoDB retries conflicting transactions, so the
            // second approval re-runs its checks against the first one's commit.
            const approvalLock = await Employee.updateOne(
                { _id: leave.employeeId },
                { $inc: { leaveApprovalVersion: 1 } },
                { session }
            );
            if (!approvalLock.matchedCount) {
                transactionResult = { httpStatus: 404, error: "Employee not found" };
                return;
            }

            if (isLeavePassed(leave)) {
                const autoRejected = await LeaveApplication.findOneAndUpdate(
                    { _id: id, status: "PENDING" },
                    { $set: { status: "REJECTED", autoRejected: true, rejectReason: "Auto Rejected" } },
                    { returnDocument: "after", session }
                );
                transactionResult = autoRejected
                    ? { httpStatus: 400, error: "Cannot process leave: start date has already passed. Request has been auto-rejected." }
                    : { httpStatus: 409, error: "Leave was already processed" };
                return;
            }

            if (status === "APPROVED") {
                const conflict = await LeaveApplication.findOne({
                    _id: { $ne: leave._id },
                    employeeId: leave.employeeId,
                    status: "APPROVED",
                    startDate: { $lte: leave.endDate },
                    endDate: { $gte: leave.startDate },
                }).session(session);

                if (conflict) {
                    const { year: sy, month: sm, day: sd } = istParts(conflict.startDate);
                    const { year: ey, month: em, day: ed } = istParts(conflict.endDate);
                    transactionResult = {
                        httpStatus: 409,
                        error: `Cannot approve: conflicts with an approved leave from ${sy}-${sm}-${sd} to ${ey}-${em}-${ed}`,
                    };
                    return;
                }

                const holidaySet = await loadHolidaySet(leave.startDate, leave.endDate);
                const leaveDaysByYear = splitDaysByYear(leave.startDate, leave.endDate, holidaySet);
                for (const y of Object.keys(leaveDaysByYear)) {
                    const yStart = new Date(`${y}-01-01T00:00:00+05:30`);
                    const yEnd = new Date(`${y}-12-31T23:59:59.999+05:30`);
                    const yHolidays = await loadHolidaySet(yStart, yEnd);
                    const approvedLeavesInYear = await LeaveApplication.find({
                        _id: { $ne: leave._id },
                        employeeId: leave.employeeId,
                        type: leave.type,
                        status: "APPROVED",
                        startDate: { $lte: yEnd },
                        endDate: { $gte: yStart },
                    }).session(session).lean();

                    let usedInYear = 0;
                    for (const existingLeave of approvedLeavesInYear) {
                        const daysByYear = splitDaysByYear(existingLeave.startDate, existingLeave.endDate, yHolidays);
                        usedInYear += daysByYear[y] || 0;
                    }
                    const remaining = (LEAVE_QUOTAS[leave.type] || 0) - usedInYear;
                    const needed = leaveDaysByYear[y];
                    if (needed > remaining) {
                        transactionResult = {
                            httpStatus: 400,
                            error: `Cannot approve: requires ${needed} days in ${y}, but employee only has ${remaining} remaining for ${leave.type}`,
                        };
                        return;
                    }
                }
            }

            const updateOps = { $set: { status } };
            if (status === "REJECTED") updateOps.$set.rejectReason = rejectReason;
            else updateOps.$unset = { rejectReason: "" };

            const updated = await LeaveApplication.findOneAndUpdate(
                { _id: id, status: "PENDING" },
                updateOps,
                { returnDocument: "after", session }
            );
            transactionResult = updated
                ? { updatedLeave: updated }
                : { httpStatus: 409, error: "Leave was already processed" };
        });

        if (transactionResult?.httpStatus) {
            return res.status(transactionResult.httpStatus).json({ error: transactionResult.error });
        }
        const updatedLeave = transactionResult?.updatedLeave;
        if (!updatedLeave) {
            return res.status(500).json({ error: "Failed to update leave status" });
        }

        // Send email notification for approved/rejected leaves (awaited inside try/catch)
        if (["APPROVED", "REJECTED"].includes(status)) {
            try {
                const employee = await Employee.findById(updatedLeave.employeeId);
                if (employee && employee.email) {
                    await sendLeaveStatusEmail(
                        employee.email,
                        employee.firstName,
                        status,
                        updatedLeave.type,
                        updatedLeave.startDate,
                        updatedLeave.endDate,
                        updatedLeave.reason,
                        updatedLeave.rejectReason
                    );
                }
            } catch (err) {
                console.error("Failed to send leave status email:", err);
            }
        }

        return res.json({ success: true, data: updatedLeave });
    } catch (error) {
        console.error("updateLeaveStatus error:", error);
        return res.status(500).json({ error: "Failed to update leave status" });
    } finally {
        if (session) await session.endSession();
    }
};

// Cancel an employee's own pending request before its start date.
// DELETE /api/leave/:id
export const cancelLeaveRequest = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }
        const employee = await Employee.findOne({ userId: req.session.userId });
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const deleted = await LeaveApplication.findOneAndDelete({
            _id: req.params.id,
            employeeId: employee._id,
            status: "PENDING",
            startDate: { $gt: istDayStart() },
        });
        if (deleted) return res.json({ success: true });

        const request = await LeaveApplication.findOne({ _id: req.params.id, employeeId: employee._id });
        if (!request) return res.status(404).json({ error: "Leave request not found" });
        return res.status(409).json({ error: "Only pending requests starting in the future can be cancelled" });
    } catch (error) {
        console.error("cancelLeaveRequest error:", error);
        return res.status(500).json({ error: "Failed to cancel leave request" });
    }
};
