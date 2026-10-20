const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

function hexId(prefix, num) {
  return prefix + num.toString(16).padStart(4, '0');
}

// PDF generator helper
function createSimplePdf(title, subtitle, lines) {
  const contentStream = 'BT /F1 18 Tf 50 720 Td (' + title.replace(/[()\\]/g, '') + ') Tj ET ' +
    'BT /F1 12 Tf 50 695 Td (' + subtitle.replace(/[()\\]/g, '') + ') Tj ET ' +
    lines.map((l, i) => 'BT /F1 10 Tf 50 ' + (660 - i * 18) + ' Td (' + l.replace(/[()\\]/g, '') + ') Tj ET').join(' ');
  const streamLen = Buffer.byteLength(contentStream);
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    '5 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + contentStream + '\nendstream\nendobj'
  ];
  let offset = 9;
  const xrefEntries = ['0000000000 65535 f '];
  let body = '%PDF-1.4\n';
  for (const obj of objects) {
    const oStr = obj + '\n';
    xrefEntries.push(String(offset).padStart(10, '0') + ' 00000 n ');
    offset += Buffer.byteLength(oStr);
    body += oStr;
  }
  const startxref = offset;
  const xref = 'xref\n0 ' + (objects.length + 1) + '\n' + xrefEntries.join('\n') + '\n';
  const trailer = 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + startxref + '\n%%EOF\n';
  return Buffer.from(body + xref + trailer);
}

const PASSWORD_HASH_EMPLOYEE = "$2b$10$KylaFRMp.W2ABuxIl9Inq.7ZHOB5WMB32it1r8AZiOu/hlAw11rz."; // password123
const PASSWORD_HASH_ADMIN = "$2b$10$olf4hj4CmB8qk4w6NuVEtefiZpzN3mU85aR4MrmhYEUJmrMJSY/XK";    // admin123

// 25 Employees definition
const employeesRaw = [
  { firstName: "Sarah", lastName: "Jenkins", dept: "Engineering", pos: "Senior Full Stack Engineer", salary: 95000, allow: 8000, ded: 4500, phone: "+1 (555) 234-5678", join: "2023-03-15", bio: "Full stack architect specializing in React, Node.js, and cloud systems." },
  { firstName: "John", lastName: "Doe", dept: "Product Management", pos: "Lead Product Manager", salary: 90000, allow: 7500, ded: 4000, phone: "+1 (555) 345-6789", join: "2023-05-10", bio: "Product strategist focused on user experience and data-driven product lifecycle." },
  { firstName: "Emily", lastName: "Watson", dept: "Human Resources", pos: "HR People Partner", salary: 72000, allow: 5000, ded: 3000, phone: "+1 (555) 456-7890", join: "2022-11-01", bio: "Championing employee wellbeing, talent acquisition, and positive workplace culture." },
  { firstName: "Michael", lastName: "Chang", dept: "Design", pos: "Senior Product Designer", salary: 82000, allow: 6000, ded: 3500, phone: "+1 (555) 567-8901", join: "2023-01-20", bio: "Crafting seamless, human-centered UI/UX design systems and interactive prototypes." },
  { firstName: "Priya", lastName: "Patel", dept: "Marketing", pos: "Growth Marketing Manager", salary: 78000, allow: 5500, ded: 3200, phone: "+1 (555) 678-9012", join: "2023-08-01", bio: "Leading multi-channel growth marketing campaigns and brand positioning." },
  { firstName: "David", lastName: "Miller", dept: "Finance", pos: "Senior Financial Analyst", salary: 85000, allow: 6500, ded: 3800, phone: "+1 (555) 789-0123", join: "2022-07-15", bio: "Overseeing financial planning, quarterly forecasts, and corporate budget models." },
  { firstName: "Jessica", lastName: "Taylor", dept: "Customer Success", pos: "Customer Success Specialist", salary: 64000, allow: 4500, ded: 2800, phone: "+1 (555) 890-1234", join: "2024-02-01", bio: "Dedicated to client onboarding excellence, retention, and customer satisfaction." },
  { firstName: "Alex", lastName: "Rivera", dept: "IT Support", pos: "Cloud & DevOps Specialist", salary: 92000, allow: 7000, ded: 4200, phone: "+1 (555) 901-2345", join: "2023-04-12", bio: "Infrastructure engineer managing CI/CD pipelines, Kubernetes, and cloud security." },
  { firstName: "Liam", lastName: "Wilson", dept: "Sales", pos: "Enterprise Account Executive", salary: 70000, allow: 9000, ded: 3500, phone: "+1 (555) 012-3456", join: "2023-09-18", bio: "Driving enterprise client relationships, renewals, and revenue acceleration." },
  { firstName: "Sophia", lastName: "Martinez", dept: "Operations", pos: "Operations Manager", salary: 76000, allow: 5000, ded: 3100, phone: "+1 (555) 123-4567", join: "2023-06-01", bio: "Streamlining organizational workflows and supply chain efficiency." },
  // 15 additional team members for rich scale
  { firstName: "Marcus", lastName: "Vance", dept: "Engineering", pos: "Staff Backend Engineer", salary: 110000, allow: 9000, ded: 5000, phone: "+1 (555) 211-9876", join: "2022-04-10", bio: "Distributed systems and high-throughput microservices specialist in Go & Node.js." },
  { firstName: "Chloe", lastName: "Bennett", dept: "Engineering", pos: "Frontend UI Architect", salary: 98000, allow: 8000, ded: 4600, phone: "+1 (555) 212-8765", join: "2023-02-15", bio: "Passionate about modern web standards, accessibility, micro-interactions, and design tokens." },
  { firstName: "Daniel", lastName: "Kim", dept: "Engineering", pos: "QA Automation & Test Lead", salary: 84000, allow: 6500, ded: 3600, phone: "+1 (555) 213-7654", join: "2023-10-01", bio: "Leading end-to-end testing, Playwright automation suites, and release readiness." },
  { firstName: "Ananya", lastName: "Sharma", dept: "Product Management", pos: "Senior Technical Product Manager", salary: 94000, allow: 8000, ded: 4200, phone: "+1 (555) 214-6543", join: "2023-06-20", bio: "Bridging customer requirements and technical engineering roadmaps for scalable SaaS products." },
  { firstName: "Tyler", lastName: "Reed", dept: "Product Management", pos: "Associate Product Manager", salary: 68000, allow: 5000, ded: 3000, phone: "+1 (555) 215-5432", join: "2024-03-01", bio: "Focusing on analytics telemetry, customer discovery interviews, and sprint backlog grooming." },
  { firstName: "Elena", lastName: "Rostova", dept: "Design", pos: "Lead UX Researcher", salary: 88000, allow: 7000, ded: 3800, phone: "+1 (555) 216-4321", join: "2022-09-12", bio: "Uncovering actionable user behaviors through qualitative usability labs and cohort studies." },
  { firstName: "Brandon", lastName: "Cole", dept: "Design", pos: "Visual & Motion Designer", salary: 74000, allow: 5500, ded: 3200, phone: "+1 (555) 217-3210", join: "2023-11-05", bio: "Creating engaging micro-animations, illustration libraries, and sleek visual identities." },
  { firstName: "Lucas", lastName: "Silva", dept: "Marketing", pos: "Content & SEO Specialist", salary: 66000, allow: 4800, ded: 2900, phone: "+1 (555) 218-2109", join: "2024-01-15", bio: "Directing high-intent search strategy, technical content marketing, and inbound lead funnels." },
  { firstName: "Zoe", lastName: "Campbell", dept: "Marketing", pos: "Social Media & Brand Strategist", salary: 62000, allow: 4500, ded: 2700, phone: "+1 (555) 219-1098", join: "2024-04-01", bio: "Growing global brand presence, community events, and tech podcast production." },
  { firstName: "Rachel", lastName: "Green", dept: "Human Resources", pos: "Talent Acquisition Specialist", salary: 68000, allow: 5000, ded: 3000, phone: "+1 (555) 220-0987", join: "2023-07-08", bio: "Scaling engineering, product, and leadership hiring pipelines across regions." },
  { firstName: "Sanjay", lastName: "Gupta", dept: "Finance", pos: "Corporate Accounting Manager", salary: 92000, allow: 7500, ded: 4100, phone: "+1 (555) 221-9876", join: "2022-08-25", bio: "Managing multi-currency general ledgers, tax withholdings, and statutory audit compliance." },
  { firstName: "Olivia", lastName: "Thorne", dept: "Sales", pos: "Business Development Representative", salary: 60000, allow: 8000, ded: 2800, phone: "+1 (555) 222-8765", join: "2024-02-15", bio: "Sourcing enterprise qualified leads and accelerating executive discovery calls." },
  { firstName: "Nathan", lastName: "Drake", dept: "Customer Success", pos: "Enterprise Support Engineer", salary: 72000, allow: 5500, ded: 3100, phone: "+1 (555) 223-7654", join: "2023-05-18", bio: "Resolving mission-critical customer escalations and driving SLA satisfaction." },
  { firstName: "Kevin", lastName: "Park", dept: "IT Support", pos: "Systems & Network Administrator", salary: 80000, allow: 6000, ded: 3500, phone: "+1 (555) 224-6543", join: "2022-12-01", bio: "Maintaining identity providers, SSO infrastructure, zero-trust VPN, and hardware fleet." },
  { firstName: "Aaron", lastName: "Brooks", dept: "Operations", pos: "Logistics & Workplace Coordinator", salary: 62000, allow: 4500, ded: 2700, phone: "+1 (555) 225-5432", join: "2023-08-15", bio: "Orchestrating office operations, facility logistics, and inventory management." }
];

