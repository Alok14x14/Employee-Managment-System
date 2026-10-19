/**
 * Demo Database Seeder for FullStack-EMS
 * 
 * Usage:
 *   node demo-database/seed.js           # Seeds data with dynamic dates relative to today (recommended for live demo)
 *   node demo-database/seed.js --static  # Seeds exact dates from data/*.json files
 *   node demo-database/seed.js --force   # Clears demo data first, then seeds
 */

import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve dependencies from server/node_modules
const serverPkgPath = path.resolve(__dirname, "../server/package.json");
const serverRequire = createRequire(serverPkgPath);

const dotenv = serverRequire("dotenv");
const mongoose = serverRequire("mongoose");

// Load server .env
const envPath = path.resolve(__dirname, "../server/.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Support CLI flags
const args = process.argv.slice(2);
const isStatic = args.includes("--static");
const isForce = args.includes("--force");
const customUri = args.find((a) => a.startsWith("mongodb://") || a.startsWith("mongodb+srv://")) ||
                  args.find((a) => a.startsWith("--uri="))?.split("=")[1];

const MONGODB_URI = customUri || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI is not defined in server/.env or CLI arguments.");
  console.error("   Provide it in server/.env or pass as argument: node demo-database/seed.js <mongodb-uri>");
  process.exit(1);
}

