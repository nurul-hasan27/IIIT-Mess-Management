# IIIT Bhubaneswar – Mess Management System
## 10-Minute Video Presentation & Demonstration Script
### Final Internet & Web Technology (IWT) Lab Project Examination

- **Project Title:** IIIT Bhubaneswar Central Mess Management & Dining Information System
- **Total Duration:** Exactly ~10 minutes (1,450 words at ~140 wpm)
- **Target Audience:** IWT Lab Examiners, External Evaluators, Faculty & Peer Reviewers
- **Student Presenter:** [Your Name / Roll No - e.g., B121001]
- **Live Demo URL:** `http://localhost:3000`

---

## Presentation Breakdown at a Glance

| Section | Topic | Screen / View | Time Range |
| :--- | :--- | :--- | :--- |
| **01** | Introduction, Problem Statement & Objectives | Login Page (`/login.html`) | `00:00 - 01:15` (1m 15s) |
| **02** | Tech Stack, Constraints & Design Philosophy | Login Page & Code Overview | `01:15 - 02:30` (1m 15s) |
| **03** | Student Portal Walkthrough | Student Dashboard, Menus, Feedback, Bills | `02:30 - 05:15` (2m 45s) |
| **04** | Kitchen Staff Operations Desk | Live Counter Attendance & Rosters | `05:15 - 06:45` (1m 30s) |
| **05** | Administrator Control Center & Analytics | Admin Dashboard, Charts, Student CRUD, Invoicing | `06:45 - 08:45` (2m 00s) |
| **06** | Code Architecture, Database & Test Suite | Terminal (`npm test`), SQLite, Project Structure | `08:45 - 09:30` (0m 45s) |
| **07** | Conclusion & Viva Summary | Dashboard & GitHub / Documentation | `09:30 - 10:00` (0m 30s) |

---

## Detailed Section-by-Section Script

---

### SECTION 1: Introduction & Problem Statement
⏱️ **Time:** `00:00 - 01:15` (75 seconds)  
🖥️ **On Screen:** Start on `http://localhost:3000/login.html` in full screen. Show the centered Notion-style login card with the 3D institutional bowl emblem and 1-Click Demo buttons.

> **🎙️ SPOKEN NARRATION:**
> 
> "Good morning, respected examiners and faculty members. Welcome to the demonstration of my final Internet and Web Technology laboratory project: **The IIIT Bhubaneswar Mess Management System**.
> 
> In institutional residential campuses like IIIT Bhubaneswar, managing hostel dining is a complex daily operation. Traditionally, mess systems rely on manual register entries, paper meal coupons, physical notice boards, and unorganized complaint registers. 
> 
> This creates four major pain points:
> 1. First, students lack real-time visibility into daily and weekly nutritional menus.
> 2. Second, billing calculations often lead to disputes regarding leave rebates and unverified meals.
> 3. Third, quality feedback and hygiene grievances often get lost without accountability.
> 4. And fourth, mess administrators lack centralized financial intelligence to track procurement costs against student revenue.
> 
> To solve this, I have engineered an end-to-end, production-grade, full-stack institutional web portal that completely digitizes daily dining schedules, live counter attendance, transparent fee invoicing, student grievances, and administrative analytics."

---

### SECTION 2: Tech Stack, Strict Constraints & Design Philosophy
⏱️ **Time:** `01:15 - 02:30` (75 seconds)  
🖥️ **On Screen:** Keep focus on the login page; briefly hover over the 3D demo buttons and toggle between Light and Dark mode using the topbar.

