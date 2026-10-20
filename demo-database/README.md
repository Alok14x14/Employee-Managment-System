# 🗄️ StaffFlow - Demo Database

This directory contains pre-configured demo datasets in JSON format, seeding scripts, and cleanup utilities for the **FullStack Employee Management System (StaffFlow)**.

It is designed to give you instant, realistic, and comprehensive data across all frontend views, dashboards, and portals without modifying any application code.

---

## 🚀 Quick Start: How to Seed Demo Data

Make sure your MongoDB server or Atlas cluster is accessible (via `server/.env` `MONGODB_URI` or via command-line argument).

### Option 1: Run with NPM (from this folder)
```bash
cd demo-database
npm run seed
```

### Option 2: Run directly with Node (from workspace root)
```bash
node demo-database/seed.js
```

### Option 3: Connect to a custom MongoDB URI
```bash
node demo-database/seed.js "mongodb://localhost:27017/EMS"
```

> **Tip (Dynamic vs Static dates):**
> - By default, `node demo-database/seed.js` dynamically anchors attendance, leaves, today's shifts, attendance corrections, announcements, and payroll records relative to **today's date**. This ensures that the Admin Dashboard, 5-day attendance trend, today's shift tracker, and notification center immediately show active, fresh data!
> - If you prefer exact literal dates from the JSON files, run:
>   ```bash
>   node demo-database/seed.js --static
>   ```
> - To wipe previous demo data and re-insert fresh demo data:
>   ```bash
>   node demo-database/seed.js --force
>   ```

---

## 🔑 Demo Login Credentials

### 👑 Admin Account
| Field | Value |
|---|---|
| **Email** | `admin@example.com` |
| **Password** | `admin123` |
| **Role** | `ADMIN` |
| **Access** | Full organization dashboard, employee management, salary & payslips, leave approvals, attendance correction review, company announcements publisher, document management center |

---

### 👥 Employee Accounts
All employee accounts use the password: **`password123`**

| Name | Role / Position | Department | Email | Salary |
|---|---|---|---|---|
| **Sarah Jenkins** | Senior Full Stack Engineer | Engineering | `sarah.jenkins@example.com` | $95,000 |
| **John Doe** | Lead Product Manager | Product Management | `john.doe@example.com` | $90,000 |
| **Emily Watson** | HR People Partner | Human Resources | `emily.watson@example.com` | $72,000 |
| **Michael Chang** | Senior Product Designer | Design | `michael.chang@example.com` | $82,000 |
| **Priya Patel** | Growth Marketing Manager | Marketing | `priya.patel@example.com` | $78,000 |
| **David Miller** | Senior Financial Analyst | Finance | `david.miller@example.com` | $85,000 |
| **Jessica Taylor** | Customer Success Specialist | Customer Success | `jessica.taylor@example.com` | $64,000 |
| **Alex Rivera** | Cloud & DevOps Specialist | IT Support | `alex.rivera@example.com` | $92,000 |
| **Liam Wilson** | Enterprise Account Executive | Sales | `liam.wilson@example.com` | $70,000 |
| **Sophia Martinez** | Operations Manager | Operations | `sophia.martinez@example.com` | $76,000 |

---

## 📁 What's Inside `data/`

All raw datasets are stored as clean, structured JSON files in [`data/`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data):

| File | Description | Records |
|---|---|---|
| [`users.json`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data/users.json) | Admin and employee authentication records with bcrypt password hashes. | 11 users |
| [`employees.json`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data/employees.json) | Rich employee profiles across all 10 corporate departments. | 10 profiles |
| [`attendance.json`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data/attendance.json) | Today's active shifts, past 7 days logged hours, and monthly calendars. | 44 records |
| [`attendanceCorrections.json`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data/attendanceCorrections.json) | Correction requests for missed check-in/out times in `PENDING`, `APPROVED`, and `REJECTED` states. | 4 requests |
| [`announcements.json`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data/announcements.json) | Company-wide notices, town halls, and policy updates published by Admin. | 4 notices |
| [`employeeDocuments.json`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data/employeeDocuments.json) | Real valid PDF documents across Policies, Offer Letters, Tax Forms, and Reviews. | 8 documents |
| [`leaveApplications.json`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data/leaveApplications.json) | Time-off requests in `PENDING`, `APPROVED`, and `REJECTED` (including Auto-Rejected) states. | 9 applications |
| [`payslips.json`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data/payslips.json) | Monthly payslips with basic pay, allowances, deductions, and net salary. | 11 payslips |
| [`holidays.json`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data/holidays.json) | National and public holidays across the calendar year. | 10 holidays |

---

## 🖥️ What You'll See Across the Application

Once seeded and connected:

1. **Admin Dashboard (`/dashboard`)**:
   - Total Workforce Headcount & Department distribution breakdown chart.
   - Live **Today's Attendance** meter and 5-Day Attendance trend bar chart.
   - Pending leave approval count and badge alerts.
   - Recent employee hires and recent leave request widgets.

2. **Employee Dashboard (`/dashboard` as Employee)**:
   - Weekly logged hours chart (past 7 days).
   - Monthly attendance statistics and latest generated payslip summary.
   - Live clock-in / clock-out button with current shift timer.

3. **📢 Company Announcements (`/announcements`)**:
   - Organization-wide notices (All-Hands, Hybrid Work Policy, Benefits Enrollment, IT Maintenance).
   - Admin view with announcement publishing form and delete actions.
   - Employee view with rich formatted announcement cards and expiration indicators.

4. **📄 Documents & Company Policies (`/documents`)**:
   - Filterable document categories: **Company Policy**, **Offer Letter**, **Tax Form**, and **Other**.
   - Built-in inline PDF previewer modal with download capability.
   - Admin upload form supporting company-wide policies or employee-assigned documents.

5. **🕒 Attendance & Correction Requests (`/attendance` & `/admin/attendance`)**:
   - **Admin Attendance**: Real-time today shift tracker and **Pending Attendance Corrections** review widget with Approve & Reject action buttons.
   - **Employee Attendance**: Monthly calendar with color-coded day types (Full Day, Half Day, Late, Absent) and **Attendance Corrections** submission & status history.

6. **👥 Employee Directory (`/directory`)**:
   - Colleague roster with department filtering, instant search by name/position/email, and direct mailto links.

7. **💬 AI HR Assistant (`HrAssistant.jsx`)**:
   - Floating HR companion in the bottom right corner of the employee portal to answer policy, quota, and process questions.

8. **🔔 Notification Center**:
   - Sidebar notification bell displaying badge count and alerts for:
     - Open attendance checkout reminders
     - Company announcements
     - New documents and policy updates
     - Approved/rejected attendance corrections
     - Approved/rejected leave requests
     - Newly issued monthly payslips
     - Upcoming public holidays within the next 7 days

---

## 🧹 Cleaning Up Demo Data

To safely remove only the demo data without affecting any other database records:

```bash
# From demo-database folder
npm run clear

# Or from workspace root
node demo-database/clear.js
```
