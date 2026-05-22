const jwt = require('jsonwebtoken');

/**
 * Verifies the Bearer JWT and attaches the decoded payload to `req.auth`.
 * Applied to every route except POST /api/auth/login.
 */
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET || 'headsupeye-dev-secret');
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = auth;
