import crypto from "crypto";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../utils/emailService.js";

// Login for employee and admin
// POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password, role_type } = req.body;

        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        if (role_type === "admin" && user.role !== "ADMIN") {
            return res.status(401).json({ error: "Not authorized as admin" });
        }

        if (role_type === "employee" && user.role !== "EMPLOYEE") {
            return res.status(401).json({ error: "Not authorized as employee" });
        }

        const emp = await Employee.findOne({ userId: user._id }).select("isDeleted employmentStatus").lean();
        if (emp?.isDeleted || (user.role === "EMPLOYEE" && (!emp || emp.employmentStatus !== "ACTIVE"))) {
            return res.status(403).json({ error: "Account deactivated", code: "ACCOUNT_DEACTIVATED" });
        }

        const payload = {
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
            mustChangePassword: user.mustChangePassword ?? false,
            tokenVersion: user.tokenVersion ?? 0,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

        return res.json({ user: payload, token });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Login failed" });
    }
};

// Get session for employee and admin
// GET /api/auth/session
export const session = (req, res) => {
    const session = req.session;
    return res.json({ user: session });
};

// Forgot password
// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== "string") {
            return res.status(400).json({ error: "Email is required" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            return res.status(400).json({ error: "Email is required" });
        }

        // Return immediately with the same 200 message to prevent user enumeration
        const genericResponse = { message: "If an account exists, a reset link has been sent" };

        const user = await User.findOne({ email: normalizedEmail });
        if (user) {
            let isDeleted = false;
            let firstName = "there";

            if (user.role === "EMPLOYEE") {
                const emp = await Employee.findOne({ userId: user._id }).select("firstName isDeleted").lean();
                if (emp?.isDeleted) {
                    isDeleted = true;
                }
                if (emp?.firstName) {
                    firstName = emp.firstName;
                }
            }

            if (!isDeleted) {
                const rawToken = crypto.randomBytes(32).toString("hex");
                const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
                const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

                user.passwordResetToken = hashedToken;
                user.passwordResetExpires = expiry;
                await user.save();

                const clientBase = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();
                const resetUrl = `${clientBase}/reset-password/${rawToken}`;

                sendPasswordResetEmail(user.email, firstName, resetUrl).catch((err) => {
                    console.error("Failed to send password reset email:", err);
                });
            }
        }

        return res.status(200).json(genericResponse);
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ error: "Failed to process password reset request" });
    }
};

// Reset password
// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        if (!token || typeof token !== "string") {
            return res.status(400).json({ error: "Reset link is invalid or has expired" });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ error: "Reset link is invalid or has expired" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.passwordChangedAt = new Date();
        user.mustChangePassword = false;
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        return res.json({ success: true });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ error: "Failed to reset password" });
    }
};

// Change password for employee and admin
// POST /api/auth/change-password
export const changePassword = async (req, res) => {
    try {
        const session = req.session;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Both passwords are required" });
        }
        if (typeof newPassword !== "string" || newPassword.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ error: "New password cannot be the same as current password" });
        }
        const user = await User.findById(session.userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return res.status(400).json({ error: "Current password is incorrect" });

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        user.mustChangePassword = false;
        // Subtract 1 second to ensure current timestamp of new JWT token doesn't precede passwordChangedAt
        user.passwordChangedAt = new Date(Date.now() - 1000);
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        const payload = {
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
            mustChangePassword: false,
            tokenVersion: user.tokenVersion,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

        return res.json({ success: true, token, user: payload });
    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({ error: "Failed to change password" });
    }
};
