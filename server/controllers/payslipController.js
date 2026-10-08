import Employee from "../models/Employee.js";
import Payslip from "../models/Payslip.js";

// Create payslip
// POST /api/payslips
export const createPayslip = async (req, res) => {
    try {
        const { employeeId, month, year, basicSalary, allowances, deductions } = req.body;

        if(!employeeId || !month || !year || !basicSalary){
            return res.status(400).json({ error: "Missing fields" });
        }

        const round2 = (x) => Math.round(Number(x || 0) * 100) / 100;
        const basic = round2(basicSalary);
        const allow = round2(allowances);
        const deduct = round2(deductions);
        const netSalary = round2(basic + allow - deduct);

        const payslip = await Payslip.create({
            employeeId,
            month: Number(month),
            year: Number(year),
            basicSalary: basic,
            allowances: allow,
            deductions: deduct,
            netSalary,
        })

        return res.json({success: true, data: payslip})
    } catch (error) {
        return res.status(500).json({ error: "Failed" });
    }
}

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
        if (!id || id === 'undefined') {
            return res.status(400).json({ error: "Invalid payslip ID" });
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