import Employee from "../models/Employee.js";
import User from "../models/User.js";

// Get profile
// GET /api/profile
export const getProfile = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId })
            .populate("userId", "email role createdAt")
            .lean();

        if (!employee) {
            // Authenticated user is not an employee - return admin profile
            const user = await User.findById(session.userId).select("-password").lean();
            return res.json({
                _id: user?._id?.toString() || session.userId,
                id: user?._id?.toString() || session.userId,
                userId: session.userId,
                firstName: "Admin",
                lastName: "",
                email: user?.email || session.email,
                role: user?.role || session.role || "ADMIN",
                position: "System Administrator",
                department: "Executive Administration",
                employmentStatus: "ACTIVE",
                joinDate: user?.createdAt,
                createdAt: user?.createdAt,
                phone: "N/A (System Account)",
                bio: user?.bio || "",
                isDeleted: false,
                isAdmin: true
            });
        }

        const role = employee.userId?.role || session.role || "EMPLOYEE";
        return res.json({
            ...employee,
            id: employee._id.toString(),
            role,
            isAdmin: role === "ADMIN"
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch profile" });
    }
};

// Update profile
// POST /api/profile
export const updateProfile = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId });

        if (!employee) {
            // Allow admin user without employee record to update their bio
            if (session.role === "ADMIN") {
                await User.findByIdAndUpdate(session.userId, {
                    bio: req.body.bio ?? ""
                });
                return res.json({ success: true });
            }
            return res.status(404).json({ error: "Employee not found" });
        }

        if (employee.isDeleted) {
            return res.status(403).json({ error: "Your account is deactivated. You cannot update your profile." });
        }

        await Employee.findByIdAndUpdate(employee._id, {
            bio: req.body.bio ?? ""
        });
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to update profile" });
    }
};