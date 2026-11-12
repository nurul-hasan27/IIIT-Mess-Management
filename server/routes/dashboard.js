const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getTodayString } = require('../utils/date');

// GET /api/dashboard/student
router.get('/student', requireAuth, (req, res, next) => {
  try {
    const studentId = req.session.user.id;
    const today = getTodayString();
    const currMonth = today.slice(0, 7);

    // 1. Current month bill & total dues
    const billRow = db.prepare(`
      SELECT 
        COALESCE(total_amount, 0) as current_month_bill,
        COALESCE(due_amount, 0) as current_month_due,
        status as current_bill_status
      FROM bills
      WHERE student_id = ? AND billing_month = ?
    `).get(studentId, currMonth) || { current_month_bill: 0, current_month_due: 0, current_bill_status: 'None' };

    const totalDuesRow = db.prepare(`
      SELECT COALESCE(SUM(due_amount), 0) as total_dues
      FROM bills
      WHERE student_id = ?
    `).get(studentId);

    // 2. Attendance this month
    const attendanceCount = db.prepare(`
      SELECT COUNT(*) as attended
      FROM meal_attendance
      WHERE student_id = ? AND status = 'present' AND strftime('%Y-%m', date) = ?
    `).get(studentId, currMonth).attended;

    // 3. Pending complaints
    const pendingComplaintsCount = db.prepare(`
      SELECT COUNT(*) as pending
      FROM complaints
      WHERE student_id = ? AND status IN ('Submitted', 'Under Review', 'In Progress')
    `).get(studentId).pending;

    // 4. Today's menu with items & feedback status
    const todayMenus = db.prepare(`
      SELECT * FROM menus
      WHERE date = ?
      ORDER BY 
        CASE meal_type 
          WHEN 'breakfast' THEN 1 
          WHEN 'lunch' THEN 2 
          WHEN 'dinner' THEN 3 
          ELSE 4 
        END
    `).all(today);

    for (const m of todayMenus) {
      m.items = db.prepare('SELECT * FROM menu_items WHERE menu_id = ?').all(m.id);
      m.user_feedback = db.prepare(`
        SELECT * FROM feedback WHERE student_id = ? AND date = ? AND meal_type = ?
      `).get(studentId, today, m.meal_type) || null;
      m.attendance = db.prepare(`
        SELECT status FROM meal_attendance WHERE student_id = ? AND date = ? AND meal_type = ?
      `).get(studentId, today, m.meal_type) || null;
    }

    // 5. Recent Announcements
    const announcements = db.prepare(`
      SELECT a.*, u.full_name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.is_active = 1 AND (a.expiry_date IS NULL OR a.expiry_date >= ?)
      ORDER BY 
        CASE a.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
        a.publish_date DESC
      LIMIT 3
    `).all(today);

    // 6. Recent Activities
    const recentPayments = db.prepare(`
      SELECT id, receipt_number, amount, payment_date, payment_method, status
      FROM payments
      WHERE student_id = ?
      ORDER BY payment_date DESC, created_at DESC
      LIMIT 3
    `).all(studentId);

    const recentComplaints = db.prepare(`
      SELECT id, ticket_number, category, subject, status, created_at
      FROM complaints
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 3
    `).all(studentId);

    const recentFeedback = db.prepare(`
      SELECT id, date, meal_type, overall_rating, comments, created_at
      FROM feedback
      WHERE student_id = ?
      ORDER BY date DESC, created_at DESC
      LIMIT 3
    `).all(studentId);

    res.json({
      stats: {
        currentMonthBill: billRow.current_month_bill,
        currentBillStatus: billRow.current_bill_status,
        outstandingDues: totalDuesRow.total_dues,
        mealsAttendedMonth: attendanceCount,
        pendingComplaints: pendingComplaintsCount
      },
      todayMenus,
      announcements,
      recentActivity: {
        payments: recentPayments,
        complaints: recentComplaints,
        feedback: recentFeedback
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/admin
router.get('/admin', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const today = getTodayString();
    const currMonth = today.slice(0, 7);

    // 1. Overview Statistics
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_active = 1").get().count;

    const mealsServedThisMonth = db.prepare(`
      SELECT COUNT(*) as count 
      FROM meal_attendance 
      WHERE status = 'present' AND strftime('%Y-%m', date) = ?
    `).get(currMonth).count;

    const monthlyRevenue = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE status = 'Completed' AND strftime('%Y-%m', payment_date) = ?
    `).get(currMonth).total;

    const monthlyExpenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE strftime('%Y-%m', expense_date) = ?
    `).get(currMonth).total;

    const pendingComplaints = db.prepare(`
      SELECT COUNT(*) as count 
      FROM complaints 
      WHERE status IN ('Submitted', 'Under Review', 'In Progress')
    `).get().count;

    const outstandingPayments = db.prepare(`
      SELECT COALESCE(SUM(due_amount), 0) as total 
      FROM bills
    `).get().total;

    // 2. Analytics: Revenue vs Expenses (Last 6 Months)
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(mStr);
    }

    const revExpTrend = months.map(m => {
      const rev = db.prepare("SELECT COALESCE(SUM(amount), 0) as amt FROM payments WHERE status = 'Completed' AND strftime('%Y-%m', payment_date) = ?").get(m).amt;
      const exp = db.prepare("SELECT COALESCE(SUM(amount), 0) as amt FROM expenses WHERE strftime('%Y-%m', expense_date) = ?").get(m).amt;
      return { month: m, revenue: rev, expense: exp };
    });

    // 3. Analytics: Expense Categories (Current Month)
    const expenseByCategory = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE strftime('%Y-%m', expense_date) = ?
      GROUP BY category
      ORDER BY total DESC
    `).all(currMonth);

    // 4. Analytics: Attendance Trends (Last 7 Days)
    const attendanceDates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      attendanceDates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }

    const attendanceTrend = attendanceDates.map(date => {
      const row = db.prepare(`
        SELECT 
          SUM(CASE WHEN meal_type = 'breakfast' AND status = 'present' THEN 1 ELSE 0 END) as breakfast,
          SUM(CASE WHEN meal_type = 'lunch' AND status = 'present' THEN 1 ELSE 0 END) as lunch,
          SUM(CASE WHEN meal_type = 'dinner' AND status = 'present' THEN 1 ELSE 0 END) as dinner
        FROM meal_attendance
        WHERE date = ?
      `).get(date);
      return {
        date,
        breakfast: row?.breakfast || 0,
        lunch: row?.lunch || 0,
        dinner: row?.dinner || 0
      };
    });

    // 5. Analytics: Complaint Status Distribution
    const complaintStatusDist = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM complaints 
      GROUP BY status
    `).all();

    // 6. Analytics: Feedback Ratings Averages
    const feedbackAverages = db.prepare(`
      SELECT 
        ROUND(AVG(food_quality_rating), 1) as food_quality,
        ROUND(AVG(taste_rating), 1) as taste,
        ROUND(AVG(hygiene_rating), 1) as hygiene,
        ROUND(AVG(quantity_rating), 1) as quantity,
        ROUND(AVG(overall_rating), 1) as overall
      FROM feedback
    `).get();

    // 7. Recent Activities
    const recentRegistrations = db.prepare(`
      SELECT id, student_id, full_name, department, created_at 
      FROM users WHERE role = 'student' 
      ORDER BY created_at DESC LIMIT 4
    `).all();

    const recentPaymentsList = db.prepare(`
      SELECT p.id, p.receipt_number, p.amount, p.payment_date, p.payment_method, u.full_name as student_name, u.student_id as student_roll
      FROM payments p
      JOIN users u ON p.student_id = u.id
      ORDER BY p.payment_date DESC, p.created_at DESC LIMIT 4
    `).all();

    const recentComplaintsList = db.prepare(`
      SELECT c.id, c.ticket_number, c.category, c.subject, c.status, c.priority, u.full_name as student_name
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      ORDER BY c.created_at DESC LIMIT 4
    `).all();

    const recentMenuUpdates = db.prepare(`
      SELECT id, date, meal_type, title, serving_time, is_special
      FROM menus
      ORDER BY date DESC, created_at DESC LIMIT 4
    `).all();

    res.json({
      stats: {
        totalStudents,
        mealsServedThisMonth,
        monthlyRevenue,
        monthlyExpenses,
        pendingComplaints,
        outstandingPayments
      },
      analytics: {
        revenueVsExpenses: revExpTrend,
        expenseByCategory,
        attendanceTrend,
        complaintStatusDist,
        feedbackAverages
      },
      recentActivity: {
        registrations: recentRegistrations,
        payments: recentPaymentsList,
        complaints: recentComplaintsList,
        menuUpdates: recentMenuUpdates
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/staff
router.get('/staff', requireAuth, requireRole('admin', 'staff'), (req, res, next) => {
  try {
    const today = getTodayString();
    const staffId = req.session.user.id;

    // Today's menus
    const todayMenus = db.prepare(`
      SELECT * FROM menus WHERE date = ?
      ORDER BY 
        CASE meal_type WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 ELSE 4 END
    `).all(today);

    for (const m of todayMenus) {
      m.items = db.prepare('SELECT * FROM menu_items WHERE menu_id = ?').all(m.id);
      m.presentCount = db.prepare(`
        SELECT COUNT(*) as count FROM meal_attendance WHERE date = ? AND meal_type = ? AND status = 'present'
      `).get(today, m.meal_type).count;
    }

    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_active = 1").get().count;

    // Complaints assigned to this staff or unassigned
    const assignedComplaints = db.prepare(`
      SELECT c.*, u.full_name as student_name, u.hostel_room
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      WHERE (c.assigned_to = ? OR c.assigned_to IS NULL) AND c.status IN ('Submitted', 'Under Review', 'In Progress')
      ORDER BY c.created_at DESC
    `).all(staffId);

    res.json({
      today,
      totalStudents,
      todayMenus,
      assignedComplaints
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
