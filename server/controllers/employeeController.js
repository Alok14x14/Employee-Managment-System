import Employee from "../models/Employee.js";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { sendWelcomeEmail } from "../utils/emailService.js";
import Attendance from "../models/Attendance.js";
import { istDayStart, istDayEnd } from "../utils/time.js";

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
            date: { $gte: startOfDay, $lt: endOfDay }
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

        if(!joinDate || isNaN(new Date(joinDate).getTime())){
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
                joinDate: new Date(joinDate),
                bio: bio || "",
            })
        } catch (employeeError) {
            await User.findByIdAndDelete(user._id);
            throw employeeError;
        }

        // Send welcome email
        sendWelcomeEmail(email, firstName, joinDate)
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
        const {firstName, lastName, email, phone, position, department, basicSalary, allowances, deductions, password, role, bio, employmentStatus} = req.body;

        const employee = await Employee.findById(id);
        if(!employee) return res.status(404).json({error: "Employee not found"})

       
        await Employee.findByIdAndUpdate(id, {
            firstName,
            lastName,
            email,
            phone,
            position,
            department: department || "Engineering",
            basicSalary: round2(basicSalary),
            allowances: round2(allowances),
            deductions: round2(deductions),
            employmentStatus: employmentStatus || "ACTIVE",
            bio: bio || "",
        })

         // Update user record
         const userUpdate = {email}
         if(role) userUpdate.role = role;
         if(password) userUpdate.password = await bcrypt.hash(password, 10);
         await User.findByIdAndUpdate(employee.userId, userUpdate)

        return res.json({success: true})
    } catch (error) {
        if(error.code === 11000){
            return res.status(400).json({ error: "Email already exists" })
        }
        return res.status(500).json({ error: "Failed to update employee" });
    }
}

// Delete employee
// DELETE /api/employees/:id
export const deleteEmployee = async (req, res)=>{
    try {
        const { id } = req.params;

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