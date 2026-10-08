import Employee from "../models/Employee.js";
import Payslip from "../models/Payslip.js";
import { isValidObjectId } from "../utils/validate.js";

// Create payslip
// POST /api/payslips
export const createPayslip = async (req, res) => {
    try {
        const { employeeId, month, year, basicSalary, allowances, deductions } = req.body;

        if (!isValidObjectId(employeeId)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee || employee.isDeleted) {
            return res.status(400).json({ error: "Employee not found or is archived" });
        }

        const m = Number(month);
        const y = Number(year);
        if (!Number.isInteger(m) || m < 1 || m > 12) {
            return res.status(400).json({ error: "Month must be between 1 and 12" });
        }
        if (!Number.isInteger(y) || y < 2000 || y > 2100) {
            return res.status(400).json({ error: "Year must be between 2000 and 2100" });
        }

        if (basicSalary === undefined || basicSalary === null || basicSalary === "" || isNaN(Number(basicSalary)) || Number(basicSalary) < 0) {
            return res.status(400).json({ error: "Basic salary must be a number >= 0" });
        }

        const allowNum = allowances !== undefined && allowances !== null && allowances !== "" ? Number(allowances) : 0;
        const deductNum = deductions !== undefined && deductions !== null && deductions !== "" ? Number(deductions) : 0;
        if (isNaN(allowNum) || allowNum < 0 || isNaN(deductNum) || deductNum < 0) {
            return res.status(400).json({ error: "Allowances and deductions must be numeric amounts >= 0" });
        }

        const round2 = (x) => Math.round(Number(x || 0) * 100) / 100;
        const basic = round2(basicSalary);
        const allow = round2(allowNum);
        const deduct = round2(deductNum);
        const netSalary = round2(basic + allow - deduct);

        const payslip = await Payslip.create({
            employeeId,
            month: m,
            year: y,
            basicSalary: basic,
            allowances: allow,
            deductions: deduct,
            netSalary,
        });

        return res.json({ success: true, data: payslip });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "Payslip already exists for this month" });
        }
        return res.status(500).json({ error: "Failed" });
    }
};

// Get payslips
// GET /api/payslips
export const getPayslips = async (req, res) => {
    try {
        const session = req.session;
        const isAdmin = session.role === "ADMIN";
        if(isAdmin){
            const payslips = await Payslip.find().populate("employeeId").sort({ createdAt: -1 });
            const data = payslips.map((p)=>{
                const obj = p.toObject();
                return {
                    ...obj,
                    id: obj._id.toString(),
                    employee: obj.employeeId,
                    employeeId: obj.employeeId?._id?.toString(),
                }
            })
            return res.json({ data });
        } else {
            const employee = await Employee.findOne({userId: session.userId})
            if (!employee) return res.status(404).json({ error: "Not found" });
            const payslips = await Payslip.find({employeeId: employee._id}).sort({  createdAt: -1 });
            return res.json({data: payslips})
        }
    } catch (error) {
        return res.status(500).json({ error: "Failed" });
    }
}

// Get payslip by ID
// GET /api/payslips/:id
export const getPayslipById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }
        const payslip = await Payslip.findById(id).populate("employeeId").lean();

        if (!payslip) return res.status(404).json({ error: "Not found" });

        const session = req.session;
        if (session.role !== "ADMIN") {
            const employee = await Employee.findOne({ userId: session.userId });
            if (!employee) {
                return res.status(403).json({ error: "Unauthorized access" });
            }
            const payslipEmpId = (payslip.employeeId?._id || payslip.employeeId)?.toString();
            if (payslipEmpId !== employee._id.toString()) {
                return res.status(403).json({ error: "Forbidden: You cannot view this payslip" });
            }
        }

        const result = {
            ...payslip,
            id: payslip._id.toString(),
            employee: payslip.employeeId,
        };
        return res.json(result);
    } catch (error) {
        console.error("getPayslipById error:", error);
        return res.status(500).json({ error: error.message || "Failed" });
    }
};