import Employee from "../models/Employee.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { sendWelcomeEmail } from "../utils/emailService.js";
import Attendance from "../models/Attendance.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Payslip from "../models/Payslip.js";
import EmployeeDocument from "../models/EmployeeDocument.js";
import { istDayStart, istDayEnd } from "../utils/time.js";
import { isValidObjectId, parseDate } from "../utils/validate.js";

const round2 = (x) => Math.round(Number(x || 0) * 100) / 100;

// Get employees
// GET /api/employees
export const getEmployees = async (req, res)=>{
    try {
        const { department, status, search } = req.query;
        const paginated = req.query.page !== undefined || req.query.limit !== undefined;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
        const where = {};
        if (status === 'deleted') {
            where.isDeleted = true;
        } else {
            where.isDeleted = { $ne: true };
        }
        
        if(department) where.department = department;
        if (search?.trim()) {
            const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const expression = new RegExp(escapedSearch, "i");
            where.$or = [
                { firstName: expression },
                { lastName: expression },
                { position: expression },
                { email: expression },
            ];
        }

        const total = paginated ? await Employee.countDocuments(where) : null;
        let employeesQuery = Employee.find(where).sort({createdAt: -1});
        if (paginated) employeesQuery = employeesQuery.skip((page - 1) * limit).limit(limit);
        const employees = await employeesQuery.populate("userId", "email role").lean();

        // Get today's attendances
        const startOfDay = istDayStart();
        const endOfDay = istDayEnd();
        const todayAttendances = await Attendance.find({
            employeeId: { $in: employees.map((employee) => employee._id) },
            date: { $gte: startOfDay, $lt: endOfDay },
            status: { $ne: "ABSENT" }
        }).lean();

        const attendanceMap = todayAttendances.reduce((acc, curr) => {
            acc[curr.employeeId.toString()] = curr;
            return acc;
        }, {});

        const result = employees.map((emp)=>({
            ...emp,
            id: emp._id.toString(),
            user: emp.userId ? {email: emp.userId.email, role: emp.userId.role} : null,
            isPresentToday: !!attendanceMap[emp._id.toString()]
        }))
        return res.json(paginated ? { data: result, total, page, limit, totalPages: Math.ceil(total / limit) } : result)
    } catch (error) {
        
        return res.status(500).json({error: "Failed to fetch employees"})
    }
}

// GET /api/employees/:id/details - admin employee profile and recent records
export const getEmployeeDetails = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid employee ID" });
        const employee = await Employee.findById(id).populate("userId", "email role").lean();
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const filter = { employeeId: employee._id };
        const [attendance, leaves, payslips, documents, counts] = await Promise.all([
            Attendance.find(filter).sort({ date: -1 }).limit(10).lean(),
            LeaveApplication.find(filter).sort({ createdAt: -1 }).limit(10).lean(),
            Payslip.find(filter).sort({ year: -1, month: -1 }).limit(10).lean(),
            EmployeeDocument.find({ $or: [{ employeeId: employee._id }, { audience: "ALL" }] })
                .select("category title fileName fileSize audience createdAt").sort({ createdAt: -1 }).limit(50).lean(),
            Promise.all([
                Attendance.countDocuments(filter), LeaveApplication.countDocuments(filter),
                Payslip.countDocuments(filter),
            ]),
        ]);

        return res.json({ data: {
            employee: { ...employee, id: employee._id.toString(), user: employee.userId ? { email: employee.userId.email, role: employee.userId.role } : null },
            attendance: attendance.map((item) => ({ ...item, id: item._id.toString() })),
            leaves: leaves.map((item) => ({ ...item, id: item._id.toString() })),
            payslips: payslips.map((item) => ({ ...item, id: item._id.toString() })),
            documents: documents.map((item) => ({ ...item, id: item._id.toString() })),
            counts: { attendance: counts[0], leaves: counts[1], payslips: counts[2] },
        } });
    } catch (error) {
        console.error("getEmployeeDetails error:", error);
        return res.status(500).json({ error: "Failed to fetch employee details" });
    }
}

