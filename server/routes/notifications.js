const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// GET /api/notifications - User's notifications & unread count
router.get('/', requireAuth, (req, res, next) => {
  try {
    const userId = req.session.user.id;

    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).all(userId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(userId).count;

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', requireAuth, (req, res, next) => {
  try {
    const userId = req.session.user.id;

    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ?
    `).run(userId);

    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/:id/read - Mark single as read
router.put('/:id/read', requireAuth, (req, res, next) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    const userId = req.session.user.id;

    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
    `).run(notifId, userId);

    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
