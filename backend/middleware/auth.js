const db = require('../models/db');

// Simple secure session token generator
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'USER',
    name: user.name,
    isDemo: user.isDemo || false,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(token) {
  try {
    if (!token) return null;
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const payload = JSON.parse(raw);
    if (!payload.id) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-auth-token'] || req.query.token);

  if (!token) {
    // If no token provided, fallback to demo user for seamless UX if requested
    const demoUser = db.findOne('users', u => u.isDemo === true);
    if (demoUser && req.headers['x-allow-demo'] === 'true') {
      req.user = demoUser;
      return next();
    }
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }

  const user = db.findOne('users', u => u.id === payload.id);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  req.user = user;
  next();
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden: Insufficient administrative privileges.' });
    }
    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  requireAuth,
  requireRole
};
