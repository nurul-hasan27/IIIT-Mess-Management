function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack || err.message || err);

  // SQLite constraint violations
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      error: 'A record with these unique details already exists.'
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({
      error: 'Referenced related record does not exist.'
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'An unexpected server error occurred.'
  });
}

module.exports = errorHandler;
