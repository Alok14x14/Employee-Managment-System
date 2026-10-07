import { inngest } from "../inngest/index.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import { sendLeaveStatusEmail } from "../utils/emailService.js";

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

        const today = new Date();
        today.setHours(0,0,0,0);
        if(new Date(startDate) < today || new Date(endDate) < today){
            return res.status(400).json({ error: "Leave dates must be in the future" });
        }

        if(new Date(endDate) < new Date(startDate) ){
            return res.status(400).json({ error: "End date cannot be before start date" });
        }


        const leave = await LeaveApplication.create({
            employeeId: employee._id,
            type,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            status: "PENDING",
        })

        await inngest.send({
            name: "leave/pending",
            data: {leaveApplicationId: leave._id,}
        })

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
        const { status, rejectReason } = req.body;
        if(!["APPROVED", "REJECTED", "PENDING"].includes(status)){
            return res.status(400).json({ error: "Invalid status" });
        }
        if (status === "REJECTED" && !rejectReason) {
            return res.status(400).json({ error: "Rejection reason is required" });
        }
        
        const updateData = { status };
        if (status === "REJECTED") updateData.rejectReason = rejectReason;

        const leave = await LeaveApplication.findByIdAndUpdate(req.params.id, updateData, {returnDocument: "after"})
        
        // Send email notification for approved/rejected leaves
        if (leave && ["APPROVED", "REJECTED"].includes(status)) {
            const employee = await Employee.findById(leave.employeeId);
            if (employee && employee.email) {
                sendLeaveStatusEmail(
                    employee.email, 
                    employee.firstName, 
                    status, 
                    leave.type, 
                    leave.startDate, 
                    leave.endDate, 
                    leave.reason,
                    leave.rejectReason
                ).catch(err => console.error("Failed to send leave status email:", err));
            }
        }

        return res.json({success: true, data: leave})
    } catch (error) {
        return res.status(500).json({ error: "Failed" });
    }
}