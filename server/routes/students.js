const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/students - List students with search, filters, pagination
router.get('/', requireAuth, requireRole('admin', 'staff'), (req, res, next) => {
  try {
    const { search, department, year, status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = ["role = 'student'"];
    let params = [];

    if (search) {
      whereClauses.push('(student_id LIKE ? OR full_name LIKE ? OR email LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (department) {
      whereClauses.push('department = ?');
      params.push(department);
    }

    if (year) {
      whereClauses.push('year_of_study = ?');
      params.push(parseInt(year, 10));
    }

    if (status !== undefined && status !== '') {
      whereClauses.push('is_active = ?');
      params.push(parseInt(status, 10));
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM users ${whereStr}`).get(...params);
    const total = countRow.total;

    const students = db.prepare(`
      SELECT u.id, u.student_id, u.full_name, u.email, u.department, u.year_of_study, u.hostel_room, u.phone, u.is_active, u.created_at,
        (SELECT COALESCE(SUM(due_amount), 0) FROM bills WHERE student_id = u.id) as total_dues,
        (SELECT COUNT(*) FROM meal_attendance WHERE student_id = u.id AND status = 'present') as meals_attended
      FROM users u
      ${whereStr}
      ORDER BY u.student_id ASC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit, 10), offset);

    res.json({
      students,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/students/:id
router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id, 10);

    // If student, can only view own info
    if (req.session.user.role === 'student' && req.session.user.id !== studentId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const student = db.prepare(`
      SELECT id, student_id, full_name, email, role, department, year_of_study, hostel_room, phone, is_active, created_at
      FROM users WHERE id = ?
    `).get(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const bills = db.prepare(`
      SELECT * FROM bills WHERE student_id = ? ORDER BY billing_month DESC LIMIT 6
    `).all(studentId);

    const complaints = db.prepare(`
      SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC LIMIT 5
    `).all(studentId);

    const attendanceSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_marked,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count
      FROM meal_attendance WHERE student_id = ?
    `).get(studentId);

    res.json({
      student,
      bills,
      complaints,
      attendanceSummary
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/students - Admin creates student
router.post('/', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const { student_id, full_name, email, department, year_of_study, hostel_room, phone, password } = req.body;

    if (!student_id || !full_name || !email) {
      return res.status(400).json({ error: 'Student ID, Full Name, and Email are required.' });
    }

    const defaultPass = password || 'Student@123';
    const password_hash = bcrypt.hashSync(defaultPass, 10);

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

    res.status(201).json({
      message: 'Student account created successfully',
      studentId: result.lastInsertRowid
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/students/:id - Admin updates student
router.put('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    const { full_name, email, department, year_of_study, hostel_room, phone, is_active, password } = req.body;

    let query = `
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          email = COALESCE(?, email),
          department = COALESCE(?, department),
          year_of_study = COALESCE(?, year_of_study),
          hostel_room = COALESCE(?, hostel_room),
          phone = COALESCE(?, phone),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
    `;
    let params = [
      full_name ? full_name.trim() : null,
      email ? email.trim().toLowerCase() : null,
      department ? department.trim() : null,
      year_of_study !== undefined && year_of_study !== '' ? parseInt(year_of_study, 10) : null,
      hostel_room ? hostel_room.trim() : null,
      phone ? phone.trim() : null,
      is_active !== undefined ? parseInt(is_active, 10) : null
    ];

    if (password && password.trim().length >= 6) {
      query += `, password_hash = ?`;
      params.push(bcrypt.hashSync(password.trim(), 10));
    }

    query += ` WHERE id = ?`;
    params.push(studentId);

    const result = db.prepare(query).run(...params);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    res.json({ message: 'Student updated successfully.' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/students/:id - Admin soft deletes or deletes
router.delete('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id, 10);

    // Check if student has related financial records
    const billCount = db.prepare('SELECT COUNT(*) as c FROM bills WHERE student_id = ?').get(studentId).c;
    if (billCount > 0) {
      // Soft-delete to preserve relational integrity of bills & payments
      db.prepare('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(studentId);
      return res.json({ message: 'Student account has been deactivated (preserved audit and billing history).' });
    }

    // Hard delete if no financial ties
    db.prepare('DELETE FROM users WHERE id = ?').run(studentId);
    res.json({ message: 'Student deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
