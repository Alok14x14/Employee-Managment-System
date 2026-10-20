/**
 * Demo Database Seeder for FullStack-EMS (StaffFlow)
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
const announcementsData = loadJson("announcements.json");
const attendanceCorrectionsData = loadJson("attendanceCorrections.json");
const employeeDocsData = loadJson("employeeDocuments.json");

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
  console.log("🌱 Starting Demo Database Seeding for FullStack EMS (StaffFlow)...");
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
    const announcementsCol = db.collection("announcements");
    const employeeDocsCol = db.collection("employeedocuments");
    const attendanceCorrectionsCol = db.collection("attendancecorrections");

    // Demo IDs list for cleanup/upsert
    const demoUserIds = usersData.map((u) => new mongoose.Types.ObjectId(u._id));
    const demoEmployeeIds = employeesData.map((e) => new mongoose.Types.ObjectId(e._id));
    const demoHolidayNames = holidaysData.map((h) => h.name);
    const demoAnnouncementIds = announcementsData.map((a) => new mongoose.Types.ObjectId(a._id));
    const demoDocumentIds = employeeDocsData.map((d) => new mongoose.Types.ObjectId(d._id));
    const demoCorrectionIds = attendanceCorrectionsData.map((c) => new mongoose.Types.ObjectId(c._id));

    if (isForce) {
      console.log("🧹 Cleaning existing demo records (--force)...");
      await usersCol.deleteMany({ _id: { $in: demoUserIds } });
      await employeesCol.deleteMany({ _id: { $in: demoEmployeeIds } });
      await leavesCol.deleteMany({ employeeId: { $in: demoEmployeeIds } });
      await payslipsCol.deleteMany({ employeeId: { $in: demoEmployeeIds } });
      await attendanceCol.deleteMany({ employeeId: { $in: demoEmployeeIds } });
      await holidaysCol.deleteMany({ name: { $in: demoHolidayNames } });
      await announcementsCol.deleteMany({ _id: { $in: demoAnnouncementIds } });
      await employeeDocsCol.deleteMany({ _id: { $in: demoDocumentIds } });
      await attendanceCorrectionsCol.deleteMany({ _id: { $in: demoCorrectionIds } });
      console.log("✨ Cleaned prior demo records.\n");
    }

    const today = getISTDayStart();
    const baseAnchorDate = new Date("2026-10-20T00:00:00.000Z");

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
      let normalizedDate = getISTDayStart(new Date(h.date));
      // In dynamic mode, ensure holiday does not accidentally fall exactly on today
      if (!isStatic && normalizedDate.getTime() === today.getTime()) {
        normalizedDate = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);
      }
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
    for (let i = 0; i < leaveAppsData.length; i++) {
      const l = leaveAppsData[i];
      let startDate = new Date(l.startDate);
      let endDate = new Date(l.endDate);

      if (!isStatic) {
        if (l.status === "PENDING") {
          startDate = new Date(today.getTime() + (2 + i) * 24 * 60 * 60 * 1000);
          endDate = new Date(startDate.getTime() + (l.workingDays - 1) * 24 * 60 * 60 * 1000);
        } else if (l.status === "APPROVED") {
          startDate = new Date(today.getTime() - (5 + i * 2) * 24 * 60 * 60 * 1000);
          endDate = new Date(startDate.getTime() + (l.workingDays - 1) * 24 * 60 * 60 * 1000);
        } else if (l.status === "REJECTED") {
          startDate = new Date(today.getTime() - (8 + i) * 24 * 60 * 60 * 1000);
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
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    for (const p of payslipsData) {
      const empId = new mongoose.Types.ObjectId(p.employeeId);
      let targetMonth = Number(p.month);
      let targetYear = Number(p.year);

      if (!isStatic) {
        targetMonth = p.month === 8 ? (prevMonth === 1 ? 12 : prevMonth - 1) : prevMonth;
        targetYear = prevYear;
      }

      const doc = {
        employeeId: empId,
        month: targetMonth,
        year: targetYear,
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
    const seededAttendanceMap = new Map();

    for (let i = 0; i < attendanceData.length; i++) {
      const a = attendanceData[i];
      let recDate = new Date(a.date);
      let checkIn = a.checkIn ? new Date(a.checkIn) : null;
      let checkOut = a.checkOut ? new Date(a.checkOut) : null;

      if (!isStatic) {
        // Calculate offset in days from baseAnchorDate (2026-10-20)
        const daysDiff = Math.round((baseAnchorDate.getTime() - new Date(a.date).getTime()) / (24 * 3600 * 1000));
        recDate = new Date(today.getTime() - daysDiff * 24 * 60 * 60 * 1000);

        if (checkIn) {
          const inHours = checkIn.getUTCHours();
          const inMins = checkIn.getUTCMinutes();
          checkIn = new Date(recDate.getTime() + (inHours * 3600 + inMins * 60) * 1000);
        }
        if (checkOut) {
          const outHours = checkOut.getUTCHours();
          const outMins = checkOut.getUTCMinutes();
          checkOut = new Date(recDate.getTime() + (outHours * 3600 + outMins * 60) * 1000);
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

      const attId = new mongoose.Types.ObjectId(a._id);
      const existing = await attendanceCol.findOne({
        $or: [{ _id: attId }, { employeeId: doc.employeeId, date: doc.date }],
      });

      if (existing) {
        await attendanceCol.updateOne({ _id: existing._id }, { $set: doc });
        seededAttendanceMap.set(a._id, { _id: existing._id, date: recDate, checkIn, checkOut });
      } else {
        doc._id = attId;
        doc.createdAt = recDate;
        await attendanceCol.insertOne(doc);
        seededAttendanceMap.set(a._id, { _id: attId, date: recDate, checkIn, checkOut });
      }
    }
    console.log("✅ Attendance records seeded.");

    // 7. Seed Announcements
    console.log(`📢 Upserting ${announcementsData.length} Company Announcements...`);
    for (let i = 0; i < announcementsData.length; i++) {
      const ann = announcementsData[i];
      let createdAt = new Date(ann.createdAt);
      let expiresAt = ann.expiresAt ? new Date(ann.expiresAt) : null;

      if (!isStatic) {
        createdAt = new Date(today.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
        if (expiresAt) {
          expiresAt = new Date(today.getTime() + (14 + i * 7) * 24 * 60 * 60 * 1000);
        }
      }

      const annId = new mongoose.Types.ObjectId(ann._id);
      const doc = {
        title: ann.title,
        message: ann.message,
        createdBy: new mongoose.Types.ObjectId(ann.createdBy),
        expiresAt,
        createdAt,
        updatedAt: createdAt,
      };

      const existing = await announcementsCol.findOne({ _id: annId });
      if (existing) {
        await announcementsCol.updateOne({ _id: annId }, { $set: doc });
      } else {
        doc._id = annId;
        await announcementsCol.insertOne(doc);
      }
    }
    console.log("✅ Announcements seeded.");

    // 8. Seed Employee Documents
    console.log(`📄 Upserting ${employeeDocsData.length} Employee Documents & Policies...`);
    for (const d of employeeDocsData) {
      const docId = new mongoose.Types.ObjectId(d._id);
      const empId = d.employeeId ? new mongoose.Types.ObjectId(d.employeeId) : null;
      const pdfBuffer = Buffer.from(d.contentBase64, "base64");

      const doc = {
        employeeId: empId,
        audience: d.audience,
        category: d.category,
        title: d.title,
        fileName: d.fileName,
        fileSize: pdfBuffer.length,
        content: pdfBuffer,
        uploadedBy: new mongoose.Types.ObjectId(d.uploadedBy),
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(),
      };

      const existing = await employeeDocsCol.findOne({ _id: docId });
      if (existing) {
        await employeeDocsCol.updateOne({ _id: docId }, { $set: doc });
      } else {
        doc._id = docId;
        await employeeDocsCol.insertOne(doc);
      }
    }
    console.log("✅ Employee Documents seeded.");

    // 9. Seed Attendance Corrections
    console.log(`🕒 Upserting ${attendanceCorrectionsData.length} Attendance Corrections...`);
    for (const c of attendanceCorrectionsData) {
      const corrId = new mongoose.Types.ObjectId(c._id);
      const empId = new mongoose.Types.ObjectId(c.employeeId);
      const mappedAtt = seededAttendanceMap.get(c.attendanceId);
      const attId = mappedAtt ? mappedAtt._id : new mongoose.Types.ObjectId(c.attendanceId);

      let requestedTime = new Date(c.requestedTime);
      let createdAt = new Date(c.createdAt);

      if (!isStatic && mappedAtt) {
        const origReq = new Date(c.requestedTime);
        const hours = origReq.getUTCHours();
        const mins = origReq.getUTCMinutes();
        requestedTime = new Date(mappedAtt.date.getTime() + (hours * 3600 + mins * 60) * 1000);
        createdAt = new Date(requestedTime.getTime() + 30 * 60 * 1000);
      }

      const doc = {
        employeeId: empId,
        attendanceId: attId,
        field: c.field,
        requestedTime,
        reason: c.reason,
        status: c.status,
        reviewedBy: c.reviewedBy ? new mongoose.Types.ObjectId(c.reviewedBy) : null,
        reviewedAt: c.reviewedAt ? new Date(c.reviewedAt) : null,
        reviewNote: c.reviewNote || "",
        createdAt,
        updatedAt: c.reviewedAt ? new Date(c.reviewedAt) : createdAt,
      };

      const existing = await attendanceCorrectionsCol.findOne({ _id: corrId });
      if (existing) {
        await attendanceCorrectionsCol.updateOne({ _id: corrId }, { $set: doc });
      } else {
        doc._id = corrId;
        await attendanceCorrectionsCol.insertOne(doc);
      }
    }
    console.log("✅ Attendance Corrections seeded.\n");

    // Print comprehensive summary table
    console.log("==========================================================================");
    console.log("🎉 DEMO DATABASE READY FOR STAFFFLOW (FULLSTACK EMS)!");
    console.log("==========================================================================");
    console.log("👑 ADMIN ACCOUNT:");
    console.log("   Email:    admin@example.com");
    console.log("   Password: admin123");
    console.log("   Role:     ADMIN");
    console.log("   Features: Dashboard analytics, employee management, payroll & payslips,");
    console.log("             leave approvals, shifts & attendance correction review,");
    console.log("             company announcements publisher, document center, holiday calendar.\n");

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
    console.log("✨ HIGHLIGHTS & READY-TO-TEST DEMO FEATURES:");
    console.log("   1. 📢 Company Announcements: Live notices on /announcements & notification bell.");
    console.log("   2. 📄 Employee Documents & Policies: Downloadable & previewable PDFs on /documents.");
    console.log("   3. 🕒 Attendance Corrections: Pending requests ready for Admin review on /admin/attendance");
    console.log("      and past status tracking on /attendance.");
    console.log("   4. 👥 Employee Directory: Rich roster on /directory with filters by department & title.");
    console.log("   5. 💬 AI HR Assistant: Floating chatbot in bottom-right corner of employee portal.");
    console.log("   6. 🔔 Notification Center: 7 live badge alerts across leaves, shifts, docs, announcements.");
    console.log("==========================================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  }
}

seed();
