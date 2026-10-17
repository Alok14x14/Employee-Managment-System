import "dotenv/config";
import dns from "dns";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const lowercaseEmails = async () => {
    try {
        console.log("Connecting to database...");
        await connectDB();

        console.log("Normalizing User emails...");
        const users = await User.find({});
        let usersUpdated = 0;
        for (const user of users) {
            if (user.email) {
                const normalized = user.email.trim().toLowerCase();
                if (user.email !== normalized) {
                    await User.updateOne({ _id: user._id }, { $set: { email: normalized } });
                    usersUpdated++;
                }
            }
        }
        console.log(`Updated ${usersUpdated} of ${users.length} user emails.`);

        console.log("Normalizing Employee emails...");
        const employees = await Employee.find({});
        let employeesUpdated = 0;
        for (const emp of employees) {
            if (emp.email) {
                const normalized = emp.email.trim().toLowerCase();
                if (emp.email !== normalized) {
                    await Employee.updateOne({ _id: emp._id }, { $set: { email: normalized } });
                    employeesUpdated++;
                }
            }
        }
        console.log(`Updated ${employeesUpdated} of ${employees.length} employee emails.`);

        console.log("Email normalization completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Email normalization failed:", error);
        process.exit(1);
    }
};

lowercaseEmails();