// Generate Users & Employees
const users = [
  {
    _id: "66f000000000000000000001",
    email: "admin@example.com",
    password: PASSWORD_HASH_ADMIN,
    role: "ADMIN",
    bio: "System Administrator & HR Operations Lead",
    mustChangePassword: false,
    tokenVersion: 0
  }
];

const employees = [];

employeesRaw.forEach((e, idx) => {
  const empNum = idx + 1;
  const userNum = idx + 2;
  const empId = hexId("66e00000000000000000", empNum);
  const userId = hexId("66f00000000000000000", userNum);
  const email = `${e.firstName.toLowerCase()}.${e.lastName.toLowerCase()}@example.com`;

  users.push({
    _id: userId,
    email,
    password: PASSWORD_HASH_EMPLOYEE,
    role: "EMPLOYEE",
    bio: e.bio,
    mustChangePassword: false,
    tokenVersion: 0
  });

  employees.push({
    _id: empId,
    userId,
    firstName: e.firstName,
    lastName: e.lastName,
    email,
    phone: e.phone,
    position: e.pos,
    department: e.dept,
    basicSalary: e.salary,
    allowances: e.allow,
    deductions: e.ded,
    employmentStatus: "ACTIVE",
    joinDate: new Date(e.join + "T00:00:00.000Z").toISOString(),
    isDeleted: false,
    bio: e.bio
  });
});

console.log(`Generated ${users.length} Users and ${employees.length} Employees.`);

// Generate rich Attendance records: Today (Day 0) + 14 past business days
const attendance = [];
let attIdCounter = 1;

