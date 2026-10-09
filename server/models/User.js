import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true },
    password: {type: String, required: true },
    role: {type: String, enum: ["ADMIN", "EMPLOYEE"], default: "EMPLOYEE"},
    bio: {type: String, default: "" },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    mustChangePassword: { type: Boolean, default: false },
}, {timestamps: true})

const User = mongoose.models.User || mongoose.model("User", userSchema)

export default User;