> **🎙️ SPOKEN NARRATION:**
> 
> "Before diving into the live features, let me highlight our architectural choices and the strict academic constraints under which this project was built.
> 
> In strict accordance with the IWT syllabus, this application is built entirely with fundamental web technologies—**without relying on any frontend frameworks like React, Angular, or Vue**, and without UI component libraries like Bootstrap or Tailwind.
> 
> - **On the Frontend:** We utilized genuine semantic HTML5, modern CSS3 leveraging CSS custom properties and Flexbox/CSS Grid, and modular vanilla JavaScript (ES6+) with the native Fetch API. For data visualization, we integrated Chart.js, and for our visual identity, high-fidelity 3D icons from `thiings.co`.
> - **On the Backend:** We built a high-performance RESTful API using Node.js and Express.js version 5.
> - **For the Database:** We chose SQLite powered by `better-sqlite3`, running in Write-Ahead Logging (WAL) mode for maximum concurrency and sub-millisecond query execution.
> - **For Security:** Passwords are salted and hashed using `bcryptjs`, sessions are managed with server-side HTTP-only cookies via `express-session`, and all state-changing endpoints feature custom CSRF protection and role-based access control across three user roles: **Student, Staff, and Admin**.
> 
> For our UI/UX design philosophy, we implemented Notion's tactile aesthetic—a warm off-white canvas (`#f6f5f4`), pure white cards with hairline borders and zero drop shadows, a focused Notion Blue primary accent (`#0075de`), and elegant highlight pill tags."

---

### SECTION 3: Live Demo — Student Portal Experience
⏱️ **Time:** `02:30 - 05:15` (165 seconds)  
🖥️ **On Screen Actions:**
1. Click the **'Student'** 1-Click Demo Login button on the login screen.
2. Land on the Student Dashboard (`#dashboard`).
3. Point out the hero welcome banner, 4 balanced stat cards, and today's 3 meals.
4. Click **'Rate Meal'** on Lunch -> submit a 5-star rating with a comment.
5. Click **'Weekly Menu'** in the sidebar (`#menu-weekly`).
6. Click **'Meal Attendance'** in the sidebar (`#attendance`).
7. Click **'Grievance Tickets'** (`#complaints`) -> Click **'Raise a New Complaint'** -> submit a ticket.
8. Click **'My Mess Bills'** (`#bills`) -> Click **'Pay'** -> submit a test transaction.

> **🎙️ SPOKEN NARRATION:**
> 
> "Let's log in first as a student by clicking our 1-Click Demo button for **Aarav Sharma**, a 3rd-year CSE resident.
> 
> Immediately, we land on the **Student Central Dashboard**. Notice the clean, centered layout:
> At the top, we have our personalized welcome banner showing Aarav's room number (Hostel-1, Room 101) and roll number, flanked by our 3D brand icon.
> 
> Right below, our 4 overview cards compute real-time metrics directly from SQLite:
> - Current Month Bill
> - Total Outstanding Dues
> - Meals Attended this billing cycle
> - And Pending Grievances
> 
> Below that is **Today's Dining Schedule** spanning Breakfast, Lunch, and Dinner. Each card displays the serving window, main theme, and individual items with dietary indicators—green for vegetarian and red for non-vegetarian.
> 
> As a student, I can rate my meal right from this card. Let's click **'Rate Meal'** on Lunch. A centered modal pops up. I'll give Food Quality a 5, Taste a 5, Hygiene a 5, and leave a comment: *'Paneer was exceptionally fresh today.'* Clicking Submit instantly recalculates the dining ratings.
> 
> Next, let's explore the **Weekly Menu Schedule**. Here, students have full visibility into the upcoming 7-day institutional dining roster, with active badges highlighting today's date.
> 
> In the **Meal Attendance** tab, students can track their verified dining hall check-ins. The system calculates an attendance turnout rate—82% in Aarav's case—and provides a session-wise breakdown of Breakfast, Lunch, and Dinner.
> 
> Now, let's visit **Grievance Tickets**. If a student has an issue regarding hygiene, water, food quality, or billing, they can click **'Raise a New Complaint'**. Let's file a ticket:
> - Category: *Food Quality*
> - Priority: *Medium*
> - Subject: *'Chapati was slightly undercooked at dinner'*
> - Description: *'Requesting the kitchen staff to ensure proper tawa heating.'*
> 
> The ticket is instantly assigned a unique ticket ID like `TKT-2026-6842` and routed to the kitchen desk.
> 
> Finally, let's check **My Mess Bills**. Here, students see their monthly fee invoices. The system accounts for base mess charges and automatically applies rebates for approved leaves at 90 rupees per day. Aarav has an outstanding balance; let's click **'Clear Outstanding Dues'**. We select UPI, enter reference `UPI-994821`, and record the payment. The due amount drops to zero, and an itemized digital receipt is instantly generated under **Payment History**."

---

