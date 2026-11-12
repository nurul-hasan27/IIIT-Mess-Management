function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    const userRole = req.session.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to perform this action.' });
    }
    next();
  };
}

// Basic CSRF protection for mutating requests via API
function csrfCheck(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Check custom header or origin
    const customHeader = req.headers['x-requested-with'];
    const origin = req.headers['origin'];
    const host = req.headers['host'];
    
    // Accept requests that originate from the same host or send the custom header
    if (customHeader === 'XMLHttpRequest' || (origin && origin.includes(host))) {
      return next();
    }
    // In local dev/testing, also allow if content-type is json
    if (req.is('application/json') || req.headers['content-type']?.includes('application/json')) {
      return next();
    }
    return res.status(403).json({ error: 'Cross-site request validation failed.' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireRole,
  csrfCheck
};
