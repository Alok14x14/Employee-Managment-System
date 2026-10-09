import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        const session = jwt.verify(token, process.env.JWT_SECRET);

        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [user, emp] = await Promise.all([
            User.findById(session.userId).select("role email passwordChangedAt mustChangePassword").lean(),
            Employee.findOne({ userId: session.userId }).select("isDeleted").lean()
        ]);

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Invalidate old sessions if password changed after token was issued
        if (user.passwordChangedAt && session.iat && session.iat * 1000 < user.passwordChangedAt.getTime()) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (user.role === "EMPLOYEE" && emp?.isDeleted) {
            return res.status(403).json({ error: "Account deactivated" });
        }

        req.session = {
            ...session,
            role: user.role,
            mustChangePassword: user.mustChangePassword ?? false
        };
        next();
    } catch (error) {
        return res.status(401).json({ error: "Unauthorized" });
    }
};

export const requirePasswordChanged = (req, res, next) => {
    if (req?.session?.mustChangePassword) {
        return res.status(403).json({ error: "Password change required", code: "PASSWORD_CHANGE_REQUIRED" });
    }
    next();
};

export const protectAdmin = (req, res, next) => {
    if (req?.session?.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};