// Day 0 (Today: 2026-10-20)
employees.forEach((emp, idx) => {
  let checkIn = "2026-10-20T03:30:00.000Z"; // 09:00 IST
  let checkOut = "2026-10-20T12:00:00.000Z"; // 17:30 IST
  let status = "PRESENT";
  let workingHours = 8.5;
  let dayType = "Full Day";

  if (idx === 0) { // Sarah Jenkins: open checkout
    checkOut = null;
    workingHours = null;
    dayType = null;
  } else if (idx === 1) { // John Doe: late, open checkout
    checkIn = "2026-10-20T04:15:00.000Z"; // 09:45 IST
    checkOut = null;
    status = "LATE";
    workingHours = null;
    dayType = null;
  } else if (idx === 3) { // Michael Chang: open checkout
    checkOut = null;
    workingHours = null;
    dayType = null;
  } else if (idx === 6) { // Jessica Taylor: late, open checkout
    checkIn = "2026-10-20T04:20:00.000Z";
    checkOut = null;
    status = "LATE";
    workingHours = null;
    dayType = null;
  } else if (idx === 8) { // Liam Wilson: half day
    checkIn = "2026-10-20T03:20:00.000Z";
    checkOut = "2026-10-20T08:20:00.000Z";
    workingHours = 5.0;
    dayType = "Half Day";
  } else if (idx === 10) { // Marcus Vance: late turnstile
    checkIn = "2026-10-20T04:10:00.000Z";
    status = "LATE";
    workingHours = 7.8;
  } else if (idx === 14) { // Tyler Reed: late subway
    checkIn = "2026-10-20T04:25:00.000Z";
    status = "LATE";
    workingHours = 7.6;
  } else if (idx === 24) { // Aaron Brooks: half day
    checkIn = "2026-10-20T03:15:00.000Z";
    checkOut = "2026-10-20T07:45:00.000Z";
    workingHours = 4.5;
    dayType = "Half Day";
  }

  attendance.push({
    _id: hexId("66a00000000000000000", attIdCounter++),
    employeeId: emp._id,
    date: "2026-10-20T00:00:00.000Z",
    checkIn,
    checkOut,
    status,
    workingHours,
    dayType,
    autoCheckedOut: false
  });
});

// Past 14 days (excluding weekends: Oct 19 Mon, Oct 16 Fri, Oct 15 Thu, Oct 14 Wed, Oct 13 Tue, Oct 12 Mon, Oct 9 Fri, Oct 8 Thu, Oct 7 Wed, Oct 6 Tue)
const pastDates = [
  "2026-10-19", "2026-10-16", "2026-10-15", "2026-10-14", "2026-10-13",
  "2026-10-12", "2026-10-09", "2026-10-08", "2026-10-07", "2026-10-06"
];

pastDates.forEach((dateStr, dayIdx) => {
  employees.forEach((emp, empIdx) => {
    // Inject realistic variations
    const isLate = (empIdx + dayIdx) % 7 === 3;
    const isHalfDay = (empIdx + dayIdx) % 11 === 4;
    const isAbsent = (empIdx + dayIdx) % 17 === 8;

    let inHour = isLate ? "04:15:00.000Z" : "03:30:00.000Z";
    let outHour = isHalfDay ? "08:30:00.000Z" : "12:00:00.000Z";
    let status = isAbsent ? "ABSENT" : (isLate ? "LATE" : "PRESENT");
    let workingHours = isAbsent ? null : (isHalfDay ? 5.0 : (isLate ? 7.75 : 8.5));
    let dayType = isAbsent ? null : (isHalfDay ? "Half Day" : "Full Day");

    attendance.push({
      _id: hexId("66a00000000000000000", attIdCounter++),
      employeeId: emp._id,
      date: `${dateStr}T00:00:00.000Z`,
      checkIn: isAbsent ? null : `${dateStr}T${inHour}`,
      checkOut: isAbsent ? null : `${dateStr}T${outHour}`,
      status,
      workingHours,
      dayType,
      autoCheckedOut: false
    });
  });
});

console.log(`Generated ${attendance.length} Attendance records across ${pastDates.length + 1} working days.`);

