const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getTodayString } = require('../utils/date');

// GET /api/bills - List bills
router.get('/', requireAuth, (req, res, next) => {
  try {
    const userRole = req.session.user.role;
    const userId = req.session.user.id;
    const { month, status, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = [];
    let params = [];

    if (userRole === 'student') {
      whereClauses.push('b.student_id = ?');
      params.push(userId);
    }

    if (month) {
      whereClauses.push('b.billing_month = ?');
      params.push(month);
    }

    if (status) {
      whereClauses.push('b.status = ?');
      params.push(status);
    }

    if (search) {
      whereClauses.push('(b.bill_number LIKE ? OR u.full_name LIKE ? OR u.student_id LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = db.prepare(`
      SELECT COUNT(*) as total 
      FROM bills b
      JOIN users u ON b.student_id = u.id
      ${whereStr}
    `).get(...params);

    const bills = db.prepare(`
      SELECT 
        b.*,
        u.student_id as student_roll,
        u.full_name as student_name,
        u.department,
        u.hostel_room
      FROM bills b
      JOIN users u ON b.student_id = u.id
      ${whereStr}
      ORDER BY b.billing_month DESC, b.due_date ASC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit, 10), offset);

    // Summary calculation for the filtered set
    const summary = db.prepare(`
      SELECT 
        COALESCE(SUM(b.total_amount), 0) as total_billed,
        COALESCE(SUM(b.paid_amount), 0) as total_collected,
        COALESCE(SUM(b.due_amount), 0) as total_pending
      FROM bills b
      JOIN users u ON b.student_id = u.id
      ${whereStr}
    `).get(...params);

    res.json({
      bills,
      summary,
      pagination: {
        total: countRow.total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bills/export-csv - Admin exports bills to CSV
router.get('/export-csv', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const { month } = req.query;
    let query = `
      SELECT 
        b.bill_number,
        u.student_id as roll_number,
        u.full_name as student_name,
        u.department,
        b.billing_month,
        b.base_amount,
        b.rebate_amount,
        b.fine_amount,
        b.total_amount,
        b.paid_amount,
        b.due_amount,
        b.status,
        b.due_date
      FROM bills b
      JOIN users u ON b.student_id = u.id
    `;
    let params = [];
    if (month) {
      query += ` WHERE b.billing_month = ?`;
      params.push(month);
    }
    query += ` ORDER BY b.billing_month DESC, u.student_id ASC`;

    const records = db.prepare(query).all(...params);

    // Build CSV
    const headers = ['Bill Number', 'Roll Number', 'Student Name', 'Department', 'Month', 'Base Amount', 'Rebate', 'Fine', 'Total Amount', 'Paid Amount', 'Due Amount', 'Status', 'Due Date'];
    const rows = records.map(r => [
      r.bill_number,
      r.roll_number,
      `"${r.student_name.replace(/"/g, '""')}"`,
      r.department || '',
      r.billing_month,
      r.base_amount,
      r.rebate_amount,
      r.fine_amount,
      r.total_amount,
      r.paid_amount,
      r.due_amount,
      r.status,
      r.due_date
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="iiit-mess-bills-${month || 'all'}.csv"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

// GET /api/bills/:id - Bill detail with items and payments
router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const billId = parseInt(req.params.id, 10);
    const userRole = req.session.user.role;
    const userId = req.session.user.id;

    const bill = db.prepare(`
      SELECT 
        b.*,
        u.student_id as student_roll,
        u.full_name as student_name,
        u.email as student_email,
        u.department,
        u.hostel_room,
        u.phone as student_phone
      FROM bills b
      JOIN users u ON b.student_id = u.id
      WHERE b.id = ?
    `).get(billId);

    if (!bill) {
      return res.status(404).json({ error: 'Bill record not found.' });
    }

    if (userRole === 'student' && bill.student_id !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(billId);
    const payments = db.prepare('SELECT * FROM payments WHERE bill_id = ? ORDER BY payment_date DESC').all(billId);

    res.json({
      bill,
      items,
      payments
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bills/generate - Admin batch generates monthly bills
router.post('/generate', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const { billing_month, due_date, base_rate } = req.body;
    if (!billing_month) {
      return res.status(400).json({ error: 'Billing month (YYYY-MM) is required.' });
    }

    // Default base rate from settings if not passed
    let rate = parseFloat(base_rate);
    if (isNaN(rate) || rate <= 0) {
      const setting = db.prepare("SELECT value FROM system_settings WHERE key = 'monthly_base_charge'").get();
      rate = setting ? parseFloat(setting.value) : 3800.0;
    }

    const dueDate = due_date || `${billing_month}-20`;

    // Active students
    const students = db.prepare("SELECT id, student_id, full_name FROM users WHERE role = 'student' AND is_active = 1").all();
    let generatedCount = 0;
    let skippedCount = 0;

    const generateTx = db.transaction(() => {
      const checkExisting = db.prepare('SELECT id FROM bills WHERE student_id = ? AND billing_month = ?');
      const insertBill = db.prepare(`
        INSERT INTO bills (bill_number, student_id, billing_month, base_amount, total_amount, paid_amount, due_amount, status, due_date, notes)
        VALUES (?, ?, ?, ?, ?, 0.0, ?, 'Unpaid', ?, ?)
      `);
      const insertItem = db.prepare(`
        INSERT INTO bill_items (bill_id, description, amount)
        VALUES (?, ?, ?)
      `);
      const insertNotify = db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, reference_id)
        VALUES (?, ?, ?, 'bill', ?)
      `);

      for (const student of students) {
        const exists = checkExisting.get(student.id, billing_month);
        if (exists) {
          skippedCount++;
          continue;
        }

        const billNumber = `BILL-${billing_month.replace('-', '')}-${student.student_id}`;
        const billRes = insertBill.run(
          billNumber,
          student.id,
          billing_month,
          rate,
          rate,
          rate,
          dueDate,
          `Standard monthly mess fee for ${billing_month}`
        );

        insertItem.run(billRes.lastInsertRowid, `Mess Subscription (${billing_month})`, rate);

        insertNotify.run(
          student.id,
          `New Mess Bill: ${billing_month}`,
          `Your mess invoice of ₹${rate.toFixed(2)} for ${billing_month} has been published. Due date: ${dueDate}.`,
          billRes.lastInsertRowid
        );

        generatedCount++;
      }
    });

    generateTx();

    res.json({
      message: `Billing generation complete: ${generatedCount} generated, ${skippedCount} skipped (already existed).`,
      generatedCount,
      skippedCount
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/bills/:id - Admin updates bill adjustments (rebate, fine, notes)
router.put('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const billId = parseInt(req.params.id, 10);
    const { rebate_amount, fine_amount, special_diet_amount, notes, due_date } = req.body;

    const existing = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId);
    if (!existing) {
      return res.status(404).json({ error: 'Bill record not found.' });
    }

    const rebate = rebate_amount !== undefined ? parseFloat(rebate_amount) : existing.rebate_amount;
    const fine = fine_amount !== undefined ? parseFloat(fine_amount) : existing.fine_amount;
    const special = special_diet_amount !== undefined ? parseFloat(special_diet_amount) : existing.special_diet_amount;
    const total = Math.max(0, existing.base_amount + special - rebate + fine);
    const due = Math.max(0, total - existing.paid_amount);

    let status = 'Unpaid';
    if (due <= 0 && total > 0) status = 'Paid';
    else if (existing.paid_amount > 0 && due > 0) status = 'Partially Paid';
    else if (new Date() > new Date(existing.due_date) && due > 0) status = 'Overdue';

    db.prepare(`
      UPDATE bills
      SET rebate_amount = ?,
          fine_amount = ?,
          special_diet_amount = ?,
          total_amount = ?,
          due_amount = ?,
          status = ?,
          due_date = COALESCE(?, due_date),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(rebate, fine, special, total, due, status, due_date || null, notes || null, billId);

    res.json({ message: 'Bill updated successfully.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/payments - List payments
router.get('/payments/list', requireAuth, (req, res, next) => {
  try {
    const userRole = req.session.user.role;
    const userId = req.session.user.id;
    const { search, method, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = [];
    let params = [];

    if (userRole === 'student') {
      whereClauses.push('p.student_id = ?');
      params.push(userId);
    }

    if (method) {
      whereClauses.push('p.payment_method = ?');
      params.push(method);
    }

    if (search) {
      whereClauses.push('(p.receipt_number LIKE ? OR p.transaction_reference LIKE ? OR u.full_name LIKE ? OR u.student_id LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const payments = db.prepare(`
      SELECT 
        p.*,
        u.student_id as student_roll,
        u.full_name as student_name,
        b.bill_number,
        b.billing_month,
        rec.full_name as recorded_by_name
      FROM payments p
      JOIN users u ON p.student_id = u.id
      LEFT JOIN bills b ON p.bill_id = b.id
      LEFT JOIN users rec ON p.recorded_by = rec.id
      ${whereStr}
      ORDER BY p.payment_date DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit, 10), offset);

    res.json({ payments });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments - Record payment (Admin or Student internal simulator)
router.post('/payments', requireAuth, (req, res, next) => {
  try {
    const { bill_id, student_id, amount, payment_method, transaction_reference, notes } = req.body;
    const userRole = req.session.user.role;
    const currentUserId = req.session.user.id;

    const targetStudentId = userRole === 'student' ? currentUserId : parseInt(student_id, 10);
    const payAmount = parseFloat(amount);

    if (!targetStudentId || isNaN(payAmount) || payAmount <= 0 || !payment_method) {
      return res.status(400).json({ error: 'Valid student ID, positive amount, and payment method are required.' });
    }

    // Generate or use transaction reference
    const ref = transaction_reference ? transaction_reference.trim() : `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    // Prevent duplicate transaction ref
    const existingRef = db.prepare('SELECT id FROM payments WHERE transaction_reference = ?').get(ref);
    if (existingRef) {
      return res.status(409).json({ error: 'A payment with this transaction reference already exists.' });
    }

    const recordTx = db.transaction(() => {
      // Find matching bill
      let targetBillId = bill_id ? parseInt(bill_id, 10) : null;
      let bill = null;

      if (targetBillId) {
        bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(targetBillId);
      } else {
        // Find earliest unpaid bill for this student
        bill = db.prepare(`
          SELECT * FROM bills 
          WHERE student_id = ? AND status != 'Paid'
          ORDER BY billing_month ASC LIMIT 1
        `).get(targetStudentId);
        if (bill) targetBillId = bill.id;
      }

      // Generate receipt number
      const count = db.prepare('SELECT COUNT(*) as c FROM payments').get().c;
      const today = getTodayString().replace(/-/g, '');
      const receiptNumber = `REC-${today}-${String(count + 1).padStart(3, '0')}`;

      // Insert payment
      const pRes = db.prepare(`
        INSERT INTO payments (receipt_number, bill_id, student_id, amount, payment_date, payment_method, transaction_reference, status, recorded_by, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Completed', ?, ?)
      `).run(
        receiptNumber,
        targetBillId,
        targetStudentId,
        payAmount,
        getTodayString(),
        payment_method,
        ref,
        currentUserId,
        notes || (userRole === 'student' ? 'Student recorded online payment' : 'Staff/Admin registered payment')
      );

      // If tied to a bill, update the bill's financials
      if (bill) {
        const newPaid = bill.paid_amount + payAmount;
        const newDue = Math.max(0, bill.total_amount - newPaid);
        let newStatus = 'Partially Paid';
        if (newDue <= 0) newStatus = 'Paid';

        db.prepare(`
          UPDATE bills
          SET paid_amount = ?,
              due_amount = ?,
              status = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newPaid, newDue, newStatus, bill.id);
      }

      // Notify student
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, reference_id)
        VALUES (?, ?, ?, 'payment', ?)
      `).run(
        targetStudentId,
        `Payment Received: ₹${payAmount.toFixed(2)}`,
        `Payment of ₹${payAmount.toFixed(2)} recorded under Receipt ${receiptNumber} (${payment_method}).`,
        pRes.lastInsertRowid
      );

      return receiptNumber;
    });

    const receiptNumber = recordTx();
    res.status(201).json({
      message: 'Payment recorded successfully.',
      receiptNumber
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
