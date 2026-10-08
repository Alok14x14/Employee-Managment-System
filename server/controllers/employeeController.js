import Employee from "../models/Employee.js";
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

        if(!email || !password || !firstName || !lastName){
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        const parsedJoin = parseDate(joinDate);
        if(!parsedJoin){
            return res.status(400).json({ error: "Valid join date is required" });
        }

        const hashed = await bcrypt.hash(password, 10)
        const user = await User.create({
            email,
            password: hashed,
            role: role || "EMPLOYEE"
        })

        let employee;
        try {
            employee = await Employee.create({
                userId: user._id,
                firstName,
                lastName,
                email,
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
        sendWelcomeEmail(email, firstName, parsedJoin)
            .catch(err => console.error("Failed to send welcome email:", err));

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

        if (password !== undefined) {
            if (typeof password !== "string" || password.length < 8) {
                return res.status(400).json({ error: "Password must be at least 8 characters" });
            }
        }

        // Update user record FIRST
        const userUpdate = {};
        if (email !== undefined) userUpdate.email = email;
        if (role !== undefined) userUpdate.role = role;
        if (password !== undefined) {
            userUpdate.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(userUpdate).length > 0) {
            try {
                await User.findByIdAndUpdate(employee.userId, userUpdate, { runValidators: true });
            } catch (userError) {
                if (userError.code === 11000) {
                    return res.status(400).json({ error: "Email already exists" });
                }
                throw userError;
            }
        }

        // Build employee update object from only present fields (not undefined)
        const employeeUpdate = {};
        if (firstName !== undefined) employeeUpdate.firstName = firstName;
        if (lastName !== undefined) employeeUpdate.lastName = lastName;
        if (email !== undefined) employeeUpdate.email = email;
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

        if (Object.keys(employeeUpdate).length > 0) {
            await Employee.findByIdAndUpdate(id, employeeUpdate, { runValidators: true });
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