// Generate Leave Applications (28 applications)
const leaves = [
  // 7 Pending requests for Admin Review Queue
  { _id: hexId("66c00000000000000000", 1), employeeId: employees[0]._id, type: "ANNUAL", startDate: "2026-10-22", endDate: "2026-10-24", workingDays: 3, reason: "Attending annual full-stack engineering conference and personal development.", status: "PENDING" },
  { _id: hexId("66c00000000000000000", 2), employeeId: employees[4]._id, type: "CASUAL", startDate: "2026-10-23", endDate: "2026-10-24", workingDays: 2, reason: "Family gathering and cousin wedding ceremony.", status: "PENDING" },
  { _id: hexId("66c00000000000000000", 3), employeeId: employees[10]._id, type: "SICK", startDate: "2026-10-22", endDate: "2026-10-22", workingDays: 1, reason: "Scheduled medical health checkup and diagnostic tests.", status: "PENDING" },
  { _id: hexId("66c00000000000000000", 4), employeeId: employees[11]._id, type: "ANNUAL", startDate: "2026-10-26", endDate: "2026-10-30", workingDays: 5, reason: "Annual family autumn retreat and vacation travel.", status: "PENDING" },
  { _id: hexId("66c00000000000000000", 5), employeeId: employees[15]._id, type: "CASUAL", startDate: "2026-10-23", endDate: "2026-10-23", workingDays: 1, reason: "Personal bank documentation and apartment lease extension.", status: "PENDING" },
  { _id: hexId("66c00000000000000000", 6), employeeId: employees[20]._id, type: "ANNUAL", startDate: "2026-10-27", endDate: "2026-10-29", workingDays: 3, reason: "Family celebration and traditional festivities.", status: "PENDING" },
  { _id: hexId("66c00000000000000000", 7), employeeId: employees[22]._id, type: "CASUAL", startDate: "2026-10-22", endDate: "2026-10-23", workingDays: 2, reason: "Home relocation and furniture delivery assistance.", status: "PENDING" },

  // 16 Approved historical requests
  { _id: hexId("66c00000000000000000", 8), employeeId: employees[1]._id, type: "SICK", startDate: "2026-10-12", endDate: "2026-10-13", workingDays: 2, reason: "Viral fever and doctor-advised rest.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 9), employeeId: employees[3]._id, type: "ANNUAL", startDate: "2026-09-14", endDate: "2026-09-18", workingDays: 5, reason: "Annual family vacation travel.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 10), employeeId: employees[5]._id, type: "CASUAL", startDate: "2026-10-05", endDate: "2026-10-05", workingDays: 1, reason: "Home relocation and bank documentation errand.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 11), employeeId: employees[9]._id, type: "SICK", startDate: "2026-10-08", endDate: "2026-10-08", workingDays: 1, reason: "Dental surgery and recovery.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 12), employeeId: employees[7]._id, type: "CASUAL", startDate: "2026-10-16", endDate: "2026-10-16", workingDays: 1, reason: "Car inspection and urgent licensing work.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 13), employeeId: employees[0]._id, type: "CASUAL", startDate: "2026-10-02", endDate: "2026-10-02", workingDays: 1, reason: "Personal family commitment.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 14), employeeId: employees[12]._id, type: "SICK", startDate: "2026-09-21", endDate: "2026-09-22", workingDays: 2, reason: "Severe migraine and rest.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 15), employeeId: employees[13]._id, type: "ANNUAL", startDate: "2026-09-07", endDate: "2026-09-11", workingDays: 5, reason: "Out-of-state family holiday.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 16), employeeId: employees[16]._id, type: "CASUAL", startDate: "2026-09-25", endDate: "2026-09-25", workingDays: 1, reason: "Government ID renewal appointment.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 17), employeeId: employees[17]._id, type: "SICK", startDate: "2026-10-06", endDate: "2026-10-07", workingDays: 2, reason: "Seasonal flu and physician rest.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 18), employeeId: employees[18]._id, type: "CASUAL", startDate: "2026-09-15", endDate: "2026-09-15", workingDays: 1, reason: "Personal errand and legal consultation.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 19), employeeId: employees[19]._id, type: "ANNUAL", startDate: "2026-08-17", endDate: "2026-08-21", workingDays: 5, reason: "Summer vacation with family.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 20), employeeId: employees[21]._id, type: "CASUAL", startDate: "2026-10-09", endDate: "2026-10-09", workingDays: 1, reason: "Home plumbing and electrical repair supervision.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 21), employeeId: employees[23]._id, type: "SICK", startDate: "2026-09-28", endDate: "2026-09-29", workingDays: 2, reason: "Eye infection and ophthalmologist consultation.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 22), employeeId: employees[2]._id, type: "ANNUAL", startDate: "2026-08-03", endDate: "2026-08-07", workingDays: 5, reason: "Annual relaxation and travel.", status: "APPROVED" },
  { _id: hexId("66c00000000000000000", 23), employeeId: employees[24]._id, type: "CASUAL", startDate: "2026-10-14", endDate: "2026-10-14", workingDays: 1, reason: "Family school event attendance.", status: "APPROVED" },

  // 5 Rejected requests
  { _id: hexId("66c00000000000000000", 24), employeeId: employees[8]._id, type: "ANNUAL", startDate: "2026-09-28", endDate: "2026-10-02", workingDays: 5, reason: "Extended personal leave for overseas trip.", status: "REJECTED", rejectReason: "Critical quarter-end sales closing deliverables during this period." },
  { _id: hexId("66c00000000000000000", 25), employeeId: employees[6]._id, type: "CASUAL", startDate: "2026-10-14", endDate: "2026-10-15", workingDays: 2, reason: "Urgent family event and travel.", status: "REJECTED", rejectReason: "Auto Rejected", autoRejected: true },
  { _id: hexId("66c00000000000000000", 26), employeeId: employees[10]._id, type: "ANNUAL", startDate: "2026-09-14", endDate: "2026-09-18", workingDays: 5, reason: "Leisure vacation trip.", status: "REJECTED", rejectReason: "Coincided with core database v2 migration sprint." },
  { _id: hexId("66c00000000000000000", 27), employeeId: employees[14]._id, type: "CASUAL", startDate: "2026-10-01", endDate: "2026-10-02", workingDays: 2, reason: "Long weekend personal trip.", status: "REJECTED", rejectReason: "Auto Rejected", autoRejected: true },
  { _id: hexId("66c00000000000000000", 28), employeeId: employees[22]._id, type: "ANNUAL", startDate: "2026-09-01", endDate: "2026-09-04", workingDays: 4, reason: "Personal holiday travel.", status: "REJECTED", rejectReason: "Multiple client escalations scheduled for that week." }
];

console.log(`Generated ${leaves.length} Leave Applications.`);

