# StaffFlow

**A full-stack employee management system for everyday HR operations.** StaffFlow brings employee records, attendance, leave, payroll, announcements, and company documents together in one responsive workspace, with separate experiences for administrators and employees.

[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D%2020.19-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![AI](https://img.shields.io/badge/AI-OpenRouter-7C3AED)](https://openrouter.ai/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](server/package.json)

**Live demo:** [Open StaffFlow](https://employee-managment-system-6ohy.vercel.app/login) · **Source:** [GitHub repository](https://github.com/Alok14x14/Employee-Managment-System)

> The public demo is shared. Use demo credentials only and do not enter real employee or payroll information.

## What you can do

### Admins

- Review workforce, attendance, pending leave, and department summaries on the dashboard.
- Create, edit, search, filter, and archive employee accounts while retaining historical records.
- Open an employee profile with employment and compensation details plus recent attendance, leave, payslip, and document records.
- Browse employee rosters by department and manage organization holidays.
- Review today's attendance, including late arrivals and open shifts; review employee attendance correction requests.
- Search the admin activity log to review changes and outcomes across HR operations.
- Approve or reject leave requests, with a reason required for rejection.
- Publish company announcements and upload or remove employee documents and policy PDFs.
- Generate monthly payslips with salary components, allowances, and deductions.

### Employees

- Clock in and out, view a live shift timer, and review attendance by month or in a log.
- Request Sick, Casual, or Annual leave and check working-day calculations and balances.
- Request an attendance correction and track its review status.
- View payslips and print or save them as PDF.
- Read company announcements and access shared or assigned documents.
- Use the HR assistant for policy and process questions, and optionally get help clarifying a leave reason.
- Update profile details and change a password.

The interface supports light and dark themes and adapts to smaller screens. Role checks are enforced in both the client routes and server middleware.

## AI features

StaffFlow integrates **OpenRouter-powered generative AI** in two employee-facing tools:

- **AI HR assistant:** employees can ask how-to and policy questions about StaffFlow. The assistant is grounded in the HR guidance configured by the project and can explain general leave and attendance rules.
- **AI leave reason helper:** employees can ask AI to make their own draft reason clearer and more professional. The result is returned to the editable form for review; the employee decides whether to submit it.

The model is called from the server, so the OpenRouter key is never placed in the browser. The assistant receives its conversation and fixed HR guidance, not employee database records, personal leave balances, attendance history, or payslip details. The leave helper sends the selected leave category and the employee-entered draft text to OpenRouter. It rewrites only the stated facts and does not submit a request or judge eligibility. AI output can be wrong: employees should check it, avoid including sensitive medical details, and use the relevant StaffFlow page or HR administrator for personal records and decisions.

To enable these features, configure `OPENROUTER_API_KEY` in `server/.env` and in the server hosting environment. Optionally set `OPENROUTER_MODEL` (default: `openai/gpt-4o-mini`) and `OPENROUTER_SITE_URL`. Without an API key, the rest of StaffFlow can run, but AI requests return a configuration message.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `admin123` |
| Employee | `sarah.jenkins@example.com` | `password123` |

Newly seeded admin accounts require a password change at first sign-in. The public demo may use a different setup.

## Technology

| Area | Stack |
|---|---|
| Web client | React 19, Vite, React Router, Tailwind CSS, Recharts, Axios |
| API | Node.js, Express 5, Mongoose |
| Database | MongoDB (Atlas recommended) |
| Authentication | JWT, bcrypt, role-based middleware, token versioning |
| Jobs | Inngest events and scheduled functions |
| Cache | Optional Upstash Redis dashboard cache |
| Email | Nodemailer with SMTP (Brevo compatible) |
| Hosting | Vercel-ready client and server projects |

## Run locally

### Requirements

- Node.js `>=20.19` and npm.
- MongoDB Atlas or a local MongoDB replica set. The application uses transactions, so a standalone local MongoDB server is not sufficient.
- Optional integrations: SMTP for email, Inngest for background jobs, and an OpenRouter API key for AI-assisted HR features.

### 1. Install dependencies

From the repository root:

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure the server

Copy `server/.env.example` to `server/.env`, then set the MongoDB URI and a strong JWT secret. For local development, the defaults below expect the client on port `5173` and API on port `4000`.

```env
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=<use-a-long-random-secret>
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@example.com

# Optional: dashboard response cache
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional: Inngest background jobs
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Optional: SMTP email
SMTP_USER=
SMTP_PASS=
SENDER_EMAIL=

# Optional: HR assistant and leave reason helper
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_SITE_URL=
```

Keep `.env` files and API keys private. SMTP, Inngest, Upstash Redis, and OpenRouter settings can remain unset if you do not need those features locally.

### 3. Configure the client

Create `client/.env`:

```env
VITE_BASE_URL=http://localhost:4000
```

### 4. Add starter data

For a single admin account (temporary password `admin123`; change it on first sign-in):

```bash
cd server
npm run seed
```

Or, from the repository root, load the complete demo dataset:

```bash
node demo-database/seed.js           # dates adjusted relative to today
node demo-database/seed.js --static   # use dates as stored in the JSON files
node demo-database/seed.js --force    # replace existing demo records, then seed
```

The demo seed script uses `server/.env`'s `MONGODB_URI` by default. To clear seeded demo records, run `node demo-database/clear.js` from the root. See [demo-database/README.md](demo-database/README.md) for the included accounts and seed data details.

### 5. Start the app

Open two terminals from the repository root:

```bash
cd server
npm run server
```

```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API listens at [http://localhost:4000](http://localhost:4000).

To run the Inngest development server as well, use a third terminal:

```bash
npx inngest-cli@latest dev -u http://localhost:4000/api/inngest
```

## Application rules and automation

- Business-day calculations use `Asia/Kolkata` (IST). Weekends, configured holidays, and approved leave days are excluded from applicable attendance and leave calculations.
- Clock-ins after 9:00 AM IST are marked late. Attendance day types are based on hours worked: Full Day at 8+ hours, Three Quarter Day at 6+, Half Day at 4+, otherwise Short Day.
- Open shifts receive a reminder after 9 hours and are automatically checked out after 10 hours. Past unrecorded working days can be marked absent.
- Leave quotas are Sick 12 days, Casual 12 days, and Annual 18 days. Working-day calculations exclude weekends and configured holidays; quota is checked again on approval.
- Employees whose account is archived or whose employment status is not Active cannot sign in or continue using the API. Administrator accounts cannot be archived through employee management.
- Admin actions are recorded in the activity log with their outcome and relevant change details. Logs expire after one year.
- Inngest handles shift reminders and auto-checkout, pending-leave reminders and expiry, weekday attendance reminders, and absence processing. Scheduled automation requires Inngest to be configured and connected to `/api/inngest`.

## API map

All API routes use the `/api` prefix. Protected routes require `Authorization: Bearer <token>`.

| Area | Example endpoints |
|---|---|
| Authentication | `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/session`, `POST /auth/change-password` |
| Employees and profile | `GET/POST /employees`, `GET /employees/:id/details`, `PUT/DELETE /employees/:id`, `GET/POST /profile` |
| Attendance | `POST /attendance`, `GET /attendance`, `GET /attendance/admin/today`, `GET/POST /attendance/corrections`, `PATCH /attendance/corrections/:id` |
| Leave | `POST /leave`, `GET /leave`, `GET /leave/balance`, `PATCH/DELETE /leave/:id` |
| Payslips | `POST /payslips`, `GET /payslips`, `GET /payslips/:id` |
| Holidays | `GET /holidays`, `POST /holidays`, `DELETE /holidays/:id` |
| Documents | `GET/POST /documents`, `GET /documents/:id/content`, `DELETE /documents/:id` |
| Announcements | `GET/POST /announcements`, `DELETE /announcements/:id` |
| Admin activity | `GET /audit-logs?page=&limit=&search=` |
| Dashboard and assistant | `GET /dashboard`, `POST /hr-assistant/chat`, `POST /hr-assistant/leave-draft` |

Admin-only operations are identified by server-side role middleware. Employee and audit-log lists support pagination; employee and audit-log endpoints support search. Document uploads accept PDF files up to 5 MB.

## Deployment

The repository is structured for two Vercel projects:

1. Deploy `client/` as the frontend and set `VITE_BASE_URL` to the deployed API URL.
2. Deploy `server/` as the API and configure the variables in `server/.env.example`. Set `CLIENT_URL` to the frontend origin (comma-separated when allowing multiple origins).
3. Connect the Inngest app to `https://<api-domain>/api/inngest` to run production events and schedules.
4. Configure MongoDB Atlas network access for the deployment environment.

## Useful maintenance commands

Run these from `server/`:

```bash
npm run close:unclosed-attendance
npm run reject:expired-leaves
npm run backfill:leave-days
npm run backfill:audit-retention
npm run lowercase:emails
```

## Project layout

```text
client/              React application, pages, components, and API client
server/              Express API, controllers, models, jobs, and utilities
demo-database/       JSON fixtures and demo seed/clear scripts
docs/screenshots/    README product screenshots
```

## Screenshots

### Admin portal

![StaffFlow admin dashboard and review queue](docs/screenshots/Admin-portal/Screenshot%202026-10-20%20192409.png)

![StaffFlow admin portal screenshot](docs/screenshots/Admin-portal/Screenshot%202026-10-20%20192423.png)

![StaffFlow admin portal screenshot](docs/screenshots/Admin-portal/Screenshot%202026-10-20%20192433.png)

![StaffFlow admin portal screenshot](docs/screenshots/Admin-portal/Screenshot%202026-10-20%20192441.png)

![StaffFlow admin portal screenshot](docs/screenshots/Admin-portal/Screenshot%202026-10-20%20192451.png)

![StaffFlow admin portal screenshot](docs/screenshots/Admin-portal/Screenshot%202026-10-20%20192459.png)

![StaffFlow admin portal screenshot](docs/screenshots/Admin-portal/Screenshot%202026-10-20%20192508.png)

![StaffFlow admin portal screenshot](docs/screenshots/Admin-portal/Screenshot%202026-10-20%20192515.png)

![StaffFlow admin portal screenshot](docs/screenshots/Admin-portal/Screenshot%202026-10-20%20192526.png)

![StaffFlow admin portal screenshot](docs/screenshots/Admin-portal/Screenshot%202026-10-20%20192536.png)

### Employee portal

![StaffFlow employee dashboard](docs/screenshots/employee-portal/Screenshot%202026-10-20%20192802.png)

![StaffFlow employee portal screenshot](docs/screenshots/employee-portal/Screenshot%202026-10-20%20192813.png)

![StaffFlow employee portal screenshot](docs/screenshots/employee-portal/Screenshot%202026-10-20%20192833.png)

![StaffFlow employee portal screenshot](docs/screenshots/employee-portal/Screenshot%202026-10-20%20192845.png)

![StaffFlow employee portal screenshot](docs/screenshots/employee-portal/Screenshot%202026-10-20%20192855.png)

![StaffFlow employee portal screenshot](docs/screenshots/employee-portal/Screenshot%202026-10-20%20192906.png)

## Maintainer

**Alok** · B.Tech, Electronics and Communication Engineering, NIT Patna
