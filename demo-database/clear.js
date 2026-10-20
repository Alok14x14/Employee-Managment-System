/**
 * Demo Database Cleaner for FullStack-EMS (StaffFlow)
 * Safely removes demo data from MongoDB collections without affecting custom data.
 * 
 * Usage:
 *   node demo-database/clear.js
 */

import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverPkgPath = path.resolve(__dirname, "../server/package.json");
const serverRequire = createRequire(serverPkgPath);

const dotenv = serverRequire("dotenv");
const mongoose = serverRequire("mongoose");

const envPath = path.resolve(__dirname, "../server/.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI is not defined.");
  process.exit(1);
}

const loadJson = (filename) => {
  const filePath = path.join(__dirname, "data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

async function clear() {
  console.log("🧹 Connecting to MongoDB to remove demo records...");
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    const usersData = loadJson("users.json");
    const employeesData = loadJson("employees.json");
    const holidaysData = loadJson("holidays.json");
    const announcementsData = loadJson("announcements.json");
    const employeeDocsData = loadJson("employeeDocuments.json");
    const attendanceCorrectionsData = loadJson("attendanceCorrections.json");

    const demoUserIds = usersData.map((u) => new mongoose.Types.ObjectId(u._id));
    const demoEmployeeIds = employeesData.map((e) => new mongoose.Types.ObjectId(e._id));
    const demoHolidayNames = holidaysData.map((h) => h.name);
    const demoAnnouncementIds = announcementsData.map((a) => new mongoose.Types.ObjectId(a._id));
    const demoDocumentIds = employeeDocsData.map((d) => new mongoose.Types.ObjectId(d._id));
    const demoCorrectionIds = attendanceCorrectionsData.map((c) => new mongoose.Types.ObjectId(c._id));

    const [uRes, eRes, aRes, lRes, pRes, hRes, annRes, docRes, corrRes] = await Promise.all([
      db.collection("users").deleteMany({ _id: { $in: demoUserIds } }),
      db.collection("employees").deleteMany({ _id: { $in: demoEmployeeIds } }),
      db.collection("attendances").deleteMany({ employeeId: { $in: demoEmployeeIds } }),
      db.collection("leaveapplications").deleteMany({ employeeId: { $in: demoEmployeeIds } }),
      db.collection("payslips").deleteMany({ employeeId: { $in: demoEmployeeIds } }),
      db.collection("holidays").deleteMany({ name: { $in: demoHolidayNames } }),
      db.collection("announcements").deleteMany({ _id: { $in: demoAnnouncementIds } }),
      db.collection("employeedocuments").deleteMany({ _id: { $in: demoDocumentIds } }),
      db.collection("attendancecorrections").deleteMany({ _id: { $in: demoCorrectionIds } }),
    ]);

    console.log("✅ Successfully removed demo records:");
    console.log(`   - Users deleted: ${uRes.deletedCount}`);
    console.log(`   - Employees deleted: ${eRes.deletedCount}`);
    console.log(`   - Attendances deleted: ${aRes.deletedCount}`);
    console.log(`   - Leaves deleted: ${lRes.deletedCount}`);
    console.log(`   - Payslips deleted: ${pRes.deletedCount}`);
    console.log(`   - Holidays deleted: ${hRes.deletedCount}`);
    console.log(`   - Announcements deleted: ${annRes.deletedCount}`);
    console.log(`   - Documents deleted: ${docRes.deletedCount}`);
    console.log(`   - Attendance corrections deleted: ${corrRes.deletedCount}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Clear operation failed:", error);
    process.exit(1);
  }
}

clear();
