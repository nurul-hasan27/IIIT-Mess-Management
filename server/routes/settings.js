const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/settings
router.get('/', (req, res, next) => {
  try {
    const rows = db.prepare('SELECT * FROM system_settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json({ settings, raw: rows });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings - Admin updates system settings
router.put('/', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object required.' });
    }

    const upsert = db.prepare(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `);

    const updateTx = db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        upsert.run(key, String(value));
      }
    });

    updateTx();
    res.json({ message: 'System settings updated successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
