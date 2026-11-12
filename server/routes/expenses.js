const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getTodayString } = require('../utils/date');

// GET /api/expenses - Admin lists expenses with filters & summary
router.get('/', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const { month, category, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = [];
    let params = [];

    if (month) {
      whereClauses.push("strftime('%Y-%m', e.expense_date) = ?");
      params.push(month);
    }

    if (category) {
      whereClauses.push('e.category = ?');
      params.push(category);
    }

    if (search) {
      whereClauses.push('(e.title LIKE ? OR e.vendor_name LIKE ? OR e.invoice_number LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const expenses = db.prepare(`
      SELECT 
        e.*,
        u.full_name as recorded_by_name
      FROM expenses e
      LEFT JOIN users u ON e.recorded_by = u.id
      ${whereStr}
      ORDER BY e.expense_date DESC, e.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit, 10), offset);

    const totalRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses, COUNT(*) as count
      FROM expenses e
      ${whereStr}
    `).get(...params);

    // Category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as category_total, COUNT(*) as count
      FROM expenses e
      ${whereStr}
      GROUP BY category
      ORDER BY category_total DESC
    `).all(...params);

    res.json({
      expenses,
      summary: {
        total_expenses: totalRow.total_expenses,
        count: totalRow.count
      },
      categoryBreakdown
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/expenses - Admin adds expense
router.post('/', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const { title, category, amount, expense_date, vendor_name, invoice_number, description } = req.body;
    const adminId = req.session.user.id;

    if (!title || !category || !amount) {
      return res.status(400).json({ error: 'Title, category, and amount are required.' });
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number.' });
    }

    const result = db.prepare(`
      INSERT INTO expenses (title, category, amount, expense_date, vendor_name, invoice_number, description, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      category,
      amt,
      expense_date || getTodayString(),
      vendor_name ? vendor_name.trim() : null,
      invoice_number ? invoice_number.trim() : null,
      description ? description.trim() : null,
      adminId
    );

    res.status(201).json({
      message: 'Expense recorded successfully.',
      expenseId: result.lastInsertRowid
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/expenses/:id - Admin updates expense
router.put('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const expenseId = parseInt(req.params.id, 10);
    const { title, category, amount, expense_date, vendor_name, invoice_number, description } = req.body;

    const result = db.prepare(`
      UPDATE expenses
      SET title = COALESCE(?, title),
          category = COALESCE(?, category),
          amount = COALESCE(?, amount),
          expense_date = COALESCE(?, expense_date),
          vendor_name = COALESCE(?, vendor_name),
          invoice_number = COALESCE(?, invoice_number),
          description = COALESCE(?, description)
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      category || null,
      amount ? parseFloat(amount) : null,
      expense_date || null,
      vendor_name ? vendor_name.trim() : null,
      invoice_number ? invoice_number.trim() : null,
      description ? description.trim() : null,
      expenseId
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    res.json({ message: 'Expense updated successfully.' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/expenses/:id - Admin deletes expense
router.delete('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const expenseId = parseInt(req.params.id, 10);
    const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(expenseId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found.' });
    }
    res.json({ message: 'Expense deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
