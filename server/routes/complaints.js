const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/complaints - List complaints
router.get('/', requireAuth, (req, res, next) => {
  try {
    const userRole = req.session.user.role;
    const userId = req.session.user.id;
    const { status, category, priority, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = [];
    let params = [];

    if (userRole === 'student') {
      whereClauses.push('c.student_id = ?');
      params.push(userId);
    }

    if (status) {
      whereClauses.push('c.status = ?');
      params.push(status);
    }

    if (category) {
      whereClauses.push('c.category = ?');
      params.push(category);
    }

    if (priority) {
      whereClauses.push('c.priority = ?');
      params.push(priority);
    }

    if (search) {
      whereClauses.push('(c.ticket_number LIKE ? OR c.subject LIKE ? OR c.description LIKE ? OR u.full_name LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = db.prepare(`
      SELECT COUNT(*) as total 
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      ${whereStr}
    `).get(...params);

    const complaints = db.prepare(`
      SELECT 
        c.*,
        u.student_id as student_roll,
        u.full_name as student_name,
        u.hostel_room,
        u.phone as student_phone,
        assignee.full_name as assigned_to_name
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      LEFT JOIN users assignee ON c.assigned_to = assignee.id
      ${whereStr}
      ORDER BY 
        CASE c.status
          WHEN 'Submitted' THEN 1
          WHEN 'Under Review' THEN 2
          WHEN 'In Progress' THEN 3
          WHEN 'Resolved' THEN 4
          WHEN 'Rejected' THEN 5
          ELSE 6
        END,
        c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit, 10), offset);

    res.json({
      complaints,
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

// GET /api/complaints/:id
router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const complaintId = parseInt(req.params.id, 10);
    const userRole = req.session.user.role;
    const userId = req.session.user.id;

    const complaint = db.prepare(`
      SELECT 
        c.*,
        u.student_id as student_roll,
        u.full_name as student_name,
        u.email as student_email,
        u.hostel_room,
        u.phone as student_phone,
        assignee.full_name as assigned_to_name
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      LEFT JOIN users assignee ON c.assigned_to = assignee.id
      WHERE c.id = ?
    `).get(complaintId);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint ticket not found.' });
    }

    if (userRole === 'student' && complaint.student_id !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ complaint });
  } catch (error) {
    next(error);
  }
});

// POST /api/complaints - Student submits complaint
router.post('/', requireAuth, (req, res, next) => {
  try {
    const studentId = req.session.user.id;
    const { category, subject, description, priority = 'Medium' } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({ error: 'Category, subject, and description are required.' });
    }

    // Generate ticket number
    const countRow = db.prepare('SELECT COUNT(*) as count FROM complaints').get();
    const nextSeq = countRow.count + 1;
    const year = new Date().getFullYear();
    const ticketNumber = `CMP-${year}-${String(nextSeq).padStart(3, '0')}`;

    const result = db.prepare(`
      INSERT INTO complaints (ticket_number, student_id, category, subject, description, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Submitted')
    `).run(
      ticketNumber,
      studentId,
      category,
      subject.trim(),
      description.trim(),
      priority
    );

    // Create acknowledgement notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, reference_id)
      VALUES (?, ?, ?, 'complaint', ?)
    `).run(
      studentId,
      `Complaint Registered: ${ticketNumber}`,
      `Your complaint regarding "${subject.trim()}" has been received and logged under Ticket ${ticketNumber}.`,
      result.lastInsertRowid
    );

    res.status(201).json({
      message: 'Complaint submitted successfully.',
      ticketNumber,
      complaintId: result.lastInsertRowid
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/complaints/:id - Admin/Staff updates status and notes
router.put('/:id', requireAuth, requireRole('admin', 'staff'), (req, res, next) => {
  try {
    const complaintId = parseInt(req.params.id, 10);
    const { status, assigned_to, resolution_notes, priority } = req.body;

    const existing = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
    if (!existing) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    db.prepare(`
      UPDATE complaints
      SET status = COALESCE(?, status),
          assigned_to = COALESCE(?, assigned_to),
          resolution_notes = COALESCE(?, resolution_notes),
          priority = COALESCE(?, priority),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      status || null,
      assigned_to ? parseInt(assigned_to, 10) : null,
      resolution_notes !== undefined ? resolution_notes.trim() : null,
      priority || null,
      complaintId
    );

    // If status changed, notify student
    if (status && status !== existing.status) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, reference_id)
        VALUES (?, ?, ?, 'complaint', ?)
      `).run(
        existing.student_id,
        `Complaint Update: ${existing.ticket_number}`,
        `Your complaint status has been updated to "${status}". ${resolution_notes ? 'Notes: ' + resolution_notes : ''}`,
        complaintId
      );
    }

    res.json({ message: 'Complaint updated successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
