# IIIT BHUBANESWAR – MESS MANAGEMENT SYSTEM
## REST API Endpoint Documentation

All endpoints return JSON responses with standard HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`).

Authentication uses cookie-based HTTP-only sessions. State-changing requests (`POST`, `PUT`, `DELETE`) require the `X-Requested-With: XMLHttpRequest` header for CSRF defense.

---

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates student, staff, or admin. Returns user profile and initializes session. |
| `POST` | `/api/auth/register` | Public | Registers a new student account, hashes password with bcrypt, initializes welcome notification. |
| `POST` | `/api/auth/logout` | Authenticated | Destroys current session and clears session cookie. |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user record from SQLite. |
| `PUT` | `/api/auth/profile` | Authenticated | Updates personal profile (phone, room, branch, year). |
| `PUT` | `/api/auth/change-password` | Authenticated | Verifies old password and hashes new password. |
| `GET` | `/api/auth/demo-accounts` | Public | Returns pre-configured demo credentials for lab evaluation. |

#### Sample Login Request
```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json
X-Requested-With: XMLHttpRequest

{
  "identifier": "b121001@iiit-bh.ac.in",
  "password": "Student@123"
}
```

#### Sample Login Response
```json
{
  "message": "Login successful",
  "user": {
    "id": 4,
    "student_id": "B121001",
    "full_name": "Aarav Sharma",
    "email": "b121001@iiit-bh.ac.in",
    "role": "student",
    "department": "CSE",
    "year_of_study": 3,
    "hostel_room": "Hostel-1, Room 101"
  }
}
```

---

### 2. Student Management (`/api/students`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | Admin, Staff | Lists students with search, branch, year, status filters & pagination. |
| `GET` | `/api/students/:id` | Admin, Staff, Self | Fetches full student profile, billing history & attendance counts. |
| `POST` | `/api/students` | Admin | Manually creates and enrolls a new student. |
| `PUT` | `/api/students/:id` | Admin | Updates student details, hostel room, or resets password. |
| `DELETE` | `/api/students/:id` | Admin | Deactivates or removes a student record. |

---

### 3. Menu Management (`/api/menus`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/menus/today` | Public / Auth | Returns today's breakfast, lunch, dinner, items & user's feedback state. |
| `GET` | `/api/menus/weekly` | Public / Auth | Returns 7-day calendar schedule grouped by date and meal session. |
| `GET` | `/api/menus?date=YYYY-MM-DD` | Public / Auth | Returns menu entries and items for a specific date. |
| `POST` | `/api/menus` | Admin | Creates a new meal entry with multiple dishes and serving times. |
| `PUT` | `/api/menus/:id` | Admin | Updates an existing menu and its constituent items. |
| `DELETE` | `/api/menus/:id` | Admin | Deletes a meal entry and cascades deletion to menu items. |
| `POST` | `/api/menus/duplicate` | Admin | Duplicates all 3 meals of a source date to a target date. |

#### Sample Menu Creation Request
```json
{
  "date": "2024-11-20",
  "meal_type": "lunch",
  "title": "Punjabi Rajma Masala & Basmati Rice",
  "serving_time": "12:15 PM - 02:30 PM",
  "is_special": 0,
  "items": [
    { "item_name": "Steamed Basmati Rice", "category": "Main Course", "is_veg": 1 },
    { "item_name": "Rajma Masala", "category": "Main Course", "is_veg": 1 },
    { "item_name": "Bhindi Do Pyaza", "category": "Side Dish", "is_veg": 1 },
    { "item_name": "Tawa Phulka", "category": "Main Course", "is_veg": 1 }
  ]
}
```

---

### 4. Meal Attendance (`/api/attendance`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/attendance` | Student | Returns student's personal meal attendance history and rates. |
| `GET` | `/api/attendance?date=...&meal_type=...` | Staff, Admin | Returns verified roster for all active students for that session. |
| `POST` | `/api/attendance` | Staff, Admin | Marks single student or batch attendance. Prevents duplicates. |
| `GET` | `/api/attendance/summary` | Staff, Admin | Returns monthly attendance turnout and daily session trends. |

