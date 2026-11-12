# IIIT BHUBANESWAR – MESS MANAGEMENT SYSTEM
## Full-Stack Web Application | Final IWT Laboratory Project

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v24%2B-brightgreen)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite%20%28WAL%20Mode%29-blue)](https://www.sqlite.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Vanilla%20HTML%2FCSS%2FJS%20%2B%20Express-orange)]()
[![Tests](https://img.shields.io/badge/Tests-39%20Passed%20%7C%200%20Failed-success)]()

---

### 📖 PROJECT DESCRIPTION
The **IIIT Bhubaneswar Mess Management System** is a complete, production-quality academic web application developed for the Internet and Web Technology (IWT) laboratory examination. It digitizes the central dining facility of IIIT Bhubaneswar, offering students, mess staff, and wardens a unified platform to manage daily meal menus, dining attendance, student feedback, grievance tickets, monthly billing with leave rebates, payment records, and kitchen provisioning expenses.

The application follows an **Apple + Notion + modern SaaS aesthetic**: generous whitespace, refined typography, soft shadows, rounded cards, responsive layouts, and support for both Light and Dark modes.

---

### 🎯 OBJECTIVES & PROBLEM STATEMENT
- **Problem**: Traditional college mess systems rely on manual paper registers for attendance, opaque monthly bills, oral feedback, and lost complaint slips, resulting in long queues and reconciliation discrepancies.
- **Solution**: A centralized, secure, session-authenticated web portal that automates student billing, tracks dining check-ins in real-time, transparently displays menus, resolves student complaints with an audit trail, and provides administrators with live financial charts.

---

### 💻 TECHNOLOGY STACK (Zero External Cloud Dependencies)

#### Frontend
- **HTML5**: Semantic markup with clean structure.
- **CSS3**: Custom design system using CSS variables, Flexbox, Grid, soft elevation shadows, and responsive media queries.
- **Vanilla JavaScript (ES6+)**: Fetch API, dynamic DOM manipulation, hash routing, custom modals, and toast alerts.
- **Chart.js (v4.4)**: Bundled locally for offline financial and attendance analytics.
- **Lucide Icons**: Bundled locally for clean iconography.

#### Backend
- **Node.js & Express.js**: RESTful API design, modular routing, error handling middleware, and static asset delivery.
- **SQLite3 with `better-sqlite3`**: Fast, embedded relational database in Write-Ahead Logging (WAL) mode with foreign keys enabled.
- **bcryptjs**: Cryptographic password hashing (salt rounds = 10).
- **express-session**: Secure cookie-based server sessions with session fixation protection.

---

### 👥 USER ROLES & CAPABILITIES

| Role | Access Level | Key Capabilities |
| :--- | :--- | :--- |
| **Student** | Resident | View personalized dashboard, browse today's & weekly menus, rate meals (1-5 stars across 5 criteria), submit complaints, view bills with rebate line-items, make internal payments, view circulars & notifications. |
| **Admin** | Mess Warden / Committee | Full control: overall statistics, Chart.js analytics (revenue vs. expenses, turnout trends, ratings), student enrollment/deactivation, menu CRUD + duplicate day schedule, batch bill generation, rebate/fine adjustments, complaint resolution, expense tracking, circular broadcasts, and system settings. |
| **Mess Staff** | Catering Supervisor | Daily kitchen schedule, expected student headcounts, interactive meal attendance roster marking, and assigned maintenance tickets. |

---

### 🔑 DEMO LOGIN CREDENTIALS

The database comes pre-seeded with realistic academic data (22 students, 1 admin, 2 staff, 7 days of menus, bills, attendance, feedback, and expenses).

| Role | Email / Identifier | Password | Name |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@iiit-bh.ac.in` | `Admin@123` | Dr. Bibhuti Bhusan Pradhan (Mess Warden) |
| **Mess Staff** | `staff1@iiit-bh.ac.in` | `Staff@123` | Ramesh Chandra Jena (Mess Supervisor) |
| **Student** | `b121001@iiit-bh.ac.in` | `Student@123` | Aarav Sharma (Hostel-1, Room 101) |

> ⚡ **Quick Login Feature**: On the login page (`login.html`), click any of the **"1-Click Instant Demo Login"** buttons to auto-populate credentials and sign in immediately!

---

### 🚀 INSTALLATION & RUN INSTRUCTIONS

#### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v8.0.0 or higher)

#### 1. Clone or Open Project Directory
```bash
cd IIIT-Mess-Management
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Seed Database (Automatic on First Run or Manual)
```bash
# Force fresh re-seeding with sample data
npm run seed
```

#### 4. Run Automated Test Suite (39 Tests)
```bash
npm test
```

#### 5. Start the Web Server
```bash
npm start
```

#### 6. Open in Browser
Open your web browser and navigate to:
```
http://localhost:3000
```

---

### 📁 PROJECT STRUCTURE

```text
IIIT-Mess-Management/
├── package.json                   # Dependencies, test scripts & configuration
├── .env.example                   # Environment variable template
├── .gitignore                     # Git ignore rules (node_modules, data, logs)
├── README.md                      # Comprehensive project documentation
├── PROJECT_REPORT.md              # Academic IWT laboratory examination report
├── DATABASE_SCHEMA.md             # Entity Relationship & SQLite table schema
├── API_DOCUMENTATION.md           # REST API endpoint reference
│
├── data/                          # SQLite local database directory
│   └── mess.db                    # WAL-mode persistent database file
│
├── server/
│   ├── server.js                  # Main Express application & static server
│   ├── config/
│   │   └── database.js            # SQLite database connection & WAL settings
│   ├── middleware/
│   │   ├── auth.js                # Session authentication, RBAC & CSRF checks
│   │   └── errorHandler.js        # Centralized HTTP error handler
│   ├── utils/
│   │   └── date.js                # Unified ISO date formatting utilities
│   ├── database/
│   │   ├── schema.sql             # Relational DDL schema & indexes
│   │   ├── init.js                # Schema runner
│   │   └── seed.js                # Database seed script (22 students, menus, bills)
│   └── routes/
│       ├── auth.js                # Login, register, profile & logout APIs
│       ├── students.js            # Student management CRUD APIs
│       ├── menus.js               # Today, weekly & admin menu CRUD APIs
│       ├── attendance.js          # Meal attendance roster & summary APIs
│       ├── feedback.js            # Student ratings & quality averages APIs
│       ├── complaints.js          # Ticket management & resolution APIs
│       ├── billing.js             # Monthly billing, payment recording & CSV export
│       ├── expenses.js            # Provisioning & expense tracking APIs
│       ├── announcements.js       # Notice board & broadcast APIs
│       ├── notifications.js       # In-app alerts & unread counter APIs
│       ├── dashboard.js           # Student, Admin & Staff dashboard queries
│       └── settings.js            # Mess system settings APIs
│
├── public/                        # Client-side presentation tier
│   ├── index.html                 # Authenticated application shell (SPA)
│   ├── login.html                 # Login page with 1-click demo buttons
│   ├── register.html              # Student registration page
│   ├── assets/
│   │   └── logo.svg               # Vector brand logo
│   ├── vendor/
│   │   ├── chart.umd.min.js       # Bundled Chart.js for offline operation
│   │   └── lucide.min.js          # Bundled Lucide icons for offline operation
│   ├── css/
│   │   ├── main.css               # Design system, themes & app layout
│   │   ├── components.css         # Buttons, cards, modals, tables, toasts
│   │   ├── dashboard.css          # Metric cards, meal cards, timeline feeds
│   │   └── responsive.css         # Media queries for tablets & mobiles
│   └── js/
│       ├── api.js                 # Centralized Fetch wrapper with error handling
│       ├── ui.js                  # Toast notifications, modals & theme switcher
│       ├── auth.js                # User session management & profile modals
│       ├── navigation.js          # Client-side router (#dashboard, #menu, etc.)
│       ├── dashboard.js           # Student, Admin & Staff dashboard renderers
│       ├── menu.js                # Today, weekly & admin menu controller
│       ├── attendance.js          # Student attendance & staff roster marking
│       ├── feedback.js            # Star ratings & review modal controller
│       ├── complaints.js          # Grievance ticketing & resolution desk
│       ├── billing.js             # Invoicing, dues settlement & CSV export
│       ├── expenses.js            # Procurement vouchers & expense logger
│       ├── announcements.js       # Circular viewer & announcement publisher
│       ├── notifications.js       # Topbar notification dropdown & badge
│       ├── admin.js               # Student management & system configuration
│       ├── staff.js               # Kitchen desk operations controller
│       └── app.js                 # Application bootstrap & lifecycle manager
│
└── tests/
    └── api.test.js                # 39 end-to-end integration tests
```

---

### 🧪 TEST SUITE & VERIFICATION

The repository includes a standalone test suite (`tests/api.test.js`) requiring no external test runner. Run it with:

```bash
npm test
```

#### Workflows Tested
1. Student registration with input validation.
2. Student login and session creation.
3. Administrator login and RBAC verification.
4. Mess staff login and permissions check.
5. Logout and session invalidation.
6. Route protection against unauthorized access (HTTP 401 & 403).
7. Student personalized dashboard loading with database stats.
8. Daily menu creation with multi-dish lists.
9. Daily menu editing.
10. Menu deletion and cascade integrity.
11. Multi-metric student feedback and star ratings submission.
12. Complaint ticket creation with auto-generated ticket ID (`CMP-YYYY-XXX`).
13. Complaint status updates and official resolution notes.
14. Meal attendance marking and duplicate record prevention.
15. Batch monthly billing generation across hostel residents.
16. Internal payment recording and duplicate transaction reference prevention (HTTP 409).
17. Procurement expense creation and category breakdown.
18. Announcement publication and student broadcast notifications.
19. In-app notification reading and unread count decrement.
20. Student roster search and multi-parameter filtering.
21. Physical database persistence across server restarts.

---

### 🎨 DESIGN & USER EXPERIENCE HIGHLIGHTS
- **Apple & Notion Minimalism**: Monochromatic bases (`#F7F8FA` and `#171717`), high typographic hierarchy (Inter font stack), subtle borders (`#EAEAEA`), and soft shadows.
- **Light & Dark Theme**: Toggle anytime via the moon/sun icon in the topbar; selection is persisted in `localStorage`.
- **Zero Browser Alerts**: Replaced all native `alert()` and `confirm()` with custom modal dialogs and non-blocking toast notifications.
- **Responsive Layout**: Collapsible sidebar transforms into an off-canvas mobile drawer with backdrop overlay on screens smaller than 1024px.
- **Real Database Values**: No placeholder metrics or mock data—every statistic on the dashboard is calculated dynamically via SQL queries.

---

### 📜 LICENSE & ACADEMIC INTEGRITY
Developed as an academic laboratory project for **Internet and Web Technology (IWT)** at **IIIT Bhubaneswar**. Submitted for educational evaluation and demonstration purposes.
