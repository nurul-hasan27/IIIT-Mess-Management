# IIIT Bhubaneswar – Mess Management System

A web-based mess and dining management system developed for institutional residential campuses. The system automates daily dining operations, attendance logging, automated monthly billing with leave rebates, menu scheduling, grievance resolution, and administrative analytics.

---

## 🏛️ System Architecture

The application follows a clean client-server architecture built entirely with core web fundamentals and zero external cloud dependencies.

```
+-------------------------------------------------------------------+
|                        Client Tier (Browser)                      |
|   - Vanilla HTML5 / CSS3                                          |
|   - ES6+ JavaScript (Fetch API, DOM manipulation)                 |
|   - Chart.js (Data Visualizations)                                |
+-------------------------------------------------------------------+
                                  │
                       HTTP / JSON (RESTful API)
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                     Backend Server (Node.js & Express)            |
|   - Express 5.x REST API Router                                   |
|   - Session Authentication & RBAC (express-session, bcryptjs)     |
|   - CSRF & Input Validation Middleware                            |
+-------------------------------------------------------------------+
                                  │
                            better-sqlite3
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                     Database Tier (SQLite)                        |
|   - SQLite 3 (WAL mode for high concurrency)                      |
|   - 12 Relational Tables with Foreign Key Constraints             |
|   - Persistent local storage: data/mess.db                        |
+-------------------------------------------------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Custom Properties, Grid & Flexbox), Vanilla JavaScript (ES6+), Chart.js |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite with `better-sqlite3` (WAL mode enabled) |
| **Authentication** | `bcryptjs` (password hashing), `express-session` (HTTP-only secure cookies) |
| **Testing** | Automated integration tests via native Node.js test runner |

---

## ⚡ Core Features

- **Student Portal**: View daily and weekly menus, submit meal ratings and feedback, check verified dining attendance, raise and track grievance tickets, view monthly mess bills with leave rebates, and make online payments.
- **Mess Staff Desk**: Real-time counter attendance marking (single-click and bulk actions), expected meal turnout counts, and catering grievance resolution.
- **Administrator Dashboard**: Comprehensive campus analytics (revenue vs. expenses, session attendance trends, quality ratings), student CRUD management, menu scheduling, batch monthly bill generation, expense tracking, and notice circulars.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or later)
- npm (v9.x or later)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone git@github.com:nurul-hasan27/IIIT-Mess-Management.git
   cd IIIT-Mess-Management
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   npm start
   ```
   The server will start at `http://localhost:3000`. On first launch, the SQLite database is automatically created and populated with sample academic data.

4. **Run the test suite:**
   ```bash
   npm test
   ```

---

## 🔑 Demo Credentials

| Role | Email | Password | Name |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@iiit-bh.ac.in` | `Admin@123` | Dr. Bibhuti Bhusan Pradhan (Mess Warden) |
| **Mess Staff** | `staff1@iiit-bh.ac.in` | `Staff@123` | Ramesh Chandra Jena (Mess Supervisor) |
| **Student** | `b121001@iiit-bh.ac.in` | `Student@123` | Aarav Sharma (Hostel-1, Room 101) |

---

## 📁 Project Structure

```
IIIT-Mess-Management/
├── public/                  # Frontend assets
│   ├── css/                 # Stylesheets (modular CSS)
│   ├── js/                  # Client-side JavaScript modules
│   ├── assets/              # Icons and graphics
│   ├── login.html           # Authentication page
│   ├── register.html        # Student registration page
│   └── index.html           # Main application shell
├── server/                  # Backend application
│   ├── config/              # Database connection & SQLite pragmas
│   ├── database/            # Schema DDL and seed data generator
│   ├── middleware/          # Auth, RBAC, CSRF, and error handling
│   ├── routes/              # Modular Express REST API controllers
│   ├── utils/               # Date and formatting utilities
│   └── server.js            # Express server entry point
├── tests/                   # Automated API integration tests
├── data/                    # Persistent SQLite database (mess.db)
├── package.json             # Project dependencies and npm scripts
└── README.md                # Project documentation
```

---

## 📄 License

ISC License. Built for academic evaluation at IIIT Bhubaneswar.
