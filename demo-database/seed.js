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

    // Demo IDs and email lists
    const demoUserIds = usersData.map((u) => new mongoose.Types.ObjectId(u._id));
    const demoUserEmails = usersData.map((u) => u.email.toLowerCase().trim());
    const demoEmployeeIds = employeesData.map((e) => new mongoose.Types.ObjectId(e._id));
    const demoEmails = employeesData.map((e) => e.email.toLowerCase().trim());
    const demoHolidayNames = holidaysData.map((h) => h.name);
    const demoAnnouncementIds = announcementsData.map((a) => new mongoose.Types.ObjectId(a._id));
    const demoDocumentIds = employeeDocsData.map((d) => new mongoose.Types.ObjectId(d._id));
    const demoCorrectionIds = attendanceCorrectionsData.map((c) => new mongoose.Types.ObjectId(c._id));

    if (isForce) {
      console.log("🧹 Cleaning existing demo records (--force)...");
      await usersCol.deleteMany({ $or: [{ _id: { $in: demoUserIds } }, { email: { $in: demoUserEmails } }] });
      await employeesCol.deleteMany({ $or: [{ _id: { $in: demoEmployeeIds } }, { email: { $in: demoEmails } }] });
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

    // 1. Seed Users (Bulk)
    console.log(`👤 Upserting ${usersData.length} Users...`);
    const userOps = usersData.map((u) => {
      const email = u.email.toLowerCase().trim();
      const userId = new mongoose.Types.ObjectId(u._id);
      return {
        updateOne: {
          filter: { $or: [{ _id: userId }, { email }] },
          update: {
            $set: {
              email,
              password: u.password,
              role: u.role,
              bio: u.bio || "",
              mustChangePassword: u.mustChangePassword ?? false,
              tokenVersion: u.tokenVersion ?? 0,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              _id: userId,
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      };
    });
    await usersCol.bulkWrite(userOps);
    console.log("✅ Users seeded.");

    // 2. Seed Employees (Bulk)
    console.log(`💼 Upserting ${employeesData.length} Employees...`);
    const empOps = employeesData.map((e) => {
      const email = e.email.toLowerCase().trim();
      const empId = new mongoose.Types.ObjectId(e._id);
      return {
        updateOne: {
          filter: { $or: [{ _id: empId }, { email }] },
          update: {
            $set: {
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
            },
            $setOnInsert: {
              _id: empId,
              createdAt: new Date(e.joinDate),
            },
          },
          upsert: true,
        },
      };
    });
    await employeesCol.bulkWrite(empOps);
    console.log("✅ Employees seeded.");

    // 3. Seed Holidays (Bulk)
    console.log(`🎉 Upserting ${holidaysData.length} Holidays...`);
    const holidayOps = holidaysData.map((h) => {
      let normalizedDate = getISTDayStart(new Date(h.date));
      if (!isStatic && normalizedDate.getTime() === today.getTime()) {
        normalizedDate = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);
      }
      const holId = new mongoose.Types.ObjectId(h._id);
      return {
        updateOne: {
          filter: { $or: [{ _id: holId }, { date: normalizedDate }, { name: h.name }] },
          update: {
            $set: {
              name: h.name,
              date: normalizedDate,
              createdBy: new mongoose.Types.ObjectId(h.createdBy),
              updatedAt: new Date(),
            },
            $setOnInsert: {
              _id: holId,
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      };
    });
    await holidaysCol.bulkWrite(holidayOps);
    console.log("✅ Holidays seeded.");

    // 4. Seed Leave Applications (Bulk)
    console.log(`📝 Upserting ${leaveAppsData.length} Leave Applications...`);
    const leaveOps = leaveAppsData.map((l, i) => {
      let startDate = new Date(l.startDate);
      let endDate = new Date(l.endDate);

      if (!isStatic) {
        if (l.status === "PENDING") {
          startDate = new Date(today.getTime() + (2 + (i % 4)) * 24 * 60 * 60 * 1000);
          endDate = new Date(startDate.getTime() + (l.workingDays - 1) * 24 * 60 * 60 * 1000);
        } else if (l.status === "APPROVED") {
          startDate = new Date(today.getTime() - (5 + (i % 10) * 3) * 24 * 60 * 60 * 1000);
          endDate = new Date(startDate.getTime() + (l.workingDays - 1) * 24 * 60 * 60 * 1000);
        } else if (l.status === "REJECTED") {
          startDate = new Date(today.getTime() - (8 + (i % 6) * 4) * 24 * 60 * 60 * 1000);
          endDate = new Date(startDate.getTime() + (l.workingDays - 1) * 24 * 60 * 60 * 1000);
        }
      }

      const leaveId = new mongoose.Types.ObjectId(l._id);
      const empId = new mongoose.Types.ObjectId(l.employeeId);
      return {
        updateOne: {
          filter: { _id: leaveId },
          update: {
            $set: {
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
            },
            $setOnInsert: {
              _id: leaveId,
              createdAt: new Date(startDate.getTime() - 2 * 24 * 60 * 60 * 1000),
            },
          },
          upsert: true,
        },
      };
    });
    await leavesCol.bulkWrite(leaveOps);
    console.log("✅ Leave Applications seeded.");

    // 5. Seed Payslips (Bulk)
    console.log(`💰 Upserting ${payslipsData.length} Payslips...`);
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const payslipOps = payslipsData.map((p) => {
      const empId = new mongoose.Types.ObjectId(p.employeeId);
      const pId = new mongoose.Types.ObjectId(p._id);
      let targetMonth = Number(p.month);
      let targetYear = Number(p.year);

      if (!isStatic) {
        targetMonth = p.month === 8 ? (prevMonth === 1 ? 12 : prevMonth - 1) : prevMonth;
        targetYear = prevYear;
      }

      return {
        updateOne: {
          filter: { $or: [{ _id: pId }, { employeeId: empId, month: targetMonth, year: targetYear }] },
          update: {
            $set: {
              employeeId: empId,
              month: targetMonth,
              year: targetYear,
              basicSalary: Number(p.basicSalary),
              allowances: Number(p.allowances || 0),
              deductions: Number(p.deductions || 0),
              netSalary: Number(p.netSalary),
              updatedAt: new Date(),
            },
            $setOnInsert: {
              _id: pId,
              createdAt: new Date(p.createdAt || Date.now()),
            },
          },
          upsert: true,
        },
      };
    });
    await payslipsCol.bulkWrite(payslipOps);
    console.log("✅ Payslips seeded.");

    // 6. Seed Attendance (Bulk)
    console.log(`⏱️ Upserting ${attendanceData.length} Attendance Records...`);
    const seededAttendanceMap = new Map();

    const attendanceOps = attendanceData.map((a) => {
      let recDate = new Date(a.date);
      let checkIn = a.checkIn ? new Date(a.checkIn) : null;
      let checkOut = a.checkOut ? new Date(a.checkOut) : null;

      if (!isStatic) {
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
      const attId = new mongoose.Types.ObjectId(a._id);

      seededAttendanceMap.set(a._id, { _id: attId, date: recDate, checkIn, checkOut });

      return {
        updateOne: {
          filter: { $or: [{ _id: attId }, { employeeId: empId, date: recDate }] },
          update: {
            $set: {
              employeeId: empId,
              date: recDate,
              checkIn,
              checkOut,
              status: a.status,
              workingHours: a.workingHours,
              dayType: a.dayType,
              autoCheckedOut: a.autoCheckedOut ?? false,
              updatedAt: checkOut || checkIn || recDate,
            },
            $setOnInsert: {
              _id: attId,
              createdAt: recDate,
            },
          },
          upsert: true,
        },
      };
    });
    await attendanceCol.bulkWrite(attendanceOps);
    console.log("✅ Attendance records seeded.");

    // 7. Seed Announcements (Bulk)
    console.log(`📢 Upserting ${announcementsData.length} Company Announcements...`);
    const announcementOps = announcementsData.map((ann, i) => {
      let createdAt = new Date(ann.createdAt);
      let expiresAt = ann.expiresAt ? new Date(ann.expiresAt) : null;

      if (!isStatic) {
        createdAt = new Date(today.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
        if (expiresAt) {
          expiresAt = new Date(today.getTime() + (14 + i * 7) * 24 * 60 * 60 * 1000);
        }
      }

      const annId = new mongoose.Types.ObjectId(ann._id);
      return {
        updateOne: {
          filter: { _id: annId },
          update: {
            $set: {
              title: ann.title,
              message: ann.message,
              createdBy: new mongoose.Types.ObjectId(ann.createdBy),
              expiresAt,
              createdAt,
              updatedAt: createdAt,
            },
            $setOnInsert: {
              _id: annId,
            },
          },
          upsert: true,
        },
      };
    });
    await announcementsCol.bulkWrite(announcementOps);
    console.log("✅ Announcements seeded.");

    // 8. Seed Employee Documents (Bulk)
    console.log(`📄 Upserting ${employeeDocsData.length} Employee Documents & Policies...`);
    const docOps = employeeDocsData.map((d) => {
      const docId = new mongoose.Types.ObjectId(d._id);
      const empId = d.employeeId ? new mongoose.Types.ObjectId(d.employeeId) : null;
      const pdfBuffer = Buffer.from(d.contentBase64, "base64");

      return {
        updateOne: {
          filter: { _id: docId },
          update: {
            $set: {
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
            },
            $setOnInsert: {
              _id: docId,
            },
          },
          upsert: true,
        },
      };
    });
    await employeeDocsCol.bulkWrite(docOps);
    console.log("✅ Employee Documents seeded.");

    // 9. Seed Attendance Corrections (Bulk)
    console.log(`🕒 Upserting ${attendanceCorrectionsData.length} Attendance Corrections...`);
    const correctionOps = attendanceCorrectionsData.map((c) => {
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

      return {
        updateOne: {
          filter: { _id: corrId },
          update: {
            $set: {
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
            },
            $setOnInsert: {
              _id: corrId,
            },
          },
          upsert: true,
        },
      };
    });
    await attendanceCorrectionsCol.bulkWrite(correctionOps);
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
    console.log("   ----------------------------------------------------------------------------------");
    console.log("   Name              | Department         | Position                         | Email");
    console.log("   ----------------------------------------------------------------------------------");
    employeesData.forEach((emp) => {
      const name = `${emp.firstName} ${emp.lastName}`.padEnd(17);
      const dept = emp.department.padEnd(18);
      const pos = emp.position.padEnd(32);
      console.log(`   ${name} | ${dept} | ${pos} | ${emp.email}`);
    });
    console.log("==========================================================================");
    console.log("✨ HIGHLIGHTS & READY-TO-TEST DEMO FEATURES:");
    console.log("   1. 📢 Company Announcements (7): Live notices on /announcements & notification bell.");
    console.log("   2. 📄 Employee Documents & Policies (16): Downloadable & previewable PDFs on /documents.");
    console.log("   3. 🕒 Attendance Corrections (12): 4 pending requests for Admin review on /admin/attendance");
    console.log("      and past status tracking on /attendance.");
    console.log("   4. 👥 Employee Directory (25): Full company roster on /directory with department filtering.");
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