### SECTION 4: Live Demo — Kitchen Staff Operations Desk
⏱️ **Time:** `05:15 - 06:45` (90 seconds)  
🖥️ **On Screen Actions:**
1. Click the User Profile dropdown at the bottom of the sidebar -> Click **'Sign Out'**.
2. Click the **'Mess Staff'** 1-Click Demo Login button (`Ramesh Chandra Jena`).
3. Land on the Staff Dashboard.
4. Point out the expected student headcounts.
5. Click **'Live Meal Attendance'** (`#staff-attendance`).
6. Select date and session -> Toggle a student's status between Present and Absent.
7. Show assigned grievance tickets at the bottom.

> **🎙️ SPOKEN NARRATION:**
> 
> "Now, let's log out and log in as our **Mess Staff supervisor, Ramesh Chandra Jena**.
> 
> The system dynamically restructures the navigation shell using server-side role verification. Staff members only see operational menus.
> 
> On the **Mess Operations Desk**, kitchen managers can view expected student meal counts to prevent food wastage.
> 
> At the dining hall entrance, staff use the **Live Meal Attendance Roster**. Let's select today's Lunch session. The roster lists all registered student residents with their roll numbers, branches, and hostel rooms. 
> 
> When a student swipes or reports to the dining counter, the staff member simply clicks the toggle button. Watch row B121001: clicking **'Mark Present'** instantly updates the database via an asynchronous AJAX PUT request, updates the badge to green, and recalculates the live turnout counter without a full page refresh. We also have bulk utilities to mark all present or reset sessions during special events.
> 
> Below, the staff supervisor can view grievance tickets specifically assigned to catering operations and update their resolution notes."

---

### SECTION 5: Live Demo — Administrator Control Center & Analytics
⏱️ **Time:** `06:45 - 08:45` (120 seconds)  
🖥️ **On Screen Actions:**
1. Sign out -> Click the **'Admin'** 1-Click Demo Login button (`Dr. Bibhuti Bhusan Pradhan`).
2. Land on the Administrator Control Center (`#dashboard`).
3. Showcase the balanced 3×2 stats grid and 4 live Chart.js charts.
4. Click **'Student Roster'** (`#admin-students`) -> use the live search bar to filter by 'CSE' or roll number.
5. Click **'Manage Menus'** (`#admin-menu`) -> show daily menu editing.
6. Click **'Billing & Rebates'** (`#admin-billing`) -> demonstrate batch billing & click **'Export CSV Report'** to download the file.
7. Show **'Circulars'** (`#announcements`) and **'Mess Settings'** (`#admin-settings`).

> **🎙️ SPOKEN NARRATION:**
> 
> "Now, let's log in with full administrative privileges as **Dr. Bibhuti Bhusan Pradhan, Mess Warden & Administrator**.
> 
> The **Administrator Control Center** provides an executive command desk:
> In the top overview, we have a perfectly balanced 3×2 grid computing total registered students, meals served this month, total collected revenue, total provisioning expenses, open grievances, and cumulative dues.
> 
> Below that, we have 4 interactive Chart.js visualizations that read directly from our SQLite database:
> 1. A 6-month comparative bar chart of **Revenue versus Operating Expenses**.
> 2. A doughnut chart displaying our **Monthly Procurement Cost Breakdown** across groceries, dairy, vegetables, and maintenance.
> 3. A 7-day multi-line trend of **Meal Attendance by Session** comparing Breakfast, Lunch, and Dinner.
> 4. And an institutional **Food Quality Rating Bar** tracking student satisfaction.
> 
> In **Student Management**, the admin has full CRUD capabilities. We can add new students, edit room allocations, or deactivate accounts. Notice our instant client-side filtering: typing 'CSE' or a roll number instantly filters our active student table.
> 
> Under **Manage Mess Menu**, administrators can schedule daily recipes, adjust serving timings, toggle special feast banners, and use our one-click **Duplicate Day Menu** feature to copy schedules across weeks.
> 
> Under **Billing & Fee Administration**, the admin can generate batch monthly invoices for all 25+ hostel residents in a single transaction. The system computes base rates, deducts approved leave rebates, and adds overdue fines. With one click on **'Export CSV Report'**, the entire billing ledger is compiled into a downloadable CSV for auditing.
> 
> Finally, in **Mess Settings**, administrators can configure base charges, per-day rebate allowances, serving windows, and emergency helpline contacts."

