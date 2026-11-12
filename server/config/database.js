const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, 'mess.db');

const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency & reliability, and enable foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
