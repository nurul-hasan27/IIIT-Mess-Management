const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getTodayString } = require('../utils/date');

// GET /api/attendance
router.get('/', requireAuth, (req, res, next) => {
  try {
    const userRole = req.session.user.role;
    const userId = req.session.user.id;

    if (userRole === 'student') {
      const { month } = req.query; // YYYY-MM
      let query = `
        SELECT a.*, u.full_name as marker_name
        FROM meal_attendance a
        LEFT JOIN users u ON a.marked_by = u.id
        WHERE a.student_id = ?
      `;
      let params = [userId];

      if (month) {
        query += ` AND strftime('%Y-%m', a.date) = ?`;
        params.push(month);
      }

      query += ` ORDER BY a.date DESC, 
        CASE a.meal_type 
          WHEN 'breakfast' THEN 1 
          WHEN 'lunch' THEN 2 
          WHEN 'dinner' THEN 3 
          ELSE 4 
        END`;

      const records = db.prepare(query).all(...params);

      const summary = db.prepare(`
        SELECT 
          COUNT(*) as total_meals,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN meal_type = 'breakfast' AND status = 'present' THEN 1 ELSE 0 END) as breakfast_present,
          SUM(CASE WHEN meal_type = 'lunch' AND status = 'present' THEN 1 ELSE 0 END) as lunch_present,
          SUM(CASE WHEN meal_type = 'dinner' AND status = 'present' THEN 1 ELSE 0 END) as dinner_present
        FROM meal_attendance
        WHERE student_id = ? ${month ? "AND strftime('%Y-%m', date) = ?" : ''}
      `).get(...params);

      return res.json({ records, summary });
    }

    // Admin / Staff roster view
    const date = req.query.date || getTodayString();
    const meal_type = req.query.meal_type || 'breakfast';

    const roster = db.prepare(`
      SELECT 
        u.id as student_id,
        u.student_id as roll_number,
        u.full_name,
        u.department,
        u.hostel_room,
        a.id as attendance_id,
        COALESCE(a.status, 'absent') as status,
        a.marked_at,
        marker.full_name as marked_by_name
      FROM users u
      LEFT JOIN meal_attendance a 
        ON a.student_id = u.id 
        AND a.date = ? 
        AND a.meal_type = ?
      LEFT JOIN users marker ON a.marked_by = marker.id
      WHERE u.role = 'student' AND u.is_active = 1
      ORDER BY u.student_id ASC
    `).all(date, meal_type);

    const stats = {
      total_students: roster.length,
      present_count: roster.filter(r => r.status === 'present').length,
      absent_count: roster.filter(r => r.status !== 'present').length
    };

    res.json({
      date,
      meal_type,
      stats,
      roster
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/attendance - Staff/Admin marks attendance (single or batch)
router.post('/', requireAuth, requireRole('admin', 'staff'), (req, res, next) => {
  try {
    const { date, meal_type, attendance_list, student_id, status } = req.body;
    const markerId = req.session.user.id;

    if (!date || !meal_type) {
      return res.status(400).json({ error: 'Date and meal type are required.' });
    }

    const upsertStmt = db.prepare(`
      INSERT INTO meal_attendance (student_id, date, meal_type, status, marked_by, marked_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, date, meal_type) DO UPDATE SET
        status = excluded.status,
        marked_by = excluded.marked_by,
        marked_at = CURRENT_TIMESTAMP
    `);

    // Batch update
    if (Array.isArray(attendance_list)) {
      const batchTx = db.transaction(() => {
        for (const item of attendance_list) {
          upsertStmt.run(item.student_id, date, meal_type, item.status || 'present', markerId);
        }
      });
      batchTx();
      return res.json({ message: `Attendance updated for ${attendance_list.length} students.` });
    }

    // Single student update
    if (!student_id) {
      return res.status(400).json({ error: 'Student ID or attendance list is required.' });
    }

    upsertStmt.run(student_id, date, meal_type, status || 'present', markerId);
    res.json({ message: 'Attendance marked successfully.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/attendance/summary - Overall institutional attendance metrics
router.get('/summary', requireAuth, requireRole('admin', 'staff'), (req, res, next) => {
  try {
    const { month } = req.query;
    const filterMonth = month || getTodayString().slice(0, 7);

    const monthlyStats = db.prepare(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_present,
        SUM(CASE WHEN meal_type = 'breakfast' AND status = 'present' THEN 1 ELSE 0 END) as breakfast_present,
        SUM(CASE WHEN meal_type = 'lunch' AND status = 'present' THEN 1 ELSE 0 END) as lunch_present,
        SUM(CASE WHEN meal_type = 'dinner' AND status = 'present' THEN 1 ELSE 0 END) as dinner_present
      FROM meal_attendance
      WHERE strftime('%Y-%m', date) = ?
    `).get(filterMonth);

    // Daily trends for the month
    const dailyTrends = db.prepare(`
      SELECT 
        date,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count
      FROM meal_attendance
      WHERE strftime('%Y-%m', date) = ?
      GROUP BY date
      ORDER BY date ASC
    `).all(filterMonth);

    res.json({
      month: filterMonth,
      summary: monthlyStats,
      dailyTrends
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
