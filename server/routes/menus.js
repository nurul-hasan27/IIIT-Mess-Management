const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getTodayString } = require('../utils/date');

// GET /api/menus/today
router.get('/today', (req, res, next) => {
  try {
    const today = getTodayString();
    const userId = req.session?.user?.id;

    const menus = db.prepare(`
      SELECT m.*, u.full_name as created_by_name
      FROM menus m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.date = ?
      ORDER BY 
        CASE m.meal_type 
          WHEN 'breakfast' THEN 1 
          WHEN 'lunch' THEN 2 
          WHEN 'dinner' THEN 3 
          ELSE 4 
        END
    `).all(today);

    // Attach items and user's feedback
    for (const menu of menus) {
      menu.items = db.prepare('SELECT * FROM menu_items WHERE menu_id = ?').all(menu.id);
      if (userId) {
        menu.user_feedback = db.prepare(`
          SELECT * FROM feedback WHERE student_id = ? AND date = ? AND meal_type = ?
        `).get(userId, today, menu.meal_type) || null;
      }
    }

    res.json({
      date: today,
      menus
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/menus/weekly
router.get('/weekly', (req, res, next) => {
  try {
    const { start_date } = req.query;
    let baseDate = start_date ? new Date(start_date) : new Date();

    // Default to a 7-day window centered or starting from baseDate
    const dates = [];
    for (let i = -2; i <= 4; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${day}`);
    }

    const placeholders = dates.map(() => '?').join(',');
    const menus = db.prepare(`
      SELECT m.*, u.full_name as created_by_name
      FROM menus m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.date IN (${placeholders})
      ORDER BY m.date ASC,
        CASE m.meal_type 
          WHEN 'breakfast' THEN 1 
          WHEN 'lunch' THEN 2 
          WHEN 'dinner' THEN 3 
          ELSE 4 
        END
    `).all(...dates);

    // Group items
    const menuMap = {};
    for (const m of menus) {
      m.items = db.prepare('SELECT * FROM menu_items WHERE menu_id = ?').all(m.id);
      if (!menuMap[m.date]) {
        menuMap[m.date] = {};
      }
      menuMap[m.date][m.meal_type] = m;
    }

    res.json({
      dates,
      today: getTodayString(),
      weeklyMenus: menuMap
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/menus - by specific date
router.get('/', (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || getTodayString();

    const menus = db.prepare(`
      SELECT m.*, u.full_name as created_by_name
      FROM menus m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.date = ?
      ORDER BY 
        CASE m.meal_type 
          WHEN 'breakfast' THEN 1 
          WHEN 'lunch' THEN 2 
          WHEN 'dinner' THEN 3 
          ELSE 4 
        END
    `).all(targetDate);

    for (const menu of menus) {
      menu.items = db.prepare('SELECT * FROM menu_items WHERE menu_id = ?').all(menu.id);
    }

    res.json({
      date: targetDate,
      menus
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/menus - Admin creates meal
router.post('/', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const { date, meal_type, title, serving_time, is_special, items } = req.body;

    if (!date || !meal_type || !title || !serving_time) {
      return res.status(400).json({ error: 'Date, meal type, title, and serving time are required.' });
    }

    const adminId = req.session.user.id;

    const createTransaction = db.transaction(() => {
      // Delete existing menu for this date and meal_type if any
      const existing = db.prepare('SELECT id FROM menus WHERE date = ? AND meal_type = ?').get(date, meal_type);
      if (existing) {
        db.prepare('DELETE FROM menus WHERE id = ?').run(existing.id);
      }

      const menuRes = db.prepare(`
        INSERT INTO menus (date, meal_type, title, serving_time, is_special, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(date, meal_type, title.trim(), serving_time.trim(), is_special ? 1 : 0, adminId);

      const menuId = menuRes.lastInsertRowid;

      if (Array.isArray(items)) {
        const insertItem = db.prepare(`
          INSERT INTO menu_items (menu_id, item_name, category, is_veg)
          VALUES (?, ?, ?, ?)
        `);
        for (const it of items) {
          const name = typeof it === 'string' ? it : it.item_name;
          const cat = typeof it === 'object' && it.category ? it.category : 'Main Course';
          const isVeg = typeof it === 'object' && it.is_veg !== undefined ? (it.is_veg ? 1 : 0) : 1;
          if (name && name.trim()) {
            insertItem.run(menuId, name.trim(), cat, isVeg);
          }
        }
      }

      return menuId;
    });

    const menuId = createTransaction();
    res.status(201).json({ message: 'Menu created successfully', menuId });
  } catch (error) {
    next(error);
  }
});

// PUT /api/menus/:id - Admin updates meal
router.put('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const menuId = parseInt(req.params.id, 10);
    const { title, serving_time, is_special, items } = req.body;

    const updateTransaction = db.transaction(() => {
      const result = db.prepare(`
        UPDATE menus
        SET title = COALESCE(?, title),
            serving_time = COALESCE(?, serving_time),
            is_special = COALESCE(?, is_special)
        WHERE id = ?
      `).run(
        title ? title.trim() : null,
        serving_time ? serving_time.trim() : null,
        is_special !== undefined ? (is_special ? 1 : 0) : null,
        menuId
      );

      if (result.changes === 0) {
        throw new Error('Menu entry not found');
      }

      if (Array.isArray(items)) {
        db.prepare('DELETE FROM menu_items WHERE menu_id = ?').run(menuId);
        const insertItem = db.prepare(`
          INSERT INTO menu_items (menu_id, item_name, category, is_veg)
          VALUES (?, ?, ?, ?)
        `);
        for (const it of items) {
          const name = typeof it === 'string' ? it : it.item_name;
          const cat = typeof it === 'object' && it.category ? it.category : 'Main Course';
          const isVeg = typeof it === 'object' && it.is_veg !== undefined ? (it.is_veg ? 1 : 0) : 1;
          if (name && name.trim()) {
            insertItem.run(menuId, name.trim(), cat, isVeg);
          }
        }
      }
    });

    updateTransaction();
    res.json({ message: 'Menu updated successfully.' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/menus/:id - Admin deletes meal
router.delete('/:id', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const menuId = parseInt(req.params.id, 10);
    const result = db.prepare('DELETE FROM menus WHERE id = ?').run(menuId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Menu not found.' });
    }
    res.json({ message: 'Menu deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/menus/duplicate - Admin duplicates menu of a source date to target date
router.post('/duplicate', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const { source_date, target_date } = req.body;
    if (!source_date || !target_date) {
      return res.status(400).json({ error: 'Source date and target date are required.' });
    }

    const sourceMenus = db.prepare('SELECT * FROM menus WHERE date = ?').all(source_date);
    if (sourceMenus.length === 0) {
      return res.status(404).json({ error: 'No menus found on the source date to duplicate.' });
    }

    const adminId = req.session.user.id;

    const dupTransaction = db.transaction(() => {
      // Remove any target date menus first
      db.prepare('DELETE FROM menus WHERE date = ?').run(target_date);

      const insertMenu = db.prepare(`
        INSERT INTO menus (date, meal_type, title, serving_time, is_special, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const insertItem = db.prepare(`
        INSERT INTO menu_items (menu_id, item_name, category, is_veg)
        VALUES (?, ?, ?, ?)
      `);

      for (const m of sourceMenus) {
        const newMenuRes = insertMenu.run(target_date, m.meal_type, m.title, m.serving_time, m.is_special, adminId);
        const oldItems = db.prepare('SELECT * FROM menu_items WHERE menu_id = ?').all(m.id);
        for (const item of oldItems) {
          insertItem.run(newMenuRes.lastInsertRowid, item.item_name, item.category, item.is_veg);
        }
      }
    });

    dupTransaction();
    res.json({ message: `Successfully duplicated ${sourceMenus.length} meals to ${target_date}.` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