// Generate Attendance Corrections (12 requests)
const attendanceCorrections = [
  // 4 Pending requests for Admin Attendance Review
  {
    _id: hexId("66700000000000000000", 1),
    employeeId: employees[1]._id, // John Doe
    attendanceId: attendance[1]._id,
    field: "checkOut",
    requestedTime: "2026-10-20T12:30:00.000Z",
    reason: "Forgot to tap badge at departure kiosk before leaving for offsite client dinner.",
    status: "PENDING",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: "",
    createdAt: "2026-10-20T13:00:00.000Z"
  },
  {
    _id: hexId("66700000000000000000", 2),
    employeeId: employees[6]._id, // Jessica Taylor
    attendanceId: attendance[6]._id,
    field: "checkOut",
    requestedTime: "2026-10-20T13:00:00.000Z",
    reason: "Late client onboarding call extended beyond office hours; forgot manual checkout.",
    status: "PENDING",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: "",
    createdAt: "2026-10-20T13:30:00.000Z"
  },
  {
    _id: hexId("66700000000000000000", 3),
    employeeId: employees[10]._id, // Marcus Vance
    attendanceId: attendance[10]._id,
    field: "checkIn",
    requestedTime: "2026-10-20T03:30:00.000Z",
    reason: "Front turnstile RFID scanner failed to register card; logged in manually at desk.",
    status: "PENDING",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: "",
    createdAt: "2026-10-20T05:00:00.000Z"
  },
  {
    _id: hexId("66700000000000000000", 4),
    employeeId: employees[14]._id, // Tyler Reed
    attendanceId: attendance[14]._id,
    field: "checkIn",
    requestedTime: "2026-10-20T03:35:00.000Z",
    reason: "Subway signal delay caused slight arrival delay; badge kiosk queue was backed up.",
    status: "PENDING",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: "",
    createdAt: "2026-10-20T05:15:00.000Z"
  },

  // 5 Approved requests
  {
    _id: hexId("66700000000000000000", 5),
    employeeId: employees[0]._id, // Sarah Jenkins
    attendanceId: attendance[25]._id, // Oct 19
    field: "checkIn",
    requestedTime: "2026-10-19T03:30:00.000Z",
    reason: "Badge scanner at North entrance failed to read RFID card; entered via visitor gate.",
    status: "APPROVED",
    reviewedBy: users[0]._id,
    reviewedAt: "2026-10-19T05:00:00.000Z",
    reviewNote: "Verified with security desk check-in log.",
    createdAt: "2026-10-19T04:00:00.000Z"
  },
  {
    _id: hexId("66700000000000000000", 6),
    employeeId: employees[11]._id, // Chloe Bennett
    attendanceId: attendance[50]._id, // Oct 16
    field: "checkOut",
    requestedTime: "2026-10-16T12:00:00.000Z",
    reason: "System rebooted before browser checkout button clicked.",
    status: "APPROVED",
    reviewedBy: users[0]._id,
    reviewedAt: "2026-10-16T13:30:00.000Z",
    reviewNote: "Confirmed with sprint planning sign-off time.",
    createdAt: "2026-10-16T12:45:00.000Z"
  },
  {
    _id: hexId("66700000000000000000", 7),
    employeeId: employees[5]._id, // David Miller
    attendanceId: attendance[75]._id, // Oct 15
    field: "checkIn",
    requestedTime: "2026-10-15T03:20:00.000Z",
    reason: "Badge reader glitch at underground parking elevator.",
    status: "APPROVED",
    reviewedBy: users[0]._id,
    reviewedAt: "2026-10-15T04:15:00.000Z",
    reviewNote: "Parking gate timestamp matches entry.",
    createdAt: "2026-10-15T03:50:00.000Z"
  },
  {
    _id: hexId("66700000000000000000", 8),
    employeeId: employees[2]._id, // Emily Watson
    attendanceId: attendance[100]._id, // Oct 14
    field: "checkOut",
    requestedTime: "2026-10-14T11:45:00.000Z",
    reason: "Interview panel ran overtime till evening; forgot manual checkout.",
    status: "APPROVED",
    reviewedBy: users[0]._id,
    reviewedAt: "2026-10-14T12:30:00.000Z",
    reviewNote: "Interview room booking confirms schedule.",
    createdAt: "2026-10-14T12:00:00.000Z"
  },
  {
    _id: hexId("66700000000000000000", 9),
    employeeId: employees[23]._id, // Kevin Park
    attendanceId: attendance[125]._id, // Oct 13
    field: "checkIn",
    requestedTime: "2026-10-13T03:15:00.000Z",
    reason: "Server rack emergency maintenance before normal office opening hours.",
    status: "APPROVED",
    reviewedBy: users[0]._id,
    reviewedAt: "2026-10-13T06:00:00.000Z",
    reviewNote: "Datacenter badge log verified.",
    createdAt: "2026-10-13T04:30:00.000Z"
  },

  // 3 Rejected requests
  {
    _id: hexId("66700000000000000000", 10),
    employeeId: employees[7]._id, // Alex Rivera
    attendanceId: attendance[32]._id,
    field: "checkOut",
    requestedTime: "2026-10-16T14:30:00.000Z",
    reason: "Requested overtime departure time after remote data sync monitoring.",
    status: "REJECTED",
    reviewedBy: users[0]._id,
    reviewedAt: "2026-10-17T04:30:00.000Z",
    reviewNote: "Overtime requires pre-authorization from department manager.",
    createdAt: "2026-10-16T15:00:00.000Z"
  },
  {
    _id: hexId("66700000000000000000", 11),
    employeeId: employees[8]._id, // Liam Wilson
    attendanceId: attendance[58]._id,
    field: "checkOut",
    requestedTime: "2026-10-15T15:00:00.000Z",
    reason: "Late client entertainment dinner checkout time correction.",
    status: "REJECTED",
    reviewedBy: users[0]._id,
    reviewedAt: "2026-10-16T04:00:00.000Z",
    reviewNote: "Client dinner hours should be filed as expense report rather than office shift.",
    createdAt: "2026-10-15T15:30:00.000Z"
  },
  {
    _id: hexId("66700000000000000000", 12),
    employeeId: employees[24]._id, // Aaron Brooks
    attendanceId: attendance[74]._id,
    field: "checkIn",
    requestedTime: "2026-10-14T03:00:00.000Z",
    reason: "Early morning shipment receipt.",
    status: "REJECTED",
    reviewedBy: users[0]._id,
    reviewedAt: "2026-10-14T05:00:00.000Z",
    reviewNote: "Delivery invoice shows vendor arrived at 09:30 AM IST.",
    createdAt: "2026-10-14T04:00:00.000Z"
  }
];

console.log(`Generated ${attendanceCorrections.length} Attendance Corrections.`);

// Generate Payslips for all 25 employees across 2 months (Month 9 Sep & Month 8 Aug) = 50 payslips
const payslips = [];
let payIdCounter = 1;

employees.forEach((emp) => {
  // Month 9 (September 2026)
  payslips.push({
    _id: hexId("66b00000000000000000", payIdCounter++),
    employeeId: emp._id,
    month: 9,
    year: 2026,
    basicSalary: emp.basicSalary,
    allowances: emp.allowances,
    deductions: emp.deductions,
    netSalary: emp.basicSalary + emp.allowances - emp.deductions,
    createdAt: "2026-10-01T04:30:00.000Z"
  });

  // Month 8 (August 2026)
  payslips.push({
    _id: hexId("66b00000000000000000", payIdCounter++),
    employeeId: emp._id,
    month: 8,
    year: 2026,
    basicSalary: emp.basicSalary,
    allowances: emp.allowances,
    deductions: emp.deductions,
    netSalary: emp.basicSalary + emp.allowances - emp.deductions,
    createdAt: "2026-09-01T04:30:00.000Z"
  });
});

