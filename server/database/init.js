const fs = require('fs');
const path = require('path');
const db = require('../config/database');

function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

module.exports = { initDatabase };
