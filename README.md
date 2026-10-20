# StaffFlow: Employee Management System

A full-stack MERN application for workforce operations: employee records, attendance tracking, leave management with quota rules, and payroll/payslips. It has separate Admin and Employee portals, background jobs for automation, and IST-aware date handling throughout.

**Live demo:** https://employee-managment-system-6ohy.vercel.app/login

**Source:** https://github.com/Alok14x14/Employee-Managment-System

---

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123` |
| Employee | `sarah.jenkins@example.com` | `password123` |

> The demo is shared and publicly reachable. Please don't store real data in it.

---

## Features

### Admin portal
- **Dashboard:** headcount, today's attendance, pending leaves, 5-day attendance trend, leave distribution, headcount by department.
- **Employees:** create, edit and archive (soft delete) employees; search and filter by department and status; archived staff lose access immediately.
- **Departments:** roster view grouped by department.
- **Today's attendance:** live view (auto-refreshes every 60s) of present, late, still working, checked out and not checked in.
- **Holidays:** manage organization holidays that feed into leave and attendance rules.
- **Leave governance:** approve or reject requests (rejection requires a reason); employees are notified by email.
- **Payslips:** generate monthly payslips with basic pay, allowances and deductions.

### Employee portal
- **Attendance:** one-click clock in/out with a live clock and elapsed timer, monthly calendar view and log view.
- **Leave:** apply for Sick (12d), Casual (12d) or Annual (18d) leave with a live working-day and balance calculator.
- **Payslips:** view issued payslips and download them as PDF (print-optimized A4 layout with the amount in words, INR format).
- **Settings:** edit bio and change password.

### Platform
- Light/dark theme (persisted, no flash on load), responsive layout, skeleton loaders.
- Role-based route guards on the client and role-checking middleware on the server.

---

## Business rules

**Attendance**
- Clock-in after 9:00 AM IST is marked `LATE`.
- Clock-in is blocked on weekends, public holidays and approved leave days.
- Day type is derived from hours worked: `>= 8h` Full Day, `>= 6h` Three Quarter Day, `>= 4h` Half Day, otherwise Short Day.
- A shift not closed after 9 hours triggers a reminder email, then an auto check-out after one more hour, recorded as a 4h Half Day (flagged `autoCheckedOut`).
- Missing past working days are recorded as `ABSENT`, excluding weekends, holidays and approved leave.

**Leave**
- Working days exclude weekends and configured holidays.
- A leave spanning two calendar years is charged to each year's quota separately.
- Overlap checks against existing `PENDING` and `APPROVED` leaves.
- Quota is re-validated at approval time, not just at application time.
- Pending leaves are auto-rejected once their start date passes.
- The admin is reminded by email if a request sits pending for 24h.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS v4, Recharts, Axios, date-fns, react-hot-toast, lucide-react |
| Backend | Node.js (>= 20.19), Express 5, Mongoose 9 |
| Database | MongoDB Atlas |
| Auth | JWT (7-day expiry), bcrypt, token versioning |
| Background jobs | Inngest (event-driven functions and crons) |
| Email | Nodemailer over Brevo SMTP |
| Security | Helmet, CORS allowlist, express-rate-limit |
| Hosting | Vercel (client and server as separate projects) |

---

## Architecture

```
┌──────────────┐   HTTPS / JSON    ┌──────────────────┐     ┌───────────────┐
│ React SPA    │ ────────────────► │ Express API      │ ──► │ MongoDB Atlas │
│ (Vercel)     │   Bearer JWT      │ (Vercel)         │     └───────────────┘
└──────────────┘                   │                  │
                                   │  /api/inngest ◄──┼──── Inngest (crons, delayed jobs)
                                   │                  │──► Brevo SMTP (emails)
                                   └──────────────────┘
