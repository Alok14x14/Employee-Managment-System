import Employee from "../models/Employee.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { sendWelcomeEmail } from "../utils/emailService.js";
import Attendance from "../models/Attendance.js";
import { istDayStart, istDayEnd } from "../utils/time.js";
import { isValidObjectId, parseDate } from "../utils/validate.js";

const round2 = (x) => Math.round(Number(x || 0) * 100) / 100;

// Get employees
// GET /api/employees
export const getEmployees = async (req, res)=>{
    try {
        const { department, status } = req.query;
        const where = {};
        if (status === 'deleted') {
            where.isDeleted = true;
        } else {
            where.isDeleted = { $ne: true };
        }
        
        if(department) where.department = department;

        const employees = await Employee.find(where).sort({createdAt: -1}).populate("userId", "email role").lean();

        // Get today's attendances
        const startOfDay = istDayStart();
        const endOfDay = istDayEnd();
        const todayAttendances = await Attendance.find({
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
        return res.json(result)
    } catch (error) {
        
        return res.status(500).json({error: "Failed to fetch employees"})
    }
}

// Create employee
// POST /api/employees
export const createEmployee = async (req, res)=>{
    try {
        const {firstName, lastName, email, phone, position, department, basicSalary, allowances, deductions, joinDate, password, role, bio} = req.body;

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
            role: role || "EMPLOYEE",
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