// Load JSON data files
const loadJson = (filename) => {
  const filePath = path.join(__dirname, "data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const usersData = loadJson("users.json");
const employeesData = loadJson("employees.json");
const holidaysData = loadJson("holidays.json");
const leaveAppsData = loadJson("leaveApplications.json");
const payslipsData = loadJson("payslips.json");
const attendanceData = loadJson("attendance.json");

// Helper to calculate IST day start
const getISTDayStart = (date = new Date()) => {
  const d = new Date(date);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value])
  );
  return new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00+05:30`);
};

async function seed() {
  console.log("🌱 Starting Demo Database Seeding for FullStack EMS...");
  console.log(`📡 Connecting to MongoDB...`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Database connected successfully.\n");

    const db = mongoose.connection.db;

    // Collections
    const usersCol = db.collection("users");
    const employeesCol = db.collection("employees");
    const holidaysCol = db.collection("holidays");
    const leavesCol = db.collection("leaveapplications");
    const payslipsCol = db.collection("payslips");
    const attendanceCol = db.collection("attendances");

    // Demo IDs list for cleanup/upsert
    const demoUserIds = usersData.map((u) => new mongoose.Types.ObjectId(u._id));
    const demoEmployeeIds = employeesData.map((e) => new mongoose.Types.ObjectId(e._id));

    if (isForce) {
      console.log("🧹 Cleaning existing demo records (--force)...");
      await usersCol.deleteMany({ _id: { $in: demoUserIds } });
      await employeesCol.deleteMany({ _id: { $in: demoEmployeeIds } });
      await leavesCol.deleteMany({ employeeId: { $in: demoEmployeeIds } });
      await payslipsCol.deleteMany({ employeeId: { $in: demoEmployeeIds } });
      await attendanceCol.deleteMany({ employeeId: { $in: demoEmployeeIds } });
      const demoHolidayNames = holidaysData.map((h) => h.name);
      await holidaysCol.deleteMany({ name: { $in: demoHolidayNames } });
      console.log("✨ Cleaned prior demo records.\n");
    }

    // 1. Seed Users
    console.log(`👤 Upserting ${usersData.length} Users...`);
    for (const u of usersData) {
      const email = u.email.toLowerCase().trim();
      const existing = await usersCol.findOne({ email });
      const doc = {
        email,
        password: u.password,
        role: u.role,
        bio: u.bio || "",
        mustChangePassword: u.mustChangePassword ?? false,
        tokenVersion: u.tokenVersion ?? 0,
        updatedAt: new Date(),
      };
      if (existing) {
        await usersCol.updateOne({ _id: existing._id }, { $set: doc });
      } else {
        doc._id = new mongoose.Types.ObjectId(u._id);
        doc.createdAt = new Date();
        await usersCol.insertOne(doc);
      }
    }
    console.log("✅ Users seeded.");

    // 2. Seed Employees
    console.log(`💼 Upserting ${employeesData.length} Employees...`);
    for (const e of employeesData) {
      const email = e.email.toLowerCase().trim();
      const existing = await employeesCol.findOne({ email });
      const doc = {
        userId: new mongoose.Types.ObjectId(e.userId),
        firstName: e.firstName,
        lastName: e.lastName,
        email,
        phone: e.phone,
        position: e.position,
        department: e.department,
        basicSalary: Number(e.basicSalary || 0),
        allowances: Number(e.allowances || 0),
        deductions: Number(e.deductions || 0),
        employmentStatus: e.employmentStatus || "ACTIVE",
        joinDate: new Date(e.joinDate),
        isDeleted: e.isDeleted ?? false,
        bio: e.bio || "",
        updatedAt: new Date(),
      };
      if (existing) {
        await employeesCol.updateOne({ _id: existing._id }, { $set: doc });
      } else {
        doc._id = new mongoose.Types.ObjectId(e._id);
        doc.createdAt = new Date(e.joinDate);
        await employeesCol.insertOne(doc);
      }
    }
    console.log("✅ Employees seeded.");

    // 3. Seed Holidays
    console.log(`🎉 Upserting ${holidaysData.length} Holidays...`);
    for (const h of holidaysData) {
      const normalizedDate = getISTDayStart(new Date(h.date));
      const existing = await holidaysCol.findOne({
        $or: [{ date: normalizedDate }, { name: h.name }],
      });
      const doc = {
        name: h.name,
        date: normalizedDate,
        createdBy: new mongoose.Types.ObjectId(h.createdBy),
        updatedAt: new Date(),
      };
      if (existing) {
        await holidaysCol.updateOne({ _id: existing._id }, { $set: doc });
      } else {
        doc._id = new mongoose.Types.ObjectId(h._id);
        doc.createdAt = new Date();
        await holidaysCol.insertOne(doc);
      }
    }
    console.log("✅ Holidays seeded.");

    // 4. Seed Leave Applications
    console.log(`📝 Upserting ${leaveAppsData.length} Leave Applications...`);
    const today = getISTDayStart();
    for (let i = 0; i < leaveAppsData.length; i++) {
      const l = leaveAppsData[i];
      let startDate = new Date(l.startDate);
      let endDate = new Date(l.endDate);

      if (!isStatic) {
        if (l.status === "PENDING") {
          startDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
          endDate = new Date(today.getTime() + (2 + (l.workingDays - 1)) * 24 * 60 * 60 * 1000);
        } else if (l.status === "APPROVED") {
          startDate = new Date(today.getTime() - (5 + i) * 24 * 60 * 60 * 1000);
          endDate = new Date(startDate.getTime() + (l.workingDays - 1) * 24 * 60 * 60 * 1000);
        }
      }

      const empId = new mongoose.Types.ObjectId(l.employeeId);
      const leaveId = new mongoose.Types.ObjectId(l._id);
      const doc = {
        employeeId: empId,
        type: l.type,
        startDate,
        endDate,
        reason: l.reason,
        status: l.status,
        rejectReason: l.rejectReason || undefined,
        autoRejected: l.autoRejected || false,
        workingDays: l.workingDays || 1,
        updatedAt: new Date(),
      };

      const existing = await leavesCol.findOne({ _id: leaveId });
      if (existing) {
        await leavesCol.updateOne({ _id: leaveId }, { $set: doc });
      } else {
        doc._id = leaveId;
        doc.createdAt = new Date(startDate.getTime() - 2 * 24 * 60 * 60 * 1000);
        await leavesCol.insertOne(doc);
      }
    }
    console.log("✅ Leave Applications seeded.");

    // 5. Seed Payslips
    console.log(`💰 Upserting ${payslipsData.length} Payslips...`);
    for (const p of payslipsData) {
      const empId = new mongoose.Types.ObjectId(p.employeeId);
      const doc = {
        employeeId: empId,
        month: Number(p.month),
        year: Number(p.year),
        basicSalary: Number(p.basicSalary),
        allowances: Number(p.allowances || 0),
        deductions: Number(p.deductions || 0),
        netSalary: Number(p.netSalary),
        updatedAt: new Date(),
      };

      const existing = await payslipsCol.findOne({
        employeeId: doc.employeeId,
        month: doc.month,
        year: doc.year,
      });

      if (existing) {
        await payslipsCol.updateOne({ _id: existing._id }, { $set: doc });
      } else {
        doc._id = new mongoose.Types.ObjectId(p._id);
        doc.createdAt = new Date(p.createdAt || Date.now());
        await payslipsCol.insertOne(doc);
      }
    }
    console.log("✅ Payslips seeded.");

    // 6. Seed Attendance
    console.log(`⏱️ Upserting ${attendanceData.length} Attendance Records...`);
    for (let i = 0; i < attendanceData.length; i++) {
      const a = attendanceData[i];
      let recDate = new Date(a.date);
      let checkIn = a.checkIn ? new Date(a.checkIn) : null;
      let checkOut = a.checkOut ? new Date(a.checkOut) : null;

      if (!isStatic && i < 10) {
        recDate = today;
        if (checkIn) {
          checkIn = new Date(today.getTime() + (checkIn.getUTCHours() * 3600 + checkIn.getUTCMinutes() * 60) * 1000);
        }
        if (checkOut) {
          checkOut = new Date(today.getTime() + (checkOut.getUTCHours() * 3600 + checkOut.getUTCMinutes() * 60) * 1000);
        }
      }

      const empId = new mongoose.Types.ObjectId(a.employeeId);
      const doc = {
        employeeId: empId,
        date: recDate,
        checkIn,
        checkOut,
        status: a.status,
        workingHours: a.workingHours,
        dayType: a.dayType,
        autoCheckedOut: a.autoCheckedOut ?? false,
        updatedAt: checkOut || checkIn || recDate,
      };

      const existing = await attendanceCol.findOne({
        employeeId: doc.employeeId,
        date: doc.date,
      });

      if (existing) {
        await attendanceCol.updateOne({ _id: existing._id }, { $set: doc });
      } else {
        doc._id = new mongoose.Types.ObjectId(a._id);
        doc.createdAt = recDate;
        await attendanceCol.insertOne(doc);
      }
    }
    console.log("✅ Attendance records seeded.\n");

    // Print summary table
    console.log("==========================================================================");
    console.log("🎉 DEMO DATABASE READY! LOGIN CREDENTIALS:");
    console.log("==========================================================================");
    console.log("👑 ADMIN ACCOUNT:");
    console.log("   Email:    admin@example.com");
    console.log("   Password: admin123");
    console.log("   Role:     ADMIN\n");

    console.log("👥 EMPLOYEE ACCOUNTS (Password for all: password123):");
    console.log("   -----------------------------------------------------------------------");
    console.log("   Name              | Department         | Position               | Email");
    console.log("   -----------------------------------------------------------------------");
    employeesData.forEach((emp) => {
      const name = `${emp.firstName} ${emp.lastName}`.padEnd(17);
      const dept = emp.department.padEnd(18);
      const pos = emp.position.padEnd(24);
      console.log(`   ${name} | ${dept} | ${pos} | ${emp.email}`);
    });
    console.log("==========================================================================");
    console.log("\n💡 Next steps: Open your frontend app in the browser and log in with any");
    console.log("   of the credentials above to explore the dashboard, charts, calendars,");
    console.log("   attendance, leaves, and payslips!");
    console.log("==========================================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  }
}

seed();
