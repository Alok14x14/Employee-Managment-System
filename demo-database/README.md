# 🗄️ FullStack EMS - Demo Database

This directory contains pre-configured demo data, seed datasets in JSON format, and seeding scripts for the **FullStack Employee Management System (EMS)**.

It is designed to give you instant, realistic, and beautiful data across all frontend views and dashboards without modifying any existing application code.

---

## 🚀 Quick Start: How to Seed Demo Data

Make sure your MongoDB server or Atlas cluster is accessible (via `server/.env` `MONGODB_URI` or via command line).

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
> - By default, `node demo-database/seed.js` dynamically anchors attendance, leaves, and today's shift records to **today's date**. This ensures that the Admin Dashboard, 5-day attendance trend, and today's clock-in shift list immediately show active data!
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
| **Access** | Full organization dashboard, employee management, salary & payslips, leave approvals, shifts |

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
| [`attendance.json`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data/attendance.json) | Today's active shifts, past 7 days logged hours, and monthly calendars. | 22 records |
| [`leaveApplications.json`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data/leaveApplications.json) | Time-off requests in `PENDING`, `APPROVED`, and `REJECTED` states. | 8 applications |
| [`payslips.json`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data/payslips.json) | Monthly payslips with basic pay, allowances, deductions, and net salary. | 11 payslips |
| [`holidays.json`](file:///c:/Users/ASUS/Documents/FullStack-EMS/demo-database/data/holidays.json) | National and public holidays across the calendar year. | 10 holidays |

---

## 🖥️ What You'll See on the Frontend

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

3. **Employees Directory (`/employees`)**:
   - Comprehensive roster of employees across Engineering, Design, HR, Sales, etc.
   - Department filtering, search by name/position/email, salary and contact info.

4. **Attendance (`/attendance` & `/admin/attendance`)**:
   - Real-time today shift tracker: active clocked-in employees, checked-out records, late arrivals, and working hours.
   - Visual monthly calendar with color-coded day types (Full Day, Half Day, Late, Absent).

5. **Leave Management (`/leave`)**:
   - Pending requests ready for Admin approval / rejection.
   - Historical leave records categorized into Sick, Casual, and Annual leave.

6. **Payslips (`/payslips`)**:
   - Generated itemized payslips ready for viewing and printing.

7. **Holidays (`/holidays`)**:
   - Public holidays listed and displayed on the interactive holiday calendar.

---

## 🧹 Cleaning Up Demo Data

To safely remove only the demo data without affecting any other database records:

```bash
# From demo-database folder
npm run clear

# Or from workspace root
node demo-database/clear.js
```
