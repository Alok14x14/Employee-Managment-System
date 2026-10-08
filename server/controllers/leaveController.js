import { inngest } from "../inngest/index.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import { sendLeaveStatusEmail } from "../utils/emailService.js";
import { istDayStart } from "../utils/time.js";
import { isValidObjectId, parseDate } from "../utils/validate.js";

// Create leave
// POST /api/leaves
export const createLeave = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({userId: session.userId})
        if(!employee) return res.status(404).json({ error: "Employee not found" });
        if(employee.isDeleted){
            return res.status(403).json({
                 error: "Your account is deactivated. You cannot apply for leave.",
            })
        }

        const { type, startDate, endDate, reason } = req.body;

        if(!type || !startDate || !endDate || !reason){
            return res.status(400).json({ error: "Missing fields" });
        }

        if (!["SICK", "CASUAL", "ANNUAL"].includes(type)) {
            return res.status(400).json({ error: "Invalid leave type" });
        }

        const parsedStart = parseDate(startDate);
        const parsedEnd = parseDate(endDate);
        if (!parsedStart || !parsedEnd) {
            return res.status(400).json({ error: "Valid start and end dates are required" });
        }

        const today = istDayStart();
        if(parsedStart < today || parsedEnd < today){
            return res.status(400).json({ error: "Leave dates must be in the future" });
        }

        if(parsedEnd < parsedStart){
            return res.status(400).json({ error: "End date cannot be before start date" });
        }

        const trimmedReason = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
        if (!trimmedReason) {
            return res.status(400).json({ error: "Reason is required" });
        }

        const leave = await LeaveApplication.create({
            employeeId: employee._id,
            type,
            startDate: parsedStart,
            endDate: parsedEnd,
            reason: trimmedReason,
            status: "PENDING",
        })

        try {
            await inngest.send({
                name: "leave/pending",
                data: {leaveApplicationId: leave._id,}
            })
        } catch (e) {
            console.error("inngest send failed", e);
        }

        return res.json({ success: true, data: leave });
        
    } catch (error) {
        return res.status(500).json({ error: "Failed" });
    }
}

// Get leaves
// GET /api/leaves
export const getLeaves = async (req, res) => {
    try {
        const session = req.session;
        const isAdmin = session.role === "ADMIN";
        if(isAdmin){
            const status = req.query.status;
            const where = status ? {status} : {};
            const leaves = await LeaveApplication.find(where).populate("employeeId").sort({ createdAt: -1 });
            const data = leaves.map((l)=>{
                const obj = l.toObject();
                return {
                    ...obj,
                    id: obj._id.toString(),
                    employee: obj.employeeId,
                    employeeId: obj.employeeId?._id?.toString(),
                }
            })
            return res.json({data})
        } else{
            const employee = await Employee.findOne({
                userId: session.userId,
            }).lean();
            if(!employee) return res.status(404).json({ error: "Not found" });
            const leaves = await LeaveApplication.find({
                employeeId: employee._id
            }).sort({ createdAt: -1 });
            return res.json({
                data: leaves,
                employee: {...employee, id: employee._id.toString()}
            })
        }
    } catch (error) {
      return res.status(500).json({ error: "Failed" });  
    }
}

// Update leave status
// PATCH /api/leaves/:id
export const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const leave = await LeaveApplication.findById(id);
        if (!leave) {
            return res.status(404).json({ error: "Leave not found" });
        }

        const { status, rejectReason } = req.body;
        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        if (leave.status !== "PENDING") {
            return res.status(400).json({ error: "Leave status can only be updated from PENDING" });
        }

        if (status === "REJECTED" && !rejectReason) {
            return res.status(400).json({ error: "Rejection reason is required" });
        }

        const updateOps = {
            $set: { status }
        };
        if (status === "REJECTED") {
            updateOps.$set.rejectReason = rejectReason;
        } else {
            updateOps.$unset = { rejectReason: "" };
        }

        const updatedLeave = await LeaveApplication.findByIdAndUpdate(id, updateOps, { returnDocument: "after" });
        
        // Send email notification for approved/rejected leaves
        if (updatedLeave && ["APPROVED", "REJECTED"].includes(status)) {
            const employee = await Employee.findById(updatedLeave.employeeId);
            if (employee && employee.email) {
                sendLeaveStatusEmail(
                    employee.email, 
                    employee.firstName, 
                    status, 
                    updatedLeave.type, 
                    updatedLeave.startDate, 
                    updatedLeave.endDate, 
                    updatedLeave.reason,
                    updatedLeave.rejectReason
                ).catch(err => console.error("Failed to send leave status email:", err));
            }
        }

        return res.json({ success: true, data: updatedLeave });
    } catch (error) {
        return res.status(500).json({ error: "Failed" });
    }
}