---

### 5. Mess Feedback & Ratings (`/api/feedback`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/feedback` | Student | Submits ratings (1-5) for quality, taste, hygiene, quantity, overall, & comments. |
| `GET` | `/api/feedback` | Authenticated | Lists feedback history (student sees own; admin/staff sees all). |
| `GET` | `/api/feedback/summary` | Authenticated | Computes average scores across criteria and meal types. |

---

### 6. Complaint Tickets (`/api/complaints`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/complaints` | Authenticated | Lists tickets with search, category, status & priority filters. |
| `POST` | `/api/complaints` | Student | Files a grievance ticket; generates unique ticket ID `CMP-YYYY-XXX`. |
| `GET` | `/api/complaints/:id` | Authenticated | Returns ticket details, description, assignee & resolution notes. |
| `PUT` | `/api/complaints/:id` | Staff, Admin | Updates status (`Under Review`, `In Progress`, `Resolved`, `Rejected`) & notes. |

---

### 7. Billing & Payments (`/api/bills` & `/api/payments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bills` | Authenticated | Returns bills (student sees own; admin sees institutional list). |
| `GET` | `/api/bills/:id` | Authenticated | Returns detailed invoice breakdown with line items and payments. |
| `POST` | `/api/bills/generate` | Admin | Batch generates monthly bills for all active students with base charge. |
| `PUT` | `/api/bills/:id` | Admin | Updates adjustments (approved leave rebates, late payment fines). |
| `GET` | `/api/bills/export-csv` | Admin | Streams downloadable CSV of all student invoices for the month. |
| `GET` | `/api/payments` | Authenticated | Returns payment receipts history. |
| `POST` | `/api/bills/payments` | Authenticated | Records a payment, prevents duplicate transaction IDs, and credits bill. |

---

### 8. Expense Management (`/api/expenses`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/expenses` | Admin | Lists procurement vouchers, monthly total & category totals. |
| `POST` | `/api/expenses` | Admin | Records procurement voucher (groceries, dairy, staff, gas). |
| `PUT` | `/api/expenses/:id` | Admin | Updates an existing expense voucher. |
| `DELETE` | `/api/expenses/:id` | Admin | Permanently deletes an expense record. |

---

### 9. Announcements & Notifications (`/api/announcements` & `/api/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/announcements` | Public / Auth | Lists active circulars sorted by priority and date. |
| `POST` | `/api/announcements` | Admin | Publishes circular and broadcasts in-app notification to all students. |
| `PUT` | `/api/announcements/:id` | Admin | Modifies circular headline, priority, or archival status. |
| `DELETE` | `/api/announcements/:id` | Admin | Deletes an announcement. |
| `GET` | `/api/notifications` | Authenticated | Retrieves user's in-app alerts and unread counter. |
| `PUT` | `/api/notifications/read-all` | Authenticated | Marks all unread alerts for current user as read. |
| `PUT` | `/api/notifications/:id/read` | Authenticated | Marks specific notification as read. |

---

### 10. Dashboards (`/api/dashboard`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/student` | Student | Personalized stats (bill, dues, attendance, tickets), today's menu, circulars. |
| `GET` | `/api/dashboard/admin` | Admin | Institutional metrics, Chart.js datasets (revenue, expenses, attendance, feedback). |
| `GET` | `/api/dashboard/staff` | Staff, Admin | Kitchen session rosters, expected counts & assigned maintenance tickets. |

---

### 11. System Settings (`/api/settings`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings` | Public / Auth | Returns system parameters (base fee, rebate rate, meal hours, helpline). |
| `PUT` | `/api/settings` | Admin | Updates configuration values in SQLite `system_settings` table. |