console.log(`Generated ${payslips.length} Payslips for ${employees.length} employees.`);

// Generate 7 Company Announcements
const announcements = [
  {
    _id: hexId("66800000000000000000", 1),
    title: "StaffFlow 2026 Q4 All-Hands & Product Roadmap Presentation",
    message: "Join us this Friday at 3:00 PM IST for our quarterly all-hands meeting. We will review Q3 achievements, showcase key roadmap milestones across engineering and product, and celebrate top team performers. Google Meet link will be shared via calendar invitation.",
    createdBy: users[0]._id,
    expiresAt: null,
    createdAt: "2026-10-18T09:30:00.000Z"
  },
  {
    _id: hexId("66800000000000000000", 2),
    title: "Updated Hybrid Work & Core Collaboration Hours Policy",
    message: "Please review the updated policy in the Documents section. Core collaboration hours are 10:00 AM – 4:00 PM IST. Teams should coordinate in-office sync days directly with their department leads. Contact Emily Watson in HR for any inquiries.",
    createdBy: users[0]._id,
    expiresAt: null,
    createdAt: "2026-10-16T08:00:00.000Z"
  },
  {
    _id: hexId("66800000000000000000", 3),
    title: "Annual Benefits Enrollment & Health Insurance Window Open",
    message: "The annual window for updating dependent coverage, health insurance riders, and wellness allowances is open until next Friday. Please review the Benefits Summary document in the Documents section and submit any changes through the HR portal.",
    createdBy: users[0]._id,
    expiresAt: "2026-11-15T23:59:59.999Z",
    createdAt: "2026-10-12T04:30:00.000Z"
  },
  {
    _id: hexId("66800000000000000000", 4),
    title: "Scheduled Infrastructure Maintenance & IT Badge Firmware Update",
    message: "IT will be performing scheduled network switch and badge-reader firmware updates this Saturday between 10:00 PM and 2:00 AM IST. Internal VPN connections and automated door access will undergo brief rolling restarts during this maintenance window.",
    createdBy: users[0]._id,
    expiresAt: "2026-10-31T23:59:59.999Z",
    createdAt: "2026-10-19T11:15:00.000Z"
  },
  {
    _id: hexId("66800000000000000000", 5),
    title: "StaffFlow Annual Innovation Hackathon 2026 - Registration Open",
    message: "Gear up for our annual 48-hour innovation hackathon scheduled for November 12-14! Cross-functional teams across Engineering, Product, Design, and Marketing can submit problem statements and prototypes. Grand prizes include learning stipends and fast-track product incubation.",
    createdBy: users[0]._id,
    expiresAt: "2026-11-14T23:59:59.999Z",
    createdAt: "2026-10-15T14:00:00.000Z"
  },
  {
    _id: hexId("66800000000000000000", 6),
    title: "Workplace Mental Health & Confidential Counseling Sessions",
    message: "As part of our commitment to employee wellbeing, free 1-on-1 confidential counseling sessions with accredited psychologists are available every Wednesday and Friday. Appointments can be scheduled discreetly through the Employee Assistance Program portal.",
    createdBy: users[0]._id,
    expiresAt: null,
    createdAt: "2026-10-09T10:00:00.000Z"
  },
  {
    _id: hexId("66800000000000000000", 7),
    title: "Annual Corporate Year-End Gala & Awards Evening - Save the Date",
    message: "Mark your calendars for Friday, December 18, 2026! We will celebrate our collective milestones with a black-tie evening, awards ceremony, live music, and dinner banquet. Formal RSVP links will open next week.",
    createdBy: users[0]._id,
    expiresAt: "2026-12-19T23:59:59.999Z",
    createdAt: "2026-10-05T09:00:00.000Z"
  }
];

console.log(`Generated ${announcements.length} Company Announcements.`);

