const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getTodayString } = require('../utils/date');

// POST /api/feedback - Student submits meal feedback
router.post('/', requireAuth, (req, res, next) => {
  try {
    const studentId = req.session.user.id;
    const {
      date = getTodayString(),
      meal_type,
      food_quality_rating = 4,
      taste_rating = 4,
      hygiene_rating = 4,
      quantity_rating = 4,
      overall_rating = 4,
      comments
    } = req.body;

    if (!meal_type) {
      return res.status(400).json({ error: 'Meal type is required.' });
    }

    const upsertStmt = db.prepare(`
      INSERT INTO feedback (student_id, date, meal_type, food_quality_rating, taste_rating, hygiene_rating, quantity_rating, overall_rating, comments, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, date, meal_type) DO UPDATE SET
        food_quality_rating = excluded.food_quality_rating,
        taste_rating = excluded.taste_rating,
        hygiene_rating = excluded.hygiene_rating,
        quantity_rating = excluded.quantity_rating,
        overall_rating = excluded.overall_rating,
        comments = excluded.comments,
        created_at = CURRENT_TIMESTAMP
    `);

    upsertStmt.run(
      studentId,
      date,
      meal_type,
      parseInt(food_quality_rating, 10),
      parseInt(taste_rating, 10),
      parseInt(hygiene_rating, 10),
      parseInt(quantity_rating, 10),
      parseInt(overall_rating, 10),
      comments ? comments.trim() : null
    );

    res.status(201).json({ message: 'Thank you! Your feedback has been recorded.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/feedback - List feedback
router.get('/', requireAuth, (req, res, next) => {
  try {
    const userRole = req.session.user.role;
    const userId = req.session.user.id;
    const { date, meal_type, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = [];
    let params = [];

    if (userRole === 'student') {
      whereClauses.push('f.student_id = ?');
      params.push(userId);
    } else {
      if (date) {
        whereClauses.push('f.date = ?');
        params.push(date);
      }
      if (meal_type) {
        whereClauses.push('f.meal_type = ?');
        params.push(meal_type);
      }
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const feedbackList = db.prepare(`
      SELECT 
        f.*,
        u.student_id as student_roll,
        u.full_name as student_name,
        u.department
      FROM feedback f
      JOIN users u ON f.student_id = u.id
      ${whereStr}
      ORDER BY f.date DESC, f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit, 10), offset);

    res.json({ feedback: feedbackList });
  } catch (error) {
    next(error);
  }
});

// GET /api/feedback/summary - Aggregate averages and metrics
router.get('/summary', requireAuth, (req, res, next) => {
  try {
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_feedback_count,
        ROUND(AVG(food_quality_rating), 1) as avg_food_quality,
        ROUND(AVG(taste_rating), 1) as avg_taste,
        ROUND(AVG(hygiene_rating), 1) as avg_hygiene,
        ROUND(AVG(quantity_rating), 1) as avg_quantity,
        ROUND(AVG(overall_rating), 1) as avg_overall
      FROM feedback
    `).get();

    const mealAverages = db.prepare(`
      SELECT 
        meal_type,
        COUNT(*) as count,
        ROUND(AVG(overall_rating), 1) as avg_rating
      FROM feedback
      GROUP BY meal_type
    `).all();

    res.json({
      summary,
      mealAverages
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
