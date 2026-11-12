const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Simple in-memory login attempts tracker for rate limiting
const loginAttempts = new Map();

function isRateLimited(key) {
  const attempts = loginAttempts.get(key) || { count: 0, resetAt: Date.now() + 60000 };
  if (Date.now() > attempts.resetAt) {
    loginAttempts.delete(key);
    return false;
  }
  return attempts.count >= 5;
}

function recordFailedAttempt(key) {
  const attempts = loginAttempts.get(key) || { count: 0, resetAt: Date.now() + 60000 };
  attempts.count += 1;
  loginAttempts.set(key, attempts);
}

function clearAttempts(key) {
  loginAttempts.delete(key);
}

// POST /api/auth/login
router.post('/login', (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email or Student ID and password are required.' });
    }

    const clientKey = `${req.ip}_${identifier.trim().toLowerCase()}`;
    if (isRateLimited(clientKey)) {
      return res.status(429).json({ error: 'Too many login attempts. Please wait 1 minute before trying again.' });
    }

    // Lookup user by email OR student_id
    const user = db.prepare(`
      SELECT * FROM users
      WHERE (LOWER(email) = LOWER(?) OR UPPER(student_id) = UPPER(?)) AND is_active = 1
    `).get(identifier.trim(), identifier.trim());

    if (!user) {
      recordFailedAttempt(clientKey);
      return res.status(401).json({ error: 'Invalid credentials or inactive account.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      recordFailedAttempt(clientKey);
      return res.status(401).json({ error: 'Invalid credentials or inactive account.' });
    }

    clearAttempts(clientKey);

    // Regenerate session to prevent fixation
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.user = {
        id: user.id,
        student_id: user.student_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department,
        year_of_study: user.year_of_study,
        hostel_room: user.hostel_room,
        phone: user.phone
      };

      res.json({
        message: 'Login successful',
        user: req.session.user
      });
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/register
router.post('/register', (req, res, next) => {
  try {
    const {
      full_name,
      student_id,
      email,
      department,
      year_of_study,
      hostel_room,
      phone,
      password,
      confirm_password
    } = req.body;

    if (!full_name || !student_id || !email || !password) {
      return res.status(400).json({ error: 'Full name, Student ID, email, and password are required.' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Check existing
    const existing = db.prepare(`
      SELECT email, student_id FROM users
      WHERE LOWER(email) = LOWER(?) OR UPPER(student_id) = UPPER(?)
    `).get(email.trim(), student_id.trim());

    if (existing) {
      if (existing.email.toLowerCase() === email.trim().toLowerCase()) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      return res.status(409).json({ error: 'An account with this Student ID already exists.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (student_id, full_name, email, password_hash, role, department, year_of_study, hostel_room, phone)
      VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?)
    `).run(
      student_id.trim().toUpperCase(),
      full_name.trim(),
      email.trim().toLowerCase(),
      password_hash,
      department || null,
      year_of_study ? parseInt(year_of_study, 10) : null,
      hostel_room || null,
      phone || null
    );

    // Create a welcome notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(
      result.lastInsertRowid,
      'Welcome to IIIT Bhubaneswar Mess Portal',
      "Your account has been registered successfully. Explore today's menu and check billing details.",
      'system'
    );

    // Automatically log in
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.user = {
        id: result.lastInsertRowid,
        student_id: student_id.trim().toUpperCase(),
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        role: 'student',
        department: department || null,
        year_of_study: year_of_study ? parseInt(year_of_study, 10) : null,
        hostel_room: hostel_room || null,
        phone: phone || null
      };

      res.status(201).json({
        message: 'Registration successful',
        user: req.session.user
      });
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ authenticated: false, user: null });
  }

  // Fetch fresh user record from DB
  const user = db.prepare(`
    SELECT id, student_id, full_name, email, role, department, year_of_study, hostel_room, phone, created_at
    FROM users WHERE id = ? AND is_active = 1
  `).get(req.session.user.id);

  if (!user) {
    req.session.destroy();
    return res.status(401).json({ authenticated: false, user: null });
  }

  // Update session
  req.session.user = user;
  res.json({ authenticated: true, user });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, (req, res, next) => {
  try {
    const { full_name, hostel_room, phone, department, year_of_study } = req.body;
    const userId = req.session.user.id;

    db.prepare(`
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          hostel_room = COALESCE(?, hostel_room),
          phone = COALESCE(?, phone),
          department = COALESCE(?, department),
          year_of_study = COALESCE(?, year_of_study),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      full_name ? full_name.trim() : null,
      hostel_room ? hostel_room.trim() : null,
      phone ? phone.trim() : null,
      department ? department.trim() : null,
      year_of_study ? parseInt(year_of_study, 10) : null,
      userId
    );

    const updatedUser = db.prepare(`
      SELECT id, student_id, full_name, email, role, department, year_of_study, hostel_room, phone
      FROM users WHERE id = ?
    `).get(userId);

    req.session.user = updatedUser;
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/change-password
router.put('/change-password', requireAuth, (req, res, next) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.session.user.id;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
    if (!bcrypt.compareSync(current_password, user.password_hash)) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, userId);

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/demo-accounts (Convenience for evaluation & demo)
router.get('/demo-accounts', (req, res) => {
  res.json({
    admin: { email: 'admin@iiit-bh.ac.in', password: 'Admin@123', role: 'admin', name: 'Dr. B. B. Pradhan' },
    staff: { email: 'staff1@iiit-bh.ac.in', password: 'Staff@123', role: 'staff', name: 'Ramesh Chandra Jena' },
    student: { email: 'b121001@iiit-bh.ac.in', password: 'Student@123', role: 'student', name: 'Aarav Sharma' }
  });
});

module.exports = router;