```

### Background jobs (Inngest)

| Function | Trigger | Purpose |
|----------|---------|---------|
| `auto-check-out` | `employee/check-in` event | Reminder after 9h, auto check-out after 10h |
| `leave-application-reminder` | `leave/pending` event | Email admin if still pending after 24h |
| `auto-reject-leave` | `leave/pending` event | Reject at start date/time if no action |
| `attendance-reminder-cron` | 11:30 IST, Mon-Fri | Email employees who haven't checked in |
| `mark-absent-cron` | 23:59 IST, Mon-Fri | Create `ABSENT` records, close open shifts |
| `auto-reject-leaves-cron` | Hourly | Safety net for expired pending leaves |

---

## Design decisions

- **Session invalidation with `tokenVersion`.** Every JWT carries the user's token version. Password change or reset increments it, which instantly invalidates all previously issued tokens. The auth middleware also re-checks the user and employee on each request, so deactivated accounts lose access immediately.
- **Forced first-login password change.** Admin-created accounts and the seeded admin get `mustChangePassword`. A server middleware blocks every API except password change until it's done.
- **Password reset tokens are hashed.** Only a SHA-256 hash is stored, expiry is 15 minutes, and the endpoint returns the same response whether or not the email exists, to prevent user enumeration.
- **Everything is IST-aware.** Day boundaries are computed in `Asia/Kolkata` (`server/utils/time.js`) instead of the server's local time, so behavior is the same on a Vercel (UTC) server and on a laptop.
- **Soft deletes.** Archived employees keep their attendance, leave and payslip history.
- **Idempotent writes.** Unique indexes on `(employeeId, date)` for attendance and `(employeeId, month, year)` for payslips, with duplicate-key handling to survive double clicks and race conditions.
- **Atomic status transitions.** Leave approval uses `findOneAndUpdate({ status: "PENDING" })` so two admins can't process the same request twice.
- **Serverless-friendly DB connection.** The Mongo connection is cached and reused across invocations.

---

## Project structure

```
.
├── client/                    # React + Vite SPA
│   └── src/
│       ├── api/               # Axios instance + interceptors
│       ├── components/        # UI, attendance/, leave/, payslip/
│       ├── context/           # AuthContext, ThemeContext
│       ├── pages/             # Route-level pages
│       └── utils/             # Formatters (INR, IST), attendance helpers
├── server/
│   ├── config/                # DB + mailer
│   ├── constants/             # Departments, leave quotas
│   ├── controllers/           # Route handlers
│   ├── inngest/               # Background functions
│   ├── middleware/            # auth, role guards, rate limiting
│   ├── models/                # Mongoose schemas
│   ├── routes/
│   ├── scripts/               # Maintenance scripts
│   ├── utils/                 # time, holidays, leaveDays, email templates
│   └── server.js
└── demo-database/             # Seed data + seed/clear scripts
```

---

## API overview

All routes are prefixed with `/api` and use `Authorization: Bearer <token>` unless noted.

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/session`, `POST /auth/change-password` |
| Employees (admin) | `GET/POST /employees`, `PUT/DELETE /employees/:id` |
| Profile | `GET/POST /profile` |
| Attendance | `POST /attendance` (clock in/out), `GET /attendance?month=YYYY-MM`, `GET /attendance/admin/today` (admin) |
| Leave | `POST /leave`, `GET /leave`, `GET /leave/balance`, `PATCH /leave/:id` (admin) |
| Payslips | `POST /payslips` (admin), `GET /payslips`, `GET /payslips/:id` |
| Holidays | `GET /holidays?year=`, `POST /holidays` (admin), `DELETE /holidays/:id` (admin) |
| Dashboard | `GET /dashboard` |
| Meta | `GET /meta/departments` |

---

## Getting started

### Prerequisites
- Node.js >= 20.19
- A MongoDB replica set with transaction support (Atlas works; local MongoDB must be configured as a replica set)
- Optional: a Brevo SMTP account (emails) and an Inngest account (background jobs)

### 1. Clone and install
```bash
git clone "https://github.com/Alok14x14/Employee-Managment-System"
cd <repo-folder>

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

**`server/.env`** (see `server/.env.example`)
```env
PORT=4000
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/EMS"
JWT_SECRET="a-long-random-string"
CLIENT_URL="http://localhost:5173"
ADMIN_EMAIL="admin@example.com"
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""
SMTP_USER=""
SMTP_PASS=""
SENDER_EMAIL=""
```

**`client/.env`**
```env
VITE_BASE_URL=http://localhost:4000
```

### 3. Create data

Option A: create just an admin (temporary password `admin123`, must be changed on first login):
```bash
cd server
npm run seed
```

Option B: load the full demo dataset (10 employees, attendance, leaves, payslips, holidays):
```bash
node demo-database/seed.js            # dates anchored to today
node demo-database/seed.js --static   # exact dates from the JSON files
node demo-database/seed.js --force    # clear demo data, then re-seed
node demo-database/clear.js           # remove demo data only
```

### 4. Run
```bash
# terminal 1
cd server && npm run server

# terminal 2
cd client && npm run dev
```
The client runs at http://localhost:5173 and the API at http://localhost:4000.

### 5. (Optional) Run Inngest locally
```bash
npx inngest-cli@latest dev -u http://localhost:4000/api/inngest
```

### Maintenance scripts (`server/`)
```bash
npm run close:unclosed-attendance   # auto-close past open shifts
npm run reject:expired-leaves       # auto-reject expired pending leaves
npm run backfill:leave-days         # recompute workingDays on leaves
npm run lowercase:emails            # normalize stored emails
```

---

## Deployment

Both apps are deployed on Vercel as separate projects.

- **Client:** `client/vercel.json` rewrites all paths to `/` so React Router deep links work. Set `VITE_BASE_URL` to the server's URL.
- **Server:** `server/vercel.json` routes everything to `server.js` via `@vercel/node`. Set all variables from `.env.example`, with `CLIENT_URL` set to the client's URL (comma-separated if more than one).
- **Inngest:** register `https://<server-domain>/api/inngest` in the Inngest dashboard so crons and delayed jobs run in production.
- **Atlas:** allow Vercel's IPs in Network Access.

---

## Author

**Alok**, B.Tech in Electronics and Communication Engineering, NIT Patna
