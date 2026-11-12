-- IIIT Bhubaneswar Mess Management System Database Schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student', 'admin', 'staff')),
  department TEXT,
  year_of_study INTEGER,
  hostel_room TEXT,
  phone TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner')),
  title TEXT NOT NULL,
  serving_time TEXT NOT NULL,
  is_special INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, meal_type)
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'Main Course',
  is_veg INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS meal_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner')),
  status TEXT NOT NULL CHECK(status IN ('present', 'absent')) DEFAULT 'present',
  marked_by INTEGER REFERENCES users(id),
  marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, date, meal_type)
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner')),
  food_quality_rating INTEGER CHECK(food_quality_rating BETWEEN 1 AND 5),
  taste_rating INTEGER CHECK(taste_rating BETWEEN 1 AND 5),
  hygiene_rating INTEGER CHECK(hygiene_rating BETWEEN 1 AND 5),
  quantity_rating INTEGER CHECK(quantity_rating BETWEEN 1 AND 5),
  overall_rating INTEGER CHECK(overall_rating BETWEEN 1 AND 5),
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, date, meal_type)
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_number TEXT UNIQUE NOT NULL,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK(category IN ('Food Quality', 'Hygiene', 'Menu', 'Water', 'Staff Behaviour', 'Billing', 'Other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
  status TEXT NOT NULL CHECK(status IN ('Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected')) DEFAULT 'Submitted',
  assigned_to INTEGER REFERENCES users(id),
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_number TEXT UNIQUE NOT NULL,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billing_month TEXT NOT NULL,
  base_amount REAL NOT NULL DEFAULT 0.0,
  special_diet_amount REAL DEFAULT 0.0,
  rebate_amount REAL DEFAULT 0.0,
  fine_amount REAL DEFAULT 0.0,
  total_amount REAL NOT NULL DEFAULT 0.0,
  paid_amount REAL NOT NULL DEFAULT 0.0,
  due_amount REAL NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL CHECK(status IN ('Paid', 'Partially Paid', 'Unpaid', 'Overdue')) DEFAULT 'Unpaid',
  due_date TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, billing_month)
);

CREATE TABLE IF NOT EXISTS bill_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_number TEXT UNIQUE NOT NULL,
  bill_id INTEGER REFERENCES bills(id) ON DELETE SET NULL,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('UPI', 'Net Banking', 'Debit Card', 'Credit Card', 'Cash', 'Demand Draft')),
  transaction_reference TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('Completed', 'Pending', 'Failed')) DEFAULT 'Completed',
  recorded_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Groceries', 'Vegetables', 'Dairy', 'Cooking Supplies', 'Staff', 'Maintenance', 'Miscellaneous')),
  amount REAL NOT NULL,
  expense_date TEXT NOT NULL,
  vendor_name TEXT,
  invoice_number TEXT,
  description TEXT,
  recorded_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK(priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
  author_id INTEGER REFERENCES users(id),
  publish_date TEXT NOT NULL,
  expiry_date TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('announcement', 'bill', 'complaint', 'payment', 'system')) DEFAULT 'system',
  reference_id INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_menus_date ON menus(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON meal_attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_feedback_date ON feedback(date, meal_type);
CREATE INDEX IF NOT EXISTS idx_complaints_student ON complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_bills_student ON bills(student_id);
CREATE INDEX IF NOT EXISTS idx_bills_month ON bills(billing_month);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