// Generate 16 Employee Documents & Policies
const docSpecs = [
  // 6 Company Policies (audience: ALL)
  {
    id: 1, empId: null, audience: "ALL", category: "POLICY",
    title: "StaffFlow Code of Conduct & Remote Work Policy (2026)",
    fileName: "StaffFlow_Code_of_Conduct_2026.pdf",
    subtitle: "Official Organization Guidelines · Effective January 2026",
    lines: [
      "1. Overview: This policy establishes expectations for professional conduct and remote flexibility.",
      "2. Core Collaboration Hours: Teams are expected to be reachable between 10:00 AM and 4:00 PM IST.",
      "3. Information Security: All company devices must have disk encryption and password management active.",
      "4. Attendance & Communication: Log daily shift hours via StaffFlow and sync schedules with team leads.",
      "5. Compliance & Ethics: Zero tolerance for harassment, discrimination, or unauthorized data sharing."
    ]
  },
  {
    id: 2, empId: null, audience: "ALL", category: "POLICY",
    title: "Information Security & Data Protection Guidelines",
    fileName: "StaffFlow_InfoSec_Guidelines_2026.pdf",
    subtitle: "Cybersecurity & Compliance Standard · Version 3.2",
    lines: [
      "1. Access Control: Two-factor authentication (2FA) is mandatory across all internal cloud systems.",
      "2. Client Confidentiality: Customer and proprietary database records must never be exported locally.",
      "3. Incident Reporting: Suspected phishing attempts or security incidents must be reported to IT immediately.",
      "4. Password Policy: Passwords must be updated periodically and never shared across team members.",
      "5. Audit & Compliance: Periodic access reviews are conducted quarterly by the IT and security team."
    ]
  },
  {
    id: 3, empId: null, audience: "ALL", category: "POLICY",
    title: "Annual Health & Wellness Benefits Guide 2026",
    fileName: "StaffFlow_Health_Benefits_Guide_2026.pdf",
    subtitle: "Employee Benefits Summary & Claim Procedure",
    lines: [
      "1. Comprehensive Medical Insurance: Up to $50,000 family floater hospitalization coverage.",
      "2. Wellness Stipend: Annual $600 reimbursement for fitness memberships and ergonomic home office gear.",
      "3. Preventive Health Checkups: Annual diagnostic packages covered 100% at partner health centers.",
      "4. Mental Health Assistance: 24/7 confidential counseling services available to all full-time employees.",
      "5. Claim Submissions: Submit cashless or reimbursement claims via the HR portal with hospital bills."
    ]
  },
  {
    id: 4, empId: null, audience: "ALL", category: "POLICY",
    title: "Intellectual Property & Confidentiality Agreement Standard",
    fileName: "StaffFlow_IP_Confidentiality_Agreement.pdf",
    subtitle: "Legal & Corporate Governance · Standard Agreement",
    lines: [
      "1. Proprietary Information: All software code, designs, business logic, and patents remain company IP.",
      "2. Non-Disclosure: Confidential business metrics and customer data shall not be shared with external parties.",
      "3. Open Source Usage: Third-party libraries must comply with permissive licenses approved by Engineering.",
      "4. Inventions Assignment: Inventions developed in course of employment belong exclusively to the enterprise.",
      "5. Term & Survival: Obligations remain binding post-separation of employment."
    ]
  },
  {
    id: 5, empId: null, audience: "ALL", category: "POLICY",
    title: "Travel & Expense Reimbursement Policy 2026",
    fileName: "StaffFlow_Travel_Expense_Policy_2026.pdf",
    subtitle: "Finance & Accounts Department · Fiscal Policy",
    lines: [
      "1. Eligible Expenses: Pre-approved client travel, conference flights, lodging, and client dinners.",
      "2. Per Diem & Meals: Standard $75 per diem cap applies for domestic travel; $120 for international travel.",
      "3. Receipts Required: All claims above $20 require itemized tax invoice receipts.",
      "4. Claim Deadlines: Submit expense reports within 15 calendar days following travel completion.",
      "5. Reimbursement Cycle: Approved claims are disbursed on the 10th of every calendar month."
    ]
  },
  {
    id: 6, empId: null, audience: "ALL", category: "POLICY",
    title: "Emergency Preparedness & Workplace Safety Protocol",
    fileName: "StaffFlow_Workplace_Safety_Protocol.pdf",
    subtitle: "Operations & Facilities Division · Safety Standard",
    lines: [
      "1. Fire & Evacuation: Familiarize yourself with emergency exit stairwells and assembly point A.",
      "2. First Aid: First aid kits and automated external defibrillators (AED) are located at every floor lobby.",
      "3. Incident Logging: Report workplace safety hazards or slip incidents immediately to Facilities.",
      "4. Ergonomics: Request an ergonomic desk assessment or dual-monitor arm via IT helpdesk.",
      "5. Contact Numbers: Facilities Emergency Hotline: x4444 | Medical Emergency: x911."
    ]
  },

  // 10 Employee-Specific Documents (audience: EMPLOYEE)
  {
    id: 7, empId: employees[0]._id, audience: "EMPLOYEE", category: "OFFER_LETTER",
    title: "Employment Offer Letter & Terms - Sarah Jenkins",
    fileName: "Offer_Letter_Sarah_Jenkins.pdf",
    subtitle: "Confidential Employment Agreement · Engineering Division",
    lines: [
      "Candidate: Sarah Jenkins | Position: Senior Full Stack Engineer | Department: Engineering",
      "Base Compensation: $95,000 per annum | Allowances: $8,000 | Annual Quota: 18 Annual, 12 Sick, 12 Casual",
      "Reporting Manager: Director of Engineering | Location: Hybrid (Office & Remote)",
      "We are delighted to welcome you to the StaffFlow technical engineering and architecture team.",
      "This letter confirms the terms and mutual agreement of your full-time executive employment."
    ]
  },
  {
    id: 8, empId: employees[0]._id, audience: "EMPLOYEE", category: "TAX_FORM",
    title: "Form W-4 / Form 16 Tax Withholding Declaration 2026 - Sarah Jenkins",
    fileName: "Tax_Declaration_2026_Sarah_Jenkins.pdf",
    subtitle: "Payroll & Tax Compliance Division · Fiscal Year 2026-27",
    lines: [
      "Employee: Sarah Jenkins | Employee ID: 66e000000000000000000001 | Filing Status: Individual",
      "Standard Tax Deduction: Applied | Section 80C / 401(k) Investment Declaration: Confirmed",
      "Health Insurance Premium Exemption: Verified under Section 80D / Qualified Health Plan.",
      "Net Tax Withholding Schedule: Reflected monthly in issued payroll payslips.",
      "This document serves as proof of annual voluntary deductions and statutory payroll declarations."
    ]
  },
  {
    id: 9, empId: employees[0]._id, audience: "EMPLOYEE", category: "OTHER",
    title: "Annual Performance Appraisal & Merit Bonus Letter - Sarah Jenkins",
    fileName: "Performance_Bonus_Sarah_Jenkins.pdf",
    subtitle: "People & Culture Recognition · Annual Review",
    lines: [
      "Recipient: Sarah Jenkins | Performance Rating: Exceptional (Exceeds Expectations 4.9/5)",
      "Key Contributions: Modernized UI architecture, attendance correction engine, and API stability.",
      "Merit Bonus: 12% performance bonus awarded and scheduled for disbursement with October payroll.",
      "Thank you for your relentless dedication, peer mentorship, and engineering excellence.",
      "Approved by: HR People Partner & Engineering Leadership."
    ]
  },
  {
    id: 10, empId: employees[1]._id, audience: "EMPLOYEE", category: "OFFER_LETTER",
    title: "Employment Offer Letter & Terms - John Doe",
    fileName: "Offer_Letter_John_Doe.pdf",
    subtitle: "Confidential Employment Agreement · Product Division",
    lines: [
      "Candidate: John Doe | Position: Lead Product Manager | Department: Product Management",
      "Base Compensation: $90,000 per annum | Allowances: $7,500 | Quota: 18 Annual, 12 Sick, 12 Casual",
      "Reporting Manager: VP of Product | Location: Hybrid",
      "We are thrilled to bring your product vision and strategic execution to StaffFlow.",
      "This document confirms acceptance of standard employment conditions and IP agreements."
    ]
  },
  {
    id: 11, empId: employees[1]._id, audience: "EMPLOYEE", category: "TAX_FORM",
    title: "Form W-4 / Form 16 Tax Withholding Declaration 2026 - John Doe",
    fileName: "Tax_Declaration_2026_John_Doe.pdf",
    subtitle: "Payroll & Tax Compliance Division · Fiscal Year 2026-27",
    lines: [
      "Employee: John Doe | Employee ID: 66e000000000000000000002 | Filing Status: Married Joint",
      "Standard Tax Deduction: Applied | Voluntary Retirement Contribution: 6% matched",
      "Document archived for statutory payroll reporting and internal tax audits.",
      "Issued by: StaffFlow Corporate Finance & Payroll."
    ]
  },
  {
    id: 12, empId: employees[10]._id, audience: "EMPLOYEE", category: "OFFER_LETTER",
    title: "Employment Offer Letter & Terms - Marcus Vance",
    fileName: "Offer_Letter_Marcus_Vance.pdf",
    subtitle: "Confidential Employment Agreement · Engineering Division",
    lines: [
      "Candidate: Marcus Vance | Position: Staff Backend Engineer | Department: Engineering",
      "Base Compensation: $110,000 per annum | Allowances: $9,000 | Quota: 18 Annual, 12 Sick, 12 Casual",
      "Reporting Manager: Director of Engineering | Location: Remote/Hybrid",
      "Welcome to StaffFlow to lead high-concurrency microservice architectures."
    ]
  },
  {
    id: 13, empId: employees[2]._id, audience: "EMPLOYEE", category: "TAX_FORM",
    title: "Tax Withholding & Exemption Form - Emily Watson",
    fileName: "Tax_Form_Emily_Watson.pdf",
    subtitle: "Payroll & Tax Compliance Division · Fiscal Year 2026-27",
    lines: [
      "Employee: Emily Watson | Department: Human Resources | Status: Active Exempt",
      "Annual Deductions Declared: Life Insurance, Pension Fund, Medical Allowance.",
      "Document audited and archived for statutory payroll reporting.",
      "Issued by: StaffFlow Finance & Corporate Compliance."
    ]
  },
  {
    id: 14, empId: employees[15]._id, audience: "EMPLOYEE", category: "OFFER_LETTER",
    title: "Employment Offer Letter & Terms - Elena Rostova",
    fileName: "Offer_Letter_Elena_Rostova.pdf",
    subtitle: "Confidential Employment Agreement · Design Division",
    lines: [
      "Candidate: Elena Rostova | Position: Lead UX Researcher | Department: Design",
      "Base Compensation: $88,000 per annum | Allowances: $7,000 | Quota: 18 Annual, 12 Sick, 12 Casual",
      "Reporting Manager: Head of Product Design | Location: Hybrid",
      "Confirmed terms of executive employment and intellectual property assignment."
    ]
  },
  {
    id: 15, empId: employees[5]._id, audience: "EMPLOYEE", category: "TAX_FORM",
    title: "Form W-4 / Form 16 Tax Withholding Declaration 2026 - David Miller",
    fileName: "Tax_Declaration_David_Miller.pdf",
    subtitle: "Payroll & Tax Compliance Division · Fiscal Year 2026-27",
    lines: [
      "Employee: David Miller | Department: Finance | Position: Senior Financial Analyst",
      "Standard Deduction & Corporate Investment Portfolio Declaration Confirmed.",
      "Issued by: StaffFlow Corporate Treasury & Tax Administration."
    ]
  },
  {
    id: 16, empId: employees[4]._id, audience: "EMPLOYEE", category: "OTHER",
    title: "Annual Performance Appraisal & Merit Bonus Letter - Priya Patel",
    fileName: "Performance_Bonus_Priya_Patel.pdf",
    subtitle: "People & Culture Recognition · Annual Review",
    lines: [
      "Recipient: Priya Patel | Performance Rating: Outstanding (4.8/5)",
      "Key Contributions: Spearheaded customer acquisition growth and marketing pipeline expansion.",
      "Merit Bonus: 10% performance bonus approved by leadership.",
      "Approved by: VP of Marketing & People Operations."
    ]
  }
];