---

### SECTION 6: Code Architecture, Database & Test Suite
⏱️ **Time:** `08:45 - 09:30` (45 seconds)  
🖥️ **On Screen Actions:**
1. Switch window to the terminal / code editor (VS Code or Terminal).
2. Show the clean project structure (`server/`, `public/`, `tests/`).
3. Run `npm test` live in the terminal and showcase the **39 passed tests**.

> **🎙️ SPOKEN NARRATION:**
> 
> "Let's take a brief look under the hood at our codebase architecture.
> 
> The project follows a clean separation of concerns:
> - The `server/` directory organizes database initialization, custom middleware, and 12 modular Express REST route controllers.
> - The `public/` directory contains our vanilla web assets with structured CSS tokens and modular client-side JS handlers.
> - Our database schema features 12 fully normalized tables with primary keys, foreign key constraints, checks, and compound indexes.
> 
> To guarantee production reliability, I wrote a comprehensive automated integration test suite in `tests/api.test.js`. Let's run it live in the terminal using `npm test`.
> 
> As you can see, the test harness initializes an in-memory test instance, tests registration, RBAC permissions, attendance deduplication, billing calculations, and complaint state machines—executing **39 tests with 100% pass rate in under 2 seconds**."

---

### SECTION 7: Conclusion & Viva Closing
⏱️ **Time:** `09:30 - 10:00` (30 seconds)  
🖥️ **On Screen Actions:**
Switch back to the browser showing the centered Dashboard. Show the comprehensive project documentation files (`README.md`, `PROJECT_REPORT.md`).

> **🎙️ SPOKEN NARRATION:**
> 
> "In conclusion, the IIIT Bhubaneswar Mess Management System demonstrates how modern, production-grade web applications can be built with pure core fundamentals—without heavy frameworks or external cloud dependencies.
> 
> It provides institutional stakeholders with an elegant, responsive, and robust platform that eliminates billing disputes, minimizes food wastage, and elevates dining satisfaction across campus.
> 
> Complete academic documentation, including the project report, database ER diagram, and API reference, is available in the repository.
> 
> Thank you for your time and evaluation. I am now open to your questions."

---

## Examiner Q&A Cheat Sheet (Top 5 Expected Viva Questions)

### Q1: "Why did you choose SQLite over MySQL or MongoDB?"
> **Answer:** "For an on-premise institutional intranet system, SQLite with `better-sqlite3` in Write-Ahead Logging (WAL) mode is ideal. It operates in-process with zero network socket latency, requires zero database server administration, persists as a single ACID-compliant binary file, and easily handles thousands of reads per second, which exceeds the campus throughput requirement."

### Q2: "How does your session authentication and CSRF protection work without JWT?"
> **Answer:** "We use stateful server-side sessions via `express-session` stored in secure memory and identified by HTTP-only, `SameSite=Lax` cookies. This protects against XSS token theft. Furthermore, our custom middleware validates `X-Requested-With` AJAX headers on all state-changing endpoints (POST/PUT/DELETE) to block Cross-Site Request Forgery."

### Q3: "How does the system prevent duplicate attendance entries for the same meal session?"
> **Answer:** "Our SQLite schema enforces a `UNIQUE(student_id, date, meal_type)` constraint on the `meal_attendance` table. In our Express route, we execute an `INSERT ... ON CONFLICT(student_id, date, meal_type) DO UPDATE` query wrapped in an atomic transaction, guaranteeing idempotency."

### Q4: "How is the leave rebate calculated during bill generation?"
> **Answer:** "When `POST /api/bills/generate` is triggered for a billing month, the server inspects the approved leave ledger for that student, calculates the total days absent, multiplies it by the configured daily rebate rate (₹90/day from `system_settings`), and subtracts that credit from the monthly base fee (₹3,800)."

### Q5: "Why did you avoid CSS frameworks like Tailwind or Bootstrap?"
> **Answer:** "Writing genuine vanilla CSS allowed us to demonstrate deep practical knowledge of CSS3 custom properties, CSS Grid, Flexbox, media queries, and negative tracking typography. It eliminates hundreds of kilobytes of unused CSS bloat and results in an instant 100/100 Lighthouse performance score."
