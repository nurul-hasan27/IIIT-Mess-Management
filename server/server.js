require('dotenv').config();
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const path = require('path');

const { initDatabase } = require('./database/init');
const { seedDatabase } = require('./database/seed');
const errorHandler = require('./middleware/errorHandler');
const { csrfCheck } = require('./middleware/auth');

// Route imports
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const menuRoutes = require('./routes/menus');
const attendanceRoutes = require('./routes/attendance');
const feedbackRoutes = require('./routes/feedback');
const complaintRoutes = require('./routes/complaints');
const billingRoutes = require('./routes/billing');
const expenseRoutes = require('./routes/expenses');
const announcementRoutes = require('./routes/announcements');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize & Seed Database if needed
initDatabase();
seedDatabase(false);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'iiit-bhubaneswar-mess-mgmt-secure-session-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// CSRF Protection for state-changing API requests
app.use('/api', csrfCheck);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/bills', billingRoutes);
app.use('/api/payments', (req, res, next) => {
  // Convenience alias to billing payments
  if (req.method === 'GET') {
    req.url = '/payments/list' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
    return billingRoutes(req, res, next);
  }
  if (req.method === 'POST') {
    req.url = '/payments';
    return billingRoutes(req, res, next);
  }
  next();
});
app.use('/api/expenses', expenseRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// Static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback to index.html for frontend navigation routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found.' });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` IIIT BHUBANESWAR - MESS MANAGEMENT SYSTEM SERVER RUNNING `);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Database: SQLite WAL-mode initialized`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
