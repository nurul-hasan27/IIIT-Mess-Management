const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getTodayString } = require('../utils/date');

// GET /api/announcements - List announcements
router.get('/', (req, res, next) => {
  try {
    const userRole = req.session?.user?.role;
    const today = getTodayString();

    let query = `
      SELECT 
        a.*,
        u.full_name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
    `;

    // Normal students/public only see active announcements that haven't expired
    if (userRole !== 'admin') {
      query += ` WHERE a.is_active = 1 AND (a.expiry_date IS NULL OR a.expiry_date >= '${today}')`;
    }

    query += `
      ORDER BY 
        CASE a.priority 
          WHEN 'High' THEN 1 
          WHEN 'Medium' THEN 2 
          WHEN 'Low' THEN 3 
          ELSE 4 
        END,
        a.publish_date DESC,
        a.created_at DESC
    `;

    const announcements = db.prepare(query).all();
    res.json({ announcements });
  } catch (error) {
    next(error);
  }
});

// POST /api/announcements - Admin creates announcement & broadcasts
router.post('/', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const { title, description, priority = 'Medium', expiry_date } = req.body;
    const authorId = req.session.user.id;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const today = getTodayString();

    const result = db.prepare(`
      INSERT INTO announcements (title, description, priority, author_id, publish_date, expiry_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(
      title.trim(),
      description.trim(),
      priority,
      authorId,
      today,
      expiry_date || null
    );

    const announcementId = result.lastInsertRowid;

    // Broadcast in-app notification to all students
    const students = db.prepare("SELECT id FROM users WHERE role = 'student' AND is_active = 1").all();
    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, reference_id)
      VALUES (?, ?, ?, 'announcement', ?)
    `);

    const broadcastTx = db.transaction(() => {
      for (const s of students) {
        insertNotif.run(
          s.id,
          `New Announcement: ${title.trim()}`,
          description.trim().slice(0, 140) + (description.trim().length > 140 ? '...' : ''),
          announcementId
        );
      }
    });
    broadcastTx();

    res.status(201).json({
      message: 'Announcement published successfully.',
      announcementId
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/announcements/:id - Admin updates announcement
router.put('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const annId = parseInt(req.params.id, 10);
    const { title, description, priority, expiry_date, is_active } = req.body;

    const result = db.prepare(`
      UPDATE announcements
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          priority = COALESCE(?, priority),
          expiry_date = COALESCE(?, expiry_date),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      description ? description.trim() : null,
      priority || null,
      expiry_date || null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      annId
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    res.json({ message: 'Announcement updated successfully.' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/announcements/:id - Admin deletes announcement
router.delete('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const annId = parseInt(req.params.id, 10);
    const result = db.prepare('DELETE FROM announcements WHERE id = ?').run(annId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }
    res.json({ message: 'Announcement deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