// GET /api/employees/directory - employee-safe colleague directory
export const getEmployeeDirectory = async (req, res) => {
    try {
        const employeeUsers = await User.find({ role: "EMPLOYEE" }).select("_id").lean();
        const employeeUserIds = employeeUsers.map((user) => user._id);
        const where = {
            userId: { $in: employeeUserIds },
            isDeleted: { $ne: true },
            employmentStatus: "ACTIVE",
        };
        if (req.query.department) where.department = req.query.department;
        if (req.query.position) where.position = req.query.position;
        const positionOptions = await Employee.distinct("position", {
            userId: { $in: employeeUserIds }, isDeleted: { $ne: true }, employmentStatus: "ACTIVE",
            ...(req.query.department ? { department: req.query.department } : {}),
        });
        if (req.query.search?.trim()) {
            const escapedSearch = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const expression = new RegExp(escapedSearch, "i");
            where.$or = [{ firstName: expression }, { lastName: expression }, { email: expression }];
        }
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const total = await Employee.countDocuments(where);
        const employees = await Employee.find(where)
            .select("firstName lastName email department position")
            .sort({ firstName: 1, lastName: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return res.json({ data: employees.map((employee) => ({
            id: employee._id.toString(),
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            department: employee.department || "Unassigned",
            position: employee.position || "Team member",
        })), total, page, limit, totalPages: Math.ceil(total / limit), positions: positionOptions.filter(Boolean).sort((a, b) => a.localeCompare(b)) });
    } catch (error) {
        console.error("getEmployeeDirectory error:", error);
        return res.status(500).json({ error: "Failed to fetch employee directory" });
    }
}

// Create employee
// POST /api/employees
export const createEmployee = async (req, res)=>{
    try {
        const {firstName, lastName, email, phone, position, department, basicSalary, allowances, deductions, joinDate, password, role, bio} = req.body;

        if (role && role !== "EMPLOYEE") {
            return res.status(403).json({ error: "Administrators can only create employee accounts" });
        }

        if(!email || !password || !firstName || !lastName || typeof email !== "string" || typeof password !== "string"){
            return res.status(400).json({ error: "Missing required fields" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        const parsedJoin = parseDate(joinDate);
        if(!parsedJoin){
            return res.status(400).json({ error: "Valid join date is required" });
        }

        const hashed = await bcrypt.hash(password, 10)
        const user = await User.create({
            email: normalizedEmail,
            password: hashed,
            role: "EMPLOYEE",
            mustChangePassword: true,
            tokenVersion: 0,
        })

        let employee;
        try {
            employee = await Employee.create({
                userId: user._id,
                firstName,
                lastName,
                email: normalizedEmail,
                phone,
                position,
                department: department || "Engineering",
                basicSalary: round2(basicSalary),
                allowances: round2(allowances),
                deductions: round2(deductions),
                joinDate: parsedJoin,
                bio: bio || "",
            })
        } catch (employeeError) {
            await User.findByIdAndDelete(user._id);
            throw employeeError;
        }

        // Send welcome email
        try {
            await sendWelcomeEmail(normalizedEmail, firstName, parsedJoin);
        } catch (err) {
            console.error("Failed to send welcome email:", err);
        }

        return res.status(201).json({success: true, employee})
    } catch (error) {
        if(error.code === 11000){
            return res.status(400).json({ error: "Email already exists" })
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        console.error("Create employee error:", error)
        return res.status(500).json({ error: "Failed to create employee" });
    }
}


// Update employee
// PUT /api/employees/:id
export const updateEmployee = async (req, res)=>{
    try {
        const {id} = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const employee = await Employee.findById(id);
        if(!employee) return res.status(404).json({error: "Employee not found"});

        if(employee.isDeleted){
            return res.status(400).json({ error: "Employee is archived" });
        }

        const {firstName, lastName, email, phone, position, department, basicSalary, allowances, deductions, password, role, bio, employmentStatus, joinDate} = req.body;

        let normalizedEmail;
        if (email !== undefined) {
            if (typeof email !== "string" || !email.trim()) {
                return res.status(400).json({ error: "Valid email is required" });
            }
            normalizedEmail = email.trim().toLowerCase();
        }

        if (password !== undefined) {
            if (typeof password !== "string" || password.length < 8) {
                return res.status(400).json({ error: "Password must be at least 8 characters" });
            }
            if (employee.userId.toString() === req.session.userId) {
                return res.status(400).json({ error: "An employee password change cannot target the signed-in administrator account" });
            }
            const targetUser = await User.findById(employee.userId).select("role").lean();
            if (!targetUser || targetUser.role !== "EMPLOYEE") {
                return res.status(400).json({ error: "Only employee accounts can be changed from the employee profile" });
            }
        }

        // Build and validate both updates before writing either record.
        const employeeUpdate = {};
        if (firstName !== undefined) employeeUpdate.firstName = firstName;
        if (lastName !== undefined) employeeUpdate.lastName = lastName;
        if (normalizedEmail !== undefined) employeeUpdate.email = normalizedEmail;
        if (phone !== undefined) employeeUpdate.phone = phone;
        if (position !== undefined) employeeUpdate.position = position;
        if (department !== undefined) employeeUpdate.department = department;
        if (employmentStatus !== undefined) employeeUpdate.employmentStatus = employmentStatus;
        if (bio !== undefined) employeeUpdate.bio = bio;

        if (basicSalary !== undefined) employeeUpdate.basicSalary = round2(basicSalary);
        if (allowances !== undefined) employeeUpdate.allowances = round2(allowances);
        if (deductions !== undefined) employeeUpdate.deductions = round2(deductions);

        if (joinDate !== undefined) {
            const parsedJoinDate = parseDate(joinDate);
            if (!parsedJoinDate) {
                return res.status(400).json({ error: "Valid join date is required" });
            }
            employeeUpdate.joinDate = parsedJoinDate;
        }

        const userSetFields = {};
        if (normalizedEmail !== undefined) userSetFields.email = normalizedEmail;
        if (role !== undefined) userSetFields.role = role;
        if (password !== undefined) {
            userSetFields.password = await bcrypt.hash(password, 10);
            userSetFields.mustChangePassword = true;
            userSetFields.passwordChangedAt = new Date();
        }

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                if (Object.keys(userSetFields).length > 0) {
                    const userUpdate = { $set: userSetFields };
                    if (password !== undefined) userUpdate.$inc = { tokenVersion: 1 };
                    await User.findByIdAndUpdate(employee.userId, userUpdate, {
                        runValidators: true,
                        session,
                    });
                }

                if (Object.keys(employeeUpdate).length > 0) {
                    await Employee.findByIdAndUpdate(id, employeeUpdate, {
                        runValidators: true,
                        session,
                    });
                }
            });
        } finally {
            await session.endSession();
        }

        return res.json({success: true})
    } catch (error) {
        if(error.code === 11000){
            return res.status(400).json({ error: "Email already exists" })
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to update employee" });
    }
}

// Delete employee
// DELETE /api/employees/:id
export const deleteEmployee = async (req, res)=>{
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const employee = await Employee.findById(id)
        if(!employee) return res.status(404).json({ error: "Employee not found" });

        employee.isDeleted = true;
        employee.employmentStatus = "INACTIVE"
        await employee.save()
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to delete employee" });
    }
}