const employeeDocuments = docSpecs.map((s) => {
  const buf = createSimplePdf(s.title, s.subtitle, s.lines);
  return {
    _id: hexId("66900000000000000000", s.id),
    employeeId: s.empId,
    audience: s.audience,
    category: s.category,
    title: s.title,
    fileName: s.fileName,
    fileSize: buf.length,
    contentBase64: buf.toString("base64"),
    uploadedBy: users[0]._id,
    createdAt: "2026-10-10T10:00:00.000Z"
  };
});

console.log(`Generated ${employeeDocuments.length} Employee Documents & Policies with valid PDF streams.`);

// Write all datasets to data/
fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2));
fs.writeFileSync(path.join(dataDir, 'employees.json'), JSON.stringify(employees, null, 2));
fs.writeFileSync(path.join(dataDir, 'attendance.json'), JSON.stringify(attendance, null, 2));
fs.writeFileSync(path.join(dataDir, 'leaveApplications.json'), JSON.stringify(leaves, null, 2));
fs.writeFileSync(path.join(dataDir, 'attendanceCorrections.json'), JSON.stringify(attendanceCorrections, null, 2));
fs.writeFileSync(path.join(dataDir, 'payslips.json'), JSON.stringify(payslips, null, 2));
fs.writeFileSync(path.join(dataDir, 'announcements.json'), JSON.stringify(announcements, null, 2));
fs.writeFileSync(path.join(dataDir, 'employeeDocuments.json'), JSON.stringify(employeeDocuments, null, 2));

console.log('✅ ALL BULK DATASETS SUCCESSFULLY WRITTEN TO demo-database/data/ !');
