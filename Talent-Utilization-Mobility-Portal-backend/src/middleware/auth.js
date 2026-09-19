/**
 * auth.js — JWT authentication middleware
 *
 * Usage:
 *   router.get('/protected', authenticate, handler)
 *   router.get('/admin-only', authenticate, requireRole('admin'), handler)
 *
 * On success, req.employee is populated with the decoded JWT payload.
 * Passwords are never stored in or retrieved from the token.
 */

const jwt = require('jsonwebtoken');

/**
 * authenticate
 * Verifies the Bearer token in the Authorization header.
 * Attaches { id, email, role, department } to req.employee on success.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Malformed authorization header.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('[Auth] JWT_SECRET is not configured.');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error.',
      });
    }

    const decoded = jwt.verify(token, secret);

    // Attach only the payload fields — never the raw password
    req.employee = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      department: decoded.department,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token verification failed.',
    });
  }
};

/**
 * requireRole(...roles)
 * Factory that returns a middleware which restricts access to the given roles.
 * Must be used AFTER `authenticate`.
 *
 * Example: requireRole('admin', 'hr')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    if (!roles.includes(req.employee.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${roles.join(' or ')}.`,
      });
    }

    next();
  };
};

module.exports = { authenticate, requireRole };
