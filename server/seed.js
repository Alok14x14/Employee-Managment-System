import "dotenv/config";
import dns from "dns";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import bcrypt from 'bcrypt'

dns.setServers(['8.8.8.8', '1.1.1.1']);

const TemporaryPassword = "admin123";

async function registerAdmin(){
    try {
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

        if(!ADMIN_EMAIL){
            console.error('Missing ADMIN_EMAIL env variable')
            process.exit(1);
        }

        await connectDB()

        const existingAdmin = await User.findOne({email: process.env.ADMIN_EMAIL});

        if(existingAdmin){
            console.log("User already exists as role", existingAdmin.role);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(TemporaryPassword, 10)

        const admin = await User.create({
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            role: "ADMIN",
        })

        console.log("Admin user created");
        console.log("\nemail:", admin.email);
        console.log("password:", TemporaryPassword);
        console.log("\nchange the password after login.");

        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error);
    }
}

registerAdmin();